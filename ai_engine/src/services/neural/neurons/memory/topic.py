"""

    TOPIC CLUSTER  Neural Mapping of Conversation Themes    
  Cluaiz Neural OS | neurons/memory/topic.py                    
                                                                  
  Role: Specialized Neuron for grouping related Chat Episodes.    
        Acts as a 'Theme' Node for long-term memory navigation.   

"""

from src.services.neural.neurons.base_neuron import BaseNeuron
from loguru import logger

class TopicCluster(BaseNeuron):
    def __init__(self, topic_id: str, org_id: str, name: str):
        super().__init__(
            gid=topic_id, 
            org_id=org_id, 
            label="NeuralTopic", 
            pillar="Memory", 
            name=name,
            description=f"Neural Topic Map: {name}."
        )

    async def sync_dna(self, theme_keywords: list, episode_gids: list, importance: float = 0.5):
        """
        Syncs specialized Topic DNA: Keywords, group members, and importance.
        """
        dna = {
            "topic_theme_keywords": theme_keywords,
            "member_episode_gids": episode_gids,
            "thematic_importance": importance,
            "neuron_type": "TEMPORAL_TOPIC"
        }
        
        logger.info(f" [TopicCluster] Grouping {len(episode_gids)} episodes into theme: {self.name}.")
        await self.sync_to_neo4j(dna=dna)

# Helper
def create_topic_cluster(topic_id: str, org_id: str, name: str):
    return TopicCluster(topic_id, org_id, name)
