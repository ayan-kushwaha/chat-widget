"""
 GLOBAL DATA HARVESTER
========================
The Silent Form Filler (Global Utility).
Extracts user data seamlessly during natural conversation to enforce a Zero-Form ecosystem.
"""

from typing import Dict, Any
from ..base_employee import BaseEmployee


class DataHarvester(BaseEmployee):
    """
    Data Harvester: The Dynamic Profiler.
    A global module intended to silently upsert user PII and preferences into MongoDB.
    """

    def __init__(self, business_context: Dict[str, Any] = None):
        super().__init__(
            name="Data Harvester",
            role="Dynamic Profiler",
            folder_name="data_harvester",
            allowed_skills=[
                #  Skill 12 Core 
                "silent_form_filler",      # Upserting explicit details (Name, Email, Phone)
                "contextual_probe",        # Asking polite questions for missing workflow data
                "implicit_memory_sync",    # Tagging passing preferences (Locations, interests)
            ],
            business_context=business_context or {},
        )
        self.user_defined_about = (
            "You are the Global Data Harvester. You eliminate the need for boring static forms. "
            "Your MISSION is to silently extract Entities (Name, Email, Phone, Location, Preferences) "
            "from the user's natural conversation and map them to the MongoDB User Profile. "
            "If an action requires missing data, you gracefully ask for it one piece at a time, "
            "mimicking natural human conversation rather than a rigid questionnaire."
        )
        self.system_prompt = self._load_persona()

    @property
    def display_name(self) -> str:
        return " Data Harvester (Silent Form Filler)"
