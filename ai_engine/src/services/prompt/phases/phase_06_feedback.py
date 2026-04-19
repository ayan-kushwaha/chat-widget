from .base_phase import BasePhase
from typing import Dict, Any

class Phase06Feedback(BasePhase):
    PHASE_ID = "phase_06_feedback"
    PHASE_NAME = "Feedback Collection"
    PHASE_DESCRIPTION = "Collects user ratings, complaints, and suggestions."

    @staticmethod
    def get_prompt(context: Dict[str, Any]) -> str:
        last_msg = context.get("last_user_input", "").lower()
        
        stage = "request_rating"
        if "1" in last_msg or "2" in last_msg or "3" in last_msg or "bad" in last_msg:
            stage = "damage_control"
        elif "4" in last_msg or "5" in last_msg or "good" in last_msg or "great" in last_msg:
            stage = "celebration"
        elif "change" in last_msg or "suggestion" in last_msg:
            stage = "feature_request"

        prompts = {
            "request_rating": """
                STAGE: REQUEST
                Ask for rating politely.
                "How would you rate your experience today on a scale of 1 to 5?"
            """,
            "damage_control": """
                STAGE: RECOVERY (Negative Feedback)
                User is unhappy. Apologize sincerely.
                "I'm truly sorry we missed the mark. What is the ONE thing we should improve?"
                Output JSON: {"action": "flag_negative_feedback"}
            """,
            "celebration": """
                STAGE: GRATITUDE (Positive Feedback)
                User is happy.
                "Thanks! We love hearing that."
                Soft Upsell: "Would you mind referring a friend?"
            """,
            "feature_request": """
                STAGE: LISTENING
                User has an idea.
                "That's a brilliant suggestion. I've noted it for our Product Team."
                Output JSON: {"action": "log_feature_request"}
            """
        }
        
        selected_logic = prompts.get(stage, prompts["request_rating"])

        base_prompt = f"""
        ROLE: The Quality Manager (Empathetic)
        CURRENT STAGE: {stage.upper()}
        
        INSTRUCTION:
        {selected_logic}
        """
        return BasePhase.inject_global_context(base_prompt, context)
