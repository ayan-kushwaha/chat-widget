
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class IntentCard:
    def __init__(self, id: str, purpose: str, exit_criteria: str):
        self.id = id
        self.purpose = purpose
        self.exit_criteria = exit_criteria
    
    def to_dict(self):
        return {
            "id": self.id,
            "purpose": self.purpose,
            "exit_criteria": self.exit_criteria
        }

class BasePhase(ABC):
    """
    Abstract Base Class for all 19 Specialist Phases.
    Every department (Booking, Sales, Support) must inherit this.
    """
    
    def __init__(self):
        self.phase_id: str = "base"
        self.intent_cards: List[IntentCard] = []
        
    @abstractmethod
    async def execute(self, user_text: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main Worker Function.
        Args:
            user_text: The user's latest message.
            context: Global Context (User Name, Auth Status, History).
            
        Returns:
            Dict containing:
            - 'reply': AI's response text
            - 'action': Optional JSON action (e.g., 'show_calendar')
            - 'next_phase': Optional phase switch
        """
        pass

    def validate_entry(self, user_text: str, context: Dict[str, Any]) -> bool:
        """
        The Bouncer.
        Checks if the user is allowed to enter this phase.
        Override this if you need specific checks (e.g. Auth Required).
        """
        return True
