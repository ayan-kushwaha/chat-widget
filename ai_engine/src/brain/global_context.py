
from typing import Dict, Any, Optional
from loguru import logger
import time

class GlobalContext:
    """
    The Memory Manager for the Hierarchical Brain.
    Ensures that when we switch from Onboarding to Booking, 
    the AI doesn't forget who the user is.
    """
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.data: Dict[str, Any] = {
            "user_name": "Guest",
            "auth_status": "guest",
            "current_phase": "phase_01_onboarding",
            "metadata": {},
            "history": [],
            "last_active": time.time()
        }

    def update(self, key: str, value: Any):
        self.data[key] = value
        self.data["last_active"] = time.time()
        logger.debug(f" Context Updated [{self.user_id}]: {key} = {value}")

    def get(self, key: str, default: Any = None) -> Any:
        return self.data.get(key, default)

    def to_dict(self) -> Dict[str, Any]:
        return self.data

class ContextManager:
    """
    Global Store for all active sessions.
    In a production env, this would be backed by Redis.
    """
    _sessions: Dict[str, GlobalContext] = {}

    @classmethod
    def get_context(cls, user_id: str) -> GlobalContext:
        if user_id not in cls._sessions:
            logger.info(f" Creating New Context for User: {user_id}")
            cls._sessions[user_id] = GlobalContext(user_id)
        return cls._sessions[user_id]

    @classmethod
    def clear_context(cls, user_id: str):
        if user_id in cls._sessions:
            del cls._sessions[user_id]
            logger.info(f" Context Cleared for User: {user_id}")
