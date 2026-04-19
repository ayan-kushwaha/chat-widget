"""

    PSYCHOLOGY NEURON  The Emotional Map of the User         
  Cluaiz Neural OS | neurons/identity/psychology.py              
                                                                  
  Role: Specialized Neuron for tracking User Mood, Style,         
        and Preferences in Real-time.                            

"""

from src.services.neural.neurons.base_neuron import BaseNeuron
from loguru import logger

class PsychologyNeuron(BaseNeuron):
    def __init__(self, psych_id: str, org_id: str):
        super().__init__(
            gid=psych_id, 
            org_id=org_id, 
            label="PsychologyMap", 
            pillar="Identity", 
            name="User Psychology Map",
            description="Real-time map of user preferences and mood."
        )

    async def sync_state(self, psychology_layer: dict):
        """
        Syncs the full 8-level Psychology Map from Shadow Boss.
        """
        dna = {
            "p1_mood": psychology_layer.get("P1_profiler", {}).get("primary_emotion"),
            "p2_rapport": psychology_layer.get("P2_rapport", {}).get("formality"),
            "p3_chameleon": psychology_layer.get("P3_chameleon", {}).get("adapt_tone"),
            "p4_anticipator": psychology_layer.get("P4_anticipator", {}).get("predicted_next_intent"),
            "p5_influence": psychology_layer.get("P5_influence", {}).get("persuasion_tactic_detected"),
            "p6_emoji_vibe": psychology_layer.get("P6_emoji_pulse", {}).get("emoji_found"),
            "p7_topic_steer": psychology_layer.get("P7_topic_steer", {}).get("topic_drift_detected"),
            "p8_loyalty": psychology_layer.get("P8_loyalty", {}).get("loyalty_score"),
            "churn_risk": psychology_layer.get("P8_loyalty", {}).get("churn_risk"),
            "neuron_type": "USER_PSYCHOLOGY"
        }
        await self.sync_to_neo4j(dna=dna)

def create_psychology_neuron(psych_id: str, org_id: str):
    return PsychologyNeuron(psych_id, org_id)
