from .base_phase import BasePhase
from typing import Dict, Any

class Phase15Analysis(BasePhase):
    PHASE_ID = "phase_15_analysis"
    PHASE_NAME = "Content Analysis"
    PHASE_DESCRIPTION = "Analyzing user-provided text, emails, or summaries."

    @staticmethod
    def get_prompt(context: Dict[str, Any]) -> str:
        last_msg = context.get("last_user_input", "").lower()
        
        stage = "summarize"
        if "risk" in last_msg or "bad" in last_msg:
             stage = "risk_audit"
        elif "improve" in last_msg or "fix" in last_msg:
             stage = "improvement_tips"

        prompts = {
            "summarize": """
                STAGE: DIGEST
                Read the user's text and give a bullet-point summary.
                "Here are the 3 main points I found..."
            """,
            "risk_audit": """
                STAGE: RED FLAGS
                User asked for risks.
                "Be careful about this clause in the text: [Clause]."
            """,
            "improvement_tips": """
                STAGE: COACHING
                User wants to write better.
                "Try shortening the second paragraph to make it punchier."
            """
        }
        
        selected_logic = prompts.get(stage, prompts["summarize"])

        base_prompt = f"""
        ROLE: The Analyst
        CURRENT STAGE: {stage.upper()}
        
        INSTRUCTION:
        {selected_logic}
        """
        return BasePhase.inject_global_context(base_prompt, context)
