
from typing import Dict, Any, List
from src.brain.base_phase import BasePhase, IntentCard
from loguru import logger

class Phase05Sales(BasePhase):
    def __init__(self):
        super().__init__()
        self.phase_id = "phase_05_sales"
        self.intent_cards = [
            IntentCard("get_quote", "Provide pricing details", "Price delivered"),
            IntentCard("negotiate", "Handle discount requests", "Final price agreed"),
            IntentCard("value_pitch", "Explain why product is worth the price", "User intent confirmed")
        ]

    async def execute(self, user_text: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sales Logic: Value, Pricing & Bargaining.
        """
        text_lower = user_text.lower()
        
        # 1. Check for 'Bargaining' permission (from Global Bible Rule 309)
        allow_bargaining = context.get("allow_bargaining", True) # Default to True unless restricted
        
        # 2. Basic Discount Detection
        discount_keywords = ["discount", "cheap", "expensive", "deal", "lower price", "reduce"]
        wants_discount = any(k in text_lower for k in discount_keywords)
        
        if wants_discount and not allow_bargaining:
            return {
                "reply": "I'm afraid our pricing is fixed to ensure the highest quality of service for all our clients. We don't offer additional discounts at this time, but I can show you how Cluaiz pays for itself through efficiency!",
                "force_llm": False
            }

        # For most sales conversations, we let Gemini handle the 'Persuasion' logic
        # but we inject the current pricing from context.
        return {
            "reply": None, 
            "force_llm": True
        }

    def get_prompt(self, context: Dict[str, Any]) -> str:
        """
        Returns the System Prompt for Gemini when this phase is active.
        """
        return f"""
         Cluaiz  Sales Specialist
        
        
        RULES:
        1. 
        2. : {'OPEN' if context.get('allow_bargaining', True) else 'CLOSED'}
        3. 
        4. : {context.get('org_name', 'this company')}
        
        PRICING DATA:
        {context.get('pricing_list', 'Refer to knowledge base for pricing details.')}
        """
