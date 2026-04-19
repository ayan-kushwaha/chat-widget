"""

    RAPPORT MIRRORING  SemanticContract [P2]                               
  Pillar H (Heart  Sarah)                                                    
                                                                              
  Role:    Dynamic Vocabulary Matcher.                                        
  Action:  Passively analyzes incoming text for slang (e.g., "Bhai", "Sir")   
           and language (Hindi/English/Hinglish).                             
                                                                              
  Why:     If a customer says "Bhai order kab aayega?", standard AI says      
           "Dear Customer, your order...". Mirroring makes AI say "Bhai       
           aapka order bas nikalne wala hai." (Matching the user's vibe).     

"""

import json
import re
from typing import Dict, Any, List, Type
from pydantic import BaseModel, Field

from src.services.aiskills.engine.base_skill import SemanticContract, skill_logger
from src.services.aiskills.types import ContextPackage
from src.services.routing.local_llm_router import local_router
from src.utils.logger import logger


#  Schema 

class MirroringInput(BaseModel):
    user_message: str = Field(..., description="Raw text from the user to analyze.")


#  Contract 

class RapportMirroringContract(SemanticContract):
    skill_id: str = "rapport_mirroring"
    capability_statement: str = "Analyzes text for language, formality, and emotional state using local 0.6b model to mirror user's conversational tone."
    
    # Passive skill, can be called internally by any agent
    allowed_roles: List[str] = ["malik", "grahak", "agent", "shadow_boss"]
    pii_fields: List[str] = []

    @property
    def input_schema(self) -> Type[BaseModel]:
        return MirroringInput

    @skill_logger
    async def _run(
        self,
        params: MirroringInput,
        entities: Dict[str, Any],
        context_package: ContextPackage,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Uses Shadow Boss (0.6b local) to extract EQ traits globally.
        No hardcoded dictionaries. Fully scalable to any language/slang.
        """
        message = params.user_message
        
        system_prompt = (
            "You are a strict JSON analyzer. "
            "Analyze the given user message. "
            "What is the user's language, tone (formal/informal), and emotional state? "
            "Create a 'mirror_tag' instructing an AI how to reply (e.g., '[Use casual Hindi and reply gently]', '[Use formal Spanish]'). "
            "Return ONLY valid JSON matching this schema exactly: "
            "{\"language\": \"<detected_language>\", \"tone\": \"<formal/informal>\", \"emotion\": \"<state>\", \"mirror_tag\": \"<custom_instruction>\"}"
        )

        try:
            # Stage 1: Fast local inference (< 100ms)
            raw_response = await local_router.quick_classify(prompt=message, system=system_prompt)
            
            # Simple JSON extraction in case the model wraps it in markdown
            match = re.search(r"(\{.*\})", raw_response, re.DOTALL)
            json_text = match.group(1) if match else raw_response
            
            result = json.loads(json_text)
            
            # Ensure required keys exist
            return {
                "formality": result.get("tone", "neutral").lower(),
                "language": result.get("language", "english").lower(),
                "emotion": result.get("emotion", "neutral").lower(),
                "mirror_tag": result.get("mirror_tag", None),
                "metrics": {"provider": "qwen3:0.6b_local"}
            }
            
        except Exception as e:
            logger.error(f" [Mirroring] LLM classification failed: {e}")
            # Safe Fallback
            return {
                "formality": "neutral",
                "language": "english",
                "emotion": "neutral",
                "mirror_tag": None,
                "metrics": {"error": str(e)}
            }


    @property
    def capability_statement(self) -> str:
        return "Dummy capability statement for " + self.__class__.__name__

