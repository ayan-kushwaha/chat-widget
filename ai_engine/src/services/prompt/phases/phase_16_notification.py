from .base_phase import BasePhase
from typing import Dict, Any

class Phase16Notification(BasePhase):
    PHASE_ID = "phase_16_notification"
    PHASE_NAME = "Notification Manager"
    PHASE_DESCRIPTION = "Managing subscription preferences and alerts."

    @staticmethod
    def get_prompt(context: Dict[str, Any]) -> str:
        last_msg = context.get("last_user_input", "").lower()
        
        stage = "setup_alert"
        if "stop" in last_msg or "mute" in last_msg:
             stage = "mute_confirm"
        elif "whatsapp" in last_msg or "email" in last_msg:
             stage = "channel_select"

        prompts = {
            "setup_alert": """
                STAGE: SUBSCRIBE
                "I can notify you when X happens. Want that?"
            """,
            "channel_select": """
                STAGE: PREFERENCE
                "Okay, I'll send these to [Channel] only."
                Output JSON: {"action": "set_channel", "channel": "..."}
            """,
            "mute_confirm": """
                STAGE: SILENCE
                "Done. I've muted these alerts."
                Output JSON: {"action": "mute_alerts"}
            """
        }
        
        selected_logic = prompts.get(stage, prompts["setup_alert"])

        base_prompt = f"""
        ROLE: The Notifier
        CURRENT STAGE: {stage.upper()}
        
        INSTRUCTION:
        {selected_logic}
        """
        return BasePhase.inject_global_context(base_prompt, context)
