"""

    STRATEGY PATH  Multi-Step Neural Coordination DNA        
  Cluaiz Neural OS | neurons/reflex/strategy.py                  
                                                                  
  Role: Specialized Neuron for complex, long-term Strategic Paths. 
        Coordinates multiple agents, routines, and handovers.    

"""

from src.services.neural.neurons.base_neuron import BaseNeuron
from loguru import logger

class StrategyPath(BaseNeuron):
    def __init__(self, strategy_id: str, org_id: str, name: str):
        super().__init__(
            gid=strategy_id, 
            org_id=org_id, 
            label="NeuralStrategy", 
            pillar="Reflex", 
            name=name,
            description=f"Neural Strategy Path: {name}."
        )

    async def sync_dna(self, steps: list, target_vision_gid: str, priority: int = 5):
        """
        Syncs specialized Strategy DNA: Steps, target vision, and execution priority.
        """
        dna = {
            "strategic_execution_steps": steps,
            "target_vision_node_gid": target_vision_gid,
            "execution_priority_rank": priority,
            "neuron_type": "STRATEGIC_PLAN"
        }
        
        logger.info(f" [StrategyPath] Syncing Strategy: {self.name} (Steps: {len(steps)})")
        await self.sync_to_neo4j(dna=dna)

# Helper
def create_strategy_path(strategy_id: str, org_id: str, name: str):
    return StrategyPath(strategy_id, org_id, name)
