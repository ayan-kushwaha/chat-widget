"""

    HANDOVER GATE  Quality Control & Protocol Validation    
  Cluaiz Neural OS | neurons/reflex/handover_gate.py              
                                                                  
  Role: Specialized Neuron for validating Task Handover Quality.   
        Acts as a 'Gatekeeper' between AI Agents.                

"""

from src.services.neural.neurons.base_neuron import BaseNeuron
from loguru import logger

class HandoverGate(BaseNeuron):
    def __init__(self, gate_id: str, org_id: str):
        super().__init__(
            gid=gate_id, 
            org_id=org_id, 
            label="NeuralGate", 
            pillar="Reflex", 
            name=f"Gate: {gate_id[:8]}",
            description="Neural Gate for task quality validation."
        )

    async def sync_dna(self, validation_rules: list, threshold: float):
        """
        Syncs specialized Gate DNA: Rules and opening thresholds.
        """
        dna = {
            "validation_logic_rules": validation_rules,
            "gate_opening_threshold": threshold,
            "neuron_type": "QUALITY_REFLEX"
        }
        
        logger.info(f" [HandoverGate] Syncing DNA for {self.gid} (Threshold: {threshold})")
        await self.sync_to_neo4j(dna=dna)

# Helper
def create_handover_gate(gate_id: str, org_id: str):
    return HandoverGate(gate_id, org_id)
