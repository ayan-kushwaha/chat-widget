"""

    RECOVERY NODE  Self-Healing Neural Instructions         
  Cluaiz Neural OS | neurons/reflex/recovery.py                
                                                                  
  Role: Specialized Neuron for Autonomous Error Recovery.          
        Linked to ErrorCaches and Alternative Paths.              

"""

from src.services.neural.neurons.base_neuron import BaseNeuron
from loguru import logger

class RecoveryNode(BaseNeuron):
    def __init__(self, recovery_id: str, org_id: str):
        super().__init__(
            gid=recovery_id, 
            org_id=org_id, 
            label="RecoveryAction", 
            pillar="Reflex", 
            name=f"Fix: {recovery_id[:8]}",
            description="Neural instructions for autonomous failure recovery."
        )

    async def sync_dna(self, error_gid: str, fix_logic: str, alternative_agent_gid: str):
        """
        Syncs specialized Recovery DNA: Fix logic and alternative routing.
        """
        dna = {
            "mapped_error_gid": error_gid,
            "fix_autonomous_instructions": fix_logic,
            "backup_agent_gid": alternative_agent_gid,
            "neuron_type": "RECOVERY_REFLEX"
        }
        
        logger.info(f" [RecoveryNode] Syncing Fix for Error {error_gid} (Alt Agent: {alternative_agent_gid})")
        await self.sync_to_neo4j(dna=dna)

# Helper
def create_recovery_node(recovery_id: str, org_id: str):
    return RecoveryNode(recovery_id, org_id)
