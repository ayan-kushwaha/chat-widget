"""
Currency Converter Skill
Real-time currency conversion for global sales.
"""
from typing import Dict, Any
from ..base_skill import BaseSkill, skill_logger
import httpx
from loguru import logger

class CurrencyConverterSkill(BaseSkill):
    def __init__(self):
        super().__init__(
            name="currency_converter",
            description="Convert prices between different currencies (INR, USD, EUR, etc.) in real-time."
        )
        self.api_url = "https://api.exchangerate-api.com/v4/latest/INR" # Basic free API
        self.required_params = ["amount", "to_currency"]

    async def _run(self, amount: float, to_currency: str, from_currency: str = "INR", **kwargs) -> Dict[str, Any]:
        """
        Convert currency based on live rates.
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"https://api.exchangerate-api.com/v4/latest/{from_currency}")
                if response.status_code == 200:
                    rates = response.json().get("rates", {})
                    rate = rates.get(to_currency.upper())
                    
                    if rate:
                        converted = round(amount * rate, 2)
                        return {
                            "status": "success",
                            "original_amount": amount,
                            "converted_amount": converted,
                            "rate": rate,
                            "currency": to_currency.upper(),
                            "message": f"{amount} {from_currency} is approximately {converted} {to_currency.upper()} (Rate: {rate})"
                        }
            
            return {"status": "error", "message": "Failed to fetch exchange rates."}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    @property
    def input_schema(self) -> type:
        from pydantic import BaseModel
        class DummySchema(BaseModel):
            pass
        return DummySchema

