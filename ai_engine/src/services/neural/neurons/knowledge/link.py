"""

    LINK NEURON  Neural Cross-Referencing Knowledge         
  Cluaiz Neural OS | neurons/knowledge/link.py                  
                                                                  
  Role: Specialized Neuron for establishing relationships between 
        different document regions or knowledge chunks.           

"""

from src.services.neural.neurons.base_neuron import BaseNeuron
from loguru import logger

class LinkNeuron(BaseNeuron):
    def __init__(self, link_id: str, org_id: str):
        super().__init__(
            gid=link_id, 
            org_id=org_id, 
            label="KnowledgeLink", 
            pillar="Cognition", 
            name="Knowledge Cross-Reference",
            description="A neural bridge between two knowledge points."
        )

    async def sync_connection(self, source_gid: str, target_gid: str, strength: float = 0.5, context: str = ""):
        dna = {
            "source_neuron_gid": source_gid,
            "target_neuron_gid": target_gid,
            "connection_weight": strength,
            "contextual_reason": context,
            "neuron_type": "KNOWLEDGE_LINK"
        }
        await self.sync_to_neo4j(dna=dna)

def create_link_neuron(link_id: str, org_id: str):
    return LinkNeuron(link_id, org_id)
