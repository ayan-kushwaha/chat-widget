"""
🧪 NEURAL INTELLIGENCE VERIFICATION
Validates GDS Activation (Phase 8) and Evolution Cycles (Phase 9).
"""
import asyncio
import os
import sys
from loguru import logger

# Add the workspace root to sys.path
sys.path.append(os.getcwd())

from src.services.neural.graph_manager.orchestrator import graph_orchestrator, GraphOrchestrator
print(f"DEBUG: Loaded orchestrator from: {graph_orchestrator.__class__.__module__}")
import inspect
print(f"DEBUG: orchestrator.py location: {inspect.getfile(GraphOrchestrator)}")

from src.services.neural.evolution.evolution_engine import evolution_engine
from src.database.neo4j_client import neo4j_client

async def verify_neural_intelligence():
    # Initialize Neo4j (MemoryManager connects automatically via VectorStore)
    await neo4j_client.connect()
    
    from src.core.memory import memory
    from src.core.vector_store import vector_store
    
    if not vector_store.q_client:
        print("❌ QDRANT ERROR: VectorStore client not initialized!")
        return
    
    ORG_ID = "test_neural_org_001"
    USER_ID = "test_user_ai"
    
    print("\n--- [STEP 1] Verifying Phase 8: GDS Topo-Linker ---")
    try:
        print("DEBUG: Calling interaction 1...")
        await graph_orchestrator.sync_interaction_unified(
            USER_ID,
            ORG_ID,
            "I want to learn about FastAPI and Python.",
            "FastAPI is a modern web framework."
        )
    except Exception as e:
        print(f"❌ ERROR IN INTERACTION 1: {e}")
        import traceback
        traceback.print_exc()
        return

    try:
        print("DEBUG: Calling interaction 2...")
        await graph_orchestrator.sync_interaction_unified(
            USER_ID,
            ORG_ID,
            "Now tell me how to deploy this on AWS.",
            "You can use Docker and ECS for AWS deployment."
        )
    except Exception as e:
        print(f"❌ ERROR IN INTERACTION 2: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Check Neo4j for LEADS_TO
    check_leads = await neo4j_client.run_write(
        "MATCH (t1:TopicNeuron)-[r:LEADS_TO]->(t2:TopicNeuron) RETURN r LIMIT 1", {}
    )
    if check_leads:
        print("✅ GDS SUCCESS: Predictive [LEADS_TO] edge created between topics.")
    else:
        print("❌ GDS FAILED: No [LEADS_TO] edge found.")

    print("\n--- [STEP 2] Verifying Phase 9: Evolution Sharding ---")
    # Simulate a reaction to boost weight for harvesting
    # We'll use a mock mongo_id that we know is in the graph from Step 1
    # For simulation, we'll just force a high-weight record
    await neo4j_client.run_write(
        "MATCH (e:EpisodeNeuron {org_id: $org}) SET e.interaction_weight = 5.0", {"org": ORG_ID}
    )
    
    success = await evolution_engine.run_evolution_cycle(ORG_ID, min_weight=2.0)
    
    if success:
        print("✅ EVOLUTION SUCCESS: Training shard generated and AtmaTrainer triggered.")
        # Check if directory exists
        shard_dir = f"data/evolution_shards/{ORG_ID}"
        if os.path.exists(shard_dir) and os.listdir(shard_dir):
            print(f"✅ FILE SUCCESS: Shard files located in {shard_dir}")
    else:
        print("❌ EVOLUTION FAILED: Cycle did not produce results.")

if __name__ == "__main__":
    asyncio.run(verify_neural_intelligence())
