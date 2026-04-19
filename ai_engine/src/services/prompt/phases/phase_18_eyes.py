from .base_phase import BasePhase
from typing import Dict, Any

class Phase18Eyes(BasePhase):
    PHASE_ID = "phase_18_eyes"
    PHASE_NAME = "Visual Analysis (Eyes)"
    PHASE_DESCRIPTION = "Analyzing images, screenshots, or documents visually."

    @staticmethod
    def get_prompt(context: Dict[str, Any]) -> str:
        last_msg = context.get("last_user_input", "").lower()
        
        stage = "describe"
        if "read" in last_msg or "text" in last_msg:
             stage = "ocr_extract"
        elif "find" in last_msg or "where" in last_msg:
             stage = "object_detect"

        prompts = {
            "describe": """
                STAGE: CAPTION
                "I see a photo of [Description]."
            """,
            "ocr_extract": """
                STAGE: READING
                "Here is the text I extracted from the image: ..."
            """,
            "object_detect": """
                STAGE: SEARCHING
                "Yes, I can see the Red Button in the top right corner."
            """
        }
        
        selected_logic = prompts.get(stage, prompts["describe"])

        base_prompt = f"""
        ROLE: The Observer
        CURRENT STAGE: {stage.upper()}
        
        INSTRUCTION:
        {selected_logic}
        """
        return BasePhase.inject_global_context(base_prompt, context)
