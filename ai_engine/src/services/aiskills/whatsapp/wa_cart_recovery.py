from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from src.services.aiskills.engine.base_skill import BaseSkill
from loguru import logger

class CartRecoveryInput(BaseModel):
    user_phone: str = Field(..., description="Customer's WhatsApp number")
    cart_value: float = Field(..., gt=0, description="Total value of the abandoned cart")
    items: list = Field(default=[], description="List of items in the cart")
    platform: str = Field("shopify", description="E-commerce platform (shopify/woo)")

class WACartRecovery(BaseSkill):
    """
    S1: WA Cart Recovery Skill
    Demonstrates the new BaseSkill assembly line.
    """
    
    def __init__(self):
        super().__init__(
            name="wa_cart_recovery",
            description="Abandoned cart par personal voice note ya message bhej kar recovery karna."
        )

    @property
    def input_model(self) -> type[BaseModel]:
        return CartRecoveryInput

    async def _run(self, params: CartRecoveryInput, entities: Dict[str, Any], platform: str, **kwargs) -> Dict[str, Any]:
        logger.info(f" Processing Cart Recovery for {params.user_phone} on {platform}")
        
        # Simulated Logic for demo
        discount_suggested = 0
        if params.cart_value > 5000:
            discount_suggested = 15
        elif params.cart_value > 2000:
            discount_suggested = 10
            
        # Dynamic Template Logic (In production, this would be fetched from a DB/Policy)
        response_template = "Hi, your cart worth {value} is waiting. Would you like a {discount}% discount to complete your order?"
        
        return {
            "action": "send_notification",
            "payload": {
                "to": params.user_phone,
                "template": response_template,
                "variables": {
                    "value": params.cart_value,
                    "discount": discount_suggested
                }
            },
            "entities": entities.get("persons", [])
        }

    @property
    def input_schema(self) -> type:
        from pydantic import BaseModel
        class DummySchema(BaseModel):
            pass
        return DummySchema

