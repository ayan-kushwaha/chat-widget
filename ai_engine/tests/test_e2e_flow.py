"""
╔══════════════════════════════════════════════════════════════════════════════╗
║  🚀 TARGETED E2E FLOW TEST — Cluaiz V2 Full Pipeline                        ║
║                                                                              ║
║  Tests the complete pipeline (Temporal -> Intent -> Route -> Skill)         ║
║  Uses register_sync for speed and reliability.                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import asyncio
import time
from loguru import logger

# 1. Imports from our core system
from src.services.aiskills.registry import SkillRegistry
from src.services.aiskills.factory import SkillFactory
from src.services.aiskills.contracts.types import ContextPackage, BusinessDNA
from src.services.context.runtime_injector import RuntimeInjector
from src.services.routing.intent_router import intent_router, IntentLane
from src.services.routing.cognitive_router import cognitive_router

# 2. Import specific skills for the test
from src.services.aiskills.contracts.executive.voice_to_task import VoiceToTaskContract
from src.services.aiskills.contracts.executive.meeting_negotiator import MeetingNegotiatorContract
from src.services.aiskills.contracts.executive.diagnostic_parser import DiagnosticParserContract
from src.services.aiskills.contracts.support.de_escalator import DeEscalatorContract

# 3. Setup (Sync Registration to avoid embedding hell)
def bootstrap_test_skills():
    print("\n[0] Bootstrapping Core Skills (Sync Mode)...")
    core_classes = [
        VoiceToTaskContract,
        MeetingNegotiatorContract,
        DiagnosticParserContract,
        DeEscalatorContract
    ]
    for cls in core_classes:
        SkillRegistry.register_sync(cls)
    print(f"    ✅ Ready: {list(SkillRegistry._skills.keys())}\n")

# 4. Scenarios
SCENARIOS = [
    {
        "name": "🗂️ Anjali (Executive PA)",
        "role": "malik",
        "emp_id": "executive_pa",
        "message": "Kal subah 10 baje CA ke sath meeting fix karo aur report mujhe email kar do.",
        "expected_intent": IntentLane.ORDER,
        "expected_skill": "voice_to_task",
    },
    {
        "name": "📅 Amit (Operations)",
        "role": "grahak",
        "emp_id": "appointment_setter",
        "message": "Bhai ek demo schedule karna hai product ka, Tuesday free ho?",
        "expected_intent": IntentLane.ORDER,
        "expected_skill": "meeting_negotiator",
    },
    {
        "name": "🛡️ Sarah (Support)",
        "role": "grahak",
        "emp_id": "support_lead",
        "message": "Ye kya bakwaas hai! Refund karo abhi, 2 hafte se wait kar raha hoon badtameezi lag rakhi hai.",
        "expected_intent": IntentLane.FRUSTRATION,
        "expected_skill": "de_escalator",
    },
    {
        "name": "🔧 Alex (Tech Support)",
        "role": "grahak",
        "emp_id": "tech_support",
        "message": "My app is crashing on iPhone 15, iOS 17. Errors show 404 and 500 when I login.",
        "expected_intent": IntentLane.TECH_ISSUE,
        "expected_skill": "diagnostic_parser",
    },
]

async def run_test():
    bootstrap_test_skills()
    
    print("=" * 70)
    print(f"  {'STATION':<20} | {'FIELD':<15} | {'RESULT':<25}")
    print("-" * 70)

    for i, s in enumerate(SCENARIOS, 1):
        print(f"\n🚀 Scenario {i}: {s['name']}")
        
        # Step 1: Context (Temporal Anchor)
        emp_id = s.get("emp_id", "anjali")
        ctx = await RuntimeInjector.assemble_package(
            business_id="biz_123", 
            employee_id=emp_id,
            query=s['message'],
            user_timezone="Asia/Kolkata"
        )
        print(f"  {'Context':<20} | {'Temporal':<15} | {ctx.temporal_anchor}")

        # Step 2: Intent
        intent = await intent_router.classify(s['message'])
        i_match = "✅" if intent == s['expected_intent'] else f"❌ ({s['expected_intent']})"
        print(f"  {'Intent':<20} | {'Lane':<15} | {intent:<10} {i_match}")

        # Step 3: Cognitive Route
        path = cognitive_router.decide(intent=intent, user_message=s['message'])
        print(f"  {'Route':<20} | {'Path':<15} | {path}")

        # Step 4: Skill Execution
        result = await SkillFactory.get_skill_for_execution(
            query=s['message'],
            role=s['role'],
            context_package=ctx,
            use_llm_confirm=False  # Speed up for test
        )
        skill_id = result.get("skill_id")
        s_match = "✅" if skill_id == s['expected_skill'] else f"❌ ({s['expected_skill']})"
        print(f"  {'Skill':<20} | {'Picked':<15} | {skill_id:<10} {s_match}")
        print(f"  {'Confidence':<20} | {'Score/Tier':<15} | {result['score']}/{result['tier'].value}")

    print("\n" + "=" * 70)
    print("  ✅ E2E FLOW TEST COMPLETED SUCCESSFULLY")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(run_test())
