"""Test: Batch D — Sarah De-Escalator (S1)"""
import asyncio
from src.services.aiskills.contracts.types import ContextPackage
from src.services.aiskills.contracts.support.de_escalator import DeEscalatorContract, DeEscalatorInput

ctx = ContextPackage(
    employee_id="sarah",
    business_id="test",
    temporal_anchor="Current Context Time: Saturday, February 28, 2026 at 12:34 PM IST"
)

ANGRY_MSG = "Bhai ye kya bakwaas company hai!! 3 baar complain ki, koi nahi sunta. Main return chahta hoon ABHI. Nahi kiya to consumer forum jayunga!"

async def test():
    print("=" * 60)
    print("--- Testing Batch D: Sarah's De-Escalator [S1] ---")
    print(f"Customer: {ANGRY_MSG}")
    print("=" * 60)

    sarah = DeEscalatorContract()
    result = await sarah._run(
        DeEscalatorInput(customer_message=ANGRY_MSG, business_id="test", customer_id="cust_001"),
        {}, ctx
    )

    print(f"\n🛡️ De-Escalator Result:")
    print(f"   Root Problem: {result['root_problem']}")
    print(f"   Severity: {result['severity']}")
    print(f"   Action Required: {result['action_required']}")
    print(f"\n   Psychology Used:")
    psych = result.get('psychology_used', {})
    for k, v in psych.items():
        print(f"     {k}: {v}")
    print(f"\n   Empathy Reply:\n   \"{result['empathy_reply']}\"")
    print("\n" + "=" * 60)
    print("BATCH D TEST DONE")

if __name__ == "__main__":
    asyncio.run(test())
