"""

   THE CHAMELEON  SemanticContract [P3]                                    
  Universal Psychology Radar  OS Level                                       
                                                                              
  Role:    Dynamically adjusts AI warmth, urgency, and response style         
           based on the user's detected mood.                                  
                                                                              
  Action:  0.6b model reads the user message and returns a 'style_directive'  
           that tells any AI employee how to tune their reply tone.           
                                                                              
  Why:     A user typing in ALL CAPS  needs a very different tone than       
           one sending \"Bhai, ek chota sa sawal tha \". Static tone = lost  
           customer.                                                           

"""

import json
import re
from typing import Dict, Any, List, Type
from pydantic import BaseModel, Field

from src.services.aiskills.engine.base_skill import SemanticContract, skill_logger
from src.services.aiskills.types import ContextPackage
from src.services.routing.local_llm_router import local_router
from src.utils.logger import logger


class ChameleonInput(BaseModel):
    user_message: str = Field(..., description="Raw user message to analyze for tone adjustment.")


class TheChameleonContract(SemanticContract):
    skill_id: str = "the_chameleon"
    capability_statement: str = (
        "Adjusts the AI's reply warmth, urgency, and tone based on the user's current emotional state. "
        "Returns a style directive for how to communicate in this specific moment."
    )
    allowed_roles: List[str] = ["malik", "grahak", "agent", "shadow_boss"]
    pii_fields: List[str] = []

    @property
    def input_schema(self) -> Type[BaseModel]:
        return ChameleonInput

    @skill_logger
    async def _run(
        self,
        params: ChameleonInput,
        entities: Dict[str, Any],
        context_package: ContextPackage,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Uses 0.6b local model to detect mood and return a tone adjustment directive.
        """
        message = params.user_message

        system_prompt = (
            "You are an emotional tone analyzer. "
            "Analyze the given message and determine what communication style an AI should use in its reply. "
            "Consider: frustration level, urgency, friendliness. "
            "Return ONLY valid JSON: "
            "{\"mood\": \"<calm/frustrated/urgent/happy/sad/angry>\", "
            "\"warmth\": \"<cold/neutral/warm/very_warm>\", "
            "\"urgency\": \"<low/medium/high>\", "
            "\"style_directive\": \"<One-line instruction for the AI e.g. 'Be gentle and apologetic' or 'Be concise and direct'>\"}"
        )

        try:
            raw = await local_router.quick_classify(prompt=message, system=system_prompt)
            match = re.search(r"(\{.*\})", raw, re.DOTALL)
            result = json.loads(match.group(1) if match else raw)

            return {
                "mood": result.get("mood", "neutral"),
                "warmth": result.get("warmth", "neutral"),
                "urgency": result.get("urgency", "medium"),
                "style_directive": result.get("style_directive", "Be helpful and clear."),
                "metrics": {"provider": "qwen3:0.6b_local"}
            }
        except Exception as e:
            logger.error(f" [Chameleon] Analysis failed: {e}")
            return {
                "mood": "neutral",
                "warmth": "neutral",
                "urgency": "medium",
                "style_directive": "Be helpful and clear.",
                "metrics": {"error": str(e)}
            }

    @property
    def capability_statement(self) -> str:
        return "Dummy capability statement for " + self.__class__.__name__

