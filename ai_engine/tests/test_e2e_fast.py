"""
🚀 FAST E2E ROUTING TEST
Uses register_sync (no embedding) to instantly catalogue all skills,
then tests INTENT + COGNITIVE ROUTER decisions for all 4 employee scenarios.
"""

import asyncio
from src.services.routing.intent_router import intent_router
from src.services.routing.cognitive_router import cognitive_router
from src.services.aiskills.registry import SkillRegistry

# Register all 4 employee skills (sync, no embedding needed for this test)
from src.services.aiskills.contracts.executive.voice_to_task import VoiceToTaskContract
from src.services.aiskills.contracts.executive.briefing_architect import BriefingArchitectContract
from src.services.aiskills.contracts.executive.context_memory import ContextMemoryContract
from src.services.aiskills.contracts.executive.meeting_negotiator import MeetingNegotiatorContract
from src.services.aiskills.contracts.executive.lead_qualifier import LeadQualifierContract
from src.services.aiskills.contracts.executive.diagnostic_parser import DiagnosticParserContract
from src.services.aiskills.contracts.support.de_escalator import DeEscalatorContract

def setup_registry():
    for cls in [
        VoiceToTaskContract, BriefingArchitectContract, ContextMemoryContract,
        MeetingNegotiatorContract, LeadQualifierContract,
        DiagnosticParserContract, DeEscalatorContract
    ]:
        SkillRegistry.register_sync(cls)
    print(f"  Registered: {sorted(SkillRegistry._skills.keys())}\n")

SCENARIOS = [
    {
        "name":       "🗂️ Anjali — Boss Task Extraction",
        "role":       "malik",
        "message":    "Kal CA se milna hai aur Sarah ko product brochure bhejna hai, aur investor call 4 baje fix karo.",
        "expected_intent": "ORDER",
        "expected_path":   "fast_0.6b",
    },
    {
        "name":       "📅 Amit — Customer Meeting Request",
        "role":       "grahak",
        "message":    "Bhai main aapke AI solution ke baare mein baat karna chahta hoon, kya kal 3 baje call ho sakti hai?",
        "expected_intent": "ORDER",
        "expected_path":   "fast_0.6b",
    },
    {
        "name":       "🛡️ Sarah — Angry Customer",
        "role":       "grahak",
        "message":    "Ye kya bakwaas service hai! 5 din ho gaye order nahi aya, 3 baar call kiya koi nahi sunta. REFUND chahiye ABHI!",
        "expected_intent": "FRUSTRATION",
        "expected_path":   "deep_4b",
    },
    {
        "name":       "🔧 Alex — App Crash Report",
        "role":       "grahak",
        "message":    "Bhai app chal hi nahi rahi, Samsung S22 hai mera, Android 14 pe. Kal se crash ho rahi hai.",
        "expected_intent": "AMBIGUOUS",
        "expected_path":   "fast_0.6b",
    },
]

async def run():
    print("=" * 65)
    print("  🚀 CLUAIZ V2 — FAST E2E ROUTING TEST")
    print("=" * 65)

    print("\n[0] Setting up skill registry (sync mode)...")
    setup_registry()

    results = []

    for i, s in enumerate(SCENARIOS, 1):
        print(f"{'─'*65}")
        print(f"  Scenario {i}: {s['name']}")
        print(f"  Role   : {s['role']}")
        print(f"  Message: {s['message'][:70]}...")

        # Step 1: Intent
        intent = await intent_router.classify(s["message"])
        intent_ok = "✅" if intent == s["expected_intent"] else f"⚠️ expected={s['expected_intent']}"
        print(f"  🚦 Intent: {intent} {intent_ok}")

        # Step 2: Cognitive Router
        path = cognitive_router.decide(intent=intent, user_message=s["message"])
        path_ok = "✅" if path == s["expected_path"] else f"⚠️ expected={s['expected_path']}"
        print(f"  🧠 Model : {path} {path_ok}")

        results.append({
            "name": s["name"],
            "intent_pass": intent == s["expected_intent"],
            "path_pass": path == s["expected_path"],
            "intent": intent,
            "path": path,
        })

    # Summary
    print(f"\n{'='*65}")
    print("  📋 RESULTS SUMMARY")
    print(f"{'='*65}")
    for r in results:
        i_status = "✅" if r["intent_pass"] else "❌"
        p_status = "✅" if r["path_pass"] else "❌"
        print(f"  {i_status}{p_status} {r['name']}")
        print(f"       Intent={r['intent']} | Path={r['path']}")

    total = len(results)
    intent_pass = sum(1 for r in results if r["intent_pass"])
    path_pass   = sum(1 for r in results if r["path_pass"])
    print(f"\n  Intent Accuracy : {intent_pass}/{total}")
    print(f"  Router Accuracy : {path_pass}/{total}")
    print(f"{'='*65}\n")

if __name__ == "__main__":
    asyncio.run(run())
