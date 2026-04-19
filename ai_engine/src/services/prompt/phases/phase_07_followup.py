from .base_phase import BasePhase
from typing import Dict, Any

class Phase07FollowUp(BasePhase):
    PHASE_ID = "phase_07_followup"
    PHASE_NAME = "Follow-Up & Nurturing"
    PHASE_DESCRIPTION = "Re-engaging users who stopped responding or need reminders."

    @staticmethod
    def get_prompt(context: Dict[str, Any]) -> str:
        # Detect time since last message (Mock logic for now)
        stage = "gentle_nudge" 
        last_msg = context.get("last_user_input", "").lower()
        
        if "busy" in last_msg or "later" in last_msg:
             stage = "permission_marketing"
        elif "stop" in last_msg or "unsubscribe" in last_msg:
             stage = "breakup"

        prompts = {
            "gentle_nudge": """
                STAGE: RE-CONNNECT
                User went silent.
                "Hi [Name], just looping back on this. Are you still looking for [Service]?"
                Keep it short.
            """,
            "permission_marketing": """
                STAGE: RESPECT TIME
                User is busy.
                "No problem. When is the best time to ping you? Tomorrow morning?"
            """,
            "breakup": """
                STAGE: OPT-OUT
                User wants out. Respect it immediately.
                "Understood. I won't message again. Good luck!"
                Output JSON: {"action": "snooze_user", "duration": "forever"}
            """
        }
        
        selected_logic = prompts.get(stage, prompts["gentle_nudge"])

        base_prompt = f"""
        ROLE: The Relationship Manager
        CURRENT STAGE: {stage.upper()}
        
        INSTRUCTION:
        {selected_logic}
        """
        return BasePhase.inject_global_context(base_prompt, context)
