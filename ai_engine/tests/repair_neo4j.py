import asyncio
import os
import sys

# Set environment variables for Neo4j
os.environ["NEO4J_URI"] = "bolt://localhost:7687"
os.environ["NEO4J_USER"] = "neo4j"
os.environ["NEO4J_PASSWORD"] = "cluaiz_neural_os"

# Add current directory to sys.path
sys.path.append(os.getcwd())

from src.database.neo4j_client import neo4j_client

async def repair():
    print("Connecting to Neo4j...")
    await neo4j_client.connect()
    
    org_id = "696a00efe595a3427ba19863"
    print(f"Repairing data for Org: {org_id}")

    # 1. Fix Org Name
    print("Fixing Org name...")
    await neo4j_client.run(
        "MATCH (o:Org {org_id: $org_id}) SET o.name = 'Cluaiz Neural Core'",
        org_id=org_id
    )

    # 2. Link Orphans (Entities with source_doc_id but no MENTIONS link)
    print("Linking orphaned entities to parent documents...")
    # This query finds any node that has source_doc_id but no incoming MENTIONS relation from that doc
    repair_query = """
    MATCH (n {org_id: $org_id})
    WHERE n.source_doc_id IS NOT NULL AND NOT (n.label IN ['Org', 'Document'])
    MATCH (d:Document {doc_id: n.source_doc_id})
    MERGE (d)-[r:MENTIONS]->(n)
    ON CREATE SET r.repaired = true, r.org_id = $org_id
    RETURN count(r) as repaired_count
    """
    res = await neo4j_client.run(repair_query, org_id=org_id)
    count = res[0]['repaired_count'] if res else 0
    print(f"Repaired {count} relationships.")

    await neo4j_client.close()
    print("Repair complete!")

if __name__ == "__main__":
    asyncio.run(repair())
