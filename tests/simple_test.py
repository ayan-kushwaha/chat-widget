import asyncio
import os
import sys

sys.path.append(os.getcwd())
from src.services.neural.graph_manager.orchestrator import graph_orchestrator

async def test():
    print("Testing process_interaction signature...")
    try:
        # Pass exactly 4 arguments (plus self)
        res = await graph_orchestrator.process_interaction(
            user_id="test_user",
            org_id="test_org",
            message="hello",
            response="hi"
        )
        print("✅ SUCCESS")
    except Exception as e:
        print(f"❌ FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(test())
