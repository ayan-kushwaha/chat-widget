"""

   DIAGNOSTIC PARSER  SemanticContract [A1]                                
  Batch C: Alex  IT Commander                                                
                                                                              
  Role:    Extracts precise technical error information from user chat.       
                                                                              
  Action:  Alex chats with the user to extract Device Model, OS Version,     
           App Version, and Error Description. Returns a structured           
           bug report JSON for the dev team.                                  
                                                                              
  Why:     "App open nahi ho raha" is useless for a dev team. Alex converts  
           this into: Device=iPhone 14, OS=iOS 17.2, Error=Crash on launch. 

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

class DiagnosticParserInput(BaseModel):
    user_message: str = Field(
        ..., description="The user's complaint or tech error description."
    )
    business_id: str = Field(default="", description="Business context ID.")
    conversation_history: str = Field(
        default="", description="Optional previous chat for multi-turn extraction."
    )


#  Contract 

class DiagnosticParserContract(SemanticContract):
    """
    Alex's core intelligence: extract structured bug reports from user complaints.
    """
    skill_id: str = "diagnostic_parser"
    capability_statement: str = (
        "Extracts technical diagnostic information from a user's error complaint. "
        "Gets Device Model, OS Version, App Version, and Error Description via chat. "
        "Use when a user says app is crashing, not loading, showing error, or behaving incorrectly."
    )

    allowed_roles: List[str] = ["grahak", "agent", "shadow_boss"]
    pii_fields:    List[str] = []

    @property
    def input_schema(self) -> Type[BaseModel]:
        return DiagnosticParserInput

    @skill_logger
    async def _run(
        self,
        params:          DiagnosticParserInput,
        entities:        Dict[str, Any],
        context_package: ContextPackage,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Uses 0.6B model to extract a structured bug report from user's message.
        Missing fields prompt follow-up questions.
        """
        time_context = context_package.temporal_anchor
        history_hint = f"\nPrevious conversation:\n{params.conversation_history}" if params.conversation_history else ""

        system_prompt = (
            f"[{time_context}]\n"
            "You are Alex, an IT diagnostic specialist. "
            "Extract technical error information from the user's message. "
            "Mark unknown fields as null. "
            f"{history_hint}\n"
            "Return ONLY valid JSON: "
            "{"
            "\"device_model\": \"<e.g. iPhone 14, Samsung Galaxy S23, or null>\", "
            "\"os_version\": \"<e.g. iOS 17.2, Android 14, Windows 11, or null>\", "
            "\"app_version\": \"<e.g. v2.3.1 or null>\", "
            "\"error_description\": \"<precise description of the issue>\", "
            "\"error_type\": \"<crash/freeze/not_loading/display_issue/network_error/other>\", "
            "\"severity\": \"<critical/high/medium/low>\", "
            "\"follow_up_question\": \"<one specific question to get missing info, or null>\", "
            "\"diagnostic_reply\": \"<natural response to send the user>\""
            "}"
        )

        try:
            raw = await local_router.quick_classify(
                prompt=params.user_message,
                system=system_prompt
            )
            match = re.search(r"(\{.*\})", raw, re.DOTALL)
            result = json.loads(match.group(1) if match else raw)

            device  = result.get("device_model")
            os_ver  = result.get("os_version")
            err     = result.get("error_description")
            severity = result.get("severity", "medium")

            # Determine if we have enough info for a complete bug report
            is_complete = bool(device and os_ver and err)
            logger.info(f" [DiagnosticParser] severity={severity} | complete={is_complete} | device={device}")

            # Persist bug report to MongoDB if complete
            if is_complete and params.business_id:
                await _save_bug_report(params.business_id, result)

            return {
                "device_model": device,
                "os_version": os_ver,
                "app_version": result.get("app_version"),
                "error_description": err,
                "error_type": result.get("error_type", "other"),
                "severity": severity,
                "follow_up_question": result.get("follow_up_question"),
                "diagnostic_reply": result.get("diagnostic_reply", "Theek hai, main is issue ko check karta hoon."),
                "report_complete": is_complete
            }

        except Exception as e:
            logger.error(f" [DiagnosticParser] Parsing failed: {e}")
            return {
                "device_model": None,
                "os_version": None,
                "app_version": None,
                "error_description": params.user_message,
                "error_type": "other",
                "severity": "medium",
                "follow_up_question": "Kya aap apna device model aur OS version bata sakte hain?",
                "diagnostic_reply": "Main samajh gaya. Kya aap bata sakte hain kaunsa device aur OS version use kar rahe hain?",
                "report_complete": False,
                "error": str(e)
            }


async def _save_bug_report(business_id: str, report: Dict) -> None:
    try:
        from src.core.db.mongodb import get_mongodb
        from datetime import datetime
        db = await get_mongodb()
        await db.bug_reports.insert_one({
            **report,
            "business_id": business_id,
            "status": "open",
            "created_at": datetime.utcnow()
        })
        logger.debug(" [DiagnosticParser] Bug report saved to MongoDB.")
    except Exception as e:
        logger.warning(f" [DiagnosticParser] Could not save bug report: {e}")

    @property
    def capability_statement(self) -> str:
        return "Dummy capability statement for " + self.__class__.__name__

