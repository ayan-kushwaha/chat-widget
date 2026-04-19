
from typing import Dict, Any, List
from src.brain.base_phase import BasePhase, IntentCard
from loguru import logger

class Phase04Support(BasePhase):
    def __init__(self):
        super().__init__()
        self.phase_id = "phase_04_support"
        self.intent_cards = [
            IntentCard("answer_question", "Answer a question using knowledge base", "Answer provided"),
            IntentCard("troubleshoot", "Help user fix an issue", "Steps provided"),
            IntentCard("clarify", "Ask for more details if query is vague", "User clarifies")
        ]

    async def execute(self, user_text: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Support Logic: Knowledge & Troubleshooting.
        """
        # Phase 04 is almost always LLM-driven because it relies on RAG.
        # However, we can add 'Zero-Shot' logic for common generic support.
        
        text_lower = user_text.lower()
        
        # 1. Check for common 'meta' support triggers
        if any(w in text_lower for w in ["contact", "speak to human", "agent", "person"]):
             return {
                "reply": "I can certainly help you with that! If you'd like to talk to a human agent, you can click the 'Call' icon at the top of the chat or leave your details here.",
                "force_llm": False
            }

        # For most questions, we want Gemini to use the RAG context.
        return {
            "reply": None, 
            "force_llm": True
        }

    def get_prompt(self, context: Dict[str, Any]) -> str:
        """
        Returns the System Prompt for Gemini when this phase is active.
        """
        # We inject the knowledge base context into the prompt architect, 
        # but here we define the 'Vibe' of the support specialist.
        return f"""
         Cluaiz  Support Specialist
        Knowledge Base
        
        RULES:
        1. 
        2. 
        3.  Bug
        4. : {context.get('org_name', 'this company')}
        """
