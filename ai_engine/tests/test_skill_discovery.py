from src.services.aiskills.loader import bootstrap_skills
from src.services.aiskills.registry import SkillRegistry
import asyncio

async def test_discovery():
    print("🔍 Testing Dynamic Skill Discovery...")
    await bootstrap_skills()
    
    registered_skills = list(SkillRegistry._skills.keys())
    print(f"📌 Registered Skills: {registered_skills}")
    
    expected = ['wa_cart_recovery', 'upsell_engine', 'conflict_deescalator']
    for e in expected:
        if e in registered_skills:
            print(f"✅ Found: {e}")
        else:
            print(f"❌ Missing: {e}")

if __name__ == "__main__":
    asyncio.run(test_discovery())
