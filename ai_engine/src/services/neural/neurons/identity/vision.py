"""

    VISION NEURON  Long-term Strategic Compass DNA          
  Cluaiz Neural OS | neurons/identity/vision.py                  
                                                                  
  Role: Specialized Neuron for 5-Year Vision and Strategry.       
        Indestructible Strategic Marker in Essence Hub.          

"""

from src.services.neural.neurons.base_neuron import BaseNeuron
from loguru import logger

class VisionNeuron(BaseNeuron):
    def __init__(self, vision_id: str, org_id: str):
        super().__init__(
            gid=vision_id, 
            org_id=org_id, 
            label="NeuralVision", 
            pillar="Essence", 
            name="Strategic Vision",
            description="The long-term mission and vision of the company."
        )
        self.golden_vault = True

    async def sync_dna(self, vision_text: str, major_milestones: list):
        """
        Syncs specialized Vision DNA: Text and 5-year milestones.
        """
        dna = {
            "vision_mission_text": vision_text,
            "strategic_milestones": major_milestones,
            "neuron_type": "STRATEGIC_VISION"
        }
        
        logger.info(f" [VisionNeuron] Syncing Long-term Vision for {self.org_id}")
        await self.sync_to_neo4j(dna=dna)

# Helper
def create_vision_neuron(vision_id: str, org_id: str):
    return VisionNeuron(vision_id, org_id)
