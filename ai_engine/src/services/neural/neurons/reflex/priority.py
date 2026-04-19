"""

    PRIORITY NODE  Neural Ranking & Dynamic Urgency DNA       
  Cluaiz Neural OS | neurons/reflex/priority.py                  
                                                                  
  Role: Specialized Neuron for managing Task & Data Priority.      
        Acts as a Weight-Modifier for Graph Search & UI.         

"""

from src.services.neural.neurons.base_neuron import BaseNeuron
from loguru import logger

class PriorityNode(BaseNeuron):
    def __init__(self, priority_id: str, org_id: str):
        super().__init__(
            gid=priority_id, 
            org_id=org_id, 
            label="NeuralPriority", 
            pillar="Reflex", 
            name="Strategic Priority Map",
            description="Neural node for ranking importance across hubs."
        )

    async def sync_dna(self, urgency_rank: int, user_importance: float, decay_impact: float):
        """
        Syncs specialized Priority DNA: Urgency ranks and importance weights.
        """
        dna = {
            "dynamic_urgency_rank": urgency_rank,
            "explicit_importance_weight": user_importance,
            "metabolic_decay_impact": decay_impact,
            "neuron_type": "STRATEGIC_REFLEX"
        }
        
        logger.info(f" [PriorityNode] Syncing Priority for {self.gid} (Rank: {urgency_rank})")
        await self.sync_to_neo4j(dna=dna)

# Helper
def create_priority_node(priority_id: str, org_id: str):
    return PriorityNode(priority_id, org_id)
