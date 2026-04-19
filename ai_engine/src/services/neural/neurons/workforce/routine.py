"""

    ROUTINE NEURON  Periodic Automation & Temporal Triggers  
  Cluaiz Neural OS | neurons/workforce/routine.py                
                                                                  
  Role: Specialized Neuron for managing Automated Workflows.      
        Stores Schedules, Triggers, and Recurring Tasks.         

"""

from src.services.neural.neurons.base_neuron import BaseNeuron
from loguru import logger

class RoutineNeuron(BaseNeuron):
    def __init__(self, routine_id: str, org_id: str, name: str):
        super().__init__(
            gid=routine_id, 
            org_id=org_id, 
            label="Routine", 
            pillar="Workforce", 
            name=name,
            description=f"Neural Automation Routine for {name}."
        )

    async def sync_dna(self, schedule: str, trigger_event: str, target_skill_gid: str):
        """
        Syncs specialized Routine DNA: Schedules and Target Skills.
        """
        dna = {
            "execution_schedule_cron": schedule,
            "event_trigger_dna": trigger_event,
            "target_skill_gid": target_skill_gid,
            "routine_status": "Active",
            "neuron_type": "TEMPORAL_AUTOMATION"
        }
        
        logger.info(f" [RoutineNeuron] Syncing DNA for {self.name} (Schedule: {schedule})")
        await self.sync_to_neo4j(dna=dna)

# Helper
def create_routine_neuron(routine_id: str, org_id: str, name: str):
    return RoutineNeuron(routine_id, org_id, name)
