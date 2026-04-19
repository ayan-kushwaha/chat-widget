"""

    AGENT NEURON  The Identity of an AI Employee            
  Cluaiz Neural OS | neurons/workforce/agent.py                  
                                                                  
  Role: Specialized Neuron for AI Agents (e.g. Aman, Rahul).      
        Linked to Skills and Workforce Hub.                      

"""

from src.services.neural.neurons.base_neuron import BaseNeuron
from loguru import logger

class AgentNeuron(BaseNeuron):
    def __init__(self, agent_id: str, org_id: str, name: str):
        super().__init__(
            gid=agent_id, 
            org_id=org_id, 
            label="Agent", 
            pillar="Workforce", 
            name=name,
            description=f"AI Employee Node for {name}."
        )

    async def sync_persona(self, persona: str, role: str, status: str = "Active"):
        """
        Syncs specialized Agent DNA: Persona, Role, and Performance.
        """
        dna = {
            "persona_dna": persona,
            "functional_role": role,
            "current_status": status,
            "performance_score": 1.0,
            "neuron_type": "AGENT_IDENTITY"
        }
        
        logger.info(f" [AgentNeuron] Syncing DNA for {self.name} (Role: {role})")
        await self.sync_to_neo4j(dna=dna)

# Helper
def create_agent_neuron(agent_id: str, org_id: str, name: str):
    return AgentNeuron(agent_id, org_id, name)
