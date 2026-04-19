from typing import Dict, Any, Tuple
from loguru import logger
from src.brain.router import brain_router
from src.services.aiskills.engine.skill_router import EmployeeRouter

class Orchestrator:
    """
    The MASTER TRAFFIC CONTROLLER 
    Routes between:
    1. Employee Workforce (Back Office) - For Admins/Owners
    2. Website Chatbot (Front Office) - For Visitors (Legacy Fallback)
    """
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Orchestrator, cls).__new__(cls)
        return cls._instance
    
    async def route(self, user_text: str, user_id: str, context: Dict[str, Any]) -> Tuple[str, str, float, Dict[str, Any]]:
        """
        Main Routing Function.
        Returns: (system_type, handler_id, confidence, audit_info)
        """
        # 1. PILLAR E - SHADOW BOSS AUDIT (The Gatekeeper)
        # Every request is audited by Qwen3:0.6b for security and intent.
        from src.core.routing.shadow_boss import shadow_boss
        audit = await shadow_boss.analyze(user_text)
        
        # Security Guardrail
        if audit.get("security") == "UNSAFE":
            logger.warning(f" Security Violation detected from {user_id}: {audit.get('reason')}")
            return "security", "blocked", 1.0, audit

        # 2. Determine User Role
        user_role = context.get("user_role", "visitor")
        
        # 3. Fast-Track Simple Intents (Greetings, etc.)
        if audit.get("complexity") == "SIMPLE" and audit.get("intent") == "GREETING":
            logger.info(f" Simple Greeting detected from {user_id}. Shadow Boss handling.")
            return "phase", "phase_01_onboarding", 1.0, audit
        
        # 4. Back Office Check (Only for Owners/Admins)
        if user_role in ["owner", "admin", "staff"]:
            employee_id, confidence = await EmployeeRouter.route(user_text)
            if employee_id and confidence > 0.6:
                logger.info(f" Owner detected: {user_id}. Routing to Employee: {employee_id}")
                return "employee", employee_id, confidence, audit
        
        # 5. Front Office Check (Detailed Phase Routing)
        logger.info(f" Routing to Legacy Brain (Phases) for: {user_id}")
        
        result = await brain_router.route(user_text)
        
        if isinstance(result, tuple):
            phase_id, confidence = result
        else:
            phase_id = result
            confidence = 1.0
            
        return "phase", phase_id, confidence, audit

    def get_worker(self, system_type: str, handler_id: str):
        """
        Returns the executable instance (Phase or Employee).
        """
        if system_type == "employee":
            return EmployeeRouter.get_agent_instance(handler_id)
        else:
            # Default to Phase
            return brain_router.get_phase_class(handler_id)

# Global Instance
orchestrator = Orchestrator()
