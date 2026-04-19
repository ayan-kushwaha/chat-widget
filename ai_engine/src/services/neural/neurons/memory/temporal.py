"""

    TEMPORAL LINK  Time-Decaying Neural Connections DNA      
  Cluaiz Neural OS | neurons/memory/temporal.py                  
                                                                  
  Role: Specialized Link Neuron for decaying relationships.       
        Linked to Memory Hub and Metabolic Janitor.              

"""

from src.services.neural.neurons.base_neuron import BaseNeuron
from loguru import logger

class TemporalLink(BaseNeuron):
    def __init__(self, link_id: str, org_id: str):
        super().__init__(
            gid=link_id, 
            org_id=org_id, 
            label="TemporalDecayLink", 
            pillar="Memory", 
            name="Decaying Connection",
            description="A neural relationship that weakens over time."
        )

    async def sync_dna(self, source_gid: str, target_gid: str, decay_constant: float):
        """
        Syncs specialized Temporal DNA: decay rates and initial weights.
        """
        dna = {
            "source_node_gid": source_gid,
            "target_node_gid": target_gid,
            "decay_constant_lambda": decay_constant,
            "current_link_weight": 1.0,
            "neuron_type": "TEMPORAL_DECAY"
        }
        
        logger.info(f" [TemporalLink] Syncing Decay: {source_gid} <- {decay_constant} -> {target_gid}")
        await self.sync_to_neo4j(dna=dna)

# Helper
def create_temporal_link(link_id: str, org_id: str):
    return TemporalLink(link_id, org_id)
