"""

    CORRECTION NODE  Supervised Fact Correction DNA          
  Cluaiz Neural OS | neurons/knowledge/correction.py              
                                                                  
  Role: Specialized Neuron for manual User-given corrections.     
        Overrides existing KnowledgeNeurons and Chunks.          

"""

from src.services.neural.neurons.base_neuron import BaseNeuron
from loguru import logger

class CorrectionNode(BaseNeuron):
    def __init__(self, correction_id: str, org_id: str):
        super().__init__(
            gid=correction_id, 
            org_id=org_id, 
            label="ManualCorrection", 
            pillar="Cognition", 
            name="Manual Fact Override",
            description="A neural node representing a human-certified fact correction."
        )

    async def sync_dna(self, target_gid: str, corrected_text: str, reason: str = ""):
        """
        Syncs specialized Correction DNA: Corrected data and override target.
        """
        dna = {
            "target_neuron_gid": target_gid,
            "certified_correction_text": corrected_text,
            "correction_rationale": reason,
            "neuron_type": "FACT_CORRECTION"
        }
        
        logger.info(f" [CorrectionNode] Overriding {target_gid} with user-certified text.")
        await self.sync_to_neo4j(dna=dna)

# Helper
def create_correction_node(correction_id: str, org_id: str):
    return CorrectionNode(correction_id, org_id)
