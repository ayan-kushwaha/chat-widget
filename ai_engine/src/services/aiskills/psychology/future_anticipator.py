"""

   FUTURE ANTICIPATOR  SemanticContract [P4]                               
  Universal Psychology Radar  OS Level                                       
                                                                              
  Role:    Predicts what the user will likely ask or need next, based on      
           the current message and recent conversation patterns.               
                                                                              
  Action:  0.6b model analyzes message + context and returns a 'next_need'    
           prediction so employees can proactively address it.                 
                                                                              
  Why:     If a user asks \"order status\", they likely also want to know       
           \"expected delivery date\"  anticipating saves a round trip.        

"""

import json
import re
from typing import Dict, Any, List, Type
from pydantic import BaseModel, Field

from src.services.aiskills.engine.base_skill import SemanticContract, skill_logger
from src.services.aiskills.types import ContextPackage
from src.services.routing.local_llm_router import local_router
from src.utils.logger import logger


class AnticipatorInput(BaseModel):
    user_message: str = Field(..., description="The user's current message to analyze for next predicted need.")
    recent_context: str = Field(default="", description="Optional recent conversation context string.")


class FutureAnticipatorContract(SemanticContract):
    skill_id: str = "future_anticipator"
    capability_statement: str = (
        "Predicts what the user is likely to ask or need next based on their current message "
        "and conversation context. Enables proactive responses."
    )
    allowed_roles: List[str] = ["malik", "grahak", "agent", "shadow_boss"]
    pii_fields: List[str] = []

    @property
    def input_schema(self) -> Type[BaseModel]:
        return AnticipatorInput

    @skill_logger
    async def _run(
        self,
        params: AnticipatorInput,
        entities: Dict[str, Any],
        context_package: ContextPackage,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Uses 0.6b model to predict the user's next likely need.
        """
        context_hint = f"\nRecent context: {params.recent_context}" if params.recent_context else ""

        system_prompt = (
            "You are a proactive customer intelligence system. "
            "Based on the user's current message, predict what they will most likely ask or want next. "
            "Be specific and actionable."
            f"{context_hint}"
            "Return ONLY valid JSON: "
            "{\"primary_intent\": \"<what they want now>\", "
            "\"predicted_next_need\": \"<what they will likely ask next>\", "
            "\"proactive_offer\": \"<one short sentence the AI can say proactively>\"}"
        )

        try:
            raw = await local_router.quick_classify(prompt=params.user_message, system=system_prompt)
            match = re.search(r"(\{.*\})", raw, re.DOTALL)
            result = json.loads(match.group(1) if match else raw)

            return {
                "primary_intent": result.get("primary_intent", "unknown"),
                "predicted_next_need": result.get("predicted_next_need", ""),
                "proactive_offer": result.get("proactive_offer", ""),
                "metrics": {"provider": "qwen3:0.6b_local"}
            }
        except Exception as e:
            logger.error(f" [FutureAnticipator] Analysis failed: {e}")
            return {
                "primary_intent": "unknown",
                "predicted_next_need": "",
                "proactive_offer": "",
                "metrics": {"error": str(e)}
            }

    @property
    def capability_statement(self) -> str:
        return "Dummy capability statement for " + self.__class__.__name__

