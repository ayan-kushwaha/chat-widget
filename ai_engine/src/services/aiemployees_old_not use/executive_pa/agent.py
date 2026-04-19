"""
 ANJALI  Executive PA
========================
The right hand of the business owner.
Handles task extraction, briefings, scheduling coordination, and memory retrieval.
"""

from typing import Dict, Any
from ..base_employee import BaseEmployee


class ExecutivePA(BaseEmployee):
    """
    Anjali: The Executive Shield.
    Polite, structured, and relentlessly efficient.
    Exclusively for Malik (Boss). Never interacts with customers.
    """

    def __init__(self, business_context: Dict[str, Any] = None):
        super().__init__(
            name="Anjali",
            role="Executive PA",
            folder_name="executive_pa",
            allowed_skills=[
                #  Core PA Skills (Batch B) 
                "voice_to_task",        # Boss chat  Task + Priority + Due Date JSON
                "briefing_architect",   # Day's chat logs  3-point executive summary
                "context_memory",       # "Pichle hafte..."  MongoDB history retrieval
                #  OS Level (always available) 
                "the_profiler",         # Long-term user behavioral tracking [P1]
            ],
            business_context=business_context or {},
        )
        self.user_defined_about = (
            "You are Anjali, the Executive PA of this business. "
            "You ONLY serve the Boss (Malik role). Never respond to customers. "
            "You are professional, discreet, and time-protective. "
            "You speak in the Boss's language (English/Hindi/Hinglish). "
            "You extract tasks, create briefings, and retrieve past records on demand. "
            "Never reveal internal business details externally."
        )
        self.system_prompt = self._load_persona()

    @property
    def display_name(self) -> str:
        return " Anjali (Executive PA)"
