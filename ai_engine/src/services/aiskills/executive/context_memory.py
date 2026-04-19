"""

   CONTEXT MEMORY  SemanticContract [E-MEM]                                
  Batch B: Anjali  Executive PA                                              
                                                                              
  Role:    Retrieves the Boss's historical decisions and chats from DB.       
                                                                              
  Action:  Anjali searches MongoDB for past tasks, decisions, and outcomes    
           related to the Boss's current question.                            
                                                                              
  Why:     "Pichle hafte wala inventory report kahan hai?"  Anjali can       
           find it without the Boss having to search. This is what makes      
           her a REAL PA, not just a chatbot.                                 

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

class ContextMemoryInput(BaseModel):
    query: str = Field(
        ...,
        description="What the Boss is looking for (e.g., 'last inventory report', 'Sarah's task from last week')."
    )
    business_id: str = Field(default="", description="Business context ID.")
    limit: int = Field(default=5, description="Max number of past records to return.")


#  Contract 

class ContextMemoryContract(SemanticContract):
    """
    Anjali's long-term memory retrieval. Fetches matching past tasks and
    decisions from the boss_log collection in MongoDB.
    """
    skill_id: str = "context_memory"
    capability_statement: str = (
        "Retrieves past tasks, decisions, and meeting notes for the Boss. "
        "Use when Boss asks about something from the past: 'Woh wali report', 'Last week ka kya hua', "
        "'Did we resolve the Sarah issue?' etc."
    )
    allowed_roles: List[str] = ["malik", "shadow_boss"]
    pii_fields:    List[str] = []

    @property
    def input_schema(self) -> Type[BaseModel]:
        return ContextMemoryInput

    @property
    def capability_statement(self) -> str:
        return "Dummy capability statement for " + self.__class__.__name__

    @skill_logger
    async def _run(
        self,
        params:          ContextMemoryInput,
        entities:        Dict[str, Any],
        context_package: ContextPackage,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Step 1: Uses 0.6B to extract search keywords from the query.
        Step 2: Searches MongoDB task_log/boss_log for matching records.
        Step 3: Returns matched records as structured context.
        """
        time_context = context_package.temporal_anchor

        # Step 1: Extract search keywords from the boss query using 0.6B
        keyword_prompt = (
            f"[{time_context}]\n"
            "Extract 2-4 search keywords from this query to search a task/log database. "
            "Return ONLY a JSON array of strings. Example: [\"inventory\", \"report\", \"last week\"]\n"
            f"Query: \"{params.query}\""
        )

        try:
            raw = await local_router.quick_classify(
                prompt=keyword_prompt,
                system="You extract search keywords. Return ONLY a JSON array."
            )
            match = re.search(r"(\[.*\])", raw, re.DOTALL)
            keywords: List[str] = json.loads(match.group(1) if match else "[]")
        except Exception:
            keywords = params.query.lower().split()[:4]

        logger.debug(f" [ContextMemory] Searching with keywords: {keywords}")

        # Step 2: Search MongoDB
        records = await _search_task_log(params.business_id, keywords, params.limit)

        if not records:
            return {
                "found": False,
                "keywords_used": keywords,
                "records": [],
                "reply": "Mujhe koi relevant record nahi mila is query ke liye. Kya aap thoda aur specific kar sakte hain?"
            }

        return {
            "found": True,
            "keywords_used": keywords,
            "records": records,
            "count": len(records),
            "reply": f"Haan Boss, mujhe {len(records)} related record(s) mile hain."
        }


async def _search_task_log(business_id: str, keywords: List[str], limit: int) -> List[Dict]:
    """Full-text keyword search across MongoDB task_log collection."""
    try:
        from src.core.db.mongodb import get_mongodb
        db = await get_mongodb()

        # Build OR query across keywords
        keyword_filter = {
            "$or": [
                {"task": {"$regex": kw, "$options": "i"}}
                for kw in keywords
            ]
        }
        if business_id:
            keyword_filter["business_id"] = business_id

        cursor = db.task_log.find(keyword_filter).sort("created_at", -1).limit(limit)
        results = []
        async for doc in cursor:
            doc.pop("_id", None)
            results.append(doc)
        return results

    except Exception as e:
        logger.warning(f" [ContextMemory] MongoDB search failed: {e}")
        return []

    # Removed the badly indented capability_statement from here

