"""

    SESSION NEURON  The Root of a Conversation Context         
  Cluaiz Neural OS | neurons/memory/session.py                    
                                                                  
  Role: Specialized Neuron for chat sessions.                     
        Stores user intent, emotional tone, and session life.     

"""

from src.services.neural.neurons.base_neuron import BaseNeuron
from loguru import logger

class SessionNeuron(BaseNeuron):
    def __init__(self, session_id: str, org_id: str, user_id: str):
        super().__init__(
            gid=session_id, 
            org_id=org_id, 
            label="ChatSession", 
            pillar="Memory", 
            name=f"Session: {session_id[:8]}",
            description=f"Neural Session Node for User {user_id}."
        )

    async def sync_dna(self, intent: str, mood: str, status: str = "Active"):
        """
        Syncs specialized Session DNA: Intent, mood, and state.
        """
        dna = {
            "session_intent": intent,
            "user_mood_snapshot": mood,
            "session_status": status,
            "neuron_type": "LIVE_SESSION"
        }
        
        logger.info(f" [SessionNeuron] Syncing DNA for {self.gid} (Intent: {intent})")
        await self.sync_to_neo4j(dna=dna)

# Helper
def create_session_neuron(session_id: str, org_id: str, user_id: str):
    return SessionNeuron(session_id, org_id, user_id)
