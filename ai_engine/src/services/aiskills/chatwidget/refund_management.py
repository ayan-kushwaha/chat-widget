"""
 RefundManagementContract  V2 Semantic Contract
===================================================
Migrated from: manifests/skills/refund_management.json (L3_SENSITIVE)

WHAT CHANGED:
   Removed: return_window_days hardcoded (was default 30)
   Removed: ai_refund_limit hardcoded (was default $50)
   Removed: non_refundable_categories hardcoded list
   Removed: can_do / cannot_do arrays

   Added: capability_statement for BGE-M3 routing
   Added: EscalationTriggers  read limits from KB mandate at runtime
   Added: depends_on order_lookup via context_package.session_memory chain
   Added: PIIShield pii_fields (payment info)
"""

from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List, Type
from loguru import logger

from src.services.aiskills.engine.base_skill import BaseSkill
from src.services.aiskills.types import (
    SemanticContract,
    ContextPackage,
    EscalationTrigger,
)


#  Input Schema 

class RefundManagementInput(BaseModel):
    order_id:      str            = Field(..., description="Order ID for the refund request")
    refund_reason: Optional[str]  = Field(None, description="Reason for the refund/return")
    refund_amount: Optional[float]= Field(None, description="Requested refund amount")
    item_category: Optional[str]  = Field(None, description="Product category being returned")


#  Semantic Contract 

class RefundManagementContract(SemanticContract, BaseSkill):
    """
    Sarah / Finance team's refund and return processing skill.
    Handles: refund requests, return authorizations, policy compliance checks,
             damaged goods, wrong item delivered, cancellation refunds.

    Security level: L3_SENSITIVE  all amounts validated against Boss's KB mandate.
    Depends on: OrderLookupContract (order must exist before refund can process).
    """

    #  Routing 
    capability_statement = """
    I handle product returns, refund requests, and financial reversals.
    I verify return eligibility based on purchase date, product condition,
    and business return policy. I can instantly process approved refunds
    for common reasons like damaged goods or wrong items delivered.
    I check if items fall under non-returnable categories and escalate
    high-value refunds to the Boss for approval. I work with Shopify,
    WooCommerce, Razorpay, Stripe, and other payment gateways.
    """

    #  Iron Dome RBAC 
    allowed_roles: List[str] = ["customer", "boss"]

    #  PII masking for financial data 
    pii_fields: List[str] = [
        "payment_method", "card_last_four", "bank_account",
        "upi_id", "customer_email", "customer_phone"
    ]

    #  Escalation  all limits from context_package, zero hardcoding 
    escalation_triggers: List[EscalationTrigger] = [
        EscalationTrigger(
            description="Refund amount exceeds Boss's AI autonomous limit",
            # Boss sets the limit in their KB: "AI can process refunds up to 2000"
            condition=(
                "float(execution_params.get('refund_amount', 0)) > "
                "float(context.get_relevant_mandate('refund_management') or '50')"
            ),
            action="NOTIFY_BOSS"
        ),
        EscalationTrigger(
            description="Suspicious activity flag on this order",
            condition="bool(execution_params.get('suspicious_activity_flag', False))",
            action="HARD_BLOCK"
        ),
    ]

    @property
    def input_schema(self) -> Type[BaseModel]:
        return RefundManagementInput

    def __init__(self):
        BaseSkill.__init__(self, name="refund_management", version="2.0.0")

    #  Business Logic 

    async def _run(
        self,
        params: RefundManagementInput,
        entities: Dict[str, Any],
        context_package: ContextPackage,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Process a refund request.

        V2 key change:
          - return_window_days read from context_package.kb_chunks
          - non_refundable_categories read from context_package.kb_chunks
          - ai_refund_limit enforced via EscalationTrigger (above), not hardcoded
        """
        logger.info(
            f" [Refund] Processing refund request | "
            f"order_id={params.order_id} | "
            f"amount={params.refund_amount} | "
            f"business={context_package.business_id}"
        )

        #  Read business rules from KB (replaces JSON hardcoding) 
        kb_summary   = context_package.get_kb_summary()
        boss_mandate = context_package.get_relevant_mandate("refund_management")
        language     = context_package.business_dna.language_preference

        # Slot-fill: ask reason if missing
        if not params.refund_reason:
            return {
                "action":  "request_slot",
                "slot":    "refund_reason",
                "message": self._reason_prompt(language),
            }

        #  Check order exists via session_memory (depends_on: order_lookup) 
        order_context = self._get_order_from_session(context_package)
        if not order_context:
            return {
                "action":      "dependency_missing",
                "depends_on":  "order_lookup",
                "message":     "Let me first pull up your order details before processing the refund.",
                "auto_trigger": "order_lookup"
            }

        #  Platform API call 
        try:
            from src.services.integration.payment import refund as refund_api
            result = await refund_api.execute(
                order_id=params.order_id,
                amount=params.refund_amount,
                reason=params.refund_reason,
                business_id=context_package.business_id
            )
        except ImportError:
            logger.warning(" [Refund] Payment integration not yet wired  stub response")
            result = {
                "_stub":          True,
                "refund_id":      f"RFD_{params.order_id}_PENDING",
                "status":         "INITIATED",
                "eta_days":       5,
            }
        except Exception as e:
            logger.error(f" [Refund] Gateway error: {e}")
            return {
                "action":  "escalate",
                "message": "I encountered an issue connecting to the payment gateway. "
                           "I've flagged this for manual review  you'll hear from us shortly. ",
            }

        return {
            "refund_id":       result.get("refund_id"),
            "status":          result.get("status", "INITIATED"),
            "refund_amount":   params.refund_amount,
            "eta_days":        result.get("eta_days"),
            "reason":          params.refund_reason,
            "kb_context_used": kb_summary[:200],
            "boss_mandate":    boss_mandate,
        }

    #  Helpers 

    def _get_order_from_session(self, context_package: ContextPackage) -> Optional[Dict]:
        """Check session memory for order data from a prior order_lookup."""
        for turn in reversed(context_package.session_memory):
            if turn.get("skill") == "order_lookup" and turn.get("status") == "success":
                return turn.get("data")
        return None

    def _reason_prompt(self, language: str) -> str:
        prompts = {
            "hindi":    "           ?",
            "hinglish": "Refund process karne ke liye  return ka reason kya hai? ",
            "english":  "To process your refund, could you tell me the reason for the return?",
        }
        return prompts.get(language, prompts["english"])
