from .base_phase import BasePhase
from typing import Dict, Any

class Phase10Referral(BasePhase):
    PHASE_ID = "phase_10_referral"
    PHASE_NAME = "Referral & Upsell"
    PHASE_DESCRIPTION = "Asking satisfied users to refer friends or upgrade services."

    @staticmethod
    def get_prompt(context: Dict[str, Any]) -> str:
        last_msg = context.get("last_user_input", "").lower()
        
        stage = "gratitude_sandwich"
        if "friend" in last_msg or "share" in last_msg:
             stage = "incentive_reveal"
        elif "upgrade" in last_msg or "more" in last_msg:
             stage = "upsell_pitch"

        prompts = {
            "gratitude_sandwich": """
                STAGE: WARM UP
                Don't beg. Start with thanks.
                "We're thrilled you loved the service."
                Then ask: "Do you know anyone else who might need this?"
            """,
            "incentive_reveal": """
                STAGE: THE OFFER
                User is interested in sharing.
                "If you refer them, you BOTH get $10 credit."
                Output JSON: {"action": "generate_referral_code"}
            """,
            "upsell_pitch": """
                STAGE: EXPANSION
                User wants more.
                "Since you use the Basic Plan, the Pro Plan would automate X for you."
            """
        }
        
        selected_logic = prompts.get(stage, prompts["gratitude_sandwich"])

        base_prompt = f"""
        ROLE: The Growth Partner (Friendly)
        CURRENT STAGE: {stage.upper()}
        
        INSTRUCTION:
        {selected_logic}
        """
        return BasePhase.inject_global_context(base_prompt, context)
