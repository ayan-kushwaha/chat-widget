"""

   VOICE-TO-TASK  SemanticContract [E1]                                    
  Batch B: Anjali  Executive PA                                              
                                                                              
  Role:    Converts Boss's unstructured chat or voice text into structured    
           To-Do cards with Task, Priority, and Due Date extracted.           
                                                                              
  Action:  0.6B model reads the Boss's message and extracts actionable        
           task items in structured JSON. Saved in MongoDB for recall.        
                                                                              
  Why:     Boss says "Kal subah ek meeting fix karni hai aur Sarah ko         
           invoice bhejna hai."  Without VTT, this is just a chat.          
           With VTT, it becomes 2 To-Do cards with dates and priorities.     

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

class VoiceToTaskInput(BaseModel):
    boss_message: str = Field(..., description="Raw text or voice transcription from the Boss.")
    business_id:  str = Field(default="", description="Business context ID for storage.")


#  Contract 

class VoiceToTaskContract(SemanticContract):
    """
    Anjali's core intelligence: transforms unstructured Boss speech into
    structured, prioritized To-Do items.
    """
    skill_id: str = "voice_to_task"
    capability_statement: str = (
        "Converts the Boss's chat or voice message into a structured To-Do list. "
        "Extracts tasks, priorities (high/medium/low), and due dates from natural language. "
        "Use when the Boss is giving instructions, delegating work, or mentioning upcoming tasks."
    )

    allowed_roles: List[str] = ["malik", "shadow_boss"]
    pii_fields:    List[str] = []

    @property
    def input_schema(self) -> Type[BaseModel]:
        return VoiceToTaskInput

    @skill_logger
    async def _run(
        self,
        params:          VoiceToTaskInput,
        entities:        Dict[str, Any],
        context_package: ContextPackage,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Extracts actionable tasks from the Boss's message.
        Uses the Temporal Anchor from ContextPackage to resolve relative dates correctly.
        """
        time_context = context_package.temporal_anchor  # e.g. "Friday, Feb 28, 2026 at 11:49 AM IST"

        system_prompt = (
            f"[{time_context}]\n"
            "You are Anjali, the Executive Personal Assistant. "
            "The Boss has given you a message. Extract all actionable tasks from it. "
            "For each task, determine: description, priority (high/medium/low), and due_date (resolve 'kal', 'aaj', 'parson' using the current time above). "
            "Return ONLY valid JSON: "
            "{\"tasks\": ["
            "{\"task\": \"<description>\", \"priority\": \"<high|medium|low>\", \"due_date\": \"<YYYY-MM-DD or null if not specified>\", \"assignee\": \"<person name or 'self'>\"}"
            "]}"
        )

        try:
            raw = await local_router.quick_classify(
                prompt=params.boss_message,
                system=system_prompt
            )
            match = re.search(r"(\{.*\})", raw, re.DOTALL)
            result = json.loads(match.group(1) if match else raw)
            tasks = result.get("tasks", [])

            logger.info(f" [VoiceToTask] Extracted {len(tasks)} task(s) from Boss message.")

            # Persist tasks to MongoDB if available
            if tasks and params.business_id:
                await _save_tasks(params.business_id, tasks)

            return {
                "tasks_extracted": len(tasks),
                "tasks": tasks,
                "source_message": params.boss_message,
                "time_context": time_context
            }

        except Exception as e:
            logger.error(f" [VoiceToTask] Extraction failed: {e}")
            return {
                "tasks_extracted": 0,
                "tasks": [],
                "source_message": params.boss_message,
                "error": str(e)
            }


async def _save_tasks(business_id: str, tasks: List[Dict]) -> None:
    """Persists extracted tasks to MongoDB task_log collection."""
    try:
        from src.core.db.mongodb import get_mongodb
        from datetime import datetime
        db = await get_mongodb()
        docs = [
            {**t, "business_id": business_id, "created_at": datetime.utcnow(), "status": "pending"}
            for t in tasks
        ]
        await db.task_log.insert_many(docs)
        logger.debug(f" [VoiceToTask] Saved {len(docs)} tasks to MongoDB.")
    except Exception as e:
        logger.warning(f" [VoiceToTask] Could not save tasks to MongoDB: {e}")

    @property
    def capability_statement(self) -> str:
        return "Dummy capability statement for " + self.__class__.__name__

