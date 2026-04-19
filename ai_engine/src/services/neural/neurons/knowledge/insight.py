"""

    INSIGHT NEURON  AI-Learned Facts & Reasoning Nodes       
  Cluaiz Neural OS | neurons/knowledge/insight.py                
                                                                  
  Role: Specialized Neuron for Derived/Learned Knowledge.         
        Linked to Evidence Chunks and Confidence Scores.          

"""

from src.services.neural.neurons.base_neuron import BaseNeuron
from loguru import logger

class InsightNeuron(BaseNeuron):
    def __init__(self, insight_id: str, org_id: str, name: str):
        super().__init__(
            gid=insight_id, 
            org_id=org_id, 
            label="NeuralInsight", 
            pillar="Cognition", 
            name=name,
            description=f"AI-Derived Insight: {name}."
        )

    async def sync_dna(self, insight_text: str, confidence: float, evidence_gids: list):
        """
        Syncs specialized Insight DNA: Learned facts, confidence, and evidence.
        """
        dna = {
            "derived_insight_text": insight_text,
            "reasoning_confidence": confidence,
            "evidence_neuron_gids": evidence_gids,
            "neuron_type": "LEARNED_KNOWLEDGE"
        }
        
        logger.info(f" [InsightNeuron] Syncing DNA for {self.gid} (Confidence: {confidence:.2f})")
        await self.sync_to_neo4j(dna=dna)

# Helper
def create_insight_neuron(insight_id: str, org_id: str, name: str):
    return InsightNeuron(insight_id, org_id, name)
