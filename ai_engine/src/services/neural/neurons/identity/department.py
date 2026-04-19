"""

    DEPARTMENT NEURON  Organizational Branching DNA         
  Cluaiz Neural OS | neurons/identity/department.py              
                                                                  
  Role: Specialized Neuron for Departmental structure.             
        Acts as a root for workforce and departmental goals.     

"""

from src.services.neural.neurons.base_neuron import BaseNeuron
from loguru import logger

class DeptNeuron(BaseNeuron):
    def __init__(self, dept_id: str, org_id: str, name: str):
        super().__init__(
            gid=dept_id, 
            org_id=org_id, 
            label="Department", 
            pillar="Identity", 
            name=name,
            description=f"Neural Department Node for {name}."
        )
        self.golden_vault = True  # Departments are strategic foundations

    async def sync_dna(self, goals: list, budget_priority: int):
        """
        Syncs specialized Dept DNA: Goals and budget priority mapping.
        """
        dna = {
            "departmental_goals": goals,
            "budget_priority_1to10": budget_priority,
            "neuron_type": "DEPT_IDENTITY"
        }
        
        logger.info(f" [DeptNeuron] Syncing DNA for {self.name} (Priority: {budget_priority})")
        await self.sync_to_neo4j(dna=dna)

# Helper
def create_dept_neuron(dept_id: str, org_id: str, name: str):
    return DeptNeuron(dept_id, org_id, name)
