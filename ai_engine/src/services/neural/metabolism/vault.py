"""

    GOLDEN VAULT  Neural Persistence & Protection              
  Cluaiz Neural OS | services/neural/metabolism/vault.py          
                                                                  
  Role: Mark nodes as 'Indestructible' Golden Vault entries.      
        Immune to Janitor Cleanup (Metabolic Decay).              

"""

from loguru import logger
from src.database.neo4j_client import neo4j_client

class GoldenVaultManager:
    
    async def protect_node(self, node_id: str, org_id: str, label: str = "KnowledgeChunk"):
        """
        Marks a specific node as part of the Golden Vault.
        """
        id_key = self._get_id_key(label)
        logger.info(f" [Vault] Protecting Node: {node_id} (Org: {org_id})")
        
        try:
            await neo4j_client.run(
                f"""
                MATCH (n {{ {id_key}: $node_id, org_id: $org_id }})
                SET n.golden_vault = true,
                    n.priority_score = 1.0,
                    n.decay_exempt = true
                """,
                node_id=node_id, org_id=org_id
            )
            logger.info(f" [Vault] Node {node_id} is now INDESTRUCTIBLE.")
        except Exception as e:
            logger.error(f" [Vault] Failed protecting node {node_id}: {e}")

    def _get_id_key(self, label: str) -> str:
        mapping = {
            "Agent": "agent_id", "Skill": "skill_id", "Goal": "goal_id",
            "Document": "doc_id", "Employee": "emp_id", "Focus": "focus_id",
            "Episode": "episode_id", "History": "history_id"
        }
        return mapping.get(label.capitalize(), "node_id")

vault = GoldenVaultManager()
