"""

    VOICE NEURON  Neural Audio Profile & TTS DNA            
  Cluaiz Neural OS | neurons/workforce/voice.py                  
                                                                  
  Role: Specialized Neuron for AI Agent Vocal Identity.           
        Linked to AgentNodes and Neural Interfaces.              

"""

from src.services.neural.neurons.base_neuron import BaseNeuron
from loguru import logger

class VoiceNeuron(BaseNeuron):
    def __init__(self, voice_id: str, org_id: str):
        super().__init__(
            gid=voice_id, 
            org_id=org_id, 
            label="NeuralVoice", 
            pillar="Workforce", 
            name="Agent Voice Identity",
            description="Neural profile for TTS and vocal features."
        )

    async def sync_dna(self, provider: str, voice_key: str, pitch: float = 1.0, rate: float = 1.0):
        """
        Syncs specialized Voice DNA: TTS provider, voice keys, and modulation.
        """
        dna = {
            "tts_service_provider": provider,
            "tts_voice_id_key": voice_key,
            "voice_pitch_level": pitch,
            "voice_speech_rate": rate,
            "neuron_type": "AUDIOLOGICAL_IDENTITY"
        }
        
        logger.info(f" [VoiceNeuron] Syncing Voice for {self.gid} (Provider: {provider})")
        await self.sync_to_neo4j(dna=dna)

# Helper
def create_voice_neuron(voice_id: str, org_id: str):
    return VoiceNeuron(voice_id, org_id)
