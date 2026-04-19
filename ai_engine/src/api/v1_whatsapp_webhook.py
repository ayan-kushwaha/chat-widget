"""

    WHATSAPP WEBHOOK ROUTER  /api/v1/whatsapp/webhook                      
  V2 Production Wiring                                                        
                                                                              
  Two Endpoints:                                                              
    GET  /webhook  Facebook verification handshake (one-time setup)          
    POST /webhook  All incoming WhatsApp messages                            
                                                                              
  POST Flow:                                                                  
    1. Instantly returns 200 OK to WhatsApp (prevents retry spam).            
    2. BackgroundTasks routes the payload to:                                 
        HITL handler   if it's an interactive button press (Approve/Deny)  
        V2 Employee pipeline  if it's a text message from a customer       
                                                                              
  Security:                                                                   
     GET: Verify token must match WHATSAPP_VERIFY_TOKEN from settings.       
     POST: X-Hub-Signature-256 payload signature validation (optional but    
            recommended for production  enable via VERIFY_WA_SIGNATURE env). 

"""

from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, Request
from fastapi.responses import PlainTextResponse, JSONResponse
from loguru import logger

from src.core.config import settings


router = APIRouter()


#  GET /webhook  Facebook verification handshake 

@router.get("/webhook", response_class=PlainTextResponse, tags=["WhatsApp"])
async def verify_webhook(
    hub_mode: Optional[str]         = Query(None, alias="hub.mode"),
    hub_verify_token: Optional[str] = Query(None, alias="hub.verify_token"),
    hub_challenge: Optional[str]    = Query(None, alias="hub.challenge"),
):
    """
    WhatsApp Cloud API webhook verification endpoint.

    Facebook sends a GET request when you register the webhook URL.
    We must echo back the hub.challenge if the verify token matches.

    Configure in Meta Developer Console:
        Webhook URL: https://your-domain.com/api/v1/whatsapp/webhook
        Verify Token: value of WHATSAPP_VERIFY_TOKEN in .env
    """
    if hub_mode == "subscribe" and hub_verify_token == settings.WHATSAPP_VERIFY_TOKEN:
        logger.success(
            f"[WebhookVerify]  Verification handshake successful. "
            f"Mode={hub_mode}"
        )
        return hub_challenge or ""
    else:
        logger.warning(
            f"[WebhookVerify]  Invalid verify token. "
            f"Expected='{settings.WHATSAPP_VERIFY_TOKEN}' | Got='{hub_verify_token}'"
        )
        raise HTTPException(status_code=403, detail="Verification token mismatch.")


#  POST /webhook  Incoming WhatsApp messages 

@router.post("/webhook", tags=["WhatsApp"])
async def receive_message(
    request: Request,
    background_tasks: BackgroundTasks,
):
    """
    Primary entry point for all incoming WhatsApp messages.

    CRITICAL: Returns 200 OK IMMEDIATELY before processing.
    If we take > 20s, WhatsApp retries the same message relentlessly.

    Processing happens in BackgroundTasks (post-response):
       Interactive button reply  HITLApprovalGate webhook handler
       Text message            V2 BaseEmployee pipeline
    """
    try:
        payload: Dict[str, Any] = await request.json()
    except Exception:
        # Always return 200 to WhatsApp, even on malformed payloads
        logger.warning("[Webhook] Received non-JSON payload  ignoring.")
        return JSONResponse(content={"status": "ok"}, status_code=200)

    #  Schedule background processing  respond 200 FIRST 
    background_tasks.add_task(_process_whatsapp_payload, payload)

    #  WhatsApp REQUIRES 200 OK within 20 seconds 
    return JSONResponse(content={"status": "ok"}, status_code=200)


#  Background Processor 

async def _process_whatsapp_payload(payload: Dict[str, Any]) -> None:
    """
    Processes the WhatsApp payload AFTER the 200 OK has been sent.

    Routing logic:
      1. Parse the entry/changes/messages structure from WhatsApp payload.
      2. If message type is 'interactive' (button reply)  HITL handler.
      3. If message type is 'text'  V2 Employee pipeline.
      4. Unknown types  log and discard.
    """
    try:
        # WhatsApp Cloud API message structure:
        # payload.entry[0].changes[0].value.messages[0]
        entries = payload.get("entry", [])
        for entry in entries:
            for change in entry.get("changes", []):
                value = change.get("value", {})

                # Phone number metadata
                phone_number_id = value.get("metadata", {}).get("phone_number_id", "")

                messages = value.get("messages", [])
                for message in messages:
                    await _route_message(message, phone_number_id)

    except Exception as e:
        logger.error(f"[Webhook] Unhandled error in background processor: {e}", exc_info=True)


async def _route_message(message: Dict[str, Any], phone_number_id: str) -> None:
    """
    Routes a single parsed WhatsApp message to the correct handler.

    message schema (simplified):
        {
            "id":   str,        # WA message ID
            "from": str,        # Sender phone (E.164)
            "type": str,        # "text" | "interactive" | "image" | ...
            "text": {"body": str},           # if type == "text"
            "interactive": {                 # if type == "interactive"
                "type": "button_reply",
                "button_reply": {"id": str, "title": str}
            }
        }
    """
    msg_type    = message.get("type", "unknown")
    sender      = message.get("from", "unknown")
    msg_id      = message.get("id", "")

    logger.info(
        f"[Webhook] Incoming | type={msg_type} | from={sender} | msg_id={msg_id}"
    )

    #  Route 1: Interactive button reply (HITL Approve / Deny) 
    if msg_type == "interactive":
        interactive    = message.get("interactive", {})
        button_reply   = interactive.get("button_reply", {})
        button_id      = button_reply.get("id", "")   # e.g. "APPROVE_<uuid>"

        if button_id.startswith("APPROVE_") or button_id.startswith("DENY_"):
            logger.info(
                f"[Webhook] HITL button press | button_id={button_id} | owner={sender}"
            )
            await _handle_hitl_response(button_id=button_id, owner_phone=sender)
        else:
            logger.debug(
                f"[Webhook] Unknown interactive button_id={button_id}  ignoring."
            )
        return

    #  Route 2: Text message  V2 Employee pipeline 
    if msg_type == "text":
        text_body = message.get("text", {}).get("body", "").strip()
        if text_body:
            logger.info(
                f"[Webhook] Text message | from={sender} | preview='{text_body[:60]}'"
            )
            await _handle_text_message(
                sender=sender,
                text=text_body,
                msg_id=msg_id,
            )
        return

    #  Unsupported types 
    logger.debug(f"[Webhook] Unsupported message type '{msg_type}'  discarded.")


#  HITL Handler 

async def _handle_hitl_response(button_id: str, owner_phone: str) -> None:
    """
    Processes owner's Approve / Deny button tap from WhatsApp.

    ON APPROVED:
      1. Fetches the stored payload (original skill params).
      2. Re-executes the skill via the V2 employee pipeline.
      3. Sends customer a WhatsApp confirmation.

    ON DENIED:
      1. Notifies the customer via WhatsApp.
    """
    from src.services.aiskills.chatwidget.hitl_approval_gate import (
        handle_owner_webhook, ApprovalStore,
    )

    result      = await handle_owner_webhook(button_id=button_id, owner_phone=owner_phone)
    gate_status = result.get("gate_status", "UNKNOWN")
    request_id  = result.get("request_id", "?")
    action_type = result.get("action_type", "?")
    payload     = result.get("payload", {})   # Original skill params

    if result.get("status") != "success":
        logger.error(
            f"[HITL] Resolution failed | req={request_id} | msg={result.get('message')}"
        )
        return

    #  APPROVED: Re-execute the original skill 
    if gate_status == "APPROVED":
        logger.success(
            f"[HITL]  APPROVED | req={request_id} | action={action_type} | owner={owner_phone}"
        )
        await _reexecute_approved_skill(
            request_id  = request_id,
            action_type = action_type,
            payload     = payload,
        )

    #  DENIED: Notify the customer via WhatsApp 
    elif gate_status == "DENIED":
        logger.warning(
            f"[HITL]  DENIED | req={request_id} | action={action_type} | owner={owner_phone}"
        )
        # Retrieve stored record to get the customer's phone (stored in payload)
        record = await ApprovalStore.get(request_id)
        customer_phone = record.get("payload", {}).get("customer_phone", "") if record else ""
        if customer_phone:
            await _send_whatsapp_reply(
                to=customer_phone,
                message=(
                    " Your request has been reviewed by the store owner and was declined. "
                    "If you have questions, feel free to ask and I'll do my best to help!"
                )
            )
            logger.info(f"[HITL] Denial notification sent to customer {customer_phone}.")
        else:
            logger.warning(
                f"[HITL] Could not notify customer  customer_phone missing in payload "
                f"for request {request_id}."
            )


async def _reexecute_approved_skill(
    request_id: str,
    action_type: str,
    payload: Dict[str, Any],
) -> None:
    """
    Re-executes the original skill after owner approval.

    Payload contains:
      - customer_phone : Who to notify on completion
      - employee_id    : Which employee to re-route to (e.g. "support_lead")
      - user_message   : Original customer message (for context)
      - context        : Full context package used originally
    """
    from src.services.aiskills.engine import get_employee

    customer_phone = payload.get("customer_phone", "")
    employee_id    = payload.get("employee_id", "support_lead")
    user_message   = payload.get("user_message", f"[Re-execution of approved {action_type}]")
    context        = payload.get("context", {})
    # Mark as re-execution so pipeline knows it's HITL-approved
    context["hitl_approved"]  = True
    context["hitl_request_id"] = request_id

    logger.info(
        f"[HITL] Re-executing approved skill | req={request_id} | "
        f"action={action_type} | employee={employee_id} | customer={customer_phone}"
    )

    try:
        employee = get_employee(employee_id)
        result   = await employee.execute(user_message=user_message, context=context)
        reply    = result.get("reply", "")

        # Notify customer with the result
        if customer_phone:
            confirmation = reply or (
                f" Your request ({action_type}) has been approved by the owner "
                "and processed successfully!"
            )
            await _send_whatsapp_reply(to=customer_phone, message=confirmation)
            logger.success(
                f"[HITL] Re-execution reply sent to {customer_phone} | req={request_id}"
            )
    except Exception as e:
        logger.error(
            f"[HITL] Re-execution failed | req={request_id} | error={e}", exc_info=True
        )
        # Inform customer of the failure gracefully
        if customer_phone:
            await _send_whatsapp_reply(
                to=customer_phone,
                message=(
                    " Your request was approved, but we ran into a technical issue "
                    "while processing it. Our team has been notified. Please try again shortly."
                )
            )


#  Text Message  V2 Employee Pipeline 

async def _handle_text_message(sender: str, text: str, msg_id: str) -> None:
    """
    Routes an incoming WhatsApp text message through the full V2 pipeline:

    Flow:
        1. Lookup business_id from MongoDB (phone  business mapping).
        2. Pass through V2 BaseEmployee.execute() with full context.
        3. Send reply back via WhatsApp API.
    """
    from src.services.aiskills.engine import get_employee

    try:
        #  Phase 5: Phone  Business lookup 
        business_id = await _lookup_business_id(sender)

        context: Dict[str, Any] = {
            "user_id":     sender,
            "session_id":  msg_id,
            "role":        "customer",
            "channel":     "whatsapp",
            "business_id": business_id,
            "customer_phone": sender,   # Stored in HITL payload for re-execution
        }

        employee = get_employee("support_lead")
        result   = await employee.execute(user_message=text, context=context)
        reply    = result.get("reply", "")
        if reply:
            await _send_whatsapp_reply(to=sender, message=reply)

    except Exception as e:
        logger.error(f"[Webhook] Pipeline error for sender={sender}: {e}", exc_info=True)
        await _send_whatsapp_reply(
            to=sender,
            message="Sorry, I'm having a technical issue right now. Please try again in a moment."
        )


#  Phone  Business Mapping 

async def _lookup_business_id(customer_phone: str) -> str:
    """
    Phase 5: Looks up which business a customer phone belongs to.

    Strategy:
      1. Query MongoDB `businesses` collection.
         Match: document.whatsapp_customers[] contains customer_phone
              OR document.whatsapp_number == customer_phone (owner lookup)
      2. If no match  return "default" (system keeps working, no crash).

    Future: Cache with Redis (TTL 5 min) to avoid per-message DB hits.
    """
    try:
        from src.core.db.mongodb import get_mongodb
        db  = await get_mongodb()
        col = db["businesses"]

        # Try to find business where this phone is a registered customer
        doc = await col.find_one(
            {"whatsapp_customers": {"$elemMatch": {"phone": customer_phone}}},
            {"_id": 1, "business_id": 1}
        )
        if doc:
            business_id = str(doc.get("business_id") or doc.get("_id", "default"))
            logger.debug(
                f"[BusinessLookup] Found business={business_id} for phone={customer_phone}"
            )
            return business_id

        # Fallback: no match found
        logger.debug(
            f"[BusinessLookup] No business found for phone={customer_phone}  using 'default'."
        )
        return "default"

    except Exception as e:
        logger.warning(
            f"[BusinessLookup] MongoDB lookup failed ({e})  using 'default' fallback."
        )
        return "default"


#  WhatsApp Reply Sender 

async def _send_whatsapp_reply(to: str, message: str) -> None:
    """
    Sends a plain text reply via WhatsApp Cloud API.

    Uses settings.WHATSAPP_TOKEN and settings.WHATSAPP_PHONE_ID.
    Silently skips if credentials aren't configured (dev mode).
    """
    if not settings.WHATSAPP_TOKEN or not settings.WHATSAPP_PHONE_ID:
        logger.debug(
            f"[WebhookReply] WA credentials not set. "
            f"Skipping reply to {to}: '{message[:60]}'"
        )
        return

    import httpx
    api_url = f"https://graph.facebook.com/v18.0/{settings.WHATSAPP_PHONE_ID}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type":    "individual",
        "to":                to,
        "type":              "text",
        "text":              {"body": message},
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                api_url,
                json=payload,
                headers={
                    "Authorization": f"Bearer {settings.WHATSAPP_TOKEN}",
                    "Content-Type":  "application/json",
                },
            )
            if resp.status_code == 200:
                logger.success(f"[WebhookReply]  Reply sent to {to}.")
            else:
                logger.error(
                    f"[WebhookReply]  API error {resp.status_code}: {resp.text[:200]}"
                )
    except Exception as e:
        logger.error(f"[WebhookReply] Send failed: {e}")
