"""

   TRUST SCORER  Historical Reliability & Trust Protocol    
  Cluaiz Neural OS | neurons/reflex/trust.py                      
                                                                  
  Role: Specialized Neuron for tracking Agent/Path Reliability.    
        Modifiers based on SuccessNodes and ErrorCaches.         

"""

from src.services.neural.neurons.base_neuron import BaseNeuron
from loguru import logger

class TrustScorer(BaseNeuron):
    def __init__(self, trust_id: str, org_id: str):
        super().__init__(
            gid=trust_id, 
            org_id=org_id, 
            label="TrustProfile", 
            pillar="Reflex", 
            name="Agent Trust Profile",
            description="Neural profile for reliability tracking."
        )

    async def sync_dna(self, trust_level: float, success_count: int, failure_count: int):
        """
        Syncs specialized Trust DNA: Trust levels and historical counts.
        """
        dna = {
            "current_trust_level_0to1": trust_level,
            "total_success_count": success_count,
            "total_failure_count": failure_count,
            "neuron_type": "PERFORMANCE_TRACKER"
        }
        
        logger.info(f" [TrustScorer] Syncing Trust for {self.gid} (Trust: {trust_level:.2f})")
        await self.sync_to_neo4j(dna=dna)

# Helper
def create_trust_scorer(trust_id: str, org_id: str):
    return TrustScorer(trust_id, org_id)
