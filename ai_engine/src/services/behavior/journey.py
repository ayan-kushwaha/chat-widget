from typing import List, Dict, Optional, Any
from src.utils.logger import logger

class JourneyService:
    """
    Rule 2: Generic Flow/Step Handler.
    Decouples UI steps from Python code.
    """
    
    @staticmethod
    def get_current_step(
        query: str,
        history: List[Dict[str, Any]],
        journey_config: List[Dict[str, Any]],
        current_step_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Determines which step of the journey the user is currently in.
        """
        if not journey_config:
            return None
            
        # 1. Check for manual jumps (Keywords/Intents already mostly handled by ADS)
        # But if ADS confirmed a Flow match, we might already have the step_id.
        
        # 2. Sequential Logic: If no jump, stay in current step or move to next
        if not current_step_id:
            # New session - Start at first enabled step
            for step in journey_config:
                if step.get('enabled', True):
                    return step
            return None
            
        # Find current step details
        current_step = next((s for s in journey_config if s.get('id') == current_step_id), None)
        
        # If user answered, should we move to next step?
        # For now, we return the current_step and let the LLM handle the transition 
        # based on the mission instruction.
        
        return current_step

journey_service = JourneyService()
