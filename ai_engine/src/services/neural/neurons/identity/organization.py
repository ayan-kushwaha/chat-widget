"""

    ORGANIZATION NEURON  The Identity Pillar of Cluaiz      
  Cluaiz Neural OS | neurons/identity/organization.py            
                                                                  
  Role: Specialized Neuron for Business Rules, Mission, and      
        Values. Indestructible Pillar of Essence Hub.            

"""

from src.services.neural.neurons.base_neuron import BaseNeuron
from loguru import logger

class OrganizationNeuron(BaseNeuron):
    def __init__(self, org_id: str, name: str):
        super().__init__(
            gid=org_id, 
            org_id=org_id, 
            label="Organization", 
            pillar="Essence", 
            name=name,
            description="The Organization/Business Identity Neuron."
        )
        self.golden_vault = True
        self.decay_rate = 0.0

    async def sync_mission(self, mission_text: str, core_values: list):
        dna = {
            "mission_statement": mission_text,
            "core_values": core_values,
            "neuron_type": "ORGANIZATION_IDENTITY"
        }
        await self.sync_to_neo4j(dna=dna)

def create_org_neuron(org_id: str, name: str):
    return OrganizationNeuron(org_id, name)
