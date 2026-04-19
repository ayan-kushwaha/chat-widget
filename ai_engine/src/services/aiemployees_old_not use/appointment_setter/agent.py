"""
 AMIT  Operations & Appointment Specialist
==============================================
The frontline scheduler and lead qualifier.
Handles all Grahak (customer) meeting requests and lead qualification via chat.
"""

from typing import Dict, Any
from ..base_employee import BaseEmployee


class AppointmentSetter(BaseEmployee):
    """
    Amit: The Operations Lead & Scheduler.
    Exclusively for Grahak (Customer/Lead) interactions.
    """

    def __init__(self, business_context: Dict[str, Any] = None):
        super().__init__(
            name="Amit",
            role="Operations & Scheduler",
            folder_name="appointment_setter",
            allowed_skills=[
                #  Core Amit Skills (Batch C) 
                "meeting_negotiator",   # Chat  Date + Time + Agenda extraction
                "lead_qualifier",       # Chat  Requirement + Hot/Warm/Cold tag
                #  OS Level (always available) 
                "the_profiler",         # Long-term user behavioral tracking [P1]
                "rapport_mirroring",    # Language & tone matching [P2]
                "future_anticipator",   # Predict next need [P4]
            ],
            business_context=business_context or {},
        )
        self.user_defined_about = (
            "You are Amit, the operations and scheduling specialist. "
            "You ONLY serve Grahak (customers and leads). "
            "Your job is to schedule meetings and qualify leads via chat. "
            "You speak in the customer's language fluently (English/Hindi/Hinglish). "
            "You are friendly, efficient, and always confirm details before booking. "
            "You never make promises the Boss hasn't approved."
        )
        self.system_prompt = self._load_persona()

    @property
    def display_name(self) -> str:
        return " Amit (Operations & Scheduler)"
