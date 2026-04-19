"""

    CONVERSATION MEMORY MANAGER (Dual-Tier)                                 
  Batch 5: The Time-Aware Brain (Phase 2)                                     
                                                                              
  Role:    Provides Short-Term and Long-Term Context for AI Employees.        
                                                                              
  Tiers:                                                                      
  1. Short-Term (Working Memory): Token-bounded sliding window of the current 
     conversation. Prevents 4B LLM Context Overflow.                          
  2. Long-Term (Historical Memory): Intent-aware Vector DB fetch. Includes    
     strict Timestamps for 'Time-Awareness'.                                  

"""

import time
from typing import Dict, List, Any
from datetime import datetime
from loguru import logger

from src.core.memory import memory # type: ignore
from src.core.vector_store import vector_store # type: ignore


class ShortTermMemory:
    """
    Token-bounded Working Memory.
    Prevents Context Overflow on 4B models.
    """
    def __init__(self, max_tokens: int = 1500, max_turns: int = 10):
        self.history: List[Dict[str, str]] = []
        self.max_tokens = max_tokens
        self.max_turns  = max_turns
        self.slots: Dict[str, Any] = {} # For Batch 5.2 Slot Filling

    def add_turn(self, role: str, message: str) -> None:
        """Add a turn and slide window if token limit exceeded."""
        self.history.append({"role": role, "message": message})
        self._enforce_limits()

    def _estimate_tokens(self, text: str) -> int:
        """Fast, rough token estimation (word count * 1.3)."""
        return int(len(text.split()) * 1.3)

    def _enforce_limits(self) -> None:
        """Slide the window based on Max Turns OR Max Tokens, whichever hits first."""
        # 1. Enforce Turn Limit (Fast drop)
        if len(self.history) > self.max_turns:
            self.history = self.history[-self.max_turns:]

        # 2. Enforce Token Limit (Slide older messages out)
        while self.history:
            total_tokens = sum(self._estimate_tokens(t["message"]) for t in self.history)
            if total_tokens <= self.max_tokens:
                break
            # Drop oldest message
            dropped = self.history.pop(0)
            logger.debug(f" [Memory] Dropped oldest message to save tokens (Rolled off: {self._estimate_tokens(dropped['message'])} tokens)")

    def get_context_string(self) -> str:
        """Returns the formatted short-term conversation."""
        return "\n".join([f"{t['role']}: {t['message']}" for t in self.history])

    def clear(self):
        self.history = []
        self.slots = {}


class LongTermMemory:
    """
    Time-Aware Historical Memory.
    Intent-aware fetch (skip on Greetings to save 15ms latency).
    """

    # Intents that actually need historical context
    FETCH_INTENTS = {"query", "statement"}  # Simplified based on language_processor intents

    @staticmethod
    async def fetch_historical_context(user_id: str, query: str, intent: str, limit: int = 3) -> str:
        """
        Ultra-fast Vector DB Lookup (<15ms goal).
        Only fires if intent is relevant.
        """
        start_ns = time.perf_counter_ns()

        if intent not in LongTermMemory.FETCH_INTENTS:
            logger.debug(f" [Memory] Skipped Long-Term Fetch. Intent='{intent}' doesn't require history.")
            return ""

        # Using simple Qdrant lookup
        # We assume VectorStore saves docs with metadata: {'user_id': user_id, 'timestamp': ISO8601}
        try:
            results = await memory.query_similar(
                query_text=query,
                n_results=limit,
                collection_name="historical_conversations", # Dedicated collection
                where={"user_id": user_id}
            )

            if not results:
                return ""

            # Inject strict timestamps for Time Blindness Fix
            formatted_chunks = []
            for r in results:
                meta = r.get("metadata", {})
                content = r.get("content", "")
                
                # Fetch Timestamp (fallback to Now if missing, though it shouldn't be)
                ts_str = meta.get("timestamp", datetime.now().isoformat())
                try:
                    dt = datetime.fromisoformat(ts_str.replace('Z', '+00:00'))
                    friendly_time = dt.strftime("%d %b %Y, %I:%M %p")
                except:
                    friendly_time = "Past"

                chunk = f"[Past Context - {friendly_time}]: {content}"
                formatted_chunks.append(chunk)

            final_str = "\n".join(formatted_chunks)
            elapsed_ms = (time.perf_counter_ns() - start_ns) / 1_000_000
            
            logger.info(f" [Memory] Fetched {len(results)} historical records in {elapsed_ms:.2f}ms")
            return final_str

        except Exception as e:
            logger.error(f" [Memory] Long-Term Fetch failed: {e}")
            return ""


class ConversationMemoryManager:
    """
    The Master Entrypoint for Dual-Tier Memory.
    Instantiated per active chat session (usually inside BaseEmployee).
    """
    def __init__(self, session_id: str, user_id: str):
        self.session_id = session_id
        self.user_id = user_id
        self.short_term = ShortTermMemory()

    def add_turn(self, role: str, message: str):
        """Add to active session."""
        self.short_term.add_turn(role, message)

    async def build_context_payload(self, current_query: str, current_intent: str) -> Dict[str, str]:
        """
        Builds the memory payload to inject into the ContextPackage or LLM Prompt.
        """
        # 1. Get Short-Term
        st_context = self.short_term.get_context_string()

        # 2. Fetch Long-Term
        lt_context = await LongTermMemory.fetch_historical_context(
            user_id=self.user_id,
            query=current_query,
            intent=current_intent
        )

        return {
            "short_term_history": st_context,
            "long_term_history": lt_context,
            "session_id": self.session_id
        }

    # Pass-through slot filling
    def update_slot(self, key: str, value: Any):
        self.short_term.slots[key] = value

    @property
    def slots(self):
        return self.short_term.slots
