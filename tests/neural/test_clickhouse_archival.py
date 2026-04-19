"""
📊 CLICKHOUSE ARCHIVAL TEST (PHASE 12.8)
Cluaiz Neural OS | tests/neural/test_clickhouse_archival.py

Goal: Verify high-importance topic skeletons are archived to ClickHouse.
"""
import asyncio
import os
import sys
from loguru import logger

# Add workspace root
sys.path.append(os.getcwd())

# Prevent Unicode encoding errors with emojis in loguru for terminal
logger.remove()
logger.add(sys.stdout, colorize=False, format="{time} | {level} | {message}")

from src.database.neo4j_client import neo4j_client
from src.services.clickhouse_manager.core.connection import ch_connection
from src.services.clickhouse_manager.vault.search import vault_search
from src.services.clickhouse_manager.vault.archiver import archiver as ch_archiver
from src.services.neural.graph_manager.orchestrator import graph_orchestrator
from src.services.neural.metabolism.metabolism_manager import metabolism_manager
import src.services.neural.metabolism.metabolism_manager as mm_mod
print(f"DEBUG: 'metabolism_manager' loaded from: {mm_mod.__file__}")
import src
print(f"DEBUG: 'src' package loaded from: {src.__file__}")

async def main():
    print("🧠 [CH Archival Test] Simulating Deep Brain Archival...")
    await neo4j_client.connect()
    ch_connection.connect()
    
    ORG = f"test_org_{os.urandom(4).hex()}"
    USER = "boss_user"
    UNIQUE_TOPIC = f"Vyapnix Expansion {os.urandom(4).hex()}"
    
    # 1. Create High-Priority Interaction
    print(f"\n--- [STEP 1] Generating Crucial Business Context (Topic: {UNIQUE_TOPIC}) ---")
    res = await graph_orchestrator.sync_interaction_unified(
        user_id=USER,
        org_id=ORG,
        message=f"Let's discuss the {UNIQUE_TOPIC} project.",
        response="Mapping expansion goals.",
        user_role="boss"
    )
    topic_name = res["topic"]
    
    # Force Topic Priority & Pillar to ensure survival
    print(f"DEBUG: Manually setting high priority for {topic_name} in Neo4j...")
    await neo4j_client.run_write(
        "MATCH (t:NeuralTopic {name: $title, org_id: $oid}) "
        "SET t.priority_score = 2.5, t.pillar = 'Goal', t.summary = 'Expansion project summary for Q4.'",
        title=topic_name, oid=ORG
    )
    
    # Find Topic GID
    node = await neo4j_client.run("MATCH (t:NeuralTopic {name: $title, org_id: $oid}) RETURN t.gid as gid, t.summary as sum", title=topic_name, oid=ORG)
    if not node:
        print(f"❌ FAILURE: Could not find NeuralTopic node in Neo4j for {topic_name}")
        return
        
    # GID derivation matching production GraphOrchestrator logic
    topic_id = f"topic_{topic_name.lower().replace(' ', '_')}"
    print(f"✅ Topic Found in Neo4j: {topic_name} (GID: {topic_id})")
    
    # Verify the node with this GID actually exists
    node_check = await neo4j_client.run("MATCH (t:NeuralTopic {gid: $id, org_id: $oid}) RETURN t.gid", id=topic_id, oid=ORG)
    if not node_check:
        # Fallback to name search if GID was different
        print("WARNING: GID mismatch. Using Neo4j lookup...")
        node = await neo4j_client.run("MATCH (t:NeuralTopic {name: $title, org_id: $oid}) RETURN t.gid as gid", title=topic_name, oid=ORG)
        topic_id = node[0]["gid"]
        print(f"✅ Resolved Actual GID: {topic_id}")

    # 2. Trigger Archival
    print(f"\n--- [STEP 2] Triggering Skeleton Archival for {topic_id} in {ORG} ---")
    await metabolism_manager.purge_neuron(topic_id, ORG, "NeuralTopic")
    
    # 3. Verify Neo4j Skeleton
    print("\n--- [STEP 3] Verifying Neo4j Skeleton ---")
    check = await neo4j_client.run(
        "MATCH (t:NeuralTopic {gid: $id}) RETURN t.summary as sum, t.details_purged as purged", 
        id=topic_id
    )
    if check and check[0]["purged"]:
        print(f"🔥 SUCCESS: Neo4j summary cleared. State: {check[0]['sum']}")
    else:
        print("❌ FAILURE: Neo4j Topic was not skeletonized.")

    # 4. Verify ClickHouse Row
    print("\n--- [STEP 4] Verifying ClickHouse Permanent Storage ---")
    rows = vault_search.search(topic_name)
    if rows:
        print(f"🔥 SUCCESS: Found archived summary in ClickHouse Vault: '{rows[0]['title'][:30]}...'")
    else:
        print("❌ FAILURE: Summary not found in new ClickHouse Vault!")

    await neo4j_client.close()
    print("\n🏁 [CH Archival Test] Test complete.")

if __name__ == "__main__":
    asyncio.run(main())
