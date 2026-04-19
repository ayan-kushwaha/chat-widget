"""

    ERROR CACHE  Neural Memory of Failures & Mistakes        
  Cluaiz Neural OS | neurons/reflex/error.py                      
                                                                  
  Role: Specialized Neuron for storing Failure Patterns.           
        Linked to Failed Tasks and RecoveryNodes.                 

"""

from src.services.neural.neurons.base_neuron import BaseNeuron
from loguru import logger

class ErrorCache(BaseNeuron):
    def __init__(self, error_id: str, org_id: str):
        super().__init__(
            gid=error_id, 
            org_id=org_id, 
            label="NeuralError", 
            pillar="Reflex", 
            name=f"Error: {error_id[:8]}",
            description="A neural record of an AI execution failure."
        )

    async def sync_dna(self, error_log: str, failing_agent_gid: str, failure_context: str):
        """
        Syncs specialized Error DNA: Logs, failing agents, and context.
        """
        dna = {
            "error_data_blob": error_log,
            "failing_agent_gid": failing_agent_gid,
            "context_before_failure": failure_context,
            "neuron_type": "ERROR_REFLEX"
        }
        
        logger.warning(f" [ErrorCache] Recording Failure for {failing_agent_gid} (Gid: {self.gid})")
        await self.sync_to_neo4j(dna=dna)

# Helper
def create_error_cache(error_id: str, org_id: str):
    return ErrorCache(error_id, org_id)
