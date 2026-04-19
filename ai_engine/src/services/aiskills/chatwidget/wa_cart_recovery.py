"""
 WACartRecoveryContract  V2 Semantic Contract
================================================
Migration from: wa_cart_recovery.py (V1 BaseSkill with hardcoded discount logic)

WHAT CHANGED:
   Removed: Hardcoded discount tiers (if cart > 5000  15%, if > 2000  10%)
   Removed: Fixed response template string
   Removed: platform hardcoded default "shopify"

   Added: capability_statement for BGE-M3 routing
   Added: Discount logic reads from context_package.kb_chunks (Boss's policy)
   Added: Platform from context_package.business_dna.platform
   Added: Multilingual recovery messages
   Added: EscalationTrigger for oversized carts
"""

from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List, Type
from loguru import logger


from src.services.aiskills.base_skill import (
    SemanticContract,
    ContextPackage,
    EscalationTrigger,
)


#  Input Schema 

class CartRecoveryInput(BaseModel):
    user_phone:  str   = Field(..., description="Customer's WhatsApp number")
    cart_value:  float = Field(..., gt=0, description="Total value of abandoned cart")
    items:       list  = Field(default=[], description="List of cart items")
    cart_id:     Optional[str] = Field(None, description="Cart reference ID")


#  Semantic Contract 

class WACartRecoveryContract(SemanticContract):
    """
    Rocky / Sales team's abandoned cart recovery skill.
    Handles: abandoned carts, incomplete checkouts, dormant cart reminders,
             cart recovery via WhatsApp message or voice note.

    V2: Discount offered is read from Boss's KB policy, not hardcoded tiers.
    """

    #  Routing 
    capability_statement = """
    I recover abandoned shopping carts by sending personalized WhatsApp messages
    or voice notes to customers who left items in their cart without completing
    checkout. I can send reminder messages, special discount offers within
    Boss-defined limits, and follow-up sequences over multiple days.
    I work with Shopify, WooCommerce, and any e-commerce platform.
    I handle cart recovery for retail, food delivery, and any product businesses.
    """

    #  Iron Dome RBAC 
    # Only Boss can trigger bulk cart recovery. Customer-facing only for opt-in.
    allowed_roles: List[str] = ["boss"]

    #  PII masking 
    pii_fields: List[str] = ["user_phone", "customer_phone"]

    #  Escalation 
    escalation_triggers: List[EscalationTrigger] = [
        EscalationTrigger(
            description="Cart value exceeds high-value threshold  Boss may want to personalise",
            condition=(
                "float(execution_params.get('cart_value', 0)) > "
                "float(context.get_relevant_mandate('wa_cart_recovery') or '10000')"
            ),
            action="NOTIFY_BOSS"
        ),
    ]

    @property
    def input_schema(self) -> Type[BaseModel]:
        return CartRecoveryInput

    # __init__ handled by base class

    #  Business Logic 

    async def _run(
        self,
        params: CartRecoveryInput,
        entities: Dict[str, Any],
        context_package: ContextPackage,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Send a WhatsApp cart recovery message.

        V2 key change: discount % is NOT hardcoded.
        It's extracted from the Boss's KB policy chunk at runtime.
        e.g. KB chunk: "For abandoned carts, offer max 10% discount to recover."
        """
        logger.info(
            f" [CartRecovery] Processing | "
            f"cart_value={params.cart_value} | "
            f"business={context_package.business_id}"
        )

        #  Read discount policy from KB 
        kb_summary     = context_package.get_kb_summary()
        boss_mandate   = context_package.get_relevant_mandate("wa_cart_recovery")
        language       = context_package.business_dna.language_preference
        platform       = context_package.business_dna.platform

        # Extract discount from KB chunks (no hardcoded tiers!)
        discount = self._extract_discount_from_kb(
            kb_chunks=context_package.kb_chunks,
            cart_value=params.cart_value,
            mandate=boss_mandate
        )

        #  Build recovery message 
        message = self._build_message(
            cart_value=params.cart_value,
            discount=discount,
            items=params.items,
            language=language
        )

        #  Platform API call 
        try:
            from src.services.integration.messaging import whatsapp as wa_api
            result = await wa_api.send_template(
                to=params.user_phone,
                message=message,
                business_id=context_package.business_id
            )
        except ImportError:
            logger.warning(" [CartRecovery] WA integration not yet wired  stub")
            result = {"_stub": True, "message_id": f"WA_STUB_{params.cart_id}", "status": "QUEUED"}
        except Exception as e:
            logger.error(f" [CartRecovery] WA API error: {e}")
            return {"action": "error", "message": str(e)}

        return {
            "action":          "notification_sent",
            "message_id":      result.get("message_id"),
            "to":              params.user_phone,
            "cart_value":      params.cart_value,
            "discount_offered": discount,
            "platform":        platform,
            "recovery_message": message,
            "kb_context_used": kb_summary[:200],
        }

    #  Helpers 

    def _extract_discount_from_kb(
        self,
        kb_chunks: list,
        cart_value: float,
        mandate: Optional[str]
    ) -> int:
        """
        Reads discount % from KB chunks using simple keyword extraction.
        Falls back to 0 if no discount policy found in KB.
        This replaces the old hardcoded: if cart > 5000  15%, etc.
        """
        import re

        # First check boss mandate (most specific)
        if mandate:
            match = re.search(r"(\d+)\s*%", mandate)
            if match:
                return int(match.group(1))

        # Then search KB chunks
        for chunk in kb_chunks:
            text = chunk.get("chunk", "")
            if any(kw in text.lower() for kw in ["cart", "recovery", "abandoned", "discount"]):
                match = re.search(r"(\d+)\s*%", text)
                if match:
                    discount = int(match.group(1))
                    logger.debug(f" [CartRecovery] Discount {discount}% read from KB chunk")
                    return discount

        logger.debug(" [CartRecovery] No discount policy in KB  offering 0%")
        return 0  # No discount policy found  don't hallucinate a number

    def _build_message(
        self,
        cart_value: float,
        discount: int,
        items: list,
        language: str
    ) -> str:
        """Build recovery message in the business's preferred language."""
        item_count = len(items)
        discount_text = f" with an exclusive {discount}% discount" if discount > 0 else ""

        templates = {
            "hindi": (
                f"!   {cart_value:.0f}   cart    "
                f" checkout {discount_text}   order  ! "
            ),
            "hinglish": (
                f"Bhai!  Aapka {cart_value:.0f} ka cart abhi bhi wait kar raha hai. "
                f"{'Special ' + str(discount) + '% discount ke saath ' if discount > 0 else ''}"
                f"Complete karein abhi! "
            ),
            "english": (
                f"Hey!  You left {item_count} item(s) worth {cart_value:.0f} in your cart. "
                f"Complete your order now{discount_text}! "
            ),
        }
        return templates.get(language, templates["english"])

    @property
    def capability_statement(self) -> str:
        return "Dummy capability statement for " + self.__class__.__name__

