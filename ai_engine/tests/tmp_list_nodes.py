
import asyncio
import os
from dotenv import load_dotenv
import sys

sys.path.append(os.path.join(os.getcwd(), "src"))
from database.neo4j_client import neo4j_client

async def list_nodes():
    load_dotenv()
    await neo4j_client.connect()
    
    if not neo4j_client.enabled:
        print("❌ Neo4j not enabled.")
        return

    print("--- 🕸️ ALL NODES IN NEO4J ---")
    cypher = "MATCH (n) RETURN n, labels(n) as labels LIMIT 100"
    try:
        res = await neo4j_client.run(cypher)
        for r in res:
            n = r["n"]
            labels = r["labels"]
            props = dict(n)
            print(f"Node: {labels} | Props: {props}")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        await neo4j_client.close()

if __name__ == "__main__":
    asyncio.run(list_nodes())
