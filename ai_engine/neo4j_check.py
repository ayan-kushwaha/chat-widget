import sys
sys.path.append('c:/Users/Aryan/my/cluaiz/ai_engine')
from src.services.neural.graph.neo4j_client import neo4j_client

def test():
    print("Testing Neo4j Context:")
    # Prevent driver offline warning by forcibly connecting
    neo4j_client.connect()
    
    # Get node counts
    q_nodes = "MATCH (n) RETURN labels(n)[0] AS label, count(n) AS count"
    res_nodes = neo4j_client.execute_query(q_nodes)
    print("----- NODES -----")
    if res_nodes:
        for r in res_nodes:
            print(f"{r['label']}: {r['count']}")
            
    # Get edge counts
    q_edges = "MATCH ()-[r]->() RETURN type(r) AS rel_type, count(r) AS count"
    res_edges = neo4j_client.execute_query(q_edges)
    print("----- EDGES -----")
    if res_edges:
        for r in res_edges:
            print(f"{r['rel_type']}: {r['count']}")
            
    # Check specific Agent relationships
    q_agent = "MATCH (a:Agent)-[r]-(m) RETURN a.name, type(r), labels(m)[0]"
    res_agent = neo4j_client.execute_query(q_agent)
    print("----- AGENT WIRING -----")
    if res_agent:
        for r in res_agent:
            print(f"Agent '{r['a.name']}' -[{r['type(r)']}]-> {r['labels(m)[0]']}")
    else:
        print("NO AGENT RELATIONSHIPS FOUND!")

if __name__ == "__main__":
    test()
