import asyncio
import os
import sys
import io

# Force UTF-8 for Windows redirection
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Set environment variables for Neo4j if not already in env
os.environ["NEO4J_URI"] = "bolt://localhost:7687"
os.environ["NEO4J_USER"] = "neo4j"
os.environ["NEO4J_PASSWORD"] = "cluaiz_neural_os"

# Add current directory to sys.path to allow imports from src
sys.path.append(os.getcwd())

from src.database.neo4j_client import neo4j_client

async def inspect():
    print("Connecting to Neo4j...")
    await neo4j_client.connect()
    if not neo4j_client.enabled:
        print("Neo4j not enabled or connected. Check if Neo4j is running.")
        return

    print("\n--- 1. ORG_ID FREQUENCY (Top 5) ---")
    freqs = await neo4j_client.run("MATCH (n) RETURN n.org_id as org_id, count(n) as count ORDER BY count DESC LIMIT 5")
    for f in freqs:
        print(f"Org ID: {f['org_id']} | Count: {f['count']}")

    print("\n--- 2. ALL ORG NODES ---")
    org_nodes = await neo4j_client.run("MATCH (o:Org) RETURN o.org_id as org_id, o.name as name")
    if not org_nodes:
        print("No Org nodes found!")
    for o in org_nodes:
        print(f"Org ID: {o['org_id']} | Name: {o['name']}")

    print("\n--- 3. SAMPLE NODES (LIMIT 20) ---")
    nodes = await neo4j_client.run("MATCH (n) RETURN n, labels(n) as labels LIMIT 20")
    for r in nodes:
        node = r['n']
        labels = r['labels']
        props = dict(node.items())
        # Try to find a display name
        display_name = props.get('name') or props.get('title') or props.get('filename') or "N/A"
        print(f"Labels: {labels} | Name: {display_name} | Props: {props}")

    print("\n--- 4. ALL RELATIONSHIPS (Detailed) ---")
    # Using more detailed inspection
    rels = await neo4j_client.run("MATCH (a)-[r]->(b) RETURN a, r, b LIMIT 5")
    if not rels:
        print("No relationships found!")
    for r_pack in rels:
        a = r_pack['a']
        r = r_pack['r']
        b = r_pack['b']
        
        # Check how to get IDs
        a_id = getattr(a, 'element_id', getattr(a, 'id', 'NO_ID'))
        b_id = getattr(b, 'element_id', getattr(b, 'id', 'NO_ID'))
        
        # Check relationship nodes
        r_start_id = getattr(r.start_node, 'element_id', getattr(r.start_node, 'id', 'ERR'))
        r_end_id = getattr(r.end_node, 'element_id', getattr(r.end_node, 'id', 'ERR'))
        
        print(f"RelType: {r.type} | r.start: {r_start_id} | r.end: {r_end_id} | Match: {a_id == r_start_id}")

    print("\n--- 5. ORPHANED NODES ---")
    orphans = await neo4j_client.run("MATCH (n) WHERE NOT (n)--() RETURN labels(n) as labels, n.name as name LIMIT 10")
    for o in orphans:
        print(f"Orphan Node: {o['labels']} | Name: {o['name']}")

    await neo4j_client.close()

if __name__ == "__main__":
    try:
        asyncio.run(inspect())
    except Exception as e:
        print(f"Error during inspection: {e}")
