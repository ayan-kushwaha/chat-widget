"""
 RuntimeInjector  Assembles the Full Context Package (Phase 2)
===================================================================
The Heart of the 2-Phase Context Injection system.

Gathering logic:
  1. DNA: Fetch pre-computed BusinessDNA from MongoDB.
  2. KB: Retrieve relevant chunks from Qdrant for THIS query.
  3. Mandates: Fetch Boss's explicit rules from Workforce DB (MongoDB).
  4. Memory: Fetch last N turns of chat history from Redis.

All 4 pieces are put into a single `ContextPackage` object and passed
to `SkillFactory.get_skill_for_execution()` and then `BaseSkill._run()`.
"""

from typing import Optional, List, Dict, Any
from loguru import logger

# Local imports
from src.services.aiskills.types import ContextPackage
from .business_dna import get_business_dna
from .kb_retriever import KBRetriever
from src.core.db.mongodb import get_mongodb


class RuntimeInjector:
    """
    Orchestrates the assembly of runtime context for a skill call.
    """

    @staticmethod
    async def assemble_package(
        business_id: str,
        employee_id: str,
        query:       str,
        session_id:  Optional[str] = None,
        memory_payload: Optional[Dict[str, str]] = None,
        user_timezone: Optional[str] = None
    ) -> ContextPackage:
        """
        Assembles the complete ContextPackage for a skill execution.
        """
        logger.info(f" [RuntimeInjector] Assembling context package for {employee_id}...")

        # 1. Fetch Business DNA (Phase 1)
        dna = await get_business_dna(business_id)

        # 2. Retrieve KB Chunks (Phase 2)
        retriever = KBRetriever(business_id=business_id, employee_id=employee_id)
        kb_chunks = await retriever.retrieve_relevant_chunks(query=query)

        # 3. Fetch Boss Mandates (Workforce DB)
        boss_mandates = await RuntimeInjector._get_boss_mandates(employee_id)

        # 4. Ingest Dual-Tier Memory (Phase 2 Upgrade)
        session_memory = memory_payload or {}

        # 5. OS Level 1: The Global Time Anchor (Time Injection)
        # Gives mathematical time awareness to the AI globally
        import datetime
        import pytz
        
        tz_str = user_timezone or getattr(dna, 'timezone', 'UTC')
        try:
            tz = pytz.timezone(tz_str)
        except pytz.UnknownTimeZoneError:
            logger.warning(f" [RuntimeInjector] Unknown timezone '{tz_str}', falling back to UTC")
            tz = pytz.UTC
            
        now_local = datetime.datetime.now(tz)
        anchor_str = now_local.strftime("%A, %B %d, %Y at %I:%M %p %Z")

        # Assemble the package
        package = ContextPackage(
            business_dna=dna,
            kb_chunks=kb_chunks,
            boss_mandates=boss_mandates,
            session_memory=session_memory,
            temporal_anchor=f"Current Context Time: {anchor_str}",
            employee_id=employee_id,
            business_id=business_id,
            session_id=session_id or "default"
        )

        logger.success(f" [RuntimeInjector] Package ready | DNA={dna.industry_cluster} | KB={len(kb_chunks)}")
        return package

    @staticmethod
    async def _get_boss_mandates(employee_id: str) -> List[Dict[str, str]]:
        """Fetch custom mandates set by the Boss for this AI employee."""
        try:
            db = await get_mongodb()
            # employee_id maps to 'employee_id' in workforce collection
            emp_doc = await db.workforce.find_one({"employee_id": employee_id})
            
            if emp_doc and "mandates" in emp_doc:
                return emp_doc["mandates"] # List of {"skill": str, "mandate": str}
            
            return []
        except Exception as e:
            logger.error(f" [RuntimeInjector] Failed to fetch mandates: {e}")
            return []

    @staticmethod
    async def _get_session_memory(session_id: Optional[str]) -> List[Dict[str, Any]]:
        """Fetch recent conversation history."""
        if not session_id:
            return []
            
        try:
            # In Cluaiz, session memory usually lives in MongoDB 'conversations'
            db = await get_mongodb()
            conv_doc = await db.conversations.find_one({"session_id": session_id})
            
            if conv_doc and "history" in conv_doc:
                # Return last 5 turns to keep context window clean
                return conv_doc["history"][-10:]
            
            return []
        except Exception as e:
            logger.error(f" [RuntimeInjector] Failed to fetch session memory: {e}")
            return []
