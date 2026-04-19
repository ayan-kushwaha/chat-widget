"""

   LEAD QUALIFIER  SemanticContract [E-LQ]                                  
  Batch C: Amit  Operations & Scheduler                                      
                                                                              
  Role:    Extracts customer requirements via chat and assigns lead priority. 
                                                                              
  Action:  Amit chats with a lead to understand their requirement, budget,    
           and urgency. Returns a Lead Card with priority tag.                
                                                                              
  Why:     Not every lead is equal. A "high priority" lead needs immediate    
           Boss attention. A "low priority" lead can wait. Without            
           qualification, Boss wastes time on every inquiry equally.          

"""

import json
import re
from typing import Dict, Any, List, Type, Optional
from pydantic import BaseModel, Field
from loguru import logger

from src.services.aiskills.engine.base_skill import SemanticContract, skill_logger
from src.services.aiskills.types import ContextPackage
from src.services.routing.local_llm_router import local_router


#  Schema 

class LeadQualifierInput(BaseModel):
    customer_message: str = Field(
        ..., description="The customer's message expressing their requirement or interest."
    )
    business_id: str = Field(default="", description="Business context ID.")
    conversation_history: str = Field(
        default="", description="Optional: previous chat context for better qualification."
    )


#  Contract 

class LeadQualifierContract(SemanticContract):
    """
    Amit's lead intelligence: qualifies a customer's interest and assigns priority.
    """
    skill_id: str = "lead_qualifier"
    capability_statement: str = (
        "Qualifies a customer/lead by extracting their requirement, budget, and urgency from chat. "
        "Assigns a priority tag (hot/warm/cold) so the Boss knows who to focus on. "
        "Use when someone expresses interest in buying, partnering, or inquiring about services."
    )

    allowed_roles: List[str] = ["grahak", "agent", "shadow_boss"]
    pii_fields:    List[str] = []

    @property
    def input_schema(self) -> Type[BaseModel]:
        return LeadQualifierInput

    @skill_logger
    async def _run(
        self,
        params:          LeadQualifierInput,
        entities:        Dict[str, Any],
        context_package: ContextPackage,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Uses 0.6B model to extract a structured lead card from customer chat.
        """
        history_hint = f"\nPrevious conversation:\n{params.conversation_history}" if params.conversation_history else ""

        system_prompt = (
            "You are Amit, a lead qualification specialist. "
            "Analyze the customer's message and extract their business requirement. "
            f"{history_hint}\n"
            "Return ONLY valid JSON: "
            "{"
            "\"requirement\": \"<what the customer wants>\", "
            "\"budget_signal\": \"<high/medium/low/unknown based on language clues>\", "
            "\"urgency\": \"<immediate/this_week/no_rush/unknown>\", "
            "\"priority_tag\": \"<hot/warm/cold>\", "
            "\"follow_up_question\": \"<one question to better understand their need, or null if clear enough>\", "
            "\"lead_summary\": \"<one sentence summary for the Boss>\""
            "}"
        )

        try:
            raw = await local_router.quick_classify(
                prompt=params.customer_message,
                system=system_prompt
            )
            match = re.search(r"(\{.*\})", raw, re.DOTALL)
            result = json.loads(match.group(1) if match else raw)

            priority = result.get("priority_tag", "warm")
            logger.info(f" [LeadQualifier] Lead tagged as: {priority} | Requirement: {result.get('requirement', '?')}")

            # Save to MongoDB
            if params.business_id:
                await _save_lead(params.business_id, result)

            return {
                "requirement": result.get("requirement"),
                "budget_signal": result.get("budget_signal", "unknown"),
                "urgency": result.get("urgency", "unknown"),
                "priority_tag": priority,
                "follow_up_question": result.get("follow_up_question"),
                "lead_summary": result.get("lead_summary", "")
            }

        except Exception as e:
            logger.error(f" [LeadQualifier] Qualification failed: {e}")
            return {
                "requirement": None,
                "budget_signal": "unknown",
                "urgency": "unknown",
                "priority_tag": "warm",
                "follow_up_question": "Aap kya dhundh rahe hain? Main help kar sakta hoon.",
                "lead_summary": "Lead qualification failed.",
                "error": str(e)
            }


async def _save_lead(business_id: str, lead_data: Dict) -> None:
    try:
        from src.core.db.mongodb import get_mongodb
        from datetime import datetime
        db = await get_mongodb()
        await db.leads.insert_one({
            **lead_data,
            "business_id": business_id,
            "created_at": datetime.utcnow()
        })
        logger.debug(f" [LeadQualifier] Saved lead card to MongoDB.")
    except Exception as e:
        logger.warning(f" [LeadQualifier] Could not save lead: {e}")

    @property
    def capability_statement(self) -> str:
        return "Dummy capability statement for " + self.__class__.__name__

