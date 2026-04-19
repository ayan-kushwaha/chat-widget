import asyncio
import os
import sys
from loguru import logger

# Add workspace root
sys.path.append(os.getcwd())

from src.database.neo4j_client import neo4j_client

async def run():
    await neo4j_client.connect()
    # Find all nodes for the integrity org
    res = await neo4j_client.run("MATCH (n) WHERE n.org_id = 'integrity_org_101' RETURN labels(n), n.gid, n.node_id, keys(n)")
    print("\n--- NODES FOUND ---")
    for r in res:
        print(f"Labels: {r['labels(n)']}, GID: {r['n.gid']}, NODE_ID: {r['n.node_id']}, Keys: {r['keys(n)']}")
    
    # Find all relationships
    res = await neo4j_client.run("MATCH (n)-[r]->(m) WHERE n.org_id = 'integrity_org_101' RETURN type(r)")
    print("\n--- RELATIONSHIPS FOUND ---")
    for r in res:
        print(f"Type: {r['type(r)']}")
        
    await neo4j_client.close()

if __name__ == "__main__":
    asyncio.run(run())
