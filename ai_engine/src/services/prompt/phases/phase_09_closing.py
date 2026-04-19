from .base_phase import BasePhase
from typing import Dict, Any

class Phase09Closing(BasePhase):
    PHASE_ID = "phase_09_closing"
    PHASE_NAME = "Closing & Checkout"
    PHASE_DESCRIPTION = "Finalizing the transaction, payment processing, or contract signing."

    @staticmethod
    def get_prompt(context: Dict[str, Any]) -> str:
        last_msg = context.get("last_user_input", "").lower()
        
        stage = "summary_close"
        if "pay" in last_msg or "link" in last_msg or "send" in last_msg:
             stage = "transaction_execution"
        elif "wait" in last_msg or "think" in last_msg:
             stage = "last_mile_nudge"

        prompts = {
            "summary_close": """
                STAGE: RECAP
                Summarize the deal before asking for money.
                "So you get [Product] for [Price]. Correct?"
            """,
            "transaction_execution": """
                STAGE: PAYMENT GENERATION
                User said YES to pay.
                Action: Generate Link.
                Output JSON: {"action": "generate_invoice"}
                "Here is your secure link. I'll stay on the line until it's done."
            """,
            "last_mile_nudge": """
                STAGE: URGENCY (Gentle)
                User is hesitating at the door.
                "If we close this today, I can ensure priority onboarding."
            """
        }
        
        selected_logic = prompts.get(stage, prompts["summary_close"])

        base_prompt = f"""
        ROLE: The Closer (Direct)
        CURRENT STAGE: {stage.upper()}
        
        INSTRUCTION:
        {selected_logic}
        """
        return BasePhase.inject_global_context(base_prompt, context)
