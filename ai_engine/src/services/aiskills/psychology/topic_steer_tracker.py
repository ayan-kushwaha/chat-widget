"""

   TOPIC STEER-TRACKER  SemanticContract [P7]                               
  Universal Psychology Radar  OS Level                                       
                                                                              
  Role:    Tracks whether the conversation is staying on topic, and raises    
           an alert when the chat is drifting away from the main subject.     
                                                                              
  Action:  0.6b model compares the current message to the ongoing topic and   
           returns a 'drift_score' and a steer directive.                      
                                                                              
  Why:     Customers often mix personal venting with actual support requests.  
           This skill tells the AI when to gently steer the conversation back. 

"""

import json
import re
from typing import Dict, Any, List, Type
from pydantic import BaseModel, Field

from src.services.aiskills.engine.base_skill import SemanticContract, skill_logger
from src.services.aiskills.types import ContextPackage
from src.services.routing.local_llm_router import local_router
from src.utils.logger import logger


class TopicSteerInput(BaseModel):
    user_message: str = Field(..., description="The current user message.")
    original_topic: str = Field(default="", description="The original topic or intent of the conversation.")


class TopicSteerTrackerContract(SemanticContract):
    skill_id: str = "topic_steer_tracker"
    capability_statement: str = (
        "Tracks conversation drift and notifies when the user has gone off-topic. "
        "Returns a drift score and recommendation to steer the conversation back."
    )
    allowed_roles: List[str] = ["malik", "grahak", "agent", "shadow_boss"]
    pii_fields: List[str] = []

    @property
    def input_schema(self) -> Type[BaseModel]:
        return TopicSteerInput

    @skill_logger
    async def _run(
        self,
        params: TopicSteerInput,
        entities: Dict[str, Any],
        context_package: ContextPackage,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Uses 0.6b model to detect and score conversation drift.
        """
        topic_context = f"\nOriginal conversation topic: {params.original_topic}" if params.original_topic else ""

        system_prompt = (
            "You are a conversation focus analyzer. "
            "Determine if the current user message is on-topic or drifting off from the main discussion."
            f"{topic_context}"
            "Return ONLY valid JSON: "
            "{\"on_topic\": <true/false>, "
            "\"drift_score\": <0.0 to 1.0 where 0=fully on topic, 1=completely drifted>, "
            "\"current_topic\": \"<what the user is talking about now>\", "
            "\"steer_action\": \"<none | gentle_redirect | hard_redirect>\", "
            "\"steer_phrase\": \"<optional: a short phrase to redirect, or empty if no redirect needed>\"}"
        )

        try:
            raw = await local_router.quick_classify(prompt=params.user_message, system=system_prompt)
            match = re.search(r"(\{.*\})", raw, re.DOTALL)
            result = json.loads(match.group(1) if match else raw)

            return {
                "on_topic": result.get("on_topic", True),
                "drift_score": float(result.get("drift_score", 0.0)),
                "current_topic": result.get("current_topic", "unknown"),
                "steer_action": result.get("steer_action", "none"),
                "steer_phrase": result.get("steer_phrase", ""),
                "metrics": {"provider": "qwen3:0.6b_local"}
            }
        except Exception as e:
            logger.error(f" [TopicSteerTracker] Analysis failed: {e}")
            return {
                "on_topic": True,
                "drift_score": 0.0,
                "current_topic": "unknown",
                "steer_action": "none",
                "steer_phrase": "",
                "metrics": {"error": str(e)}
            }

    @property
    def capability_statement(self) -> str:
        return "Dummy capability statement for " + self.__class__.__name__

