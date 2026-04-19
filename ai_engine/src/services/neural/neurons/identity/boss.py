"""

    BOSS NEURON  The Soul of the User/Owner Identity        
  Cluaiz Neural OS | neurons/identity/boss.py                    
                                                                  
  Role: Specialized Neuron for representing User Psychology,      
        Goals, and Interaction Style. Indestructible.            

"""

from src.services.neural.neurons.base_neuron import BaseNeuron
from loguru import logger

class BossNeuron(BaseNeuron):
    def __init__(self, user_id: str, org_id: str, name: str):
        super().__init__(
            gid=user_id, 
            org_id=org_id, 
            label="Person", 
            pillar="Identity", 
            name=name,
            description="The Master/User Neuron representing the Owner."
        )
        self.golden_vault = True
        self.decay_rate = 0.0

    async def sync_dna(self, psychology: dict, goals: list):
        dna = {
            "interaction_style": psychology.get("style", "Professional"),
            "mood_baseline": psychology.get("mood", "Neutral"),
            "core_mission": psychology.get("mission", "Global Innovation"),
            "business_goals": goals,
            "neuron_type": "BOSS_IDENTITY"
        }
        await self.sync_to_neo4j(dna=dna)

def create_boss_neuron(user_id: str, org_id: str, name: str):
    return BossNeuron(user_id, org_id, name)
