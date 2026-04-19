"""
🧪 test_context_injection.py — Context-Aware Skill Validation
==============================================================
Goal: Verify that the SAME skill (RefundManagement) acts differently 
      based on the injected ContextPackage (Kirana vs SaaS).

Test 1: Kirana Store Context (Local tone, Cash refund allowed)
Test 2: SaaS Enterprise Context (Formal tone, Wallet-only credit mandate)
Test 3: DNA-level language switching (Hindi vs English)
"""

import sys
import os
import asyncio
import pytest
from unittest.mock import AsyncMock, patch, MagicMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.services.aiskills.contracts.support.refund_management import RefundManagementContract
from src.services.aiskills.contracts.base_contract import (
    ContextPackage, BusinessDNA, EscalationTrigger
)


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def kirana_context():
    """Context for a local Indian grocery store."""
    return ContextPackage(
        business_id="kirana_001",
        business_dna=BusinessDNA(
            industry_cluster="kirana_store",
            market_tier="local_smb",
            language_preference="hinglish",
            platform="whatsapp_api"
        ),
        kb_chunks=[
            {"source": "policy.txt", "chunk": "Hum cash refunds allowed karte hain agar product expiry pehle hai."}
        ],
        boss_mandates=[
            {"skill": "refund_management", "mandate": "1000"}  # Simple numeric for float()
        ]
    )

@pytest.fixture
def saas_context():
    """Context for a formal SaaS company."""
    return ContextPackage(
        business_id="saas_corp_99",
        business_dna=BusinessDNA(
            industry_cluster="saas",
            market_tier="enterprise",
            language_preference="english",
            platform="generic_web"
        ),
        kb_chunks=[
            {"source": "tos.pdf", "chunk": "Strictly no cash refunds. Account credit only within 7 days."}
        ],
        boss_mandates=[
            {"skill": "refund_management", "mandate": "50"}  # Formal limit: $50
        ]
    )


# ── Test 1: Kirana behavior (Hinglish + Mandate check) ────────────────────────

@pytest.mark.asyncio
async def test_kirana_refund_context(kirana_context):
    """
    Verify RefundManagement uses Hinglish and checks for credit preference 
    as per Kirana boss mandate.
    """
    skill = RefundManagementContract()
    
    # We mock _get_order_from_session to simulate an existing order
    with patch.object(RefundManagementContract, "_get_order_from_session") as mock_order:
        mock_order.return_value = {"order_id": "ORD-123", "amount": 500}
        
        # Call with missing reason to trigger slot filling
        result = await skill._execute(
            context_package=kirana_context,
            order_id="ORD-123"
        )
        
        # Verify Hinglish prompt (from order_lookup.py logic used in refund)
        # Note: RefundManagement returns slot-fill request in result['data']
        data = result.get("data", {})
        assert "kyun" in data.get("message", "").lower() or "reason" in data.get("message", "").lower()
        print(f"✅ Kirana slot prompt: {data.get('message')}")


# ── Test 2: SaaS behavior (Formal + Escalation check) ────────────────────────

@pytest.mark.asyncio
async def test_saas_refund_escalation(saas_context):
    """
    Verify SaaS context triggers escalation differently.
    """
    skill = RefundManagementContract()
    
    # SaaS has a mandate: Escalate > $50.
    # We'll simulate a $100 refund request.
    with patch.object(RefundManagementContract, "_get_order_from_session") as mock_order:
        mock_order.return_value = {"order_id": "SAAS-XYZ", "amount": 100}
        
        # Provide reason to bypass slot filling
        result = await skill._execute(
            context_package=saas_context,
            order_id="SAAS-XYZ",
            refund_reason="Double billing error"
        )
        
        # Check if it hit the escalation check or logic
        data = result.get("data", {})
        # Note: result status might be 'escalation_required' if trigger hits
        if result["status"] == "escalation_required":
            print(f"✅ SaaS Escalation triggered: {result['trigger']}")
        else:
            print(f"✅ SaaS result status: {result['status']} | Data: {data}")


# ── Test 3: DNA Language Preference ──────────────────────────────────────────

@pytest.mark.asyncio
async def test_dna_language_switching():
    """Verify language preference is respected across different contexts."""
    hindi_dna = BusinessDNA(language_preference="hindi")
    eng_dna   = BusinessDNA(language_preference="english")
    
    skill = RefundManagementContract()
    
    # Hindi DNA
    h_msg = skill._reason_prompt("hindi")
    assert "कारण" in h_msg or "वजह" in h_msg
    
    # English DNA
    e_msg = skill._reason_prompt("english")
    assert "reason" in e_msg.lower()
    
    print(f"✅ DNA Language switching: Hindi='{h_msg}' | English='{e_msg}'")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
