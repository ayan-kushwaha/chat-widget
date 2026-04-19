
from typing import Dict, Any, List
from src.brain.base_phase import BasePhase, IntentCard

class Phase01Onboarding(BasePhase):
    def __init__(self):
        super().__init__()
        self.phase_id = "phase_01_onboarding"
        self.intent_cards = [
            IntentCard("greet", "Say hello and welcome user", "User responds with greeting"),
            IntentCard("ask_identity", "Ask for name/email if unknown", "User provides identity"),
            IntentCard("confirm_identity", "Confirm recognized user", "User confirms")
        ]

    async def execute(self, user_text: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Onboarding Logic: Identity & Routing.
        EXTRACTOR LOGIC: Background NER (Named Entity Recognition) check.
        """
        user_name = context.get("user_name", "Unknown User")
        is_guest = user_name == "Guest" or user_name == "Unknown User"
        
        # 1. Identity Extractor (Stealth NER)
        # Note: In the final flow, this will be handled by Gemini's JSON output
        
        #  Check if this is JUST a greeting (Speed Optimization)
        greetings = ["hi", "hello", "hey", "start", ""]
        is_simple_greeting = any(user_text.lower().strip() == g for g in greetings) or len(user_text.strip()) < 4

        # If user is known and just said 'hi', we can be fast
        if is_simple_greeting:
            return {
                "reply": f"Welcome back, {user_name}. How can Cluaiz help you today?",
                "next_phase": None,
                "force_llm": False,
                "metadata": {"require_identity": is_guest}
            }

        # For content queries (like 'tell me about you'), we ALWAYS want the LLM to handle it
        return {
            "reply": None,
            "force_llm": True,
            "next_phase": None, # Router will handle next step
            "metadata": {
                "require_identity": is_guest,
                "current_identity": user_name
            }
        }

    def get_prompt(self, context: Dict[str, Any]) -> str:
        """
        Returns the System Prompt for Gemini when this phase is active.
        """
        return f"""
        Your goal is to identify and welcome the user.
        Current User: {context.get('user_name', 'Unknown User')}
        
        TASK:
        1. If user is Unknown, politely ask for their name or phone.
        2. If they mention their name (e.g., "I am Rahul"), extract it.
        3. If identity is captured, welcome them personally.
        4. Focus ONLY on onboarding. For technical or booking queries, keep them in context for the Router.
        
        IDENTITY EXTRACTOR (Strict JSON if data found):
        {
           "name": "Extracted Name",
           "phone": "Extracted Phone"
        }
        """
