"""

    EPISODE NEURON  Individual Chat Interaction DNA            
  Cluaiz Neural OS | neurons/memory/episode.py                   
                                                                  
  Role: Specialized Neuron for storing a single chat turn.         
        Links User, Assistant, and Topics into a chain.          

"""
from src.services.neural.neurons.base_neuron import BaseNeuron
from loguru import logger

class EpisodeNeuron(BaseNeuron):
    def __init__(self, episode_id: str, org_id: str, role: str):
        super().__init__(
            gid=episode_id, 
            org_id=org_id, 
            label="Episode", 
            pillar="Memory", 
            name=f"Chat Turn ({role})",
            description=f"A single interaction episode for role: {role}."
        )

    async def sync_dna(self, role: str, topic_gid: str = None, message_length: int = 0, sentiment: str = "neutral", weight: float = 1.0, mongo_ids: list[str] = None):
        """
        Syncs specialized Episode DNA: Role, Topic links, Emotional Weight, and raw DB pointers.
        """
        dna = {
            "role": role,
            "topic_gid": topic_gid,
            "message_length": message_length,
            "sentiment": sentiment,
            "interaction_weight": weight,
            "mongo_ids": mongo_ids or [],
            "neuron_type": "TEMPORAL_EPISODE"
        }
        
        logger.info(f" [EpisodeNeuron] Syncing Chat Episode for {self.gid} (Role: {role})")
        await self.sync_to_neo4j(dna=dna)

# Helper
def create_episode_neuron(episode_id: str, org_id: str, role: str):
    return EpisodeNeuron(episode_id, org_id, role)
