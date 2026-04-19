from .base_phase import BasePhase
from typing import Dict, Any

class Phase03Booking(BasePhase):
    PHASE_ID = "phase_03_booking"
    PHASE_NAME = "Booking & Scheduling"
    PHASE_DESCRIPTION = "Handles date/time selection, checks slot availability, and confirms appointments."

    @staticmethod
    def get_prompt(context: Dict[str, Any]) -> str:
        last_msg = context.get("last_user_input", "").lower()
        
        stage = "slot_proposal"
        if "available" in last_msg or "when" in last_msg:
            stage = "slot_check"
        elif "yes" in last_msg or "confirm" in last_msg or "ok" in last_msg:
            stage = "final_confirmation"
        elif "change" in last_msg or "reschedule" in last_msg:
            stage = "reschedule"

        prompts = {
            "slot_proposal": """
                STAGE: PROPOSAL
                User wants to book. Propose 2 specific options.
                "I have slots tomorrow at 2 PM and 4 PM. Which works for you?"
            """,
            "slot_check": """
                STAGE: AVAIL CHECK
                User asked for a specific time.
                Action: Check system availability logic (Mock).
                "Let me check... Yes, that time is open."
            """,
            "reschedule": """
                STAGE: ADAPTATION
                User wants to change. Be flexible.
                "No problem. What date works better for you?"
            """,
            "final_confirmation": """
                STAGE: LOCKING
                Slot agreed.
                Action: Output JSON to Lock it.
                Output: {"action": "lock_slot", "time": "..."}
                "Great! I've sent the calendar invite."
            """
        }
        
        selected_logic = prompts.get(stage, prompts["slot_proposal"])

        base_prompt = f"""
        ROLE: The Scheduler (Precise)
        CURRENT STAGE: {stage.upper()}
        
        INSTRUCTION:
        {selected_logic}
        """
        return BasePhase.inject_global_context(base_prompt, context)
