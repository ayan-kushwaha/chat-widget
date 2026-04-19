"""

    MOOD NEURON  Real-time Emotional Tone Tracking          
  Cluaiz Neural OS | neurons/memory/mood.py                    
                                                                  
  Role: Specialized Neuron for tracking User Emotional States.     
        Acts as a modifier for Agent behavior and priority.       

"""

from src.services.neural.neurons.base_neuron import BaseNeuron
from loguru import logger

class MoodNeuron(BaseNeuron):
    def __init__(self, mood_id: str, org_id: str):
        super().__init__(
            gid=mood_id, 
            org_id=org_id, 
            label="UserMood", 
            pillar="Memory", 
            name="Current Mood Snapshot",
            description="Temporal node reflecting the current emotional state of the user."
        )

    async def sync_dna(self, urgency: int, satisfaction: int, emotional_tone: str):
        """
        Syncs specialized Mood DNA: Urgency, Satisfaction, and Tone.
        """
        dna = {
            "urgency_level_1to10": urgency,
            "satisfaction_level_1to10": satisfaction,
            "detected_emotional_tone": emotional_tone,
            "neuron_type": "TEMPORAL_MOOD"
        }
        
        logger.info(f" [MoodNeuron] Tracking Mood: {emotional_tone} (Urgency: {urgency})")
        await self.sync_to_neo4j(dna=dna)

# Helper
def create_mood_neuron(mood_id: str, org_id: str):
    return MoodNeuron(mood_id, org_id)
