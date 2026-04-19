"""

    SUCCESS NEURON  Reinforcement Learning From Outcomes      
  Cluaiz Neural OS | neurons/workforce/success.py                
                                                                  
  Role: Specialized Neuron for storing Patterns of Success.       
        Acts as a 'Template' for high-quality future tasks.      

"""

from src.services.neural.neurons.base_neuron import BaseNeuron
from loguru import logger

class SuccessNeuron(BaseNeuron):
    def __init__(self, success_id: str, org_id: str, name: str):
        super().__init__(
            gid=success_id, 
            org_id=org_id, 
            label="SuccessPattern", 
            pillar="Workforce", 
            name=name,
            description=f"Neural Success Template: {name}."
        )

    async def sync_dna(self, output_sample: str, reasoning: str, performance: float = 1.0):
        """
        Syncs specialized Success DNA: Execution samples and logic.
        """
        dna = {
            "execution_outcome_sample": output_sample,
            "success_reasoning_dna": reasoning,
            "final_performance_score": performance,
            "neuron_type": "SUCCESS_REINFORCEMENT"
        }
        
        logger.info(f" [SuccessNeuron] Syncing DNA for {self.name} (Context: {reasoning[:30]}...)")
        await self.sync_to_neo4j(dna=dna)

# Helper
def create_success_neuron(success_id: str, org_id: str, name: str):
    return SuccessNeuron(success_id, org_id, name)
