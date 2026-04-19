"""

   THE ESCALATION DESK  SemanticContract [I6]                             
  Batch 4: Executive Orchestration                                            
                                                                              
  Role:    Executive Orchestrator for Human Handoff.                          
                                                                              
  Trigger: Activated when Sentiment Analysis detects high frustration,        
           or the user explicitly asks for "human", "manager", "boss".        
                                                                              
  Action:  1. Acknowledges user's frustration empathetically.                 
           2. Initiates the Human Handoff sequence (Status: ESCALATED).       
           3. Alerts Shadow Boss Monitor so Malik receives an urgent ping.    
           4. Sets a flag in Context/Memory to stop AI from continuing        
              the conversation until Malik intervenes.                        

"""

from __future__ import annotations

import time
from typing import Any, Dict, List, Type

from pydantic import BaseModel, Field
from loguru import logger

from src.services.aiskills.engine.base_skill import SemanticContract, skill_logger
from src.services.aiskills.types import ContextPackage, EscalationTrigger


#  Input Schema 

class EscalationInput(BaseModel):
    """
    Schema for an Escalation/Frustration event.
    """
    user_message: str   = Field(..., description="The user's original frustrated message.")
    reason:       str   = Field(..., description="Why handoff is needed (e.g., 'Explicit request', 'Anger detected')")
    priority:     str   = Field(default="high", description="'critical', 'high', 'medium'")
    context_summary: str= Field(default="", description="Summary of the conversation leading up to this point.")


#  The Escalation Desk SemanticContract 

class HandleFrustration(SemanticContract):
    """
     The Escalation Desk (Executive Skill).
    
    Handles human handoffs smoothly and alerts the Malik.
    """

    skill_id:             str = "handle_frustration"
    capability_statement: str = (
        "Handles user frustration, anger, or explicit requests to speak to a human manager. "
        "Executes a graceful handoff, pauses the AI, and alerts the business owner."
    )

    allowed_roles:        List[str] = ["grahak", "shadow_boss"]
    pii_fields:           List[str] = [] # Operates on conversation intent, no PII collected directly

    escalation_triggers: List[EscalationTrigger] = [
        # The skill itself IS an escalation, so it inherently notifies the boss.
        EscalationTrigger(
            description="If priority is CRITICAL (e.g., legal threat), trigger immediate hard interrupt.",
            condition="execution_params.get('priority') == 'critical'",
            action="HARD_BLOCK"
        ),
    ]

    @property
    def input_schema(self) -> Type[BaseModel]:
        return EscalationInput

    #  Core execution logic 

    @skill_logger
    async def _run(
        self,
        params:          EscalationInput,
        entities:        Dict[str, Any],
        context_package: ContextPackage,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Execute the Human Handoff.
        """
        start_ns = time.perf_counter_ns()
        
        user_message = params.user_message
        reason       = params.reason
        priority     = params.priority.lower()
        role         = context_package.get("role", "grahak") if isinstance(context_package, dict) else "grahak"
        
        logger.warning(
            f" [EscalationDesk] Initiating Human Handoff | "
            f"user={context_package.user_id if hasattr(context_package, 'user_id') else 'unknown'} | "
            f"reason='{reason}' | priority={priority}"
        )

        # 1. Alert Shadow Boss Monitor (Real-time WhatsApp / Dashboard push)
        self._alert_shadow_boss(
            event_type="human_handoff_requested",
            priority=priority,
            reason=reason,
            user_message=user_message,
        )

        # 2. Formulate empathetic response based on Boss Mandate (if any)
        # Default: Empathetic acknowledgment
        reply = (
            "I completely understand your concern. "
            "I've escalated this to my human manager, and they will connect with you shortly. "
            "Please bear with us."
        )

        mandate = context_package.get_relevant_mandate("handle_frustration") if hasattr(context_package, "get_relevant_mandate") else None
        if mandate:
            # Let LLM reformulate or enforce a specific phrase based on mandate
            if "hindi_only" in mandate.lower():
                reply = "Main aapki pareshani samajh sakta hoon. Maine yeh baat apne manager ko bhej di hai, wo jaldi hi aapse baat karenge."
            elif "apologize_profusely" in mandate.lower():
                reply = "I am so incredibly sorry for the frustration this has caused. I have immediately flagged this to our senior team who will take over right away."

        # 3. Return Verdict (Triggers pause in BaseEmployee or Orchestrator)
        return {
            "status": "success",
            "message": "Handoff complete.",
            "reply": reply,
            "system_action": "PAUSE_AI_RESPONDER", # Instructs the system to stop chatting until Boss unpauses
            "meta": {
                "priority": priority,
                "elapsed_ms": _ms(start_ns)
            }
        }

    #  Shadow Boss Alert 

    @staticmethod
    def _alert_shadow_boss(event_type: str, **detail_kwargs) -> None:
        """Non-blocking alert to Shadow Boss security monitor."""
        try:
            from src.services.aiskills.psychology.shadow_boss.monitor import shadow_boss_monitor
            shadow_boss_monitor.log_security_event({
                "event_type":  event_type,
                "detail":      detail_kwargs,
            })
        except Exception as e:
            logger.debug(f" [EscalationDesk] Shadow Boss alert failed: {e}")


def _ms(start_ns: int) -> float:
    return (time.perf_counter_ns() - start_ns) / 1_000_000

    @property
    def capability_statement(self) -> str:
        return "Dummy capability statement for " + self.__class__.__name__

