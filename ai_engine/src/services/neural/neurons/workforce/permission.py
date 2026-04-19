"""

    PERMISSION NEURON  Neural Security & Access Control DNA 
  Cluaiz Neural OS | neurons/workforce/permission.py             
                                                                  
  Role: Specialized Neuron for managing Agent Access Levels.       
        Linked to Agents, Topics, and Private Knowledge.         

"""

from src.services.neural.neurons.base_neuron import BaseNeuron
from loguru import logger

class PermissionNeuron(BaseNeuron):
    def __init__(self, permission_id: str, org_id: str):
        super().__init__(
            gid=permission_id, 
            org_id=org_id, 
            label="NeuralPermission", 
            pillar="Workforce", 
            name="Agent Access Control",
            description="Neural node for role-based access control."
        )

    async def sync_dna(self, agent_gid: str, allowed_topics: list, restriction_level: int):
        """
        Syncs specialized Permission DNA: Agents, allowed topics, and restrictions.
        """
        dna = {
            "target_agent_gid": agent_gid,
            "allowed_topic_gids": allowed_topics,
            "data_restriction_level": restriction_level,
            "neuron_type": "SECURITY_REFLEX"
        }
        
        logger.info(f" [PermissionNeuron] Syncing Security for {agent_gid} (Level: {restriction_level})")
        await self.sync_to_neo4j(dna=dna)

# Helper
def create_permission_neuron(permission_id: str, org_id: str):
    return PermissionNeuron(permission_id, org_id)
