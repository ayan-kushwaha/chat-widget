"""

    HANDOVER REFLEX  Multi-Agent Collaboration Bridge        
  Cluaiz Neural OS | neurons/workforce/handover.py               
                                                                  
  Role: Specialized Neuron for Agent-to-Agent task transfer.      
        Acts as a 'Contract' for delivering data packets.        

"""

from src.services.neural.neurons.base_neuron import BaseNeuron
from loguru import logger

class HandoverReflex(BaseNeuron):
    def __init__(self, handover_id: str, org_id: str):
        super().__init__(
            gid=handover_id, 
            org_id=org_id, 
            label="HandoverProtocol", 
            pillar="Workforce", 
            name=f"Bridge: {handover_id[:8]}",
            description="A neural bridge for multi-agent collaboration."
        )

    async def sync_dna(self, source_agent_id: str, target_agent_id: str, payload_schema: dict):
        """
        Syncs specialized Handover DNA: Source, Target, and Data schemas.
        """
        dna = {
            "source_agent_gid": source_agent_id,
            "target_agent_gid": target_agent_id,
            "payload_data_contract": payload_schema,
            "neuron_type": "COLLABORATION_REFLEX"
        }
        
        logger.info(f" [HandoverReflex] Syncing Bridge: {source_agent_id} -> {target_agent_id}")
        await self.sync_to_neo4j(dna=dna)

# Helper
def create_handover_reflex(handover_id: str, org_id: str):
    return HandoverReflex(handover_id, org_id)
