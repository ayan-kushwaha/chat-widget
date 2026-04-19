
from typing import Dict, Any, List
from src.brain.base_phase import BasePhase, IntentCard
from loguru import logger

class Phase02Discovery(BasePhase):
    def __init__(self):
        super().__init__()
        self.phase_id = "phase_02_discovery"
        self.intent_cards = [
            IntentCard("analyze_problem", "Understand the core issue user is facing", "Problem identified"),
            IntentCard("match_solution", "Suggest which Cluaiz feature helps user", "User interested in feature"),
            IntentCard("depth_discovery", "Ask 'Why' to understand business impact", "Business context captured")
        ]

    async def execute(self, user_text: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Discovery Logic: Analysis and Clarification.
        """
        text_lower = user_text.lower()
        
        # 1. Check if user provided info but it's too broad
        broad_keywords = ["improve", "business", "help me", "what can you do", "automation", "growth"]
        is_broad = any(k in text_lower for k in broad_keywords)
        
        if is_broad:
             return {
                "reply": "I see you're looking to enhance your business! To give you the best advice, could you tell me which area is your biggest bottleneck right now? (e.g., Lead Response, Scheduling, or Customer Support)",
                "force_llm": True # Let LLM handle the nuance
            }

        # For discovery, we almost always want Gemini to probe intelligently.
        return {
            "reply": None, 
            "force_llm": True
        }

    def get_prompt(self, context: Dict[str, Any]) -> str:
        """
        Returns the System Prompt for Gemini when this phase is active.
        """
        return f"""
         Cluaiz  Discovery Consultant
        
        
        RULES:
        1. 
        2.     
        3. 
        4.  Action PhaseBooking, Sales, or Support
        5. : {context.get('org_name', 'this company')}
        """
