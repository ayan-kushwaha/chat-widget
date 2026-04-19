"""

    BRAND PERSONA  Public Identity & Brand Voice DNA        
  Cluaiz Neural OS | neurons/essence/brand.py                    
                                                                  
  Role: Specialized Neuron for Brand Identity and Voice.          
        Guides the external personas of all Workforce agents.     

"""

from src.services.neural.neurons.base_neuron import BaseNeuron
from loguru import logger

class BrandPersona(BaseNeuron):
    def __init__(self, brand_id: str, org_id: str):
        super().__init__(
            gid=brand_id, 
            org_id=org_id, 
            label="NeuralBrand", 
            pillar="Essence", 
            name="Brand Persona Identity",
            description="The core external identity and voice of the company."
        )

    async def sync_dna(self, tone_descriptors: list, value_propositions: list, style_guidelines: dict):
        """
        Syncs specialized Brand DNA: Tone, values, and visual/text style.
        """
        dna = {
            "brand_voice_tone": tone_descriptors,
            "core_value_propositions": value_propositions,
            "stylistic_brand_guidelines": style_guidelines,
            "neuron_type": "BRAND_IDENTITY"
        }
        
        logger.info(f" [BrandPersona] Syncing External Brand Identity for {self.org_id}")
        await self.sync_to_neo4j(dna=dna)

# Helper
def create_brand_persona(brand_id: str, org_id: str):
    return BrandPersona(brand_id, org_id)
