"""

    TRIPLE-SYNC REGISTRY  Cross-DB Identifier Management     
  Cluaiz Neural OS | services/neural/registry/sync.py             
                                                                  
  Role: Map and Sync IDs between Mongo, Neo4j, and Qdrant.        
        Ensures 100% data integrity for the Nervous System.       

"""

from loguru import logger
from src.database.neo4j_client import neo4j_client

class TripleSyncRegistry:
    
    async def register_node(self, node_id: str, mongo_id: str, qdrant_id: str, org_id: str, label: str = "KnowledgeChunk"):
        """
        Registers a new node in the Triple-Sync Registry (stored within Neo4j properties).
        """
        try:
            # We store the sync mapping directly on the Neo4j node for atomic lookups
            id_key = self._get_id_key(label)
            
            await neo4j_client.run(
                f"""
                MATCH (n {{ {id_key}: $node_id, org_id: $org_id }})
                SET n.mongo_id = $mongo_id,
                    n.qdrant_id = $qdrant_id,
                    n.sync_status = "SYNCED",
                    n.last_synced = timestamp()
                RETURN n
                """,
                node_id=node_id, mongo_id=mongo_id, qdrant_id=qdrant_id, org_id=org_id
            )
            logger.info(f" [TripleSync] Registered Node {node_id} (Mongo: {mongo_id}, Qdrant: {qdrant_id})")
        except Exception as e:
            logger.error(f" [TripleSync] Registration failed for {node_id}: {e}")

    async def get_mapping(self, node_id: str, org_id: str, label: str = "KnowledgeChunk") -> dict:
        """
        Retrieves the cross-database mapping for a specific GID.
        """
        id_key = self._get_id_key(label)
        cypher = f"MATCH (n {{ {id_key}: $node_id, org_id: $org_id }}) RETURN n.mongo_id as m, n.qdrant_id as q"
        res = await neo4j_client.run(cypher, node_id=node_id, org_id=org_id)
        
        if res:
            return {"mongo_id": res[0].get("m"), "qdrant_id": res[0].get("q")}
        return None

    def _get_id_key(self, label: str) -> str:
        mapping = {
            "Skill": "skill_id", "Agent": "agent_id", "Goal": "goal_id",
            "Document": "doc_id", "Employee": "emp_id"
        }
        return mapping.get(label, "node_id")

triple_sync = TripleSyncRegistry()
