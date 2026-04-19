"""

    SUBCONSCIOUS GDS ENGINE  The Mathematical Core             
  Cluaiz Neural OS | services/neural/gds/engine.py                
                                                                  
  Role: Master bridge to Neo4j Graph Data Science (GDS).          
        Manages 'In-Memory Projected Graphs' to ensure that all   
        algorithmic thoughts (PageRank, FastRP) run at <100ms.    

"""

import os
from loguru import logger
from typing import Optional

try:
    # Requires: pip install graphdatascience
    # The GDS plugin must be installed on the Neo4j Server
    from graphdatascience import GraphDataScience
    HAS_GDS_CLIENT = True
except ImportError:
    HAS_GDS_CLIENT = False

class SubconsciousGDSEngine:
    """
    The engine that pushes the Neo4j graph into RAM for extreme speed mathematics.
    """
    def __init__(self):
        # Fetching auth from environment to connect to GDS
        self.uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        self.user = os.getenv("NEO4J_USER", "neo4j")
        self.password = os.getenv("NEO4J_PASSWORD", "password")
        self.gds = None
        self._connect()

    def _connect(self):
        """Initializes the connection to the GDS Plugin running on Neo4j."""
        if not HAS_GDS_CLIENT:
            logger.warning(" [GDS] graphdatascience pip package missing. Run: pip install graphdatascience")
            return
            
        try:
            self.gds = GraphDataScience(self.uri, auth=(self.user, self.password))
            logger.info(" [GDS] Successfully connected to Neo4j Graph Data Science (Mathematical Core).")
        except Exception as e:
            logger.error(f" [GDS] Failed to connect to GDS: {e}")

    def project_subconscious_graph(self, org_id: str, projection_name: str = "SubconsciousGraph"):
        """
        CRITICAL PERFORMANCE HOOK:
        Creates an In-Memory Projected Graph for a specific organization.
        This pulls nodes (Neurons) and relationships (Wiring) into RAM.
        Without this, GDS math would hit the disk and delay decisions.
        """
        if not self.gds:
            logger.error(" [GDS] Client offline. Cannot project graph.")
            return None

        # Append org_id to make it specific
        full_proj_name = f"{projection_name}_{org_id}"
        logger.info(f" [GDS] Projecting In-Memory Topology '{full_proj_name}' for Org: {org_id}...")
        
        # 1. Self-Healing: Drop existing projection if it's stale
        try:
            exists = self.gds.graph.exists(full_proj_name)
            if exists.get('exists', False):
                G_old = self.gds.graph.get(full_proj_name)
                self.gds.graph.drop(G_old)
                logger.debug(f" [GDS] Dropped stale neural projection: {full_proj_name}")
        except Exception as e:
            logger.warning(f" [GDS] Cleanup of old projection failed (Safe to ignore if first run): {e}")

        # 2. Cypher Native Projection: Pull only what we need into RAM
        try:
            node_query = f"MATCH (n) WHERE n.org_id = '{org_id}' RETURN id(n) AS id, labels(n) AS labels"
            rel_query = f"""
                MATCH (s)-[r]->(t) 
                WHERE s.org_id = '{org_id}' AND t.org_id = '{org_id}' 
                RETURN id(s) AS source, id(t) AS target, type(r) AS type, coalesce(r.weight, 1.0) AS weight
            """
            
            # Using the gds python client to project via Cypher
            G, result = self.gds.graph.project.cypher(
                full_proj_name,
                node_query,
                rel_query
            )
            
            logger.info(f" [GDS] Subconscious Graph in RAM! Neurons: {result['nodeCount']}, Connections: {result['relationshipCount']}")
            return G
            
        except Exception as e:
            logger.error(f" [GDS] Failed to project in-memory mathematical graph: {e}")
            return None

# Singleton Engine
gds_engine = SubconsciousGDSEngine()
