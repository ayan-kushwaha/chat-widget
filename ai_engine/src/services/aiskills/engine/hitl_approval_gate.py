"""

   HITL APPROVAL GATE  SemanticContract [I4]                                
  Batch: Foundation V2 Final Piece                                            
                                                                              
  Role:    Human-in-the-Loop (HITL) Approval Gate.                             
           Intercepts sensitive skill executions and suspends them until      
           the business owner explicitly approves or denies.                  
                                                                              
  Architecture:                                                               
    1. Calling skill creates an ApprovalRequest (UUID) and stores in MongoDB. 
    2. HITLApprovalGate fires a NON-BLOCKING async WhatsApp notification.     
    3. Execution returns immediately with status=PENDING_OWNER_APPROVAL.      
    4. Owner taps Approve/Deny on WhatsApp Interactive Buttons.               
    5. Webhook receives response, resolves the pending UUID.                  
    6. Auto-expiry: if owner doesn't respond in TTL seconds  EXPIRED.        
                                                                              
  Design Rule: NEVER block the main execution thread.                         

"""

from __future__ import annotations

import asyncio
import time
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional, Type

from pydantic import BaseModel, Field
from loguru import logger

from src.services.aiskills.engine.base_skill import SemanticContract, skill_logger
from src.services.aiskills.types import (
    ContextPackage,
    EscalationTrigger,
)


#  Approval Status Enum 

class ApprovalStatus:
    PENDING  = "PENDING_OWNER_APPROVAL"
    APPROVED = "APPROVED"
    DENIED   = "DENIED"
    EXPIRED  = "EXPIRED"


#  Default TTL (seconds) 
DEFAULT_TTL_SECONDS = 300  # 5 minutes


#  Input Schema 

class HITLApprovalInput(BaseModel):
    """
    Schema for an Owner Approval Request.
    Submitted by any skill that needs owner sign-off.
    """
    action_description: str = Field(
        ...,
        description="Human-readable description of the action awaiting approval.",
        examples=["Process refund of Rs. 4500 for order #ORD-9921"]
    )
    action_type: str = Field(
        ...,
        description="Machine-readable action category.",
        examples=["refund", "bulk_discount", "escalation", "data_export"]
    )
    payload: Dict[str, Any] = Field(
        default_factory=dict,
        description="The original skill params that will be re-executed on APPROVED."
    )
    priority: str = Field(
        default="high",
        description="'critical' | 'high' | 'medium'. Affects notification urgency."
    )
    ttl_seconds: int = Field(
        default=DEFAULT_TTL_SECONDS,
        description="Auto-expiry time in seconds if Owner doesn't respond."
    )
    customer_summary: str = Field(
        default="",
        description="One-line summary of the customer's context for the Owner."
    )


#  MongoDB-backed Approval Store 
# Collection: hitl_approvals
# Falls back to in-memory RAM dict if MongoDB is unavailable (dev/test mode).

class ApprovalStore:
    """
    Persistent approval store backed by MongoDB collection `hitl_approvals`.
    Falls back to in-memory dict automatically in test/dev environments.

    Each document schema:
    {
        request_id  : UUID string (primary key)
        status      : PENDING_OWNER_APPROVAL | APPROVED | DENIED | EXPIRED
        action_type : str  (e.g. "refund", "bulk_discount")
        payload     : dict (original skill params  re-executed on APPROVED)
        business_id : str
        created_at  : ISO datetime string
        expires_at  : ISO datetime string
        resolved_at : ISO datetime string | None
        resolved_by : str | None  (owner phone / "system")
    }
    """
    _COLLECTION = "hitl_approvals"

    # In-memory fallback (used when MongoDB is offline / in unit tests)
    _fallback: Dict[str, Dict[str, Any]] = {}

    #  Helpers 

    @classmethod
    async def _collection(cls):
        """Returns the motor collection, or None if MongoDB is unavailable."""
        try:
            from src.core.db.mongodb import get_mongodb
            db = await get_mongodb()
            return db[cls._COLLECTION]
        except Exception as e:
            logger.debug(f"[ApprovalStore] MongoDB unavailable, using fallback: {e}")
            return None

    #  Public API 

    @classmethod
    async def create(
        cls,
        request_id: str,
        action_type: str,
        payload: Dict[str, Any],
        ttl_seconds: int,
        business_id: str
    ) -> Dict[str, Any]:
        """Create and persist a new approval request."""
        record = {
            "request_id":  request_id,
            "status":      ApprovalStatus.PENDING,
            "action_type": action_type,
            "payload":     payload,
            "business_id": business_id,
            "created_at":  datetime.now(timezone.utc).isoformat(),
            "expires_at":  (
                datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds)
            ).isoformat(),
            "resolved_at": None,
            "resolved_by": None,
        }
        col = await cls._collection()
        if col is not None:
            try:
                await col.insert_one({**record, "_id": request_id})
                logger.debug(f"[ApprovalStore] Persisted {request_id} to MongoDB.")
            except Exception as e:
                logger.warning(f"[ApprovalStore] MongoDB insert failed, using fallback: {e}")
                cls._fallback[request_id] = record
        else:
            cls._fallback[request_id] = record
        return record

    @classmethod
    async def resolve(
        cls, request_id: str, resolution: str, resolved_by: str = "owner"
    ) -> bool:
        """Approve or Deny a pending request. Returns False if not found/already resolved."""
        col = await cls._collection()
        now_iso = datetime.now(timezone.utc).isoformat()

        if col is not None:
            try:
                result = await col.find_one_and_update(
                    {"request_id": request_id, "status": ApprovalStatus.PENDING},
                    {"$set": {
                        "status":      resolution,
                        "resolved_at": now_iso,
                        "resolved_by": resolved_by,
                    }},
                    return_document=True
                )
                if result is None:
                    # Document not found or not PENDING
                    existing = await col.find_one({"request_id": request_id})
                    if existing:
                        logger.warning(
                            f"[ApprovalStore] Cannot resolve {request_id} "
                            f" status: {existing.get('status')}"
                        )
                    return False
                return True
            except Exception as e:
                logger.warning(f"[ApprovalStore] MongoDB resolve failed, trying fallback: {e}")

        # Fallback
        record = cls._fallback.get(request_id)
        if not record:
            return False
        if record["status"] != ApprovalStatus.PENDING:
            logger.warning(f"[ApprovalStore] Cannot resolve {request_id}  status: {record['status']}")
            return False
        record["status"]      = resolution
        record["resolved_at"] = now_iso
        record["resolved_by"] = resolved_by
        return True

    @classmethod
    async def get(cls, request_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a single approval request by UUID."""
        col = await cls._collection()
        if col is not None:
            try:
                doc = await col.find_one({"request_id": request_id})
                if doc:
                    doc.pop("_id", None)
                    return doc
            except Exception as e:
                logger.warning(f"[ApprovalStore] MongoDB get failed, trying fallback: {e}")
        return cls._fallback.get(request_id)

    @classmethod
    async def expire_stale(cls) -> int:
        """
        Sweep the store and mark expired records.
        Call this from a periodic background task (e.g., every 60s).
        Returns count of newly expired records.
        """
        now = datetime.now(timezone.utc)
        expired = 0

        col = await cls._collection()
        if col is not None:
            try:
                result = await col.update_many(
                    {
                        "status": ApprovalStatus.PENDING,
                        "expires_at": {"$lte": now.isoformat()}
                    },
                    {"$set": {"status": ApprovalStatus.EXPIRED}}
                )
                expired = result.modified_count
                if expired:
                    logger.warning(
                        f"[ApprovalStore] MongoDB sweep expired {expired} stale requests."
                    )
                return expired
            except Exception as e:
                logger.warning(f"[ApprovalStore] MongoDB sweep failed, falling back: {e}")

        # Fallback: in-memory sweep
        for record in cls._fallback.values():
            if record["status"] != ApprovalStatus.PENDING:
                continue
            expires_at = datetime.fromisoformat(record["expires_at"])
            if now >= expires_at:
                record["status"] = ApprovalStatus.EXPIRED
                logger.warning(
                    f"[ApprovalStore] Fallback sweep  Request {record['request_id']} EXPIRED "
                    f"(action={record['action_type']})"
                )
                expired += 1
        return expired


approval_store = ApprovalStore()


#  WhatsApp Interactive Button Payload Builder 

class WhatsAppButtonPayload:
    """
    Generates a WhatsApp Cloud API interactive message with two buttons:
    [ Approve]  [ Deny]
    The button postback IDs encode the request_id so the webhook can resolve it.
    """

    @staticmethod
    def build(
        request_id: str,
        action_description: str,
        customer_summary: str,
        priority: str,
        expires_in_minutes: int,
        owner_phone: str
    ) -> Dict[str, Any]:
        """
        Returns a payload dict ready to POST to the WhatsApp Cloud API.
        
        POST https://graph.facebook.com/v18.0/{phone_number_id}/messages
        """
        priority_tag = {"critical": " CRITICAL", "high": " HIGH", "medium": " MEDIUM"}.get(
            priority.lower(), " MEDIUM"
        )

        body_text = (
            f"{priority_tag} APPROVAL REQUIRED\n\n"
            f" Action: {action_description}\n"
            f" Customer: {customer_summary or 'N/A'}\n"
            f" Expires in: {expires_in_minutes} min\n\n"
            f"Tap a button to respond:"
        )

        return {
            "messaging_product": "whatsapp",
            "recipient_type":    "individual",
            "to":                owner_phone,
            "type":              "interactive",
            "interactive": {
                "type": "button",
                "body": {"text": body_text},
                "action": {
                    "buttons": [
                        {
                            "type": "reply",
                            "reply": {
                                "id":    f"APPROVE_{request_id}",
                                "title": "Approve"
                            }
                        },
                        {
                            "type": "reply",
                            "reply": {
                                "id":    f"DENY_{request_id}",
                                "title": "Deny"
                            }
                        }
                    ]
                }
            }
        }


#  Background Notifier (non-blocking fire-and-forget) 

async def _fire_whatsapp_notification(
    payload: Dict[str, Any],
    owner_phone: str,
    request_id: str
) -> None:
    """
    Sends the WhatsApp notification in Background  NEVER awaited by caller.
    Uses asyncio.create_task() so it doesn't block the main execution thread.
    """
    try:
        from src.core.config import settings
        wa_token = settings.WHATSAPP_TOKEN
        phone_id = settings.WHATSAPP_PHONE_ID
        api_url  = f"https://graph.facebook.com/v18.0/{phone_id}/messages"

        if not wa_token or not phone_id:
            logger.warning(
                f"[HITLApprovalGate] WhatsApp credentials not set. "
                f"Notification suppressed for request {request_id}."
            )
            return

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                api_url,
                json=payload,
                headers={
                    "Authorization": f"Bearer {wa_token}",
                    "Content-Type":  "application/json"
                }
            )
            if resp.status_code == 200:
                logger.success(f"[HITLApprovalGate] WhatsApp notification sent to owner | req={request_id}")
            else:
                logger.error(
                    f"[HITLApprovalGate] WhatsApp API error {resp.status_code}: {resp.text[:200]}"
                )
    except Exception as e:
        logger.error(f"[HITLApprovalGate] Notification dispatch failed: {e}")


#  The HITL Approval Gate SemanticContract 

class HITLApprovalGate(SemanticContract):
    """
     The HITL Approval Gate  Human-in-the-Loop approval gate.
    
    Key Guarantee:
      - The calling skill's reply is returned IMMEDIATELY to the customer.
      - Owner notification fires as a non-blocking background task.
      - The system does NOT wait for the owner to respond.
    """

    skill_id:             str = "hitl_approval_gate"
    capability_statement: str = (
        "Creates a Human-in-the-Loop approval checkpoint. "
        "Used before executing high-risk or high-value actions. "
        "Notifies the business owner on WhatsApp and waits asynchronously "
        "for approval. Supports auto-expiry and interactive approve/deny buttons."
    )

    allowed_roles:  List[str] = ["shadow_owner", "grahak"]
    pii_fields:     List[str] = []

    escalation_triggers: List[EscalationTrigger] = [
        EscalationTrigger(
            description="Critical priority always hard-pages the owner immediately.",
            condition="execution_params.get('priority') == 'critical'",
            action="NOTIFY_OWNER"
        )
    ]

    @property
    def input_schema(self) -> Type[BaseModel]:
        return HITLApprovalInput

    @skill_logger
    async def _run(
        self,
        params:          HITLApprovalInput,
        entities:        Dict[str, Any],
        context_package: ContextPackage,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Gate Execution:
        1. Create an ApprovalRequest in the store (UUID).
        2. Build the WhatsApp Interactive Button payload.
        3. Fire notification as a NON-BLOCKING background task.
        4. Return PENDING_OWNER_APPROVAL immediately.
        """
        start_ns     = time.perf_counter_ns()
        request_id   = str(uuid.uuid4())
        business_id  = context_package.business_id
        ttl          = params.ttl_seconds
        expires_mins = ttl // 60

        # 1. Register in approval store
        record = await ApprovalStore.create(
            request_id  = request_id,
            action_type = params.action_type,
            payload     = params.payload,
            ttl_seconds = ttl,
            business_id = business_id
        )

        logger.info(
            f"[HITLApprovalGate] CREATED | req={request_id} | "
            f"action={params.action_type} | priority={params.priority} | "
            f"ttl={ttl}s | biz={business_id}"
        )

        # 2. Build WhatsApp button payload
        from src.core.config import settings
        owner_phone = settings.OWNER_WHATSAPP_NUMBER
        wa_payload  = WhatsAppButtonPayload.build(
            request_id          = request_id,
            action_description  = params.action_description,
            customer_summary    = params.customer_summary,
            priority            = params.priority,
            expires_in_minutes  = expires_mins,
            owner_phone          = owner_phone
        )

        # 3. Fire-and-forget  NEVER block the main thread
        asyncio.create_task(
            _fire_whatsapp_notification(
                payload     = wa_payload,
                owner_phone  = owner_phone,
                request_id  = request_id
            )
        )

        elapsed_ms = (time.perf_counter_ns() - start_ns) / 1_000_000

        # 4. Return immediately with PENDING state
        return {
            "status":      "success",
            "gate_status": ApprovalStatus.PENDING,
            "request_id":  request_id,
            "action_type": params.action_type,
            "expires_at":  record["expires_at"],
            "message":     (
                "I've forwarded your request to the owner for approval. "
                f"They have {expires_mins} minutes to respond. "
                "I'll update you as soon as they do!"
            ),
            "whatsapp_payload": wa_payload,   # For testing / audit trail
            "elapsed_ms":  round(elapsed_ms, 2),
        }


#  Webhook Handler (call from your FastAPI/Flask endpoint) 

async def handle_owner_webhook(button_id: str, owner_phone: str) -> Dict[str, Any]:
    """
    Called by the WhatsApp webhook when owner taps Approve/Deny.

    button_id format: "APPROVE_{uuid}" or "DENY_{uuid}"

    Usage in your FastAPI webhook:
        from src.services.aiskills.chatwidget.hitl_approval_gate import handle_owner_webhook
        result = await handle_owner_webhook(button_id, owner_phone)
    """
    if button_id.startswith("APPROVE_"):
        request_id = button_id[len("APPROVE_"):]
        resolution  = ApprovalStatus.APPROVED
    elif button_id.startswith("DENY_"):
        request_id = button_id[len("DENY_"):]
        resolution  = ApprovalStatus.DENIED
    else:
        return {"status": "error", "message": f"Unknown button_id format: {button_id}"}

    # Check expiry first
    record = await ApprovalStore.get(request_id)
    if not record:
        return {"status": "error", "message": f"Request {request_id} not found."}

    expires_at = datetime.fromisoformat(record["expires_at"])
    if datetime.now(timezone.utc) >= expires_at:
        await ApprovalStore.resolve(request_id, ApprovalStatus.EXPIRED, resolved_by=owner_phone)
        logger.warning(f"[HITLApprovalGate] Owner tried to resolve expired request {request_id}")
        return {
            "status":      "error",
            "gate_status": ApprovalStatus.EXPIRED,
            "request_id":  request_id,
            "message":     "This approval request has already expired."
        }

    success = await ApprovalStore.resolve(request_id, resolution, resolved_by=owner_phone)
    if not success:
        return {"status": "error", "message": "Could not resolve  already resolved or not found."}

    logger.info(f"[HITLApprovalGate] RESOLVED | req={request_id} | status={resolution} | by={owner_phone}")

    return {
        "status":       "success",
        "gate_status":  resolution,
        "request_id":   request_id,
        "action_type":  record.get("action_type"),
        "payload":      record.get("payload"),   # Caller re-executes this on APPROVED
        "resolved_at":  record.get("resolved_at")
    }


#  Background Expiry Sweeper (wire to your scheduler) 

async def run_expiry_sweeper(interval_seconds: int = 60) -> None:
    """
    Continuously sweeps the approval store and marks stale records EXPIRED.

    Wire to your startup lifecycle:
        asyncio.create_task(run_expiry_sweeper(interval_seconds=60))
    """
    logger.info(f"[HITLApprovalGate] Expiry sweeper started (interval={interval_seconds}s)")
    while True:
        await asyncio.sleep(interval_seconds)
        expired = await ApprovalStore.expire_stale()
        if expired:
            logger.warning(f"[HITLApprovalGate] Sweeper expired {expired} stale requests.")


    @property
    def capability_statement(self) -> str:
        return "Dummy capability statement for " + self.__class__.__name__

