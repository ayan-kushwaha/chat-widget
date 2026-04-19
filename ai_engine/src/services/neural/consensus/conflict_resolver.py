"""

    CONFLICT RESOLVER  Subconscious Policy Mediator            
  Cluaiz Neural OS | services/neural/consensus/conflict_resolver.py
                                                                  
  Role: Detects severe business collisions in the top ranked      
        neurons (e.g., Angry User vs Strict Refund Policy).       
        Generates the Mathematical Confidence Score for the UI.   

"""

from typing import List, Dict
from loguru import logger

class ConflictResolver:
    """
    Ensures the business DNA survives emotional or temporal chaos.
    """
    
    def resolve(self, ranked_neurons: List[Dict]) -> Dict:
        """
        Analyzes the Arbiter's ranked list for extreme contradictions.
        Outputs the absolute truth and the Confidence Score.
        """
        if not ranked_neurons:
            return {
                "winning_neuron": None,
                "conflict_detected": False,
                "confidence_score": 0.0
            }

        logger.info(" [Conflict Resolver] Analyzing top ranked paths for business policy clashes...")
        
        # The Arbiter's Math already fixed 99% of conflicts via W_type.
        winner = ranked_neurons[0]
        conflict_detected = False
        
        if len(ranked_neurons) > 1:
            # Check for a clash in the Top 3
            top_3_types = [n.get("type") for n in ranked_neurons[:3]]
            
            # Example Clash: Mood vs Policy
            if "MoodNeuron" in top_3_types and "PolicyNeuron" in top_3_types:
                conflict_detected = True
                logger.warning(" [Conflict Resolver] Policy Clash ! User Emotion vs Business Policy.")
                
                # The winner relies on the Arbiter's strict MCES formula.
                # If Policy wins, the system will output a firm, professional denial.
                # If Mood artificially wins (massive Hebbian score), it adapts to the empathy.
                logger.info(f" [Conflict Resolver] Arbiter overruled emotional clash. Proceeding with -> {winner.get('type')}")

        
        # Generate the Deep Interface Confidence Metric
        confidence = self._calculate_confidence(ranked_neurons)
        logger.info(f" [Conflict Resolver] Arbiter Confidence Score: {confidence}%")

        return {
            "winning_neuron": winner,
            "conflict_detected": conflict_detected,
            "confidence_score": confidence
        }

    def _calculate_confidence(self, ranked: List[Dict]) -> float:
        """
        Calculates a 0-100% confidence score.
        Based on the margin of victory between Rank #1 and Rank #2 paths.
        Small margin = Low confidence (The system is confused).
        Large margin = High confidence (The system is absolutely certain).
        """
        if len(ranked) < 2:
            return 100.0
            
        top_score = ranked[0].get("mces_score", 0.1)
        runner_up = ranked[1].get("mces_score", 0.0)
        
        if top_score <= 0:
            return 0.0
            
        # Mathematical Confidence Margin
        margin = top_score - runner_up
        ratio = margin / top_score
        
        # Baseline confidence starts at 50%. The ratio adds the rest.
        confidence = min((ratio * 100.0) + 50.0, 99.9) 
        
        return round(confidence, 1)

# Singleton Resolver
conflict_resolver = ConflictResolver()
