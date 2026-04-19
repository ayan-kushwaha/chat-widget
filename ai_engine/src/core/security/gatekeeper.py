import functools
from typing import Dict, Any, List
from loguru import logger

# List of skills that ONLY the "Malik" (Boss) can access
BOSS_ONLY_SKILLS = [
    "p_l_bot", "financial_summary", "inventory_sync", "contract_reviewer",
    "api_health_monitor", "security_sentinel", "database_optimizer",
    "boss_psychology_log", "orchestration_direct", "multi_store_sync"
]

def gatekeeper(func):
    """
    Iron Dome Layer 2: Role-Based Gatekeeper (Malik vs Grahak)
    Enforces strict isolation between Admin and Customer actions.
    """
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        skill = args[0]
        skill_name = skill.name.lower()
        
        # In a real scenario, this would come from the verified session/DB
        user_role = kwargs.get("user_role", "grahak") # Default to safest role
        user_id = kwargs.get("user_id", "unknown")

        if skill_name in BOSS_ONLY_SKILLS and user_role != "malik":
            logger.warning(f" GATEKEEPER BLOCK: User {user_id} (Role: {user_role}) tried to access Admin Skill: {skill_name}")
            return {
                "status": "error",
                "message": "PERMISSION_DENIED",
                "detail": "This action requires administrative privileges.",
                "error_type": "UnauthorizedAccess"
            }
        
        return await func(*args, **kwargs)
    
    return wrapper
