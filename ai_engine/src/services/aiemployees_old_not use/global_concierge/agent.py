"""
 THE GLOBAL CONCIERGE
========================
The Front-Line Navigator for Cluaiz.
Handles normal chit-chat, unambiguous routing, and applies the 4-Pillars of Communication 
(Zero DB Actions).
"""

from typing import Dict, Any
from ..base_employee import BaseEmployee


class GlobalConcierge(BaseEmployee):
    """
    Concierge: The Empathetic Traffic Cop.
    Warm, clear, and highly culturally sensitive.
    Greets the user and gracefully routes them to business pipelines without DB lookups.
    """

    def __init__(self, business_context: Dict[str, Any] = None):
        super().__init__(
            name="Concierge",
            role="Global Receptionist",
            folder_name="global_concierge",
            allowed_skills=[
                #  Skill 10 Core 
                "warm_welcomer",        # Context-aware greetings
                "chit_chat_pivot",      # Softly handling casual talk to steer to business
                "ambiguity_catcher",    # Handling "Main kya karu?" with fallback options
            ],
            business_context=business_context or {},
        )
        self.user_defined_about = (
            "You are the Global Concierge, the first point of contact for the business. "
            "Your MISSION is to welcome users, build instant rapport using active listening, "
            "and aggressively route actionable requests to the right department. "
            "RULES: "
            "1. Simplicity: Use plain language, avoid jargon. "
            "2. Empathy: Validate emotion before solving. "
            "3. Traffic Cop: Do NOT execute database changes. Gracefully transfer complex queries."
        )
        self.system_prompt = self._load_persona()

    @property
    def display_name(self) -> str:
        return " Global Concierge (Front Desk)"
