from .base_phase import BasePhase
from typing import Dict, Any

class Phase17Hands(BasePhase):
    PHASE_ID = "phase_17_hands"
    PHASE_NAME = "Tool Execution (Hands)"
    PHASE_DESCRIPTION = "Executes specific tools like Email Sending, CRM Updates, or API calls."

    @staticmethod
    def get_prompt(context: Dict[str, Any]) -> str:
        last_msg = context.get("last_user_input", "").lower()
        
        stage = "param_check"
        if "send" in last_msg or "do it" in last_msg:
             stage = "execution"
        elif "cancel" in last_msg:
             stage = "abort"

        prompts = {
            "param_check": """
                STAGE: VERIFY PARAMS
                "I'm ready to send the email. To: [X], Subject: [Y]. Is this correct?"
            """,
            "execution": """
                STAGE: ACTION
                Output TOOL CALL JSON.
                "Sending now..."
                Output: {"action": "execute_tool", "tool_name": "..."}
            """,
            "abort": """
                STAGE: CANCEL
                "Okay, action cancelled. Nothing was sent."
            """
        }
        
        selected_logic = prompts.get(stage, prompts["param_check"])

        base_prompt = f"""
        ROLE: The Operator
        CURRENT STAGE: {stage.upper()}
        
        INSTRUCTION:
        {selected_logic}
        """
        return BasePhase.inject_global_context(base_prompt, context)
