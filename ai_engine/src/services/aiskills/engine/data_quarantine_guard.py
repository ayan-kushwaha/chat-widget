"""

    DATA QUARANTINE GUARD  SemanticContract [I4]                           
  Pillar C (Knowledge Studio) + Pillar E (Shadow Boss)                        
                                                                              
  Role:    KB Conflict Detector & Upload Gatekeeper.                          
  Layer:   PRE-EMBED (runs before any new document lands in Qdrant).          
                                                                              
  Problem it solves:                                                          
    Boss uploads "Refund Policy v2" while v1 still exists                    
    The AI employee now has TWO conflicting policies  hallucinations.         
                                                                              
  What it does:                                                               
    1. Detects conflicts between incoming document and existing KB chunks.     
    2. If conflict  STATUS = PENDING_RESOLUTION  Boss must approve.         
    3. If no conflict  STATUS = APPROVED  document flows to embedder.       
    4. Boss approves via `approve_quarantine_item` (Gatekeeper-protected).    
    5. All quarantine decisions logged to Shadow Boss monitor.                 
                                                                              
  Conflict Detection Strategy (fast-path first):                              
    Layer 0  Title / filename similarity (Levenshtein ratio, <1ms)           
    Layer 1  Keyword overlap against existing KB (SpaCy, <5ms)               
    Layer 2  Numeric policy contradiction scan (<5ms)                        
    Layer 3  Semantic embedding diff via VectorStore (<200ms, async)         

"""

from __future__ import annotations

import re
import time
from typing import Any, Dict, List, Optional, Type

from pydantic import BaseModel, Field
from loguru import logger

from src.services.aiskills.engine.base_skill import SemanticContract, skill_logger
from src.services.aiskills.types import ContextPackage, EscalationTrigger


#  Quarantine Status Constants 

class QuarantineStatus:
    APPROVED           = "APPROVED"            # No conflict  safe to embed
    PENDING_RESOLUTION = "PENDING_RESOLUTION"  # Conflict found  Boss must approve
    AUTO_REPLACED      = "AUTO_REPLACED"       # Boss mandate: auto-replace older version
    REJECTED           = "REJECTED"            # Explicitly denied by Boss


#  Conflict Detection Helpers 

def _title_similarity(a: str, b: str) -> float:
    """
    Fast Levenshtein-based title similarity ratio (0.0  1.0).
    No external lib needed  pure Python DP.
    Used as Layer 0 signal to detect likely version replacements.
    e.g. "Refund Policy v1.pdf" vs "Refund Policy v2.pdf"  0.89
    """
    a, b = a.lower().strip(), b.lower().strip()
    if a == b:
        return 1.0
    if not a or not b:
        return 0.0

    la, lb = len(a), len(b)
    # Limit to 200 chars  titles don't need full DP on huge strings
    a, b = a[:200], b[:200]
    la, lb = len(a), len(b)

    # DP matrix (space-optimised: two rows)
    prev = list(range(lb + 1))
    for i in range(1, la + 1):
        curr = [i] + [0] * lb
        for j in range(1, lb + 1):
            cost = 0 if a[i - 1] == b[j - 1] else 1
            curr[j] = min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
        prev = curr

    distance = prev[lb]
    return 1.0 - (distance / max(la, lb))


def _keyword_conflict_score(new_text: str, existing_text: str) -> float:
    """
    Layer 1: Keyword overlap between new document and existing KB chunk.
    High overlap + numeric differences  high conflict probability.
    Returns 0.0  1.0 (1.0 = identical content).
    """
    def extract_nouns(text: str) -> set:
        # Simple noun extraction without SpaCy (avoid model load in critical path)
        words = re.findall(r"\b[a-zA-Z]{4,}\b", text.lower())
        # Filter out common stopwords
        stopwords = {
            "that", "this", "with", "from", "have", "been", "will",
            "your", "their", "which", "shall", "must", "only", "also"
        }
        return {w for w in words if w not in stopwords}

    new_kw  = extract_nouns(new_text[:3000])
    old_kw  = extract_nouns(existing_text[:3000])

    if not new_kw or not old_kw:
        return 0.0

    intersection = new_kw & old_kw
    union        = new_kw | old_kw
    return len(intersection) / len(union)   # Jaccard similarity


def _numeric_contradiction_score(new_text: str, existing_text: str) -> Dict[str, Any]:
    """
    Layer 2: Extract all policy-critical numbers from both documents.
    If same units appear with different values  conflict signal.

    Returns: {"score": float, "conflicts": [{"value_new", "value_old", "unit"}]}
    """
    # Pattern: (number, unit) pairs  e.g. "7 days", "10%", "500"
    _NUM_UNIT = re.compile(
        r"(\d+(?:\.\d+)?)\s*"
        r"(days?|hours?|weeks?|months?|years?|%|percent||rs\.?|inr|\$|units?|pieces?|items?)",
        re.IGNORECASE
    )

    def extract_num_units(text: str) -> Dict[str, List[float]]:
        """Returns {unit: [values...]}"""
        result: Dict[str, List[float]] = {}
        for match in _NUM_UNIT.finditer(text[:3000]):
            val  = float(match.group(1))
            unit = match.group(2).lower().rstrip("s")  # normalise "days"  "day"
            result.setdefault(unit, []).append(val)
        return result

    new_nums  = extract_num_units(new_text)
    old_nums  = extract_num_units(existing_text)

    conflicts      = []
    conflict_score = 0.0

    for unit, new_vals in new_nums.items():
        if unit not in old_nums:
            continue
        old_vals = old_nums[unit]
        new_max  = max(new_vals)
        old_max  = max(old_vals)

        # Conflict: same unit, values differ by >10%
        if abs(new_max - old_max) / max(old_max, 0.01) > 0.10:
            conflicts.append({
                "unit":      unit,
                "value_new": new_max,
                "value_old": old_max,
                "deviation": round(abs(new_max - old_max) / max(old_max, 0.01), 3)
            })
            conflict_score = min(conflict_score + 0.35, 1.0)

    return {"score": conflict_score, "conflicts": conflicts}


#  Input Schema 

class QuarantineInput(BaseModel):
    """
    Schema for a single quarantine check request.
    Called by the knowledge upload pipeline before any document is embedded.

    new_doc_title    : Filename or title of the incoming document.
    new_doc_content  : Full text content of the incoming document (max 16k chars).
    new_doc_source   : Source type  'pdf', 'url', 'csv', 'api', 'manual'.
    new_doc_metadata : Any extra metadata from the uploader (tags, category, etc.)
    existing_kb_chunks: Sample of existing KB chunks to compare against.
                        Injected by runtime orchestrator from Qdrant/MongoDB.
    employee_id      : Which AI employee's KB is being modified.
    business_id      : Business context for audit trail.
    auto_replace_older: If True (Boss mandate), auto-approve when new doc is
                        clearly just a newer version of an existing document.
    """
    new_doc_title:      str              = Field(..., min_length=1, max_length=512,
                                                  description="Document title or filename.")
    new_doc_content:    str              = Field(..., min_length=1, max_length=16384,
                                                  description="Full/truncated document text.")
    new_doc_source:     str              = Field(default="manual",
                                                  description="'pdf' | 'url' | 'csv' | 'api' | 'manual'")
    new_doc_metadata:   Dict[str, Any]   = Field(default_factory=dict)
    existing_kb_chunks: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Existing KB chunks to compare against. "
                    "Each chunk: {'title': str, 'content': str, 'chunk_id': str, 'source': str}"
    )
    employee_id:        str              = Field(default="unknown")
    business_id:        str              = Field(default="")
    auto_replace_older: bool             = Field(default=False,
                                                  description="If True, auto-approve clear version upgrades.")


#  Data Quarantine Guard SemanticContract 

class DataQuarantineGuard(SemanticContract):
    """
     Data Quarantine Guard  KB Upload Gate (Pillar C).

    Called by the knowledge upload pipeline BEFORE any document is embedded
    into Qdrant. Prevents conflicting policies from co-existing in the KB.

    Decision outcomes:
        APPROVED            No conflict. Proceed to embedding.
        PENDING_RESOLUTION  Conflict detected. Halt embedding. Notify Boss.
        AUTO_REPLACED       New doc replaces old (auto_replace mandate active).

    Boss resolution workflow:
        Boss reviews conflict  calls `approve_quarantine_item` skill
        (Gatekeeper-protected as malik-only action)  doc is released to embedder.

    Integration point:
        knowledge_upload_route.py  calls this skill  checks verdict
        before calling VectorStore.embed_document()
    """

    skill_id:             str = "data_quarantine_guard"
    capability_statement: str = (
        "Detects conflicts between a newly uploaded document and the existing "
        "Knowledge Base before embedding. Returns APPROVED, PENDING_RESOLUTION, "
        "or AUTO_REPLACED verdict to prevent hallucination-inducing KB conflicts."
    )

    allowed_roles:        List[str] = ["malik", "shadow_boss"]
    pii_fields:           List[str] = []

    escalation_triggers: List[EscalationTrigger] = [
        EscalationTrigger(
            description="5+ documents in PENDING_RESOLUTION for same employee  KB corruption risk.",
            condition=(
                "len([m for m in context.session_memory "
                "     if m.get('quarantine_status') == 'PENDING_RESOLUTION' "
                "     and m.get('employee_id') == execution_params.get('employee_id')]) >= 5"
            ),
            action="NOTIFY_BOSS"
        ),
    ]

    @property
    def input_schema(self) -> Type[BaseModel]:
        return QuarantineInput

    #  Core quarantine logic 

    @skill_logger
    async def _run(
        self,
        params:          QuarantineInput,
        entities:        Dict[str, Any],
        context_package: ContextPackage,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Run the 4-layer conflict detection pipeline.
        Returns a structured quarantine verdict.
        """
        start_ns       = time.perf_counter_ns()
        new_title      = params.new_doc_title
        new_content    = params.new_doc_content
        emp_id         = params.employee_id
        biz_id         = params.business_id
        kb_chunks      = params.existing_kb_chunks
        auto_replace   = params.auto_replace_older

        # Pull Boss mandate overrides
        mandate = context_package.get_relevant_mandate("data_quarantine_guard")
        conflict_threshold: float = 0.55   # score above this  PENDING_RESOLUTION
        if mandate:
            parts = dict(p.split("=", 1) for p in mandate.split(";") if "=" in p)
            try:
                conflict_threshold = float(parts.get("conflict_threshold", conflict_threshold))
            except ValueError:
                pass
            if parts.get("auto_replace", "").lower() == "on":
                auto_replace = True

        # No existing KB  nothing to conflict with
        if not kb_chunks:
            elapsed = _ms(start_ns)
            logger.info(f" [Quarantine] APPROVED (empty KB) | doc='{new_title}' | emp={emp_id}")
            return self._verdict(
                status=QuarantineStatus.APPROVED,
                reason="empty_kb_no_conflicts_possible",
                conflicts=[],
                elapsed_ms=elapsed,
                new_title=new_title,
                emp_id=emp_id,
                biz_id=biz_id,
            )

        all_conflicts: List[Dict] = []
        highest_score: float      = 0.0
        top_conflicting_chunk     = None

        # 
        # LAYER 0 + 1 + 2  Fast deterministic checks against each KB chunk
        # 
        for chunk in kb_chunks[:20]:   # Cap at 20 chunks per call for speed
            chunk_title   = chunk.get("title",   "")
            chunk_content = chunk.get("content", "")
            chunk_id      = chunk.get("chunk_id", "")

            if not chunk_content:
                continue

            chunk_score   = 0.0
            chunk_signals = []

            # L0: Title similarity (version detection)
            title_sim = _title_similarity(new_title, chunk_title)
            if title_sim >= 0.75:
                chunk_score  += title_sim * 0.30
                chunk_signals.append(f"title_similarity:{title_sim:.2f}")

                # High title sim + auto_replace  early AUTO_REPLACED verdict
                if auto_replace and title_sim >= 0.85:
                    elapsed = _ms(start_ns)
                    logger.info(
                        f" [Quarantine] AUTO_REPLACED | doc='{new_title}' | "
                        f"replaces='{chunk_title}' | sim={title_sim:.2f}"
                    )
                    self._alert_shadow_boss(
                        "quarantine_auto_replace",
                        new_title=new_title,
                        replaced_chunk_id=chunk_id,
                        emp_id=emp_id,
                        biz_id=biz_id
                    )
                    return self._verdict(
                        status=QuarantineStatus.AUTO_REPLACED,
                        reason="high_title_similarity_auto_replace_mandate",
                        conflicts=[{"type": "version_replace", "old_chunk_id": chunk_id,
                                    "old_title": chunk_title, "similarity": title_sim}],
                        elapsed_ms=elapsed,
                        new_title=new_title,
                        emp_id=emp_id,
                        biz_id=biz_id,
                        replaced_chunk_ids=[chunk_id],
                    )

            # L1: Keyword overlap (Jaccard similarity)
            kw_score = _keyword_conflict_score(new_content, chunk_content)
            if kw_score >= 0.40:
                chunk_score  += kw_score * 0.35
                chunk_signals.append(f"keyword_overlap:{kw_score:.2f}")

            # L2: Numeric contradiction
            num_result = _numeric_contradiction_score(new_content, chunk_content)
            if num_result["score"] > 0:
                chunk_score  += num_result["score"] * 0.35
                chunk_signals.append(f"numeric_contradiction:{num_result['score']:.2f}")
                for c in num_result["conflicts"]:
                    chunk_signals.append(
                        f"   {c['unit']}: new={c['value_new']} vs old={c['value_old']}"
                    )

            # Record if meaningful conflict score
            if chunk_score >= 0.25:
                conflict_entry = {
                    "chunk_id":     chunk_id,
                    "chunk_title":  chunk_title,
                    "score":        round(chunk_score, 3),
                    "signals":      chunk_signals,
                    "num_conflicts": num_result["conflicts"],
                    "source":       chunk.get("source", ""),
                }
                all_conflicts.append(conflict_entry)

                if chunk_score > highest_score:
                    highest_score        = chunk_score
                    top_conflicting_chunk = conflict_entry

        # 
        # LAYER 3  Semantic Embedding Diff (only if fast layers flagged conflict)
        # Runs async via existing VectorStore  BGE-M3 embeddings in Qdrant.
        # 
        semantic_score = 0.0
        if highest_score >= 0.25 and top_conflicting_chunk:
            try:
                semantic_score = await self._semantic_diff(
                    new_content, top_conflicting_chunk.get("content",
                    # fallback: get content from input chunks by chunk_id
                    next((c.get("content","") for c in kb_chunks
                          if c.get("chunk_id") == top_conflicting_chunk["chunk_id"]), ""))
                )
                if semantic_score >= 0.80:
                    # Very high semantic similarity = likely same document (update, not conflict)
                    # Demote to AUTO_REPLACE if mandate active, else just note it
                    top_conflicting_chunk["semantic_similarity"] = round(semantic_score, 3)
                    if auto_replace and highest_score < conflict_threshold:
                        highest_score = 0.0   # Not a conflict, just a version bump
                elif semantic_score >= 0.55:
                    # Semantically related + numeric diff = real conflict
                    highest_score     = min(highest_score + semantic_score * 0.20, 1.0)
                    if top_conflicting_chunk:
                        top_conflicting_chunk["semantic_similarity"] = round(semantic_score, 3)

            except Exception as e:
                logger.warning(f" [Quarantine-L3] Semantic diff failed (non-critical): {e}")

        #  Final verdict 
        elapsed = _ms(start_ns)

        if highest_score < conflict_threshold:
            logger.info(
                f" [Quarantine] APPROVED | doc='{new_title}' | "
                f"max_score={highest_score:.2f} | emp={emp_id} | elapsed={elapsed:.1f}ms"
            )
            return self._verdict(
                status=QuarantineStatus.APPROVED,
                reason="no_significant_conflict_detected",
                conflicts=all_conflicts,
                elapsed_ms=elapsed,
                new_title=new_title,
                emp_id=emp_id,
                biz_id=biz_id,
            )

        # Conflict detected  PENDING_RESOLUTION
        logger.warning(
            f" [Quarantine] PENDING_RESOLUTION | doc='{new_title}' | "
            f"score={highest_score:.2f} | conflicts={len(all_conflicts)} | "
            f"top_conflict='{top_conflicting_chunk['chunk_title'] if top_conflicting_chunk else 'N/A'}' | "
            f"emp={emp_id} | elapsed={elapsed:.1f}ms"
        )
        self._alert_shadow_boss(
            "quarantine_pending",
            new_title=new_title,
            conflict_count=len(all_conflicts),
            highest_score=round(highest_score, 3),
            emp_id=emp_id,
            biz_id=biz_id,
        )
        return self._verdict(
            status=QuarantineStatus.PENDING_RESOLUTION,
            reason="conflict_detected_awaiting_boss_approval",
            conflicts=all_conflicts,
            elapsed_ms=elapsed,
            new_title=new_title,
            emp_id=emp_id,
            biz_id=biz_id,
            boss_action_required=(
                f"Document '{new_title}' conflicts with {len(all_conflicts)} existing KB chunk(s). "
                f"Highest conflict score: {highest_score:.0%}. "
                f"Review and approve/reject via the Knowledge Studio panel."
            ),
        )

    #  Layer 3: Semantic Diff 

    @staticmethod
    async def _semantic_diff(new_content: str, old_content: str) -> float:
        """
        Cosine similarity between new and old document embeddings.
        Uses existing VectorStore + BGE-M3 (same as KnowledgeAuditor).
        Returns 0.0  1.0.
        """
        if not new_content or not old_content:
            return 0.0
        try:
            import numpy as np
            from src.core.vector_store import VectorStore
            vs = VectorStore()
            new_emb = np.array(await vs.get_embedding(new_content[:1500]))
            old_emb = np.array(await vs.get_embedding(old_content[:1500]))
            dot  = np.dot(new_emb, old_emb)
            norm = np.linalg.norm(new_emb) * np.linalg.norm(old_emb)
            return float(dot / norm) if norm > 0 else 0.0
        except Exception as e:
            logger.debug(f" [Quarantine] Embedding failed: {e}")
            return 0.0

    #  Shadow Boss Alert 

    @staticmethod
    def _alert_shadow_boss(event_type: str, **detail_kwargs) -> None:
        """Non-blocking alert to Shadow Boss security monitor."""
        try:
            from src.services.aiskills.psychology.shadow_boss.monitor import shadow_boss_monitor
            shadow_boss_monitor.log_security_event({
                "event_type":  event_type,
                "employee_id": detail_kwargs.get("emp_id", ""),
                "business_id": detail_kwargs.get("biz_id", ""),
                "detail":      detail_kwargs,
            })
        except Exception as e:
            logger.warning(f" [Quarantine] Shadow Boss alert failed: {e}")

    #  Verdict Builder 

    @staticmethod
    def _verdict(
        status:               str,
        reason:               str,
        conflicts:            List[Dict],
        elapsed_ms:           float,
        new_title:            str,
        emp_id:               str,
        biz_id:               str,
        boss_action_required: str             = "",
        replaced_chunk_ids:   List[str]       = None,
    ) -> Dict[str, Any]:
        """
        Standardised quarantine verdict consumed by the knowledge upload pipeline.

        Fields:
            status                APPROVED | PENDING_RESOLUTION | AUTO_REPLACED
            conflicts             list of detected conflict dicts
            boss_action_required  human-readable guidance for the Boss panel
            replaced_chunk_ids    IDs of chunks to delete on AUTO_REPLACED
        """
        return {
            "status":               status,
            "reason":               reason,
            "conflict_count":       len(conflicts),
            "conflicts":            conflicts,
            "boss_action_required": boss_action_required,
            "replaced_chunk_ids":   replaced_chunk_ids or [],
            "meta": {
                "new_doc_title": new_title,
                "employee_id":   emp_id,
                "business_id":   biz_id,
                "elapsed_ms":    round(elapsed_ms, 2),
                "guard":         "quarantine_guard_v2.0",
            }
        }


#  Module-level helpers 

def _ms(start_ns: int) -> float:
    return (time.perf_counter_ns() - start_ns) / 1_000_000

    @property
    def capability_statement(self) -> str:
        return "Dummy capability statement for " + self.__class__.__name__

