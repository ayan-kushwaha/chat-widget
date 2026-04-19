"""

    KPI NODE  Key Performance & Business Metric DNA         
  Cluaiz Neural OS | neurons/essence/kpi.py                      
                                                                  
  Role: Specialized Neuron for tracking Business Success metrics.  
        Triggers routines or alerts based on performance.        

"""

from src.services.neural.neurons.base_neuron import BaseNeuron
from loguru import logger

class KpiNode(BaseNeuron):
    def __init__(self, kpi_id: str, org_id: str, name: str):
        super().__init__(
            gid=kpi_id, 
            org_id=org_id, 
            label="NeuralKPI", 
            pillar="Essence", 
            name=name,
            description=f"Neural Performance Indicator for {name}."
        )

    async def sync_dna(self, target_value: float, current_state: float, threshold_triggers: dict):
        """
        Syncs specialized KPI DNA: Targets, current state, and alert thresholds.
        """
        dna = {
            "target_performance_value": target_value,
            "actual_current_value": current_state,
            "automatic_threshold_triggers": threshold_triggers,
            "neuron_type": "BUSINESS_METRIC"
        }
        
        logger.info(f" [KpiNode] Syncing KPI: {self.name} (Current: {current_state})")
        await self.sync_to_neo4j(dna=dna)

# Helper
def create_kpi_node(kpi_id: str, org_id: str, name: str):
    return KpiNode(kpi_id, org_id, name)
