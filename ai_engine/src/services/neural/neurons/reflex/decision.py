"""

    DECISION NEURON  The Reflex Gate for Fast Routing        
  Cluaiz Neural OS | neurons/reflex/decision.py                  
                                                                  
  Role: Specialized Neuron for 0.8b Decision Gates.               
        Linked to Paths, Triggers, and Success Patterns.         

"""

from src.services.neural.neurons.base_neuron import BaseNeuron
from loguru import logger

class DecisionNeuron(BaseNeuron):
    def __init__(self, decision_id: str, org_id: str):
        super().__init__(
            gid=decision_id, 
            org_id=org_id, 
            label="DecisionGate", 
            pillar="Reflex", 
            name=f"Gate: {decision_id[:8]}",
            description="A logical decision path for Shadow Boss."
        )

    async def sync_dna(self, condition: str, paths: list, logic: str):
        """
        Syncs specialized Decision DNA: Logic paths and branching conditions.
        """
        dna = {
            "decision_condition": condition,
            "available_paths": paths,
            "neuron_logic_dna": logic,
            "neuron_type": "DECISION_REFLEX"
        }
        
        logger.info(f" [DecisionNeuron] Syncing DNA for {self.gid} (Condition: {condition})")
        await self.sync_to_neo4j(dna=dna)

# Helper
def create_decision_neuron(decision_id: str, org_id: str):
    return DecisionNeuron(decision_id, org_id)
