"""

    TOOL NEURON  External API & Connector DNA                  
  Cluaiz Neural OS | neurons/workforce/tool.py                    
                                                                  
  Role: Specialized Neuron for API Integrations and Tools.        
        Linked to SkillNeurons and Workforce Hub.                 

"""

from src.services.neural.neurons.base_neuron import BaseNeuron
from loguru import logger

class ToolNeuron(BaseNeuron):
    def __init__(self, tool_id: str, org_id: str, name: str):
        super().__init__(
            gid=tool_id, 
            org_id=org_id, 
            label="Tool", 
            pillar="Workforce", 
            name=name,
            description=f"Neural Tool Connector for {name}."
        )

    async def sync_dna(self, endpoint: str, auth_type: str, contract: dict):
        """
        Syncs specialized Tool DNA: Endpoints, Auth strategies, and protocols.
        """
        dna = {
            "api_endpoint_url": endpoint,
            "authentication_method": auth_type,
            "tool_io_contract": contract,
            "tool_status": "Connected",
            "neuron_type": "EXTERNAL_CONNECTOR"
        }
        
        logger.info(f" [ToolNeuron] Syncing DNA for {self.name} (Endpoint: {endpoint})")
        await self.sync_to_neo4j(dna=dna)

# Helper
def create_tool_neuron(tool_id: str, org_id: str, name: str):
    return ToolNeuron(tool_id, org_id, name)
