"""

   EMOJI-PULSE DECODER  SemanticContract [P6]                               
  Universal Psychology Radar  OS Level                                       
                                                                              
  Role:    Decodes the mood and approval level from emoji reactions in chat.  
                                                                              
  Action:  0.6b model maps emoji reactions (,,, etc.) and inline       
           emoji in the message to emotional signals for any employee to use.  
                                                                              
  Why:     A  means approval. A  or  means rage. Reacting with        
           means excitement. Bina text ke bhi insaan bahut kuch bol deta hai. 

"""

import json
import re
from typing import Dict, Any, List, Type
from pydantic import BaseModel, Field

from src.services.aiskills.engine.base_skill import SemanticContract, skill_logger
from src.services.aiskills.types import ContextPackage
from src.services.routing.local_llm_router import local_router
from src.utils.logger import logger


class EmojiPulseInput(BaseModel):
    user_message: str = Field(..., description="The full user message possibly containing emojis or reactions.")


class EmojiPulseDecoderContract(SemanticContract):
    skill_id: str = "emoji_pulse_decoder"
    capability_statement: str = (
        "Decodes the emotional signal from emojis in a user's message or reaction. "
        "Maps emoji to mood states like approval, excitement, frustration, or grief."
    )
    allowed_roles: List[str] = ["malik", "grahak", "agent", "shadow_boss"]
    pii_fields: List[str] = []

    @property
    def input_schema(self) -> Type[BaseModel]:
        return EmojiPulseInput

    @skill_logger
    async def _run(
        self,
        params: EmojiPulseInput,
        entities: Dict[str, Any],
        context_package: ContextPackage,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Uses 0.6b model to decode emoji signals from user messages.
        """
        system_prompt = (
            "You are an emoji sentiment interpreter. "
            "Analyze the given message for emojis and determine the user's emotional signal. "
            "If no emoji is present, analyze the overall tone of the text itself. "
            "Return ONLY valid JSON: "
            "{\"emojis_found\": [\"<list of emojis>\"], "
            "\"pulse\": \"<approval/excitement/frustration/anger/sadness/neutral/love>\", "
            "\"intensity\": \"<low/medium/high>\", "
            "\"signal\": \"<one line summary of what the user's emoji/tone is communicating>\"}"
        )

        try:
            raw = await local_router.quick_classify(prompt=params.user_message, system=system_prompt)
            match = re.search(r"(\{.*\})", raw, re.DOTALL)
            result = json.loads(match.group(1) if match else raw)

            return {
                "emojis_found": result.get("emojis_found", []),
                "pulse": result.get("pulse", "neutral"),
                "intensity": result.get("intensity", "low"),
                "signal": result.get("signal", "No strong emotional signal detected."),
                "metrics": {"provider": "qwen3:0.6b_local"}
            }
        except Exception as e:
            logger.error(f" [EmojiPulseDecoder] Analysis failed: {e}")
            return {
                "emojis_found": [],
                "pulse": "neutral",
                "intensity": "low",
                "signal": "Unable to decode emoji pulse.",
                "metrics": {"error": str(e)}
            }

    @property
    def capability_statement(self) -> str:
        return "Dummy capability statement for " + self.__class__.__name__

