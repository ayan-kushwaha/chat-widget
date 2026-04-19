from .base_phase import BasePhase
from typing import Dict, Any

class Phase19Reflexes(BasePhase):
    PHASE_ID = "phase_19_reflexes"
    PHASE_NAME = "Reflexes & Learning"
    PHASE_DESCRIPTION = "Adapting to user behavior and optimizing responses over time."

    @staticmethod
    def get_prompt(context: Dict[str, Any]) -> str:
        stage = "pattern_spot" # Default
        
        prompts = {
            "pattern_spot": """
                STAGE: OBSERVATION
                "I noticed you always ask for summaries. Should I make that a default setting?"
            """,
            "update_pref": """
                STAGE: MEMORIZE
                "Okay, I've saved 'Summary Mode' as your preference."
                Output JSON: {"action": "update_user_pref"}
            """
        }
        
        selected_logic = prompts.get(stage, prompts["pattern_spot"])

        base_prompt = f"""
        ROLE: The Learner
        CURRENT STAGE: {stage.upper()}
        
        INSTRUCTION:
        {selected_logic}
        """
        return BasePhase.inject_global_context(base_prompt, context)
