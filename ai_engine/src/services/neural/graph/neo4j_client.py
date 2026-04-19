"""

    NEO4J PHYSICAL CONNECTOR  Database Wiring                  
  Cluaiz Neural OS | services/neural/graph/neo4j_client.py        
                                                                  
  Role: The central nervous column connecting the Application     
        API layer to the physical Neo4j Graph Database.           

"""

import os
from loguru import logger
from typing import List, Dict, Optional, Any

try:
    # Requires: pip install neo4j
    from neo4j import GraphDatabase
    HAS_NEO4J = True
except ImportError:
    HAS_NEO4J = False

class Neo4jClient:
    """
    Singleton connection pooler for the Neo4j Database.
    Ensures that queries from Onboarding, Chat, and Skills use the same optimized connection.
    """
    def __init__(self):
        self.enabled = HAS_NEO4J
        self.uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        self.user = os.getenv("NEO4J_USER", "neo4j")
        self.password = os.getenv("NEO4J_PASSWORD", "cluaiz_neural_os") # Fixed mismatch
        self.driver = None

    def connect(self) -> bool:
        """Initializes the resilient connection to the graph."""
        if not HAS_NEO4J:
            logger.error(" [Neo4j] neo4j pip package missing. Please install.")
            return False
            
        try:
            self.driver = GraphDatabase.driver(self.uri, auth=(self.user, self.password))
            # Verify connectivity
            self.driver.verify_connectivity()
            logger.info(" [Neo4j] Connected successfully to Physical Graph Database.")
            return True
        except Exception as e:
            logger.error(f" [Neo4j] Failed to connect: {e}")
            return False

    def close(self):
        """Cleanly severs the database link."""
        if self.driver:
            self.driver.close()
            logger.info(" [Neo4j] Connection closed.")

    def execute_query(self, query: str, parameters: Optional[Dict] = None) -> List[Dict[str, Any]]:
        """
        Executes a Cypher query and returns the structural records.
        """
        if not self.driver:
            logger.warning(" [Neo4j] Driver offline. Attempting to connect...")
            if not self.connect():
                return []
                
        # Safeguard parameters
        params = parameters or {}
        
        try:
            with self.driver.session() as session:
                result = session.run(query, params)
                return [record.data() for record in result]
        except Exception as e:
            logger.error(f" [Neo4j] Cypher Transaction Failed: {e}")
            logger.debug(f"Query: {query} | Params: {params}")
            return []

# The Singleton Instance.
neo4j_client = Neo4jClient()

# It's usually better to connect on-demand or during app startup.
# We will leave initialization to the calling services, but provide a quick connect here.
# neo4j_client.connect()
