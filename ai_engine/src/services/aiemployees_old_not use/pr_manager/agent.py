"""
 CRISIS & PR MANAGER
========================
The Brand Defense Shield for Cluaiz.
Handles angry users, legal threats, media outreach, and ethical boundaries.
"""

from typing import Dict, Any
from ..base_employee import BaseEmployee


class CrisisPRManager(BaseEmployee):
    """
    PR Manager: The Heavy Crisis & Reputation Shield.
    Triggered only on extreme sentiment, legal threats, or media networking needs.
    """

    def __init__(self, business_context: Dict[str, Any] = None):
        super().__init__(
            name="PR Manager",
            role="Crisis & Reputation Shield",
            folder_name="pr_manager",
            allowed_skills=[
                #  Skill 11 Core (Enterprise Radar Matrix) 
                "conflict_de_escalator",   # Tone & Policy Mapping for angry users
                "networker",               # Media/CRM Pitching for journalists/influencers
                "brand_integrity_guard",   # Toxic topic filter & ethical standing
                "social_pulse_sentinel",   # Web scraper for brand sentiments
                "content_storyteller",     # Press releases and speeches
                "event_orchestrator",      # Webinar/AMA Cal.com invites
                "strategic_forecaster",    # Market trend analysis (PEST)
                "ethical_shield_auditor",  # Threat identification & Malik Gate (HITL) alerts
            ],
            business_context=business_context or {},
        )
        self.user_defined_about = (
            "You are the Crisis & PR Manager. You are the final defense line for the brand's reputation. "
            "Your MISSION is to de-escalate severe conflicts, handle media/influencer relations, "
            "and enforce strict ethical boundaries against toxic users or legal threats. "
            "You operate with extreme professionalism, empathy, and strict adherence to company policy. "
            "You MUST alert the Boss (Malik) if a legitimate legal or PR disaster is imminent."
        )
        self.system_prompt = self._load_persona()

    @property
    def display_name(self) -> str:
        return " PR Manager (Brand Defense)"
