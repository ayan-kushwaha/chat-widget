import sys
import asyncio
sys.path.append('c:/Users/Aryan/my/cluaiz/ai_engine')
from dotenv import load_dotenv
load_dotenv('c:/Users/Aryan/my/cluaiz/ai_engine/.env')

from src.database.neo4j_client import neo4j_client

async def clean_graph():
    print("Connecting to Neuromorphic DB...")
    await neo4j_client.connect()
    
    print("Purging rogue CONNECTED_TO relationships...")
    await neo4j_client.run_write("MATCH ()-[r:CONNECTED_TO]->() DELETE r")
    
    print("Purging isolated Agent nodes from broken tests...")
    await neo4j_client.run_write("MATCH (n:Agent) WHERE NOT (n)--() DELETE n")
    
    print("Purging isolated Department nodes...")
    await neo4j_client.run_write("MATCH (n:Department) WHERE NOT (n)--() DELETE n")
    
    print("Purging isolated Boss nodes...")
    await neo4j_client.run_write("MATCH (n:Boss) WHERE NOT (n)--() DELETE n")
    
    print("Purging isolated Goal nodes...")
    await neo4j_client.run_write("MATCH (n:Goal) WHERE NOT (n)--() DELETE n")
    
    print("Purging isolated Skill nodes...")
    await neo4j_client.run_write("MATCH (n:Skill) WHERE NOT (n)--() DELETE n")

    print("✅ Graph Scrubbed Successfully.")
    await neo4j_client.close()

if __name__ == "__main__":
    asyncio.run(clean_graph())
