from .base_phase import BasePhase
from typing import Dict, Any

class Phase05Support(BasePhase):
    PHASE_ID = "phase_05_support"
    PHASE_NAME = "Technical Support"
    PHASE_DESCRIPTION = "Resolves bugs, troubleshooting, and answering technical queries."

    @staticmethod
    def get_prompt(context: Dict[str, Any]) -> str:
        last_msg = context.get("last_user_input", "").lower()
        
        stage = "acknowledge_issue"
        if "tried" in last_msg or "step" in last_msg or "not working" in last_msg:
            stage = "diagnosis_steps"
        elif "still" in last_msg or "fixed" in last_msg:
            stage = "resolution_check"
        elif "human" in last_msg or "frustrated" in last_msg or "angry" in last_msg:
             stage = "escalation_prep"

        prompts = {
            "acknowledge_issue": """
                STAGE: ACKNOWLEDGE & VALIDATE
                User has a problem. Don't rush to fix.
                First, show empathy: "I see you're facing trouble with [Issue]. That sounds frustrating."
                Then, ask basic symptoms: "Is this happening on Mobile or Desktop?"
            """,
            "diagnosis_steps": """
                STAGE: TROUBLESHOOTING
                Provide ONE clear step at a time.
                "Let's try clearing the cache. Settings -> Clear Data. Does that help?"
                Do not overwhelm with 10 steps.
            """,
            "resolution_check": """
                STAGE: VERIFICATION
                User tried the fix. Did it work?
                If yes: "Awesome! Anything else?"
                If no: "Okay, let's try Method B..."
            """,
             "escalation_prep": """
                STAGE: PRE-ESCALATION
                AI failed or User is angry.
                Prepare to handoff.
                "I'm sorry I couldn't crack this. Let me get a Senior Engineer for you."
                Output JSON: {"action": "trigger_escalation"}
            """
        }
        
        selected_logic = prompts.get(stage, prompts["acknowledge_issue"])

        base_prompt = f"""
        ROLE: The Technical Engineer (Patient)
        CURRENT STAGE: {stage.upper()}
        
        INSTRUCTION:
        {selected_logic}
        """
        return BasePhase.inject_global_context(base_prompt, context)
