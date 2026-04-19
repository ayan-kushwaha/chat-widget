from .base_phase import BasePhase
from typing import Dict, Any

class Phase20Diagnostics(BasePhase):
    PHASE_ID = "phase_20_diagnostics"
    PHASE_NAME = "Interactive Diagnostics"
    PHASE_DESCRIPTION = "Step-by-step troubleshooting using Interactive Chain Widgets (Decision Trees)."

    @staticmethod
    def get_prompt(context: Dict[str, Any]) -> str:
        last_msg = context.get("last_user_input", "").lower()
        
        stage = "symptom_check"
        if "yes" in last_msg or "no" in last_msg:
             stage = "step_traversal"
        elif "fixed" in last_msg:
             stage = "close_ticket"

        prompts = {
            "symptom_check": """
                STAGE: START
                "Let's figure this out. Does the screen turn ON?"
                [Show YES/NO Buttons]
            """,
            "step_traversal": """
                STAGE: BRANCHING
                User answered the previous step.
                Logic: If YES -> Go to Step 2. If NO -> Go to Step 1.5.
                "Okay, next: Do you see an error code?"
            """,
            "close_ticket": """
                STAGE: SOLVED
                "Great! Glad it's working."
            """
        }
        
        selected_logic = prompts.get(stage, prompts["symptom_check"])

        base_prompt = f"""
        ROLE: The Doctor (Visual)
        CURRENT STAGE: {stage.upper()}
        
        INSTRUCTION:
        {selected_logic}
        """
        return BasePhase.inject_global_context(base_prompt, context)
