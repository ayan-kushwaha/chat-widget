"""

    SUMMARY ENGINE  Neural Focusing & Working Memory        
  Cluaiz Neural OS | services/neural/focus/summary_engine.py      
                                                                  
  Role: Generate 200-300 word 'Focus Summaries' for each Dhaga.   
        Acts as the primary context for the Shadow Boss (0.8b).   

"""

from loguru import logger
from src.core.brain import brain
from src.database.neo4j_client import neo4j_client

class FocusSummaryEngine:
    
    async def generate_summary(self, chat_history: list, focus_id: str, org_id: str):
        """
        Generates a concise neural summary of the current focus chain.
        """
        logger.info(f" [SummaryEngine] Generating Focus Summary for {focus_id}")
        
        # Compile raw text for summarization (limit to last few messages)
        raw_text = "\\n".join([f"{c['role']}: {c['content']}" for c in chat_history[-10:]])
        
        prompt = f"""
        Summarize the following conversation segment into exactly 150-250 words.
        Focus on:
        1. Core User Intent (Goals).
        2. Technical Decisions made.
        3. Pending Tasks.
        4. Key Entities discussed.

        This summary will be used as a 'Working Memory' for a Neural Brain Navigator.
        DO NOT USE FLUFF. BE DENSE AND LOGICAL.

        CONVERSATION:
        "{raw_text}"
        """

        try:
            result = await brain.generate(prompt)
            summary_text = result.get("text", "") if isinstance(result, dict) else str(result)
            
            # Update Neo4j FocusSummary node
            await neo4j_client.run(
                """
                MATCH (f:FocusSummary {focus_group_id: $fid, org_id: $oid})
                SET f.summary_text = $text,
                    f.last_updated = timestamp()
                """,
                fid=focus_id, oid=org_id, text=summary_text
            )
            
            logger.info(f" [SummaryEngine] Focus Summary Updated for {focus_id}")
            return summary_text
            
        except Exception as e:
            logger.error(f" [SummaryEngine] Summarization failed for {focus_id}: {e}")
            return ""

summary_engine = FocusSummaryEngine()
