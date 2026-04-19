"""

    THE JUDGE  SemanticContract [I3]                                       
  Pillar G (BaseSkill) + Pillar E (Shadow Boss)                               
                                                                              
  Role:    Hallucination Firewall  Output Verifier.                          
  Layer:   TWO (runs AFTER 4b Expert Brain generates response).               
           Verdict is issued BEFORE the reply reaches the end-user.           
                                                                              
  Design Mandate (from Aryan / V2 Spec):                                      
     Ultra-fast  NO heavy LLM loops.                                       
     KB Protocol Cards = Ground Truth. No exceptions.                       
     Deterministic fast-path first (regex + numeric + keyword).             
     LLM cross-check ONLY used as last resort / tie-breaker.               
     Verdict is structured, audit-logged, and passed to Shadow Boss.        
                                                                              
  Verification Pipeline (fastest  slowest):                                  
    Layer 0  Numeric Claim Extractor (regex, <1ms)                           
    Layer 1  Hard Constraint Checker (rule_type=constraint cards, <2ms)      
    Layer 2  Semantic Keyword Overlap (TF relevance, <5ms)                   
    Layer 3  LLM Tie-Breaker (Qwen3:0.6b, triggered ONLY when L0-L2         
              catch a conflict and card_confidence > 0.85, <50ms)            
                                                                              
  Verdicts:                                                                   
    PASS       Response is factually consistent with KB. Send to user.       
    WARN       Minor deviation detected. Log + send with caveat injected.    
    BLOCK      Hard factual violation. Never reaches user. Bot reformulates. 

"""

from __future__ import annotations

import re
import time
from typing import Any, Dict, List, Optional, Tuple, Type

from pydantic import BaseModel, Field
from loguru import logger

from src.services.aiskills.engine.base_skill import SemanticContract, skill_logger
from src.services.aiskills.types import ContextPackage, EscalationTrigger


#  Protocol Card model (mirrors training_prompts.py output) 

class ProtocolCard:
    """
    Lightweight runtime wrapper around a single Protocol Card dict.
    Avoids repeated .get() calls throughout verification logic.
    """
    __slots__ = (
        "title", "content", "rule_type", "priority",
        "keywords", "intent", "confidence"
    )

    def __init__(self, raw: Dict[str, Any]):
        self.title      = raw.get("title", "")
        self.content    = raw.get("content", "")
        self.rule_type  = raw.get("rule_type", "knowledge")   # policy|constraint|workflow|knowledge|guideline
        self.priority   = raw.get("priority", "medium")       # critical|high|medium|low
        self.keywords   = [k.lower() for k in raw.get("keywords", [])]
        self.intent     = raw.get("intent", [])
        self.confidence = float(raw.get("confidence", 0.5))

    @property
    def is_hard_constraint(self) -> bool:
        return self.rule_type in ("constraint", "policy") and self.priority in ("critical", "high")

    @property
    def is_critical(self) -> bool:
        return self.priority == "critical"


#  Numeric Claim Extractor (Layer 0) 

# Patterns that extract numeric claims from LLM response
# e.g. "10% discount", "500 off", "3-day return", "max 15 units"
_NUM_CLAIM_PATTERNS: List[re.Pattern] = [
    re.compile(r"(\d+(?:\.\d+)?)\s*%",                       re.IGNORECASE),  # percentages
    re.compile(r"(?:|rs\.?|inr)\s*(\d[\d,]*(?:\.\d+)?)",   re.IGNORECASE),  # Indian rupee amounts
    re.compile(r"\$\s*(\d[\d,]*(?:\.\d+)?)",                              ),  # USD amounts
    re.compile(r"(\d+)\s*(?:-|to)\s*(\d+)\s*(?:day|hour|week|month)",    re.IGNORECASE),  # time ranges
    re.compile(r"(?:max|maximum|upto|up\s+to|limit)\s+(\d+)",            re.IGNORECASE),  # max limits
    re.compile(r"(\d+)\s*(?:unit|piece|item|product)s?",                 re.IGNORECASE),  # quantities
]

# Extract all numeric values from text, normalised to floats
def _extract_numerics(text: str) -> List[float]:
    nums: List[float] = []
    for pattern in _NUM_CLAIM_PATTERNS:
        for match in pattern.finditer(text):
            for group in match.groups():
                if group is not None:
                    try:
                        nums.append(float(group.replace(",", "")))
                    except ValueError:
                        pass
    return list(set(nums))


#  Keyword Overlap Scorer (Layer 2) 

def _keyword_overlap_score(response_lower: str, card: ProtocolCard) -> float:
    """
    Returns 0.01.0 relevance score between the LLM response and a Protocol Card.
    Uses simple term frequency  no embeddings, no LLM, sub-millisecond.
    """
    if not card.keywords:
        return 0.0
    hits = sum(1 for kw in card.keywords if kw in response_lower)
    return hits / len(card.keywords)


#  Input Schema 

class JudgeInput(BaseModel):
    """
    Schema for a single Judge verification request.

    llm_response      : The raw text output from the 4b Expert Brain.
    user_query        : The original user question (needed for context matching).
    employee_id       : Which AI employee generated this response (for card lookup).
    protocol_cards    : List of Protocol Card dicts for this employee (from MongoDB).
                        Injected by the runtime orchestrator from ContextPackage.
    strict_mode       : If True, WARN verdicts are treated as BLOCK (Boss-mode).
    """
    llm_response:   str             = Field(..., min_length=1, max_length=16384,
                                            description="Raw LLM output to verify.")
    user_query:     str             = Field(..., min_length=1, max_length=2048,
                                            description="Original user question for context.")
    employee_id:    str             = Field(default="unknown",
                                            description="AI employee identifier.")
    protocol_cards: List[Dict[str, Any]] = Field(default_factory=list,
                                            description="Employee KB Protocol Cards (from MongoDB).")
    strict_mode:    bool            = Field(default=False,
                                            description="If True, WARNBLOCK for Boss mode.")


#  The Judge SemanticContract 

class TheJudgeContract(SemanticContract):
    """
     The Judge  Hallucination Firewall.

    Every response from the 4b Expert Brain passes through The Judge before
    reaching the end user. The Judge cross-references the response against
    the employee's KB Protocol Cards and issues one of three verdicts:

        PASS    Factually consistent. Send immediately.
        WARN    Minor deviation. Inject safe caveat. Log to Shadow Boss.
        BLOCK   Hard factual violation. Bot must reformulate. Never sent.

    Speed guarantee:
        Fast-path (Layer 0-2): < 8ms for any response.
        Full-path (+ LLM L3):  < 60ms guaranteed (3s hard timeout on LLM call).

    Called by: routing layer / chat orchestrator after every 4b response.
    Boss mandate can control: strict_mode, card_confidence_threshold, exempted_intents.
    """

    skill_id:             str = "the_judge"
    capability_statement: str = (
        "Verifies AI employee responses against KB Protocol Cards to detect "
        "hallucinations, factual violations, and policy breaches. "
        "Issues PASS | WARN | BLOCK verdicts before any response reaches the user."
    )

    allowed_roles:         List[str]              = ["malik", "shadow_boss"]
    pii_fields:            List[str]              = []

    escalation_triggers: List[EscalationTrigger] = [
        EscalationTrigger(
            description="3+ BLOCK verdicts issued for the same employee in this session.",
            condition=(
                "len([m for m in context.session_memory "
                "     if m.get('judge_verdict') == 'BLOCK' "
                "     and m.get('employee_id') == execution_params.get('employee_id')]) >= 3"
            ),
            action="NOTIFY_BOSS"
        ),
        EscalationTrigger(
            description="Critical Protocol Card violated  immediate boss alert required.",
            condition=(
                "execution_params.get('_critical_card_violated', False) == True"
            ),
            action="NOTIFY_BOSS"
        ),
    ]

    @property
    def input_schema(self) -> Type[BaseModel]:
        return JudgeInput

    #  Core verification logic 

    @skill_logger
    async def _run(
        self,
        params: JudgeInput,
        entities: Dict[str, Any],
        context_package: ContextPackage,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Execute the 3-layer Judge pipeline.

            Layer 0  Extract all numeric claims from LLM response.
            Layer 1  Cross-check numerics against constraint/policy Protocol Cards.
            Layer 2  Keyword overlap  find most relevant cards, check consistency.
            Layer 3  LLM tie-breaker (only if L1/L2 flag a conflict on high-confidence card).

        Returns structured verdict consumed by routing layer.
        """
        start_ns = time.perf_counter_ns()

        response    = params.llm_response
        query       = params.user_query
        emp_id      = params.employee_id
        strict_mode = params.strict_mode

        #  Pull Boss mandate overrides 
        mandate = context_package.get_relevant_mandate("the_judge")
        card_confidence_threshold: float = 0.70   # below this, card is too vague to enforce
        exempted_intents:          list  = []

        if mandate:
            parts = dict(p.split("=", 1) for p in mandate.split(";") if "=" in p)
            try:
                card_confidence_threshold = float(parts.get("confidence_threshold",
                                                             card_confidence_threshold))
            except ValueError:
                pass
            exempted_intents = [
                i.strip() for i in parts.get("exempt_intents", "").split(",") if i.strip()
            ]
            if parts.get("strict_mode", "").lower() == "on":
                strict_mode = True

        #  Parse Protocol Cards 
        raw_cards: List[Dict] = params.protocol_cards
        if not raw_cards:
            # No cards = nothing to verify against. PASS with advisory.
            elapsed = _ms(start_ns)
            logger.debug(f" [Judge] No protocol cards found for {emp_id}. Skipping verification.")
            return self._verdict(
                verdict="PASS",
                reason="no_protocol_cards_available",
                violations=[],
                relevant_cards=[],
                elapsed_ms=elapsed,
                emp_id=emp_id,
                advisory="KB Protocol Cards not yet generated for this employee. "
                         "Run onboarding Step 2 (Repair Shop) to generate cards."
            )

        cards = [ProtocolCard(c) for c in raw_cards
                 if float(c.get("confidence", 0)) >= card_confidence_threshold]

        if not cards:
            elapsed = _ms(start_ns)
            logger.debug(f" [Judge] All cards below confidence_threshold={card_confidence_threshold} for {emp_id}.")
            return self._verdict(
                verdict="PASS", reason="all_cards_below_confidence_threshold",
                violations=[], relevant_cards=[], elapsed_ms=elapsed, emp_id=emp_id
            )

        response_lower = response.lower()
        query_lower    = query.lower()
        violations:     List[Dict] = []
        relevant_cards: List[str] = []

        # 
        # LAYER 0  Numeric Claim Extractor
        # Extract all numbers from LLM response for constraint checking.
        # 
        response_numerics = _extract_numerics(response)

        # 
        # LAYER 1  Hard Constraint Checker
        # Only checks cards with rule_type in (constraint, policy) + priority
        # in (critical, high). These are the non-negotiable KB facts.
        # 
        hard_cards = [c for c in cards if c.is_hard_constraint]

        for card in hard_cards:
            # 1A: Is this card even relevant to the current response?
            overlap = _keyword_overlap_score(response_lower, card)
            if overlap < 0.15:
                continue  # Card not relevant to this response  skip

            relevant_cards.append(card.title)

            # 1B: Extract numerics from the card's content
            card_numerics = _extract_numerics(card.content)
            if not card_numerics or not response_numerics:
                continue  # No numeric claims to compare  skip numeric check

            # 1C: Check if any response numeric exceeds a card constraint
            # Strategy: find the max card value as the "limit", then check
            # if any response value violates it.
            card_max = max(card_numerics)
            card_min = min(card_numerics)

            for resp_num in response_numerics:
                # Violation: response claims a value larger than any card limit
                if resp_num > card_max * 1.05:  # 5% tolerance buffer
                    violation = {
                        "layer":        "L1_hard_constraint",
                        "card_title":   card.title,
                        "card_rule":    card.rule_type,
                        "card_priority": card.priority,
                        "card_value":   card_max,
                        "response_value": resp_num,
                        "violation_type": "exceeds_card_limit",
                        "critical":      card.is_critical,
                        "card_snippet":  card.content[:180] + ""
                    }
                    violations.append(violation)
                    logger.warning(
                        f" [Judge-L1] Numeric violation | card='{card.title}' | "
                        f"card_limit={card_max} | response_claims={resp_num} | emp={emp_id}"
                    )

        # 
        # LAYER 2  Semantic Keyword Overlap (Soft Consistency Check)
        # Find the most relevant card(s) for this query+response pair.
        # Check if the response contradicts the card content at keyword level.
        # 
        # Score each card against the combined query + response text
        combined_text = f"{query_lower} {response_lower}"
        scored_cards: List[Tuple[float, ProtocolCard]] = [
            (_keyword_overlap_score(combined_text, c), c)
            for c in cards
        ]
        scored_cards.sort(key=lambda x: x[0], reverse=True)

        # Take top-3 most relevant cards for soft consistency check
        top_cards = [(score, card) for score, card in scored_cards if score >= 0.20][:3]

        for score, card in top_cards:
            if card.title not in relevant_cards:
                relevant_cards.append(card.title)

            # L2A: Detect explicit contradiction signals
            # e.g. Card says "no refund after 7 days"  response says "yes, 30 days"
            contradiction_signals = _detect_contradiction_signals(
                response_lower, card.content.lower()
            )
            if contradiction_signals:
                violation = {
                    "layer":        "L2_keyword_contradiction",
                    "card_title":   card.title,
                    "card_rule":    card.rule_type,
                    "card_priority": card.priority,
                    "overlap_score": round(score, 3),
                    "signals":       contradiction_signals,
                    "critical":      card.is_critical,
                    "card_snippet":  card.content[:180] + ""
                }
                violations.append(violation)
                logger.warning(
                    f" [Judge-L2] Contradiction signals | card='{card.title}' | "
                    f"signals={contradiction_signals} | emp={emp_id}"
                )

        #  Early PASS: no violations found in L0-2 
        if not violations:
            elapsed = _ms(start_ns)
            logger.info(
                f" [Judge] PASS | emp={emp_id} | "
                f"cards_checked={len(cards)} | relevant={len(relevant_cards)} | "
                f"elapsed={elapsed:.1f}ms"
            )
            return self._verdict(
                verdict="PASS",
                reason="all_layers_clear",
                violations=[],
                relevant_cards=relevant_cards,
                elapsed_ms=elapsed,
                emp_id=emp_id
            )

        # 
        # LAYER 3  LLM Tie-Breaker (Qwen3:0.6b)
        # Only fires when:
        #   a) L1/L2 detected violations, AND
        #   b) The highest-confidence card involved has confidence > 0.85, AND
        #   c) Non of the violations are already from a critical card
        #      (critical = auto-BLOCK, no LLM needed)
        # 

        # Auto-BLOCK on any critical card violation  no LLM call needed
        critical_violations = [v for v in violations if v.get("critical")]
        if critical_violations:
            elapsed = _ms(start_ns)
            kwargs["_critical_card_violated"] = True
            logger.warning(
                f" [Judge] BLOCK (CRITICAL CARD) | "
                f"violations={len(critical_violations)} | emp={emp_id} | elapsed={elapsed:.1f}ms"
            )
            return self._verdict(
                verdict="BLOCK",
                reason="critical_protocol_card_violated",
                violations=violations,
                relevant_cards=relevant_cards,
                elapsed_ms=elapsed,
                emp_id=emp_id,
                safe_reformulation_hint=_build_reformulation_hint(critical_violations)
            )

        # Check if LLM tie-breaker is warranted
        max_card_confidence = max(
            float(c.confidence) for _, c in top_cards
        ) if top_cards else 0.0

        llm_verdict = None
        if max_card_confidence >= 0.85:
            try:
                llm_verdict = await self._llm_tiebreaker(
                    response=response,
                    violations=violations,
                    top_cards=top_cards
                )
                logger.info(f" [Judge-L3] LLM tie-breaker verdict: {llm_verdict} | emp={emp_id}")
            except Exception as e:
                logger.error(f" [Judge-L3] LLM tie-breaker failed: {e}. Using heuristic verdict.")
                llm_verdict = None

        #  Final verdict assembly 
        # Logic: LLM says BLOCK  BLOCK. Otherwise use violation count heuristic.
        if llm_verdict == "BLOCK":
            final_verdict = "BLOCK"
            reason        = "llm_tiebreaker_confirmed_violation"
        elif llm_verdict == "PASS":
            final_verdict = "PASS"
            reason        = "llm_tiebreaker_cleared_violations"
        else:
            # Heuristic: count violations, severity determines verdict
            high_severity = [v for v in violations if v.get("card_priority") in ("critical", "high")]
            final_verdict = "BLOCK" if len(high_severity) >= 2 else "WARN"
            reason        = "heuristic_violation_count"

        # Strict mode escalates WARNs to BLOCKs
        if strict_mode and final_verdict == "WARN":
            final_verdict = "BLOCK"
            reason        = "strict_mode_warn_escalated"

        elapsed = _ms(start_ns)
        log_icon = "" if final_verdict == "BLOCK" else ""
        logger.info(
            f"{log_icon} [Judge] {final_verdict} | reason={reason} | "
            f"violations={len(violations)} | emp={emp_id} | elapsed={elapsed:.1f}ms"
        )
        return self._verdict(
            verdict=final_verdict,
            reason=reason,
            violations=violations,
            relevant_cards=relevant_cards,
            elapsed_ms=elapsed,
            emp_id=emp_id,
            safe_reformulation_hint=(
                _build_reformulation_hint(violations) if final_verdict == "BLOCK" else ""
            )
        )

    #  LLM Tie-Breaker (Qwen3:0.6b) 

    async def _llm_tiebreaker(
        self,
        response:   str,
        violations: List[Dict],
        top_cards:  List[Tuple[float, ProtocolCard]]
    ) -> str:
        """
        Binary classification via Qwen3:0.6b.
        Only called when heuristic layers are ambiguous (L1/L2 flagged a conflict
        but it might be a false positive on a high-confidence card).

        Prompt is minimal, deterministic, and strictly structured.
        Returns: 'BLOCK' | 'WARN' | 'PASS'
        """
        import httpx

        # Build compact evidence summary for the LLM (no full card dump)
        evidence_lines = []
        for v in violations[:3]:   # max 3 violations to keep prompt short
            evidence_lines.append(
                f"- Card: \"{v['card_title']}\" ({v['card_priority']} {v['card_rule']})\n"
                f"  Issue: {v.get('violation_type', 'contradiction')} | "
                f"  Card snippet: {v.get('card_snippet', '')[:100]}"
            )

        card_facts = []
        for _, card in top_cards[:2]:   # max 2 cards
            card_facts.append(f"KB Fact [{card.priority}]: {card.content[:150]}")

        prompt = (
            "You are a fact-checker. Respond with EXACTLY one word: BLOCK, WARN, or PASS.\n\n"
            f"AI Response to verify:\n\"\"\"{response[:600]}\"\"\"\n\n"
            f"KB Ground Truth:\n" + "\n".join(card_facts) + "\n\n"
            f"Detected issues:\n" + "\n".join(evidence_lines) + "\n\n"
            "Rules:\n"
            "- BLOCK: Response clearly contradicts KB facts with specific wrong numbers/policies.\n"
            "- WARN: Response is slightly off but not dangerously wrong.\n"
            "- PASS: Issues are false positives; response is factually consistent.\n\n"
            "Your single-word verdict:"
        )

        try:
            async with __import__("httpx").AsyncClient(timeout=3.0) as client:
                resp = await client.post(
                    "http://localhost:11434/api/generate",
                    json={
                        "model":  "qwen3:0.6b",
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.0,
                            "num_predict": 3,
                            "num_ctx":     512,
                        }
                    }
                )
                resp.raise_for_status()
                raw = resp.json().get("response", "WARN").strip().upper()
                return raw if raw in {"BLOCK", "WARN", "PASS"} else "WARN"

        except __import__("httpx").TimeoutException:
            logger.warning(" [Judge-L3] LLM tie-breaker timed out. Returning WARN.")
            return "WARN"

    #  Verdict Builder 

    @staticmethod
    def _verdict(
        verdict:                  str,
        reason:                   str,
        violations:               List[Dict],
        relevant_cards:           List[str],
        elapsed_ms:               float,
        emp_id:                   str,
        advisory:                 str  = "",
        safe_reformulation_hint:  str  = "",
    ) -> Dict[str, Any]:
        """
        Standard verdict dict consumed by routing layer / chat orchestrator.

        Fields:
            verdict        PASS | WARN | BLOCK
            violations     list of specific factual violations found
            relevant_cards  Protocol Card titles that were evaluated
            reformulation_hint  if BLOCK, what the bot should say instead
        """
        return {
            "verdict":                 verdict,
            "reason":                  reason,
            "violations":              violations,
            "violation_count":         len(violations),
            "relevant_protocol_cards": relevant_cards,
            "advisory":                advisory,
            "safe_reformulation_hint": safe_reformulation_hint,
            "meta": {
                "employee_id":  emp_id,
                "elapsed_ms":   round(elapsed_ms, 2),
                "judge":        "the_judge_v2.0",
                "layers_run":   "L0+L1+L2" + ("+L3" if "llm" in reason else ""),
            }
        }


#  Module-level helpers 

def _ms(start_ns: int) -> float:
    """Nanoseconds  milliseconds elapsed since start_ns."""
    return (time.perf_counter_ns() - start_ns) / 1_000_000


def _detect_contradiction_signals(response_text: str, card_text: str) -> List[str]:
    """
    Detect explicit contradiction signals between response and a card.
    Uses negation + noun proximity heuristic  no embeddings needed.

    Examples caught:
        Card: "Max discount is 10%"
        Response: "I can give you 20% discount"  SIGNAL: numeric_exceeds

        Card: "No refunds after 7 days"
        Response: "You can return it within 30 days"  SIGNAL: policy_contradiction

    Returns list of signal strings (empty = no contradiction).
    """
    signals: List[str] = []

    # Signal 1: Negation flip
    # Card contains "no X" / "not allowed" but response contains X positively
    negation_phrases = re.findall(r"(?:no|not|never|cannot|can't|won't|prohibited)\s+(\w+)", card_text)
    for phrase in negation_phrases:
        # If response uses the prohibited word without a negation near it
        resp_pattern = re.compile(
            # word must appear in response without a nearby "no/not/never"
            r"(?<!no\s)(?<!not\s)(?<!never\s)\b" + re.escape(phrase) + r"\b",
            re.IGNORECASE
        )
        if resp_pattern.search(response_text):
            signals.append(f"negation_flip:{phrase}")

    # Signal 2: Time/duration contradiction
    #  Card says "7 days"  response says "30 days" (different order of magnitude)
    card_times    = re.findall(r"(\d+)\s*(day|hour|week|month|year)s?", card_text,    re.IGNORECASE)
    response_times= re.findall(r"(\d+)\s*(day|hour|week|month|year)s?", response_text, re.IGNORECASE)

    if card_times and response_times:
        # Normalise to hours for comparison
        _to_hours = {"hour": 1, "day": 24, "week": 168, "month": 720, "year": 8760}
        card_max_h = max(int(n) * _to_hours.get(u.lower(), 1) for n, u in card_times)
        for n, u in response_times:
            resp_h = int(n) * _to_hours.get(u.lower(), 1)
            if resp_h > card_max_h * 2.0:   # >2x the card's time limit
                signals.append(f"time_duration_exceeds_card:{n}{u}>card_max")

    return signals


def _build_reformulation_hint(violations: List[Dict]) -> str:
    """
    Generate a safe reformulation instruction for the bot.
    Tells the bot what to say instead without exposing internal card data.
    Used when verdict is BLOCK  bot must generate a new response.
    """
    if not violations:
        return ""

    # Use highest-priority violation for the hint
    critical_first = sorted(violations, key=lambda v:
        {"critical": 0, "high": 1, "medium": 2, "low": 3}.get(v.get("card_priority", "low"), 3)
    )
    top = critical_first[0]

    violation_type = top.get("violation_type", "policy_contradiction")
    card_name      = top.get("card_title", "company policy")

    hints = {
        "exceeds_card_limit": (
            f"Your response contained a value that exceeds our '{card_name}' policy. "
            f"Please restate the correct policy limit from your KB and avoid mentioning "
            f"specific numbers unless directly from your Protocol Cards."
        ),
        "negation_flip": (
            f"Your response may have stated something that our '{card_name}' policy does not allow. "
            f"Please clarify using only what is explicitly stated in your knowledge base."
        ),
        "time_duration_exceeds_card": (
            f"Your response mentioned a time window that contradicts the '{card_name}' policy. "
            f"State the correct duration as per your Protocol Cards."
        ),
    }
    return hints.get(
        violation_type,
        f"Please reformulate your response strictly based on your '{card_name}' Protocol Card."
        f" Do not introduce numbers or policies not found in your knowledge base."
    )

    @property
    def capability_statement(self) -> str:
        return "Dummy capability statement for " + self.__class__.__name__

