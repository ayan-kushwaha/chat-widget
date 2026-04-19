"""

    SCORER NEURON  Neural Confidence & Feedback Tuning       
  Cluaiz Neural OS | neurons/reflex/scorer.py                    
                                                                  
  Role: Specialized Neuron for Confidence Scoring and Validation. 
        Acts as the Feedback Loop for Brain Learning.            

"""

from src.services.neural.neurons.base_neuron import BaseNeuron
from loguru import logger

class ScorerNeuron(BaseNeuron):
    def __init__(self, scorer_id: str, org_id: str):
        super().__init__(
            gid=scorer_id, 
            org_id=org_id, 
            label="ConfidenceScorer", 
            pillar="Reflex", 
            name=f"Scorer: {scorer_id[:8]}",
            description="Neural Scorer Node for confidence validation."
        )

    async def sync_dna(self, match_score: float, threshold: float, feedback: str = ""):
        """
        Syncs specialized Scorer DNA: Scores, thresholds, and feedback notes.
        """
        dna = {
            "current_match_score": match_score,
            "required_threshold": threshold,
            "human_feedback_fragment": feedback,
            "neuron_type": "CONFIDENCE_VALIDATOR"
        }
        
        logger.info(f" [ScorerNeuron] Syncing DNA for {self.gid} (Score: {match_score:.2f})")
        await self.sync_to_neo4j(dna=dna)

# Helper
def create_scorer_neuron(scorer_id: str, org_id: str):
    return ScorerNeuron(scorer_id, org_id)
