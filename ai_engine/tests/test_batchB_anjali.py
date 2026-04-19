"""Test: Anjali Batch B Skills (E1, E5, E-MEM)"""
import asyncio
from src.services.aiskills.contracts.types import ContextPackage
from src.services.aiskills.contracts.executive.voice_to_task import VoiceToTaskContract, VoiceToTaskInput
from src.services.aiskills.contracts.executive.briefing_architect import BriefingArchitectContract, BriefingArchitectInput
from src.services.aiskills.contracts.executive.context_memory import ContextMemoryContract, ContextMemoryInput

ctx = ContextPackage(
    employee_id="anjali",
    business_id="test",
    temporal_anchor="Current Context Time: Saturday, February 28, 2026 at 11:49 AM IST"
)

async def test():
    print("--- Testing Anjali Batch B Skills ---")

    # E1: Voice to Task
    vtt = VoiceToTaskContract()
    r = await vtt._run(VoiceToTaskInput(boss_message="Kal subah Sarah ko invoice bhej do aur 5 baje investor call fix karo"), {}, ctx)
    print(f"[E1] VoiceToTask: {len(r['tasks'])} tasks extracted | error: {r.get('error')}")
    for t in r["tasks"]:
        print(f"     - {t.get('task')} [{t.get('priority')}] due: {t.get('due_date')}")

    # E5: Briefing Architect
    ba = BriefingArchitectContract()
    r2 = await ba._run(BriefingArchitectInput(chat_history="User1: Order nahi aya. Anjali: Track kar rahi hun. Boss: Aaj 3 orders late hain."), {}, ctx)
    print(f"[E5] BriefingArchitect: {len(r2['briefing'])} bullets | alerts: {len(r2['critical_alerts'])}")
    for b in r2["briefing"]:
        print(f"     - {b}")

    # E-MEM: Context Memory
    cm = ContextMemoryContract()
    r3 = await cm._run(ContextMemoryInput(query="last week inventory report", business_id="test"), {}, ctx)
    print(f"[E-MEM] ContextMemory: found={r3['found']} | keywords={r3['keywords_used']}")

    print("--- ALL ANJALI BATCH B TESTS DONE ---")

if __name__ == "__main__":
    asyncio.run(test())
