"""

   MEETING NEGOTIATOR  SemanticContract [E4]                               
  Batch C: Amit  Operations & Scheduler                                      
                                                                              
  Role:    Chat-based meeting scheduler for Customers/Leads.                  
                                                                              
  Action:  Amit chats with a Lead/Customer to extract Agenda, Date, Time      
           and confirms or negotiates the slot via text.                      
                                                                              
  Why:     "Kal 3 baje free ho?"  Amit extracts this, checks if Boss is      
           available, and responds: "Boss 4 baje available hain, chalega?"    

"""

import json
import re
from typing import Dict, Any, List, Type
from pydantic import BaseModel, Field
from loguru import logger

from src.services.aiskills.engine.base_skill import SemanticContract, skill_logger
from src.services.aiskills.types import ContextPackage
from src.services.routing.local_llm_router import local_router


#  Schema 

class MeetingNegotiatorInput(BaseModel):
    customer_message: str = Field(
        ..., description="The customer/lead message requesting a meeting."
    )
    business_id: str = Field(default="", description="Business context ID.")


#  Contract 

class MeetingNegotiatorContract(SemanticContract):
    """
    Amit's core skill: chats with leads to extract and confirm meeting slots.
    """
    skill_id: str = "meeting_negotiator"
    capability_statement: str = (
        "Handles meeting scheduling requests from customers or leads. "
        "Extracts meeting agenda, preferred date, and preferred time from chat. "
        "Use when a customer says 'meeting chahiye', 'call karna tha', 'appointment lena tha', etc."
    )

    allowed_roles: List[str] = ["grahak", "agent", "shadow_boss"]
    pii_fields:    List[str] = []

    @property
    def input_schema(self) -> Type[BaseModel]:
        return MeetingNegotiatorInput

    @skill_logger
    async def _run(
        self,
        params:          MeetingNegotiatorInput,
        entities:        Dict[str, Any],
        context_package: ContextPackage,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Uses 0.6B to extract meeting details and generate a confirmation reply.
        Uses Temporal Anchor to resolve relative time references correctly.
        """
        time_context = context_package.temporal_anchor

        system_prompt = (
            f"[{time_context}]\n"
            "You are Amit, an appointment scheduling assistant. "
            "Extract meeting details from the customer's message. "
            "Resolve relative dates ('kal', 'parson', 'next week') using the current time above. "
            "If a detail is missing, mark it as null. "
            "Return ONLY valid JSON: "
            "{"
            "\"agenda\": \"<purpose of meeting or null>\", "
            "\"preferred_date\": \"<YYYY-MM-DD or null>\", "
            "\"preferred_time\": \"<HH:MM in 24h or null>\", "
            "\"follow_up_question\": \"<one question to ask if missing critical info, or null if all info is present>\", "
            "\"confirmation_reply\": \"<natural reply to send to customer confirming or asking for more info>\""
            "}"
        )

        try:
            raw = await local_router.quick_classify(
                prompt=params.customer_message,
                system=system_prompt
            )
            match = re.search(r"(\{.*\})", raw, re.DOTALL)
            result = json.loads(match.group(1) if match else raw)

            agenda    = result.get("agenda")
            date      = result.get("preferred_date")
            time_slot = result.get("preferred_time")
            reply     = result.get("confirmation_reply", "Theek hai, main aapki meeting fix karta hoon.")

            logger.info(f" [MeetingNegotiator] Extracted: agenda={agenda}, date={date}, time={time_slot}")

            # Persist meeting request to MongoDB if info is complete
            if date and agenda and params.business_id:
                await _save_meeting_request(params.business_id, result)

            return {
                "agenda": agenda,
                "preferred_date": date,
                "preferred_time": time_slot,
                "follow_up_question": result.get("follow_up_question"),
                "reply": reply,
                "booking_complete": bool(date and time_slot and agenda)
            }

        except Exception as e:
            logger.error(f" [MeetingNegotiator] Extraction failed: {e}")
            return {
                "agenda": None,
                "preferred_date": None,
                "preferred_time": None,
                "follow_up_question": "Kya aap meeting ki date aur time bata sakte hain?",
                "reply": "Zaroor! Kya aap bata sakte hain kab aur kis baare mein baat karni hai?",
                "booking_complete": False,
                "error": str(e)
            }


async def _save_meeting_request(business_id: str, details: Dict) -> None:
    try:
        from src.core.db.mongodb import get_mongodb
        from datetime import datetime
        db = await get_mongodb()
        await db.meeting_requests.insert_one({
            **details,
            "business_id": business_id,
            "status": "pending_confirmation",
            "created_at": datetime.utcnow()
        })
        logger.debug(" [MeetingNegotiator] Saved meeting request to MongoDB.")
    except Exception as e:
        logger.warning(f" [MeetingNegotiator] Could not save meeting request: {e}")

    @property
    def capability_statement(self) -> str:
        return "Dummy capability statement for " + self.__class__.__name__

