"""

    CULTURE NEURON  Organization Values & Interaction DNA   
  Cluaiz Neural OS | neurons/identity/culture.py                 
                                                                  
  Role: Specialized Neuron for Cultural DNA and Behaviors.        
        Modifiers for the tone of all Workforce agents.          

"""

from src.services.neural.neurons.base_neuron import BaseNeuron
from loguru import logger

class CultureNeuron(BaseNeuron):
    def __init__(self, culture_id: str, org_id: str):
        super().__init__(
            gid=culture_id, 
            org_id=org_id, 
            label="NeuralCulture", 
            pillar="Essence", 
            name="Company Culture DNA",
            description="Operational rules and values defining company behavior."
        )
        self.golden_vault = True

    async def sync_dna(self, values: list, tone_rules: dict, strictness: int):
        """
        Syncs specialized Culture DNA: Values, tone, and strictness rules.
        """
        dna = {
            "core_organizational_values": values,
            "interaction_tone_rules": tone_rules,
            "behavioural_strictness": strictness,
            "neuron_type": "CULTURAL_DNA"
        }
        
        logger.info(f" [CultureNeuron] Syncing Cultural DNA (Strictness: {strictness})")
        await self.sync_to_neo4j(dna=dna)

# Helper
def create_culture_neuron(culture_id: str, org_id: str):
    return CultureNeuron(culture_id, org_id)
