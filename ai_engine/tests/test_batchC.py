"""Test: Batch C Skills — Amit (E4, E-LQ) and Alex (A1)"""
import asyncio
from src.services.aiskills.contracts.types import ContextPackage
from src.services.aiskills.contracts.executive.meeting_negotiator import MeetingNegotiatorContract, MeetingNegotiatorInput
from src.services.aiskills.contracts.executive.lead_qualifier import LeadQualifierContract, LeadQualifierInput
from src.services.aiskills.contracts.executive.diagnostic_parser import DiagnosticParserContract, DiagnosticParserInput

ctx = ContextPackage(
    employee_id="amit",
    business_id="test",
    temporal_anchor="Current Context Time: Saturday, February 28, 2026 at 12:09 PM IST"
)

async def test():
    print("="*60)
    print("--- Testing Batch C: Amit + Alex Skills ---")
    print("="*60)

    # E4: Meeting Negotiator
    mn = MeetingNegotiatorContract()
    r = await mn._run(MeetingNegotiatorInput(customer_message="Bhai kal 3 baje ek quick call ho sakti hai? Business mein partnership discuss karni hai."), {}, ctx)
    print(f"\n[E4] MeetingNegotiator:")
    print(f"     Agenda: {r['agenda']}")
    print(f"     Date: {r['preferred_date']} | Time: {r['preferred_time']}")
    print(f"     Complete: {r['booking_complete']}")
    print(f"     Reply: {r['reply']}")

    # E-LQ: Lead Qualifier
    lq = LeadQualifierContract()
    ctx2 = ContextPackage(employee_id="amit", business_id="test")
    r2 = await lq._run(LeadQualifierInput(customer_message="Main ek restaurant chain chalata hoon, 5 locations hain. Tumhara AI solution try karna tha, budget tight nahi hai."), {}, ctx2)
    print(f"\n[E-LQ] LeadQualifier:")
    print(f"     Requirement: {r2['requirement']}")
    print(f"     Priority: {r2['priority_tag']} | Budget: {r2['budget_signal']} | Urgency: {r2['urgency']}")
    print(f"     Summary: {r2['lead_summary']}")

    # A1: Diagnostic Parser (Alex)
    ctx3 = ContextPackage(employee_id="alex", business_id="test")
    dp = DiagnosticParserContract()
    r3 = await dp._run(DiagnosticParserInput(user_message="Bhai app open hi nahi ho rahi mere Samsung S21 pe, Android 13 hai. Kal se ye problem aa rahi hai."), {}, ctx3)
    print(f"\n[A1] DiagnosticParser (Alex):")
    print(f"     Device: {r3['device_model']} | OS: {r3['os_version']}")
    print(f"     Error: {r3['error_description']}")
    print(f"     Severity: {r3['severity']} | Complete: {r3['report_complete']}")
    print(f"     Reply: {r3['diagnostic_reply']}")

    print("\n" + "="*60)
    print("ALL BATCH C TESTS DONE")

if __name__ == "__main__":
    asyncio.run(test())
