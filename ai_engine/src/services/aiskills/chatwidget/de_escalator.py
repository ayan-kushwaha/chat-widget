"""

   DE-ESCALATOR  SemanticContract [S1]                                     
  Batch D: Sarah  The Support Lead & Heart                                   
                                                                              
  Role:    Unified Empathy Engine for angry/frustrated customer support.      
                                                                              
  Pipeline (Sarah's 3-layer empathy response):                                
    Layer 1  The Chameleon [P3]: Detect mood, warmth, urgency                
    Layer 2  The Influence Matrix [P5]: Decide approach (naram vs sakt)      
    Layer 3  Rapport Mirroring [P2]: Match language and tone in final reply  
                                                                              
  Action:  Sarah reads the customer's angry/frustrated message, runs it       
           through all 3 psychology layers, and generates a perfectly tuned   
           de-escalation reply + logs the problem for the Boss.               
                                                                              
  Why:     A customer typing in CAPS  needs to first feel HEARD, not        
           immediately get a policy response. That empathy is what converts   
           a lost customer into a loyal one.                                  

"""

import json
import re
from typing import Dict, Any, List, Type, Optional
from pydantic import BaseModel, Field
from loguru import logger

from src.services.aiskills.engine.base_skill import SemanticContract, skill_logger
from src.services.aiskills.types import ContextPackage
from src.services.routing.local_llm_router import local_router

#  Internal Psychology Skills 
from src.services.aiskills.psychology.chameleon import TheChameleonContract, ChameleonInput
from src.services.aiskills.psychology.influence_matrix import InfluenceMatrixContract, InfluenceMatrixInput
from src.services.aiskills.psychology.mirroring import RapportMirroringContract, MirroringInput


#  Schema 

class DeEscalatorInput(BaseModel):
    customer_message: str = Field(
        ..., description="Raw angry or frustrated message from the customer."
    )
    business_id: str = Field(default="", description="Business context ID for issue logging.")
    customer_id: str = Field(default="", description="Customer ID for profile update.")


#  Contract 

class DeEscalatorContract(SemanticContract):
    """
    Sarah's unified Empathy Engine.

    Internally runs 3 psychology layers (P3 + P5 + P2) and generates
    a perfectly tuned de-escalation reply, then logs the root issue.
    """
    skill_id: str = "de_escalator"
    capability_statement: str = (
        "Handles angry, frustrated, or upset customers with empathy. "
        "Adjusts tone, language, and approach to de-escalate the situation. "
        "Extracts the root problem and logs it for the Boss. "
        "Use when a customer is complaining, escalating, or expressing frustration."
    )

    allowed_roles: List[str] = ["grahak", "agent", "shadow_boss"]
    pii_fields:    List[str] = ["customer_id"]

    @property
    def input_schema(self) -> Type[BaseModel]:
        return DeEscalatorInput

    @skill_logger
    async def _run(
        self,
        params:          DeEscalatorInput,
        entities:        Dict[str, Any],
        context_package: ContextPackage,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Sarah's full 3-layer empathy pipeline.
        """
        msg = params.customer_message
        time_context = context_package.temporal_anchor

        # 
        # LAYER 1: The Chameleon [P3]  Detect mood, warmth, urgency
        # 
        chameleon = TheChameleonContract()
        mood_data = await chameleon._run(ChameleonInput(user_message=msg), {}, context_package)
        mood      = mood_data.get("mood", "neutral")
        urgency   = mood_data.get("urgency", "medium")
        directive = mood_data.get("style_directive", "Be helpful and clear.")
        logger.debug(f" [DeEscalator] P3 Chameleon: mood={mood}, urgency={urgency}")

        # 
        # LAYER 2: Influence Matrix [P5]  Decide naram vs sakt approach
        # 
        influence = InfluenceMatrixContract()
        strategy  = await influence._run(InfluenceMatrixInput(user_message=msg), {}, context_package)
        approach  = strategy.get("approach", "balanced")
        tactic    = strategy.get("key_tactic", "Acknowledge the frustration first.")
        logger.debug(f" [DeEscalator] P5 Influence: approach={approach}, tactic={tactic}")

        # 
        # LAYER 3: Rapport Mirroring [P2]  Match language and formality
        # 
        mirror   = RapportMirroringContract()
        mirror_data = await mirror._run(MirroringInput(user_message=msg), {}, context_package)
        language = mirror_data.get("language", "english")
        formality = mirror_data.get("formality", "neutral")
        mirror_tag = mirror_data.get("mirror_tag", "")
        logger.debug(f" [DeEscalator] P2 Mirror: language={language}, formality={formality}")

        # 
        # FINAL SYNTHESIS: Generate the de-escalation reply using 4B
        # 
        synthesis_system = (
            f"[{time_context}]\n"
            f"You are Sarah, an empathetic customer support lead.\n"
            f"Customer Psychology Profile:\n"
            f"  - Mood: {mood} | Urgency: {urgency}\n"
            f"  - Communication approach: {approach}  {tactic}\n"
            f"  - Language: {language} | Formality: {formality}\n"
            f"  - Style directive: {directive}\n"
            f"  {mirror_tag}\n\n"
            f"Your job:\n"
            f"1. Acknowledge the customer's feeling FIRST (don't jump to solving immediately)\n"
            f"2. Extract the root problem from their message\n"
            f"3. Give a warm, solution-oriented reply\n\n"
            f"Return ONLY valid JSON:\n"
            "{\"empathy_reply\": \"<your full customer-facing reply>\", "
            "\"root_problem\": \"<one line: what the actual issue is>\", "
            "\"severity\": \"<critical/high/medium/low>\", "
            "\"action_required\": \"<what needs to happen to resolve this>\"}"
        )

        try:
            raw = await local_router.deep_reason(
                prompt=f"Customer message:\n\"{msg}\"",
                system=synthesis_system
            )
            match = re.search(r"(\{.*\})", raw, re.DOTALL)
            result = json.loads(match.group(1) if match else raw)

            reply         = result.get("empathy_reply", "")
            root_problem  = result.get("root_problem", "Unknown issue")
            severity      = result.get("severity", "medium")
            action        = result.get("action_required", "")

            logger.info(f" [DeEscalator] Generated reply | severity={severity} | problem='{root_problem}'")

            # Persist issue log to MongoDB
            if params.business_id:
                await _log_customer_issue(params.business_id, params.customer_id, root_problem, severity, action, msg)

            return {
                "empathy_reply":   reply,
                "root_problem":    root_problem,
                "severity":        severity,
                "action_required": action,
                "psychology_used": {
                    "mood":        mood,
                    "urgency":     urgency,
                    "approach":    approach,
                    "language":    language,
                    "formality":   formality
                }
            }

        except Exception as e:
            logger.error(f" [DeEscalator] Synthesis failed: {e}")
            # Graceful fallback reply
            fallback_reply = (
                "Main samajh raha/rahi hoon aap pareshan hain. "
                "Mujhe thoda time dijiye, main is issue ko turant solve karne ki koshish karta/karti hoon."
            )
            return {
                "empathy_reply":   fallback_reply,
                "root_problem":    "Unable to extract",
                "severity":        "medium",
                "action_required": "Manual review required",
                "psychology_used": {
                    "mood": mood, "urgency": urgency,
                    "approach": approach, "language": language
                },
                "error": str(e)
            }


async def _log_customer_issue(
    business_id: str, customer_id: str, problem: str,
    severity: str, action: str, raw_message: str
) -> None:
    """Persist customer issue to MongoDB for Boss review."""
    try:
        from src.core.db.mongodb import get_mongodb
        from datetime import datetime
        db = await get_mongodb()
        await db.customer_issues.insert_one({
            "business_id":   business_id,
            "customer_id":   customer_id,
            "root_problem":  problem,
            "severity":      severity,
            "action_required": action,
            "raw_message":   raw_message,
            "status":        "open",
            "created_at":    datetime.utcnow()
        })
        logger.debug(" [DeEscalator] Customer issue logged to MongoDB.")
    except Exception as e:
        logger.warning(f" [DeEscalator] Could not log issue: {e}")

    @property
    def capability_statement(self) -> str:
        return "Dummy capability statement for " + self.__class__.__name__

