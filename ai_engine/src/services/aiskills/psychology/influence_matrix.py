"""

   INFLUENCE MATRIX  SemanticContract [P5]                                  
  Universal Psychology Radar  OS Level                                       
                                                                              
  Role:    Decides the persuasion strategy for the AI in this conversation.   
                                                                              
  Action:  0.6b model analyses the situation and returns whether to be        
           empathetic/soft (Naram) or firm/strict (Sakt), with reasoning.     
                                                                              
  Why:     Kab naram hona hai aur kab sakt  yahi real psychology hai.        
           A user asking for a refund after 3 days needs a different          
           approach than a loyal customer asking after 3 months.              

"""

import json
import re
from typing import Dict, Any, List, Type
from pydantic import BaseModel, Field

from src.services.aiskills.engine.base_skill import SemanticContract, skill_logger
from src.services.aiskills.types import ContextPackage
from src.services.routing.local_llm_router import local_router
from src.utils.logger import logger


class InfluenceMatrixInput(BaseModel):
    user_message: str = Field(..., description="The user or boss message to analyze for persuasion strategy.")
    relationship_context: str = Field(default="", description="Optional context about the user's history or relationship.")


class InfluenceMatrixContract(SemanticContract):
    skill_id: str = "influence_matrix"
    capability_statement: str = (
        "Decides whether the AI should be empathetic/soft or firm/strict in its reply. "
        "Returns a persuasion strategy tailored to the user's situation."
    )
    allowed_roles: List[str] = ["malik", "grahak", "agent", "shadow_boss"]
    pii_fields: List[str] = []

    @property
    def input_schema(self) -> Type[BaseModel]:
        return InfluenceMatrixInput

    @skill_logger
    async def _run(
        self,
        params: InfluenceMatrixInput,
        entities: Dict[str, Any],
        context_package: ContextPackage,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Uses 0.6b model to decide persuasion approach.
        """
        context_hint = f"\nUser relationship context: {params.relationship_context}" if params.relationship_context else ""

        system_prompt = (
            "You are a persuasion strategy advisor for a customer support AI. "
            "Analyze the message and decide the best communication approach for the AI's response. "
            "'naram' = empathetic, apologetic, flexible. 'sakt' = firm, clear boundaries, no exceptions."
            f"{context_hint}"
            "Return ONLY valid JSON: "
            "{\"approach\": \"<naram/sakt/balanced>\", "
            "\"reason\": \"<why this approach>\", "
            "\"key_tactic\": \"<one specific tactic e.g. 'Acknowledge the frustration first' or 'Cite the policy clearly'>\"}"
        )

        try:
            raw = await local_router.quick_classify(prompt=params.user_message, system=system_prompt)
            match = re.search(r"(\{.*\})", raw, re.DOTALL)
            result = json.loads(match.group(1) if match else raw)

            return {
                "approach": result.get("approach", "balanced"),
                "reason": result.get("reason", ""),
                "key_tactic": result.get("key_tactic", ""),
                "metrics": {"provider": "qwen3:0.6b_local"}
            }
        except Exception as e:
            logger.error(f" [InfluenceMatrix] Analysis failed: {e}")
            return {
                "approach": "balanced",
                "reason": "fallback",
                "key_tactic": "Be helpful and clear.",
                "metrics": {"error": str(e)}
            }

    @property
    def capability_statement(self) -> str:
        return "Dummy capability statement for " + self.__class__.__name__

