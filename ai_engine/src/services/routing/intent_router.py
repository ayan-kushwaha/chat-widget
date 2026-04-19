"""

   INTENT ROUTER  The Shadow Boss Pre-Router                               
  Batch 7: The Shadow Boss Router                                             
                                                                              
  Role:    Ultra-fast intent classifier that gates all routing decisions      
           BEFORE SkillFactory runs. Runs on the 0.6B Shadow Boss CPU model. 
                                                                              
  5-Lane Highway:                                                             
    FRUSTRATION  HandleFrustration skill (human handoff)                    
    GREETING     Skip SkillFactory, go straight to RAG/Fallback             
    ORDER        SkillFactory + Slot Filler                                  
    POLICY_QUERY  Direct Qdrant RAG fetch (fast KB lookup)                  
    AMBIGUOUS    Standard SkillFactory discovery (existing flow)            
                                                                              
  Latency Target: <50ms via quick_classify() on 0.6B local model.            

"""

from __future__ import annotations

import time
from typing import Optional
from loguru import logger

from src.services.routing.local_llm_router import local_router


#  Intent Lane Definitions 

class IntentLane:
    FRUSTRATION  = "FRUSTRATION"   # Angry user, explicit escalation, refund demand
    GREETING     = "GREETING"      # Hello, Hi, How are you, small talk
    ORDER        = "ORDER"         # Place order, buy, book meeting, schedule appointment
    POLICY_QUERY = "POLICY_QUERY"  # Policy, price, timing, rules, FAQ (no action needed)
    TECH_ISSUE   = "TECH_ISSUE"    # App crash, bug report, device error, not working
    AMBIGUOUS    = "AMBIGUOUS"     # Unclear  let SkillFactory decide

    ALL = {FRUSTRATION, GREETING, ORDER, POLICY_QUERY, TECH_ISSUE, AMBIGUOUS}


#  The Router 

class IntentRouter:
    """
    Shadow Boss Pre-Router.
    Runs BEFORE SkillFactory to apply fast routing lanes.
    Uses 0.6B model for LLM classification globally. Zero hardcoded tech debt.
    """

    _CLASSIFY_SYSTEM = (
        "You are a message intent classifier for a WhatsApp business AI. "
        "Classify the user's message into exactly ONE of these categories: "
        "FRUSTRATION, GREETING, ORDER, POLICY_QUERY, TECH_ISSUE, AMBIGUOUS. "
        "Reply with ONLY the category name in UPPERCASE. No explanation."
    )

    _CLASSIFY_PROMPT_TEMPLATE = (
        "Classify this message:\n\"{message}\"\n\n"
        "CATEGORIES:\n"
        "- GREETING: Casual hello, hi, or general small talk with no action needed.\n"
        "- FRUSTRATION: User is angry, upset, demanding refund, asking for a human/manager, or emotionally complaining. NOT for tech bugs.\n"
        "- TECH_ISSUE: User reports app crash, bug, error, device problem, login failure, or 'not working'. Even if frustrated in tone.\n"
        "- ORDER: User wants to place order, buy something, book a meeting, schedule a call/appointment, or confirm a reservation.\n"
        "- POLICY_QUERY: User asking about price, delivery time, return policy, terms, or FAQ. No action required from AI.\n"
        "- AMBIGUOUS: None of the above is clearly identifiable.\n\n"
        "Reply with ONE word only."
    )

    @staticmethod
    async def classify(user_message: str) -> str:
        """
        Classify a user message into one of 5 Intent Lanes using Local Qwen3:0.6b.
        No hardcoded dictionaries used. Supports global languages instantly.
        """
        start_ns = time.perf_counter_ns()

        #  LLM Classification (0.6B Shadow Boss) 
        prompt = IntentRouter._CLASSIFY_PROMPT_TEMPLATE.format(message=user_message)
        
        try:
            raw_intent = await local_router.quick_classify(
                prompt=prompt,
                system=IntentRouter._CLASSIFY_SYSTEM
            )
            # Normalise: extract first uppercase word
            intent = raw_intent.strip().upper().split()[0] if raw_intent.strip() else "AMBIGUOUS"
            
            if intent not in IntentLane.ALL:
                intent = IntentLane.AMBIGUOUS
                
        except Exception as e:
            logger.warning(f" [IntentRouter] LLM classification failed: {e}. Defaulting to AMBIGUOUS.")
            intent = IntentLane.AMBIGUOUS

        elapsed = (time.perf_counter_ns() - start_ns) / 1_000_000
        logger.info(f" [IntentRouter] Intent='{intent}' ({elapsed:.1f}ms)")
        return intent


# Singleton
intent_router = IntentRouter()

