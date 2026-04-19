"""

   BRIEFING ARCHITECT  SemanticContract [E5]                               
  Batch B: Anjali  Executive PA                                              
                                                                              
  Role:    Summarizes the day's chats into a concise Boss Briefing.           
                                                                              
  Action:  4B Deep Path model reads recent chat history and produces a        
           3-5 bullet point executive summary for the Boss.                   
                                                                              
  Why:     Boss can't read 200 messages. Anjali reads them all and gives      
           a JARVIS-style "Here's what happened today, Boss" briefing.        

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

class BriefingArchitectInput(BaseModel):
    chat_history: str = Field(
        ...,
        description="Full or summarized chat history string for the day."
    )
    focus_area: str = Field(
        default="",
        description="Optional: specific area to focus briefing on (e.g. 'customer complaints', 'orders')."
    )


#  Contract 

class BriefingArchitectContract(SemanticContract):
    """
    Anjali's intelligence layer for daily executive summaries.
    Uses Deep Path (4B) since summarization requires reasoning over long context.
    """
    skill_id: str = "briefing_architect"
    capability_statement: str = (
        "Summarizes chat history into a concise 3-5 bullet point executive briefing for the Boss. "
        "Use when the Boss asks 'Aaj kya hua?', 'Give me a summary', or requests an update."
    )

    allowed_roles: List[str] = ["malik", "shadow_boss"]
    pii_fields:    List[str] = []

    @property
    def input_schema(self) -> Type[BaseModel]:
        return BriefingArchitectInput

    @skill_logger
    async def _run(
        self,
        params:          BriefingArchitectInput,
        entities:        Dict[str, Any],
        context_package: ContextPackage,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Uses 4B model to create a structured executive briefing from chat history.
        """
        time_context = context_package.temporal_anchor
        focus = f"\nFocus specifically on: {params.focus_area}" if params.focus_area else ""

        system_prompt = (
            f"[{time_context}]\n"
            "You are Anjali, the Executive PA. The Boss has asked for a briefing. "
            "Read the following chat history and create a concise executive summary. "
            f"{focus}\n"
            "Format your response as ONLY valid JSON: "
            "{\"briefing\": ["
            "\"<Bullet 1>\", \"<Bullet 2>\", \"<Bullet 3>\" "
            "], "
            "\"critical_alerts\": [\"<Any urgent issues that need Boss attention immediately>\"], "
            "\"mood_of_customers\": \"<overall customer sentiment today: positive/neutral/negative>\"}"
        )

        try:
            # Uses Deep Path (4B)  summarization needs reasoning
            raw = await local_router.deep_reason(
                prompt=f"Chat History:\n{params.chat_history[:4000]}",
                system=system_prompt
            )
            match = re.search(r"(\{.*\})", raw, re.DOTALL)
            result = json.loads(match.group(1) if match else raw)

            briefing = result.get("briefing", [])
            alerts   = result.get("critical_alerts", [])
            mood     = result.get("mood_of_customers", "neutral")

            logger.info(f" [BriefingArchitect] Generated {len(briefing)} bullet briefing. Alerts: {len(alerts)}")

            return {
                "briefing": briefing,
                "critical_alerts": alerts,
                "mood_of_customers": mood,
                "time_context": time_context
            }

        except Exception as e:
            logger.error(f" [BriefingArchitect] Summarization failed: {e}")
            return {
                "briefing": ["Unable to generate briefing at this time."],
                "critical_alerts": [],
                "mood_of_customers": "unknown",
                "error": str(e)
            }

    @property
    def capability_statement(self) -> str:
        return "Dummy capability statement for " + self.__class__.__name__

