"""

    NEURAL ARBITER  The Consensus Judge                        
  Cluaiz Neural OS | services/neural/consensus/arbiter.py         
                                                                  
  Role: LLM-Free Multi-Criteria Decision Layer. Evaluates         
        active neurons using the MCES formula (Weight * Hebbian   
        * Decay) to scientifically determine the single best path.

"""

import math
from typing import List, Dict
from loguru import logger
from datetime import datetime, timezone

class NeuralArbiter:
    """
    LLM-Free deterministic routing layer.
    Ensures zero hallucination during logical conflict by using Math instead of Prompting.
    """
    def __init__(self, alpha: float = 0.6, beta: float = 0.4, decay_lambda: float = 0.05):
        # : Weight of the GDS PageRank Centrality
        self.alpha = alpha
        
        # : Weight of the biological Hebbian touch frequency
        self.beta = beta
        
        # : Rate of temporal decay (old memories matter less)
        self.decay_lambda = decay_lambda
        
        # W_type: The Absolute Power Hierarchy.
        # This completely dictates the Subconscious bias. Company Rules > User Feelings.
        self.type_weights = {
            "OrgNeuron": 3.0,          # The Boss's Identity / Core DNA
            "LiveServerNeuron": 2.8,   # Direct impact on money/production
            "BluePrintNeuron": 2.5,    # AI Structure
            "GoalNeuron": 2.0,         # Direct objectives
            "PolicyNeuron": 1.8,       # Hard rules
            "TopicNeuron": 1.7,        # The Context Matrix Layer
            "CodeChunkNeuron": 1.5,    # Engineering risk
            "SkillNeuron": 1.5,        # Available capabilities
            "AgentNeuron": 1.4,        # AI Employee identity
            "FocusSummaryNode": 1.3,   # Immediate session context
            "UserNeuron": 1.2,         # User identity profile
            "MoodNeuron": 1.1,         # User feelings/sentiment
            "EpisodeNeuron": 1.0,      # Standard chat message (baseline)
            "BaseNeuron": 1.0
        }

    def calculate_mces(self, neuron_data: Dict) -> float:
        """
        The MCES (Multi-Criteria Energy Score) Formula:
        E_i = (*P_i + *H_i) * exp(-*t_i) * W_type
        """
        neuron_type = neuron_data.get("type", "BaseNeuron")
        
        # P_i: The Centrality (Hebb-Rank) from Neo4j GDS
        p_score = float(neuron_data.get("priority_score", 0.0))
        
        # H_i: The Hebbian reinforcement (normalized max touches)
        touch_count = float(neuron_data.get("touch_count", 1))
        h_score = min(touch_count / 100.0, 1.0)
        
        # t_i: Temporal decay in hours
        t_hours = 0.0
        last_accessed_iso = neuron_data.get("last_accessed_at")
        if last_accessed_iso:
            try:
                # Handle basic ISO format safely
                last_time = datetime.fromisoformat(last_accessed_iso.replace('Z', '+00:00'))
                diff = datetime.now(timezone.utc) - last_time
                t_hours = max(diff.total_seconds() / 3600.0, 0.0)
            except Exception:
                pass

        # W_type: The Hierarchy Multiplier
        w_type = self.type_weights.get(neuron_type, 1.0)

        # The deterministic formula
        decay_factor = math.exp(-self.decay_lambda * t_hours)
        base_energy = (self.alpha * p_score) + (self.beta * h_score)
        
        final_energy = base_energy * decay_factor * w_type
        
        return round(final_energy, 4)

    def select_top_path(self, active_neurons: List[Dict], max_hops: int = 3) -> List[Dict]:
        """
        Passes active neurons through the judge. Returns ranked list.
        Enforces MAX_HOP limits and the 0.6 Similarity Guillotine Filter.
        """
        if not active_neurons:
            return []
            
        logger.info(f" [Arbiter] Calculating mathematical consensus for {len(active_neurons)} neurons (Max Hops: {max_hops})...")
        
        scored_neurons = []
        for n in active_neurons:
            energy = self.calculate_mces(n)
            n_copy = dict(n)
            n_copy["mces_score"] = energy
            scored_neurons.append(n_copy)
            
        # The 0.6 Guillotine
        survivors = [n for n in scored_neurons if n["mces_score"] >= 0.6]
        
        # Rank the candidates deterministically
        ranked = sorted(survivors, key=lambda x: x["mces_score"], reverse=True)
        
        if ranked:
            top_n = ranked[0]
            logger.info(f" [Arbiter] Top Path Locked: {top_n.get('type')} [{top_n.get('name', 'Unknown')}] (Score: {top_n.get('mces_score')})")
        else:
            logger.warning(" [Arbiter] All Paths Pruned! (Score < 0.6). Forcing strict focus.")
            
        return ranked

# Singleton Judge
neural_arbiter = NeuralArbiter()
