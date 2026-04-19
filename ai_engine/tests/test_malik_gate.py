"""Test MalikGate logic: Create, Approve, Deny, Expiry"""
import asyncio

async def main():
    from src.services.aiskills.contracts.security.malik_gate import (
        MalikGate, MalikGateInput, ApprovalStore,
        handle_malik_webhook, ApprovalStatus, run_expiry_sweeper
    )
    from src.services.aiskills.contracts.types import ContextPackage, BusinessDNA

    print("[1] MalikGate imported OK")

    cp = ContextPackage(
        business_dna=BusinessDNA(industry_cluster="retail", language_preference="hinglish"),
        employee_id="test", business_id="biz_001", session_id="sess_001"
    )

    gate = MalikGate()

    # ── Test 1: Approve flow ─────────────────────────────────────────────────
    params = MalikGateInput(
        action_description="Process refund of Rs. 4500 for order ORD-9921",
        action_type="refund",
        payload={"order_id": "ORD-9921", "amount": 4500},
        priority="high",
        ttl_seconds=300,
        customer_summary="Raju from Mumbai, regular customer"
    )
    result = await gate._run(params=params, entities={}, context_package=cp)
    req_id = result["request_id"]
    print(f"[2] Gate fired    | status={result['gate_status']} | req={req_id[:8]}...")
    print(f"    customer msg  : {result['message']}")

    record = ApprovalStore.get(req_id)
    assert record["status"] == ApprovalStatus.PENDING
    print(f"[3] Store status  : {record['status']} (PASS)")

    approve_result = await handle_malik_webhook(f"APPROVE_{req_id}", "+919876543210")
    assert approve_result["gate_status"] == ApprovalStatus.APPROVED
    assert approve_result["payload"] == {"order_id": "ORD-9921", "amount": 4500}
    print(f"[4] Boss approved : {approve_result['gate_status']} (PASS)")
    print(f"    Payload back  : {approve_result['payload']}")

    # ── Test 2: Deny flow ────────────────────────────────────────────────────
    params2 = MalikGateInput(
        action_description="Apply 50% bulk discount to 1000 items",
        action_type="bulk_discount",
        payload={"discount_pct": 50, "item_count": 1000},
        priority="critical",
        ttl_seconds=300,
        customer_summary=""
    )
    result2 = await gate._run(params=params2, entities={}, context_package=cp)
    req_id2 = result2["request_id"]

    deny_result = await handle_malik_webhook(f"DENY_{req_id2}", "+919876543210")
    assert deny_result["gate_status"] == ApprovalStatus.DENIED
    print(f"[5] Boss denied   : {deny_result['gate_status']} (PASS)")

    # ── Test 3: Expiry sweep ─────────────────────────────────────────────────
    # Create a request with 0s TTL → already expired
    import time
    params3 = MalikGateInput(
        action_description="Test expiry",
        action_type="test",
        payload={},
        priority="medium",
        ttl_seconds=0,
        customer_summary=""
    )
    result3 = await gate._run(params=params3, entities={}, context_package=cp)
    req_id3 = result3["request_id"]
    expired_count = await ApprovalStore.expire_stale()
    record3 = ApprovalStore.get(req_id3)
    assert record3["status"] == ApprovalStatus.EXPIRED
    print(f"[6] Expiry test   : {record3['status']} | swept={expired_count} (PASS)")

    # ── Test 4: Double-resolve guard ─────────────────────────────────────────
    again = await handle_malik_webhook(f"APPROVE_{req_id}", "+91xxxx")
    assert again["status"] == "error"   # already APPROVED
    print(f"[7] Double-resolve guard PASS")

    # ── Test 5: WhatsApp payload structure ───────────────────────────────────
    wa = result["whatsapp_payload"]
    assert wa["type"] == "interactive"
    buttons = wa["interactive"]["action"]["buttons"]
    btn_ids = [b["reply"]["id"] for b in buttons]
    assert any("APPROVE_" in b for b in btn_ids)
    assert any("DENY_" in b for b in btn_ids)
    print(f"[8] WA payload OK : buttons={[b['reply']['title'] for b in buttons]} (PASS)")

    print()
    print("[PASS] ALL MALIK GATE TESTS PASSED!")
    print(f"       elapsed_ms={result['elapsed_ms']}ms (non-blocking dispatch)")

asyncio.run(main())
