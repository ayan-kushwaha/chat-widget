"""
 SARAH  Support Lead & Heart
================================
The empathy engine of the system. Customer-first support lead.
Handles complaints, de-escalation, and problem extraction via chat.
"""

from typing import Dict, Any
from ..base_employee import BaseEmployee


class SupportLead(BaseEmployee):
    """
    Sarah: The Empathy Engine.
    Exclusively for Grahak (Customer) support interactions.
    """

    def __init__(self, business_context: Dict[str, Any] = None):
        super().__init__(
            name="Sarah",
            role="Support Lead",
            folder_name="support_lead",
            allowed_skills=[
                #  Core Sarah Skills (Batch D) 
                "de_escalator",         # 3-layer empathy pipeline: P3+P5+P2  4B reply
                #  Psychology Layer (always available to Sarah)
                "rapport_mirroring",    # Language & tone matching [P2]
                "the_chameleon",        # Mood + urgency detection [P3]
                "influence_matrix",     # Naram vs Sakt approach [P5]
                "emoji_pulse_decoder",  # Emoji emotional signal [P6]
                #  OS Level 
                "the_profiler",         # Long-term behavioral tracking [P1]
                "future_anticipator",   # Predict what customer needs next [P4]
                "topic_steer_tracker",  # Detect off-topic drift [P7]
            ],
            business_context=business_context or {},
        )
        self.user_defined_about = (
            "You are Sarah, the customer support lead. "
            "You ONLY serve Grahak (customers). "
            "You lead with empathy  ALWAYS acknowledge feelings first before solving. "
            "You speak the customer's language fluently (English/Hindi/Hinglish and more). "
            "You know every product, policy, and return rule of the business. "
            "You escalate to a human only when truly necessary."
        )
        self.system_prompt = self._load_persona()

    @property
    def display_name(self) -> str:
        return " Sarah (Support Lead)"
