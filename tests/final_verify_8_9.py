"""
🧪 FINAL NEURAL INTELLIGENCE VERIFICATION
Uniquely named to avoid stale imports/cache.
"""
import asyncio
import os
import sys
from loguru import logger

# Add workspace root
sys.path.append(os.getcwd())

print(f"DEBUG: Current Working Directory: {os.getcwd()}")

from src.database.neo4j_client import neo4j_client
from src.services.neural.graph_manager.orchestrator import graph_orchestrator
from src.services.neural.evolution.evolution_engine import evolution_engine

async def main():
    print("DEBUG: Initializing Neo4j...")
    await neo4j_client.connect()
    
    ORG_ID = "final_verify_org_001"
    USER_ID = "final_verify_user"
    
    print("\n--- [STEP 1] GDS Bridging Test ---")
    try:
        # We call the NEWLY RENAMED method
        print(f"DEBUG: Calling graph_orchestrator.sync_interaction_unified...")
        res = await graph_orchestrator.sync_interaction_unified(
            user_id=USER_ID,
            org_id=ORG_ID,
            message="Let's talk about Python and AI.",
            response="Python is great for AI."
        )
        print(f"✅ Interaction 1 Success: {res.get('topic')}")
        
        print("DEBUG: Calling interaction 2 (Topic Shift)...")
        res2 = await graph_orchestrator.sync_interaction_unified(
            user_id=USER_ID,
            org_id=ORG_ID,
            message="Now, how do I bake a cake?",
            response="Baking a cake involves flour and eggs.",
            previous_topic_id=res.get("topic_id")
        )
        print(f"✅ Interaction 2 Success: {res2.get('topic')}")
        
    except Exception as e:
        print(f"❌ FATAL ERROR IN STEP 1: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return

    print("\n--- [STEP 2] Evolution Cycle Test ---")
    try:
        # Boost weight for harvesting
        await neo4j_client.run_write(
            "MATCH (e:EpisodeNeuron {org_id: $org}) SET e.interaction_weight = 5.0", {"org": ORG_ID}
        )
        success = await evolution_engine.run_evolution_cycle(ORG_ID, min_weight=2.0)
        if success:
            print("✅ Evolution Cycle Triggered Successfully.")
        else:
            print("ℹ️ Evolution cycle skipped (No high-weight episodes found or already trained).")
    except Exception as e:
        print(f"❌ FATAL ERROR IN STEP 2: {e}")

if __name__ == "__main__":
    asyncio.run(main())
