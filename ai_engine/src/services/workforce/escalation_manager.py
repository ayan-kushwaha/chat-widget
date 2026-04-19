from loguru import logger
from typing import Dict, Any

class EscalationManager:
    """
    Prevents silent failures.
    Tracks 'I don't know' repetitions and escalates to the Boss.
    """

    def __init__(self, threshold: int = 3):
        self.threshold = threshold
        self.gap_counters: Dict[str, int] = {} # agent_id: count

    def track_failure(self, agent_id: str, topic: str):
        """Increments the failure counter for an agent on a specific topic."""
        key = f"{agent_id}:{topic}"
        self.gap_counters[key] = self.gap_counters.get(key, 0) + 1
        
        count = self.gap_counters[key]
        logger.warning(f" Gap Warning [{count}/{self.threshold}] for {agent_id} on topic: {topic}")
        
        if count >= self.threshold:
            self.escalate_to_boss(agent_id, topic)

    def escalate_to_boss(self, agent_id: str, topic: str):
        """Sends a critical alert to the Boss Dashboard."""
        logger.critical(f" AUTO-ESCALATION: Agent {agent_id} is stuck on topic '{topic}'. Immediate human intervention required!")
        # In a real system, this would push a notification via WebSocket or Database
        pass

    def reset_counter(self, agent_id: str, topic: str):
        """Resets the counter once the gap is filled by the Boss."""
        key = f"{agent_id}:{topic}"
        if key in self.gap_counters:
            del self.gap_counters[key]
            logger.info(f" Reset escalation counter for {agent_id} on {topic}")

# Singleton
escalation_manager = EscalationManager()
