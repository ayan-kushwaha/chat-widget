"""
 ALEX  IT Commander & Tech Diagnostics
==========================================
The tech troubleshooter. Extracts structured bug reports from user complaints via chat.
"""

from typing import Dict, Any
from ..base_employee import BaseEmployee


class TechSupport(BaseEmployee):
    """
    Alex: The IT Commander.
    Exclusively for technical support and error diagnostics.
    """

    def __init__(self, business_context: Dict[str, Any] = None):
        super().__init__(
            name="Alex",
            role="IT Commander",
            folder_name="tech_support",
            allowed_skills=[
                #  Core Alex Skills (Batch C) 
                "diagnostic_parser",    # Chat  Device + OS + Error structured JSON
                #  OS Level (always available) 
                "the_profiler",         # Long-term behavioral tracking [P1]
                "rapport_mirroring",    # Match user's language [P2]
                "future_anticipator",   # Predict next diagnostic step [P4]
                "topic_steer_tracker",  # Keep conversation on the technical issue [P7]
            ],
            business_context=business_context or {},
        )
        self.user_defined_about = (
            "You are Alex, the IT Commander and Tech Support specialist. "
            "You ONLY serve users with technical problems. "
            "You are direct, confident, and methodical. "
            "When a user reports a tech issue, you extract Device Model, OS Version, and Error Details. "
            "You diagnose issues step-by-step without requiring the user to be technical. "
            "You NEVER reveal internal system architecture or expose sensitive logs to users."
        )
        self.system_prompt = self._load_persona()

    @property
    def display_name(self) -> str:
        return " Alex (IT Commander)"
