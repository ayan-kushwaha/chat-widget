
import asyncio
import os
from dotenv import load_dotenv
import sys

# Add src to path
sys.path.append(os.path.join(os.getcwd(), "src"))

from database.neo4j_client import neo4j_client

async def cleanup():
    print("🕸️ Starting Neo4j Cleanup...")
    load_dotenv()
    await neo4j_client.connect()
    
    if not neo4j_client.enabled:
        print("❌ Neo4j not enabled or connected.")
        return

    # 1. Delete ALL nodes containing 'Hardware' (case-insensitive)
    cypher_hw = """
    MATCH (n)
    WHERE toLower(n.name) CONTAINS 'hardware' 
       OR toLower(n.title) CONTAINS 'hardware'
       OR toLower(n.filename) CONTAINS 'hardware'
    DETACH DELETE n
    RETURN count(n) as deleted_count
    """
    
    # 2. Delete ALL orphaned nodes (except Organization)
    cypher_orphaned = """
    MATCH (n)
    WHERE NOT (n)--() AND labels(n)[0] <> 'Organization'
    DELETE n
    RETURN count(n) as o_count
    """
    
    try:
        res_hw = await neo4j_client.run(cypher_hw)
        res_o = await neo4j_client.run(cypher_orphaned)
        
        count_hw = res_hw[0].get("deleted_count", 0) if res_hw else 0
        count_o = res_o[0].get("o_count", 0) if res_o else 0
        
        print(f"✅ Deleted {count_hw} hardware nodes and {count_o} orphaned nodes.")
    except Exception as e:
        print(f"❌ Cleanup failed: {e}")
    finally:
        await neo4j_client.close()

if __name__ == "__main__":
    asyncio.run(cleanup())
