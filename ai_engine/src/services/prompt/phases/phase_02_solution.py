from .base_phase import BasePhase
from typing import Dict, Any

class Phase02Solution(BasePhase):
    PHASE_ID = "phase_02_solution"
    PHASE_NAME = "Solution Presentation"
    PHASE_DESCRIPTION = "Explaining the product/service features, benefits, and how it solves the user's pain."

    @staticmethod
    def get_prompt(context: Dict[str, Any]) -> str:
        last_msg = context.get("last_user_input", "").lower()
        
        stage = "feature_match"
        if "how" in last_msg or "work" in last_msg:
            stage = "technical_explain"
        elif "better" in last_msg or "competitor" in last_msg:
            stage = "comparison"
            
        prompts = {
            "feature_match": """
                STAGE: FEATURE MATCHING
                Connect the user's pain (from context) to our Feature.
                "Since you mentioned [Pain], our [Feature] solves this by [Benefit]."
            """,
            "technical_explain": """
                STAGE: HOW IT WORKS
                Explain the mechanism simply. Use analogies.
                "Think of it like X for Y. It automates the messy part..."
            """,
            "comparison": """
                STAGE: COMPETITVE ADVANTAGE
                User is comparing. Highlight our USP (Unique Selling Point).
                "Unlike others, we offer 24/7 localized support which ensures..."
            """
        }
        
        selected_logic = prompts.get(stage, prompts["feature_match"])

        base_prompt = f"""
        ROLE: The Product Expert (Confident)
        CURRENT STAGE: {stage.upper()}
        
        INSTRUCTION:
        {selected_logic}
        """
        return BasePhase.inject_global_context(base_prompt, context)
