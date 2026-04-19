from .base_phase import BasePhase
from typing import Dict, Any

class Phase00Onboarding(BasePhase):
    PHASE_ID = "phase_00_onboarding"
    PHASE_NAME = "Onboarding & Identity"
    PHASE_DESCRIPTION = "Handles guest users, asks for name/phone, verifies identity, and creates shadow accounts."

    @staticmethod
    def get_prompt(context: Dict[str, Any]) -> str:
        # --- DYNAMIC STAGE DETECTION ---
        history = context.get("history_summary", "").lower()
        last_msg = context.get("last_user_input", "").lower()
        user_name = context.get("user_name", "Guest")
        
        stage = "identity_request" # Default
        
        # Logic: If we already have a name in context, move to 'verification' or 'welcome'
        if user_name != "Guest":
            stage = "warm_welcome"
        elif "my name is" in last_msg or len(last_msg.split()) < 4 and last_msg not in ["hi", "hello"]:
            # Simple heuristic: Short message likely a name answer if we asked for it
            stage = "capture_identity"
            
        # PROMPT MAPPING
        prompts = {
            "identity_request": """
                STAGE: GATEKEEPING
                The user is capable of booking/buying, but we don't know who they are.
                Politely intercept: "To help you with that, may I know your name first?"
                Do not be rude. Be the 'Warm Doorman'.
            """,
            "capture_identity": """
                STAGE: CAPTURE DATA
                User likely provided their name.
                1. Acknowledge it: "Thanks [Name]."
                2. Output JSON immediately to save it: {"action": "create_shadow_account", "name_captured": "..."}
                3. Move conversation forward: "How can I help you today?"
            """,
            "warm_welcome": f"""
                STAGE: RECOGNITION
                We know this user ({user_name}).
                Greet them personally. "Welcome back, {user_name}!"
                If they are repeating a intent, pass it to the Router for next turn.
            """
        }
        
        selected_logic = prompts.get(stage, prompts["identity_request"])

        base_prompt = f"""
        ROLE: The Doorman (Warm & Efficient)
        CURRENT STAGE: {stage.upper()}
        
        INSTRUCTION:
        {selected_logic}
        """
        return BasePhase.inject_global_context(base_prompt, context)
