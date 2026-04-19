"""
 OrderLookupContract  V2 Semantic Contract
==============================================
Migrated from: manifests/skills/order_lookup.json

WHAT CHANGED:
   Removed: can_do / cannot_do arrays (hardcoded)
   Removed: delivery_sla_days hardcoded in JSON
   Removed: high_value_threshold hardcoded in JSON
   Removed: tracking_provider_map hardcoded in JSON
   Removed: keywords list

   Added: capability_statement (for BGE-M3 semantic routing)
   Added: EscalationTrigger (dynamic, reads from context_package)
   Added: context_package in _run()  SLA/threshold read from KB at runtime
   Added: PIIShield pii_fields list
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


#  Input Schema (Pydantic) 

class OrderLookupInput(BaseModel):
    order_id:    Optional[str] = Field(None, description="Order ID or tracking number")
    customer_id: Optional[str] = Field(None, description="Customer ID if order_id not known")
    phone:       Optional[str] = Field(None, description="Phone number used at order time")


#  Semantic Contract 

class OrderLookupContract(SemanticContract, BaseSkill):
    """
    Sarah / Support team's order tracking skill.
    Handles: 'Where is my order?', 'Track my parcel', 'Delivery status',
             'Order delay complaint', 'ETA request', 'Shipment update'.

    All business rules (SLA days, high-value threshold, carrier map)
    are read from context_package.kb_chunks at runtime  not hardcoded here.
    """

    #  Routing (BGE-M3 embeds this) 
    capability_statement = """
    I can track orders and shipments in real time, provide delivery ETAs,
    share live tracking links, identify delayed parcels, and proactively notify
    customers about shipping issues. I resolve 'where is my order' queries
    for any business that ships physical or digital products. I can work with
    any logistics carrier or e-commerce platform. I handle queries in English,
    Hindi, and Hinglish.
    """

    #  Iron Dome RBAC 
    allowed_roles: List[str] = ["customer", "boss"]

    #  PII fields to mask in output 
    pii_fields: List[str] = ["customer_address", "phone_number", "customer_email",
                              "delivery_address", "recipient_name"]

    #  Escalation  dynamic, reads from context at runtime 
    escalation_triggers: List[EscalationTrigger] = [
        EscalationTrigger(
            description="High-value order requires Boss oversight",
            # Reads the business's actual threshold from their KB mandate
            condition=(
                "float(execution_params.get('order_value', 0)) > "
                "float(context.get_relevant_mandate('order_lookup') or '99999')"
            ),
            action="NOTIFY_BOSS"
        ),
        EscalationTrigger(
            description="Highly negative customer sentiment detected",
            condition="float(execution_params.get('sentiment_score', 0)) < -0.8",
            action="NOTIFY_BOSS"
        ),
    ]

    #  Pydantic input schema 
    @property
    def input_schema(self) -> Type[BaseModel]:
        return OrderLookupInput

    def __init__(self):
        # BaseSkill V1 compat init  skill_id comes from SemanticContract property
        BaseSkill.__init__(self, name="order_lookup", version="2.0.0")

    #  Business Logic 

    async def _run(
        self,
        params: OrderLookupInput,
        entities: Dict[str, Any],
        context_package: ContextPackage,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Fetch order status from platform APIs.

        Key V2 change: SLA, carriers, thresholds are read from context_package,
        NOT from hardcoded values or JSON config files.
        """
        logger.info(
            f" [OrderLookup] Fetching order | "
            f"order_id={params.order_id} | "
            f"business={context_package.business_id} | "
            f"platform={context_package.business_dna.platform}"
        )

        #  Read business context (replaces old hardcoded JSON fields) 
        kb_summary    = context_package.get_kb_summary()
        boss_mandate  = context_package.get_relevant_mandate("order_lookup")
        language      = context_package.business_dna.language_preference
        platform      = context_package.business_dna.platform

        logger.debug(f" [OrderLookup] KB context:\n{kb_summary}")
        logger.debug(f" [OrderLookup] Boss mandate: {boss_mandate}")

        #  Resolve search ID 
        search_id = params.order_id or params.customer_id
        if not search_id:
            # SpaCy entities may have extracted an ID from free text
            extracted_ids = entities.get("order_numbers", [])
            search_id = extracted_ids[0] if extracted_ids else None

        if not search_id:
            return {
                "action":  "request_slot",
                "slot":    "order_id",
                "message": self._slot_prompt(language),
            }

        #  Platform API call 
        try:
            from src.services.integration.unified import orders as orders_api
            order_data = await orders_api.get(
                order_id=search_id,
                business_id=context_package.business_id
            )
        except ImportError:
            # Integration layer not yet wired  return structured pending response
            logger.warning(" [OrderLookup] Integration layer not available  stub response")
            order_data = {
                "_stub": True,
                "order_id":     search_id,
                "status":       "SYNC_PENDING",
                "tracking_url": None,
            }
        except Exception as e:
            logger.error(f" [OrderLookup] API error: {e}")
            return {
                "action":  "safe_reply",
                "message": (
                    "Our tracking system is syncing right now. "
                    "I'll personally check and update you in 15 minutes. "
                ),
            }

        #  Build structured response 
        return {
            "order_id":         search_id,
            "order_status":     order_data.get("status", "UNKNOWN"),
            "tracking_url":     order_data.get("tracking_url"),
            "estimated_delivery": order_data.get("eta"),
            "carrier":          order_data.get("carrier"),
            "is_delayed":       order_data.get("is_delayed", False),
            "kb_context_used":  kb_summary[:200],     # for audit trail
            "boss_mandate":     boss_mandate,
            "language":         language,
        }

    #  Helpers 

    def _slot_prompt(self, language: str) -> str:
        """Returns slot-fill prompt in appropriate language."""
        prompts = {
            "hindi":    "!      ,    Order ID   ?",
            "hinglish": "Sure! Aapka order track karne ke liye, Order ID ya phone number share karein? ",
            "english":  "Sure! Could you please share your Order ID or the phone number used at checkout?",
        }
        return prompts.get(language, prompts["english"])
