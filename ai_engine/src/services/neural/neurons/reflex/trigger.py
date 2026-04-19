"""

    TRIGGER NEURON  Instant Neural Reflexes & Action Paths 
  Cluaiz Neural OS | neurons/reflex/trigger.py                   
                                                                  
  Role: Specialized Neuron for instant Keyword/Event firing.      
        Connects User Input directly to specialized Reflexes.    

"""

from src.services.neural.neurons.base_neuron import BaseNeuron
from loguru import logger

class TriggerNeuron(BaseNeuron):
    def __init__(self, trigger_id: str, org_id: str, name: str):
        super().__init__(
            gid=trigger_id, 
            org_id=org_id, 
            label="NeuralTrigger", 
            pillar="Reflex", 
            name=name,
            description=f"Neural Instant Trigger: {name}."
        )

    async def sync_dna(self, keyword: str, action_target_gid: str, priority_boost: float = 0.5):
        """
        Syncs specialized Trigger DNA: Keywords, target path, and priority.
        """
        dna = {
            "trigger_keyword": keyword.lower(),
            "target_action_gid": action_target_gid,
            "reflex_priority_boost": priority_boost,
            "neuron_type": "INSTANT_REFLEX"
        }
        
        logger.info(f" [TriggerNeuron] Syncing Reflex: '{keyword}' -> {action_target_gid}")
        await self.sync_to_neo4j(dna=dna)

# Helper
def create_trigger_neuron(trigger_id: str, org_id: str, name: str):
    return TriggerNeuron(trigger_id, org_id, name)
