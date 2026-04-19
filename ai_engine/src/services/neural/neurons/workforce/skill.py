"""

    SKILL NEURON  The Atomic Capability of an Agent          
  Cluaiz Neural OS | neurons/workforce/skill.py                  
                                                                  
  Role: Specialized Neuron for specific Skills (e.g. Research).   
        Carries API Contracts, Trigger Phrases, and Logic.       

"""

from src.services.neural.neurons.base_neuron import BaseNeuron
from loguru import logger

class SkillNeuron(BaseNeuron):
    def __init__(self, skill_id: str, org_id: str, name: str):
        super().__init__(
            gid=skill_id, 
            org_id=org_id, 
            label="Skill", 
            pillar="Workforce", 
            name=name,
            description=f"Neural Skill Node for {name}."
        )

    async def sync_dna(self, triggers: list, protocol: dict):
        """
        Syncs specialized Skill DNA: Triggers, Input/Output, and Action logic.
        """
        dna = {
            "trigger_phrases": triggers,
            "api_contract_dna": protocol,
            "success_rate": 0.95,
            "neuron_type": "ATOMIC_SKILL"
        }
        
        logger.info(f" [SkillNeuron] Syncing DNA for {self.name} (Triggers: {len(triggers)})")
        await self.sync_to_neo4j(dna=dna)

# Helper
def create_skill_neuron(skill_id: str, org_id: str, name: str):
    return SkillNeuron(skill_id, org_id, name)
