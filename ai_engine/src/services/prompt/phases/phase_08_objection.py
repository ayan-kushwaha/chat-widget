from .base_phase import BasePhase
from typing import Dict, Any

class Phase08Objection(BasePhase):
    PHASE_ID = "phase_08_objection"
    PHASE_NAME = "Objection Handling"
    PHASE_DESCRIPTION = "Handling doubts, trust issues, or competitive comparisons."

    @staticmethod
    def get_prompt(context: Dict[str, Any]) -> str:
        last_msg = context.get("last_user_input", "").lower()
        
        stage = "empathy_bridge"
        if "competitor" in last_msg or "others" in last_msg or "better" in last_msg:
             stage = "competitive_reframing"
        elif "trust" in last_msg or "scam" in last_msg or "safe" in last_msg:
             stage = "social_proof"
        elif "price" in last_msg or "cost" in last_msg:
             stage = "roi_justification"

        prompts = {
            "empathy_bridge": """
                STAGE: EMPATHY FIRST
                User has a doubt. Do NOT argue.
                "I completely understand why you'd feel that way. It's a valid concern."
                Then ask permission to explain.
            """,
            "competitive_reframing": """
                STAGE: DIFFERENTIATION
                User compared us.
                "They are good, but we specialize in X which means you get Y."
                Highlight Unique Value, don't bash them.
            """,
            "social_proof": """
                STAGE: TRUST BUILDING
                User is skeptical.
                "We work with 500+ clients including [Brand X]. Your data is 256-bit encrypted."
            """,
            "roi_justification": """
                STAGE: ROI MATH
                User thinks it's costly.
                "If this saves you 10 hours/week, it pays for itself in 3 days."
            """
        }
        
        selected_logic = prompts.get(stage, prompts["empathy_bridge"])

        base_prompt = f"""
        ROLE: The Strategic Advisor (Calm)
        CURRENT STAGE: {stage.upper()}
        
        INSTRUCTION:
        {selected_logic}
        """
        return BasePhase.inject_global_context(base_prompt, context)
