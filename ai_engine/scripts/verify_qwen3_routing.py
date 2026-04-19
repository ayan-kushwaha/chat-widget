import asyncio
import sys
import os

# Add src to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.core.orchestrator import orchestrator
from src.core.routing.shadow_boss import shadow_boss
from src.core.brain import brain
from src.utils.logger import logger

async def test_2tier_routing():
    print("\n" + "="*50)
    print("🛡️ VERIFYING 2-TIER ROUTING (QWEN3)")
    print("="*50 + "\n")

    test_queries = [
        "Hi, how are you?",  # Simple Greeting -> Shadow Boss track
        "I want to increase my sales by 20% by next month. Can you analyze my inventory?", # Complex -> Expert Brain track
        "Shut up, you are stupid", # Security -> Blocked track
    ]

    for query in test_queries:
        print(f"\nUser: '{query}'")
        print("-" * 30)
        
        # 1. Test Shadow Boss Alone
        audit = await shadow_boss.analyze(query)
        print(f"Shadow Boss Audit: {audit}")
        
        # 2. Test Full Orchestrator
        system_type, handler_id, confidence, audit = await orchestrator.route(
            query, 
            "test_user", 
            {"user_role": "admin"}
        )
        print(f"Orchestrator Decision: System={system_type}, Handler={handler_id}, Confidence={confidence}")

async def test_expert_brain():
    print("\n" + "="*50)
    print("🧠 VERIFYING EXPERT BRAIN (QWEN3:4B)")
    print("="*50 + "\n")
    
    query = "Hinglish mein batao ki Cluaiz AI small business ke liye kyun best hai?"
    print(f"Testing Brain with: '{query}'")
    
    response = await brain.generate(query)
    print(f"\nExpert Brain Response:\n{response['text']}")
    print(f"\nUsage: {response['usage']}")

if __name__ == "__main__":
    asyncio.run(test_2tier_routing())
    asyncio.run(test_expert_brain())
