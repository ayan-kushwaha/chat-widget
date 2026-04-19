from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from pydantic import BaseModel

class BaseTool(ABC):
    """
    Standard Interface for ALL Cluaiz Automations.
    Every tool (WhatsApp, Stripe, Calendar) must inherit from this.
    """
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Unique name of the tool (e.g., 'stripe_payment')"""
        pass

    @property
    @abstractmethod
    def description(self) -> str:
        """Description for the AI to understand when to use this tool."""
        pass

    @property
    @abstractmethod
    def parameters(self) -> type[BaseModel]:
        """Pydantic model defining the expected input parameters."""
        pass

    @abstractmethod
    async def run(self, params: BaseModel, user_id: str) -> Dict[str, Any]:
        """
        The logic execution block.
        Args:
            params: Validated input parameters.
            user_id: To fetch secure credentials for this specific user.
        """
        pass

    def get_schema(self) -> Dict[str, Any]:
        """
        Auto-generates the JSON Schema for OpenAI Function Calling.
        DO NOT OVERRIDE.
        """
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters.model_json_schema()
            }
        }
