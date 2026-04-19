
import asyncio
import sys
import os
# Add src to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ai_engine')))

from src.services.neural.graph_manager.orchestrator import graph_orchestrator
from loguru import logger

async def test_graph_sync():
    logger.info("🧪 Testing Unified Graph Orchestration...")
    
    user_id = "user_aryan_7122"
    org_id = "cluaiz_neural_lab"
    
    # Interaction 1: Technical Focus
    msg1 = "I need to implement a new research skill with SearxNG."
    resp1 = "Sure! We can use SearxNG for unlimited search and Crawl4AI for extraction."
    
    logger.info("Turn 1 (Technical)...")
    res1 = await graph_orchestrator.process_interaction(user_id, org_id, msg1, resp1)
    
    assert res1["topic"] == "Web Research"
    logger.success(f"Turn 1 synced. Topic: {res1['topic']}")

    # Interaction 2: Marketing Focus
    msg2 = "Now draft a story about this for our brand campaign."
    resp2 = "Of course. Drafting a LinkedIn post about the new Neural Research Agent."
    
    logger.info("Turn 2 (Marketing)...")
    res2 = await graph_orchestrator.process_interaction(user_id, org_id, msg2, resp2)
    
    assert res2["topic"] == "Content Marketing"
    logger.success(f"Turn 2 synced. Topic: {res2['topic']}")

    logger.success("✅ Unified Graph Manager V2 Verification PASSED!")

if __name__ == "__main__":
    asyncio.run(test_graph_sync())
