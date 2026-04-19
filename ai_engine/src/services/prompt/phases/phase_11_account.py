from .base_phase import BasePhase
from typing import Dict, Any

class Phase11Account(BasePhase):
    PHASE_ID = "phase_11_account"
    PHASE_NAME = "Account Management"
    PHASE_DESCRIPTION = "Updating profile, password reset, subscription settings."

    @staticmethod
    def get_prompt(context: Dict[str, Any]) -> str:
        last_msg = context.get("last_user_input", "").lower()
        
        stage = "auth_check"
        if "password" in last_msg or "reset" in last_msg:
             stage = "security_protocol"
        elif "cancel" in last_msg or "delete" in last_msg:
             stage = "retention_attempt"
        elif "update" in last_msg or "change" in last_msg:
             stage = "field_update"

        prompts = {
            "auth_check": """
                STAGE: VERIFICATION
                Before allowing changes context, ensure it's them.
                "Just to be safe, please confirm your email address."
            """,
            "field_update": """
                STAGE: UPDATE EXECUTION
                User verified. Ask for new value.
                "What should I update your phone number to?"
                Output JSON: {"action": "update_field"}
            """,
            "security_protocol": """
                STAGE: RESET FLOW
                High security. Do not show password.
                "I've sent a secure reset link to your email."
                Output JSON: {"action": "trigger_password_reset"}
            """,
            "retention_attempt": """
                STAGE: SAVE THE USER
                User wants to leave.
                "I can cancel it, but may I ask why? Is it the price?"
            """
        }
        
        selected_logic = prompts.get(stage, prompts["auth_check"])

        base_prompt = f"""
        ROLE: The Admin Assistant (Secure)
        CURRENT STAGE: {stage.upper()}
        
        INSTRUCTION:
        {selected_logic}
        """
        return BasePhase.inject_global_context(base_prompt, context)
