"""
Feedback Learning Manager
Collects user corrections to improve intent matching accuracy.
"""
from typing import Dict, Any, Optional
from loguru import logger
import json
import os
from datetime import datetime

class FeedbackManager:
    """
    Stores user corrections and negative confirmations.
    Helps improve semantic matching over time.
    """
    
    def __init__(self, storage_path: str = "data/feedback"):
        self.storage_path = storage_path
        os.makedirs(storage_path, exist_ok=True)
        self.feedback_file = os.path.join(storage_path, "user_corrections.jsonl")
    
    def record_denial(
        self,
        user_message: str,
        predicted_skill: str,
        confidence_score: float,
        user_id: str = "default"
    ):
        """
        Record when user denies a confirmation.
        This is negative training data.
        """
        feedback = {
            "type": "denial",
            "timestamp": datetime.now().isoformat(),
            "user_id": user_id,
            "user_message": user_message,
            "predicted_skill": predicted_skill,
            "confidence_score": confidence_score,
            "actual_intent": None  # We don't know what they wanted
        }
        
        self._append_feedback(feedback)
        logger.warning(f" Denial recorded: '{user_message}' mismatched to {predicted_skill}")
    
    def record_correction(
        self,
        user_message: str,
        predicted_skill: str,
        actual_skill: str,
        confidence_score: float,
        user_id: str = "default"
    ):
        """
        Record when we know the correct skill (for retraining).
        E.g., user explicitly says "I meant to check sentiment, not send email"
        """
        feedback = {
            "type": "correction",
            "timestamp": datetime.now().isoformat(),
            "user_id": user_id,
            "user_message": user_message,
            "predicted_skill": predicted_skill,
            "actual_skill": actual_skill,
            "confidence_score": confidence_score
        }
        
        self._append_feedback(feedback)
        logger.success(f" Correction recorded: '{user_message}'  {actual_skill} (was {predicted_skill})")
    
    def record_success(
        self,
        user_message: str,
        skill_id: str,
        confidence_score: float,
        user_id: str = "default"
    ):
        """
        Record successful matches (positive reinforcement).
        """
        feedback = {
            "type": "success",
            "timestamp": datetime.now().isoformat(),
            "user_id": user_id,
            "user_message": user_message,
            "skill_id": skill_id,
            "confidence_score": confidence_score
        }
        
        self._append_feedback(feedback)
    
    def _append_feedback(self, feedback: Dict[str, Any]):
        """Append feedback to JSONL file."""
        try:
            with open(self.feedback_file, "a", encoding="utf-8") as f:
                f.write(json.dumps(feedback) + "\n")
        except Exception as e:
            logger.error(f"Failed to save feedback: {e}")
    
    def get_all_feedback(self, feedback_type: Optional[str] = None) -> list:
        """
        Load all feedback for analysis.
        feedback_type: 'denial', 'correction', 'success', or None (all)
        """
        if not os.path.exists(self.feedback_file):
            return []
        
        feedback_list = []
        try:
            with open(self.feedback_file, "r", encoding="utf-8") as f:
                for line in f:
                    fb = json.loads(line.strip())
                    if feedback_type is None or fb.get("type") == feedback_type:
                        feedback_list.append(fb)
        except Exception as e:
            logger.error(f"Failed to load feedback: {e}")
        
        return feedback_list
    
    async def auto_learn(self, query: str, response: str, intent_match: Optional[Dict] = None):
        """
        Passive Learning: Analyzes the interaction to see if it was successful.
        If it looks like a success, records it as positive reinforcement.
        """
        # For now, we record successes if the response is lengthy and non-apologetic
        # In a real scenario, we would use an LLM or sentiment check here
        if "I'm sorry" in response or "I couldn't find" in response:
            return # Don't learn from failures yet (needs user confirmation)
            
        if intent_match and intent_match.get("id"):
            self.record_success(
                user_message=query,
                skill_id=intent_match["id"],
                confidence_score=intent_match.get("score", 1.0)
            )
            logger.info(f" Passive Learning: Reinforced intent '{intent_match['id']}'")

    def get_stats(self) -> Dict[str, int]:
        """Get feedback statistics."""
        all_feedback = self.get_all_feedback()
        
        stats = {
            "total": len(all_feedback),
            "denials": 0,
            "corrections": 0,
            "successes": 0
        }
        
        for fb in all_feedback:
            fb_type = fb.get("type")
            if fb_type == "denial":
                stats["denials"] += 1
            elif fb_type == "correction":
                stats["corrections"] += 1
            elif fb_type == "success":
                stats["successes"] += 1
        
        return stats
    
    def export_for_retraining(self, output_path: str = "data/feedback/training_data.json"):
        """
        Export feedback in format suitable for model retraining.
        Returns positive and negative examples.
        """
        feedback = self.get_all_feedback()
        
        training_data = {
            "positive_examples": [],
            "negative_examples": []
        }
        
        for fb in feedback:
            if fb["type"] == "success":
                training_data["positive_examples"].append({
                    "text": fb["user_message"],
                    "skill": fb["skill_id"]
                })
            elif fb["type"] == "denial":
                training_data["negative_examples"].append({
                    "text": fb["user_message"],
                    "wrong_skill": fb["predicted_skill"]
                })
            elif fb["type"] == "correction":
                training_data["positive_examples"].append({
                    "text": fb["user_message"],
                    "skill": fb["actual_skill"]
                })
                training_data["negative_examples"].append({
                    "text": fb["user_message"],
                    "wrong_skill": fb["predicted_skill"]
                })
        
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(training_data, f, indent=2)
        
        logger.success(f" Training data exported to {output_path}")
        return training_data

# Global instance
_feedback_manager = None

def get_feedback_manager() -> FeedbackManager:
    """Get global feedback manager instance."""
    global _feedback_manager
    if _feedback_manager is None:
        _feedback_manager = FeedbackManager()
    return _feedback_manager
