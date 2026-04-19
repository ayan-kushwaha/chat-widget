"""

   DECISION AUDIT  Shadow Post-Execution Monitor             
  Cluaiz Neural OS | graph_manager/decision_audit.py             
                                                                  
  Role: Audits if the AI decision led to a successful outcome.    

"""
from typing import Dict, Any
from loguru import logger

class DecisionAudit:
    """
    Monitors tool results and user corrections.
    Creates CorrectionNeurons if an AI path proved incorrect.
    """
    
    async def audit_turn(self, interaction_data: Dict[str, Any]) -> bool:
        """
        Checks if the AI's action was successful.
        If 'user_correction' is detected, it logs a failure.
        """
        logger.info(" [GraphManager] Auditing AI decision outcome...")
        
        # Simulation: If user message starts with 'no' or 'wrong', it's a correction
        message = interaction_data.get("message", "").lower()
        if message.startswith("no") or message.startswith("nahi"):
            logger.warning(" [DecisionAudit] User correction detected! Flagging decision as FAILED.")
            return False
            
        return True

decision_audit = DecisionAudit()
