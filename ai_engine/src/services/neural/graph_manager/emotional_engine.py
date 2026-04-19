"""

   EMOTIONAL ENGINE  Sentiment & Tone Weighting                
  Cluaiz Neural OS | graph_manager/emotional_engine.py            
                                                                  
  Role: Analyzes user emotion to adjust training importance.      

"""
from typing import Dict, Any
from loguru import logger

class EmotionalEngine:
    """
    Detects if the user is angry, happy, or confused.
    Adjusts the 'interaction_weight' of the EpisodeNeuron.
    """
    
    async def analyze_sentiment(self, message: str) -> Dict[str, Any]:
        """
        Returns a sentiment label and a training weight.
        """
        logger.info(" [GraphManager] Analyzing emotional feedback...")
        
        # In production, this would use a fast classification model
        msg_lower = message.lower()
        
        # Default
        sentiment = "neutral"
        weight = 1.0
        
        # Detection logic
        if any(w in msg_lower for w in ["wrong", "bad", "stupid", "error", "no", "nahi"]):
            sentiment = "angry"
            weight = -5.0 # High penalty for training
        elif any(w in msg_lower for w in ["thanks", "good", "perfect", "yes", "sahi"]):
            sentiment = "satisfied"
            weight = 2.0  # Boost for repetition
            
        return {"sentiment": sentiment, "weight": weight}

emotional_engine = EmotionalEngine()
