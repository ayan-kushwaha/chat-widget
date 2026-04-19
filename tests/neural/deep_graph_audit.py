import asyncio
import os
import sys
from loguru import logger

# Add workspace root
sys.path.append(os.getcwd())

from src.database.neo4j_client import neo4j_client

async def run_audit(org_id: str):
    print(f"🕵️ [Deep Audit] Scanning Neural Topology for Org: {org_id}")
    await neo4j_client.connect()
    
    # 1. Label Count
    print("\n--- [Nodes by Type] ---")
    res = await neo4j_client.run(
        "MATCH (n) WHERE n.org_id = $oid RETURN labels(n)[0] as label, count(n) as count ORDER BY count DESC",
        oid=org_id
    )
    for r in res:
        print(f"  {r['label']}: {r['count']}")
    
    # 2. Relationship Analysis
    print("\n--- [Relationships] ---")
    res = await neo4j_client.run(
        "MATCH (n)-[r]->(m) WHERE n.org_id = $oid RETURN type(r) as type, count(r) as count ORDER BY count DESC",
        oid=org_id
    )
    for r in res:
        print(f"  {r['type']}: {r['count']}")

    # 3. Orphan Detection
    print("\n--- [Orphan Node Check] (Nodes with 0 relationships) ---")
    res = await neo4j_client.run(
        "MATCH (n) WHERE n.org_id = $oid AND NOT (n)-[]-() RETURN labels(n)[0] as label, n.gid as gid, n.name as name LIMIT 10",
        oid=org_id
    )
    if not res:
        print("✅ No orphaned nodes found! Every neuron is wired.")
    else:
        print(f"⚠️ FOUND {len(res)} ORPHANED NODES (Top 10):")
        for r in res:
            print(f"  [{r['label']}] {r['gid']} - {r['name']}")

    # 4. Cleanup Logic Check (Simulate Knowledge Deletion)
    # If a source is deleted, related neurons should be disconnected or handled.
    # Note: Cluaiz uses 'Metabolic Decay' rather than hard deletion for neurons.
    # We check if priority_score exists.
    print("\n--- [Metabolism Audit] ---")
    res = await neo4j_client.run(
        "MATCH (n) WHERE n.org_id = $oid RETURN avg(n.priority_score) as avg_priority, count(n) as count",
        oid=org_id
    )
    print(f"  System Vitality (Avg Priority): {res[0]['avg_priority']:.2f}")

    await neo4j_client.close()

if __name__ == "__main__":
    ORG_ID = "696a00efe595a3427ba19863"
    asyncio.run(run_audit(ORG_ID))
