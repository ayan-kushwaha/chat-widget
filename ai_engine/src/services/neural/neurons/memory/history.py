"""

    HISTORY ANCHOR  Temporal Contextualization DNA            
  Cluaiz Neural OS | neurons/memory/history.py                  
                                                                  
  Role: Specialized Neuron for marking specific Points in Time.    
        Connects historical events to active neural paths.        

"""

from src.services.neural.neurons.base_neuron import BaseNeuron
from loguru import logger

class HistoryAnchor(BaseNeuron):
    def __init__(self, anchor_id: str, org_id: str, name: str):
        super().__init__(
            gid=anchor_id, 
            org_id=org_id, 
            label="NeuralAnchor", 
            pillar="Memory", 
            name=name,
            description=f"Neural Time Marker: {name}."
        )

    async def sync_dna(self, timestamp: int, relevance_context: str, associated_topics: list):
        """
        Syncs specialized History DNA: Timestamps, context, and related topics.
        """
        dna = {
            "anchor_timestamp": timestamp,
            "temporal_relevance_tag": relevance_context,
            "associated_topic_gids": associated_topics,
            "neuron_type": "HISTORICAL_ANCHOR"
        }
        
        logger.info(f" [HistoryAnchor] Marking time point: {self.name} (Context: {relevance_context})")
        await self.sync_to_neo4j(dna=dna)

# Helper
def create_history_anchor(anchor_id: str, org_id: str, name: str):
    return HistoryAnchor(anchor_id, org_id, name)
