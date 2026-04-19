from .base_phase import BasePhase
from typing import Dict, Any

class Phase14Data(BasePhase):
    PHASE_ID = "phase_14_data"
    PHASE_NAME = "Data Collection"
    PHASE_DESCRIPTION = "Collecting structured data like addresses, GST numbers, or survey responses."

    @staticmethod
    def get_prompt(context: Dict[str, Any]) -> str:
        last_msg = context.get("last_user_input", "").lower()
        
        stage = "next_field"
        if "correct" in last_msg or "valid" in last_msg:
             stage = "validation_check"
        elif "done" in last_msg or "finish" in last_msg:
             stage = "submission"

        prompts = {
            "next_field": """
                STAGE: INTERVIEW
                Ask for the NEXT missing field.
                "Please enter your GST Number."
            """,
            "validation_check": """
                STAGE: VERIFY
                User entered data.
                "That looks like an invalid email. Could you check again?"
                OR "Got it. Next is Address."
            """,
            "submission": """
                STAGE: SAVE
                All data collected.
                Output JSON: {"action": "submit_data", "data": "..."}
                "Thank you! I've saved your details."
            """
        }
        
        selected_logic = prompts.get(stage, prompts["next_field"])

        base_prompt = f"""
        ROLE: The Clerk
        CURRENT STAGE: {stage.upper()}
        
        INSTRUCTION:
        {selected_logic}
        """
        return BasePhase.inject_global_context(base_prompt, context)
