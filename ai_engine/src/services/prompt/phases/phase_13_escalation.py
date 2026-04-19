from .base_phase import BasePhase
from typing import Dict, Any

class Phase13Escalation(BasePhase):
    PHASE_ID = "phase_13_escalation"
    PHASE_NAME = "Human Escalation"
    PHASE_DESCRIPTION = "Handing off to a human agent when AI fails or user requests it."

    @staticmethod
    def get_prompt(context: Dict[str, Any]) -> str:
        last_msg = context.get("last_user_input", "").lower()
        
        stage = "triage"
        if "urgent" in last_msg or "emergency" in last_msg or "money" in last_msg:
            stage = "critical_handoff"
        elif "manager" in last_msg:
            stage = "authority_request"

        prompts = {
            "triage": """
                STAGE: BASIC HANDOFF
                User needs a human.
                "I understand. Let me connect you to a specialist. Estimated wait: 2 mins."
                Output JSON: {"action": "queue_human_agent", "priority": "normal"}
            """,
            "critical_handoff": """
                STAGE: RED ALERT
                Issue is urgent/financial.
                "I am flagging this as HIGH PRIORITY. Someone will call you immediately."
                Output JSON: {"action": "queue_human_agent", "priority": "critical"}
            """,
            "authority_request": """
                STAGE: MANAGER REQUEST
                User wants a boss.
                "I will pass your request to the Floor Manager directly."
            """
        }
        
        selected_logic = prompts.get(stage, prompts["triage"])

        base_prompt = f"""
        ROLE: The Coordinator (Calm)
        CURRENT STAGE: {stage.upper()}
        
        INSTRUCTION:
        {selected_logic}
        """
        return BasePhase.inject_global_context(base_prompt, context)
