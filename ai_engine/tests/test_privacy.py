import asyncio
import os
from pprint import pprint
from src.services.aiskills.contracts.security.local_privacy_engine import LocalPrivacyEngine, PrivacyInput
from src.services.aiskills.contracts.types import ContextPackage, BusinessDNA

async def test_privacy_engine():
    print("=== Testing Local Privacy Engine ===")
    engine = LocalPrivacyEngine()
    
    # Test text with PII
    text = "My name is Rahul and my number is +91-9876543210. Email me at rahul.boss@company.com."
    
    # 1. Test GRAHAK (Customer) - Should mask everything
    print("\n[Test 1] Role: GRAHAK (Inbound)")
    ctx_grahak = ContextPackage(employee_id="test_optio", business_id="test_biz")
    res1 = await engine._run(
        params=PrivacyInput(text=text, direction="inbound", role="grahak"),
        entities={},
        context_package=ctx_grahak
    )
    print("Input: ", text)
    print("Output:", res1["processed_text"])
    print("Masked:", res1["was_masked"])
    print("Stats: ", res1["stats"])
    
    # 2. Test MALIK (Boss) - Should NOT mask
    print("\n[Test 2] Role: MALIK (Inbound)")
    ctx_malik = ContextPackage(employee_id="test_optio", business_id="test_biz")
    res2 = await engine._run(
        params=PrivacyInput(text=text, direction="inbound", role="malik"),
        entities={},
        context_package=ctx_malik
    )
    print("Output:", res2["processed_text"])
    print("Masked:", res2["was_masked"])
    print("Stats: ", res2["stats"])
    
    # 3. Test GRAHAK with Boss Mandate (Disable Masking)
    print("\n[Test 3] Role: GRAHAK + Boss Mandate 'disable_masking=true'")
    ctx_mandate = ContextPackage(
        employee_id="test_optio", 
        business_id="test_biz",
        boss_mandates=[{"skill": "local_privacy_engine", "mandate": "disable_masking=true"}]
    )
    res3 = await engine._run(
        params=PrivacyInput(text=text, direction="outbound", role="grahak"),
        entities={},
        context_package=ctx_mandate
    )
    print("Output:", res3["processed_text"])
    print("Masked:", res3["was_masked"])

if __name__ == "__main__":
    asyncio.run(test_privacy_engine())
