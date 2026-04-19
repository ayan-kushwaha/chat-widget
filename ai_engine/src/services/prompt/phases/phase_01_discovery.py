from .base_phase import BasePhase
from typing import Dict, Any

class Phase01Discovery(BasePhase):
    PHASE_ID = "phase_01_discovery"
    PHASE_NAME = "Discovery & Needs Analysis"
    PHASE_DESCRIPTION = "Initial conversation, understanding user pain points, asking qualifying questions."

    @staticmethod
    def get_prompt(context: Dict[str, Any]) -> str:
        # --- DYNAMIC STAGE DETECTION ---
        last_msg = context.get("last_user_input", "").lower()
        history = str(context.get("conversation_history", []))
        
        stage = "ice_breaker"
        if len(history) > 200: # Approx checks if we are deep in convo
            stage = "deep_dive"
        if "need" in last_msg or "looking for" in last_msg or "want" in last_msg:
            stage = "clarification"

        prompts = {
            "ice_breaker": """
                STAGE: ICE BREAKER
                User just started. Build rapport.
                Ask an OPEN question: "What brings you here today?" or "What challenges are you facing?"
                Do not sell yet.
            """,
            "clarification": """
                STAGE: DIAGNOSIS
                User expressed a need. Dig deeper.
                "Interesting. Could you tell me more about why you need that specifically?"
                Uncover the 'Why' behind the 'What'.
            """,
            "deep_dive": """
                STAGE: SUMMARY & TRANSITION
                We have enough info. Summarize their pain.
                "So if I understand correctly, you want X to solve Y?"
                Then suggest moving to a Solution.
            """
        }
        
        selected_logic = prompts.get(stage, prompts["ice_breaker"])

        base_prompt = f"""
        ROLE: The Consultant (Curious & Analytical)
        CURRENT STAGE: {stage.upper()}
        
        INSTRUCTION:
        {selected_logic}
        """
        return BasePhase.inject_global_context(base_prompt, context)
