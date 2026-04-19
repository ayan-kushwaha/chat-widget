
from typing import Dict, Any, List
from src.brain.base_phase import BasePhase, IntentCard
from loguru import logger

class Phase03Booking(BasePhase):
    def __init__(self):
        super().__init__()
        self.phase_id = "phase_03_booking"
        self.intent_cards = [
            IntentCard("check_availability", "Check if a time slot is free", "Slots retrieved"),
            IntentCard("propose_time", "Suggest a meeting time to user", "User agrees/disagrees"),
            IntentCard("lock_slot", "Confirm and save booking in DB", "Slot finalized")
        ]

    async def execute(self, user_text: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Booking Logic: Slots & Python Logic.
        """
        text_lower = user_text.lower()
        
        # 1. Check for 'Booking Trigger' (Keywords)
        booking_keywords = ["book", "meeting", "schedule", "appointment", "calendar"]
        is_trigger_active = any(k in text_lower for k in booking_keywords)
        
        # 2. Authorization Check (Bible Rule: No Login = No Booking)
        auth_status = context.get("auth_status", "guest")
        if auth_status == "guest":
            return {
                "reply": "I'd love to help you book a meeting! However, I'll need your name and phone number first to confirm the slot. Shall we start with your name?",
                "next_phase": "phase_01_onboarding", # Switch back to Onboarding
                "force_llm": False
            }

        # 3. Interactive Slot Picker Logic (Rule 163-165)
        # In a real scenario, we'd check availability in MongoDB/Google Cal here.
        if "tomorrow" in text_lower or "today" in text_lower or any(d in text_lower for d in ["monday", "tuesday", "wednesday", "thursday", "friday"]):
             return {
                "reply": "Checking my schedule... here are the available slots for you:",
                "action": "SHOW_SLOT_PICKER",
                "data": {"requested_time": user_text},
                "force_llm": True # Let Gemini confirm the choice
            }

        # Defualt: Let LLM handle the natural conversation
        return {
            "reply": None, # Fallback to LLM
            "force_llm": True
        }

    def get_prompt(self, context: Dict[str, Any]) -> str:
        """
        Returns the System Prompt for Gemini when this phase is active.
        """
        return f"""
         Cluaiz  Booking Assistant
        
        
        CONTEXT:
        - : {context.get('user_name', 'Guest')}
        - : {context.get('auth_status', 'verified')}
        
        RULES:
        1. 
        2. 
        3. 
        4.  Interactive Calendar
        """
