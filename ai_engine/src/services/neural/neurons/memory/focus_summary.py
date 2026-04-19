"""

    FOCUS SUMMARY NODE  Compressed Active Context Cache DNA  
  Cluaiz Neural OS | neurons/memory/focus_summary.py             
                                                                  
  Role: Specialized Neuron for storing Active Focus Summaries.     
        Acts as a Cache for the Shadow Boss reasoning process.   

"""

from src.services.neural.neurons.base_neuron import BaseNeuron
from loguru import logger

class FocusSummaryNode(BaseNeuron):
    def __init__(self, focus_id: str, org_id: str):
        super().__init__(
            gid=focus_id, 
            org_id=org_id, 
            label="FocusSummary", 
            pillar="Memory", 
            name="Active Focus Snapshot",
            description="A compressed context cache for active conversation chains."
        )

    async def sync_dna(self, summary_text: str, active_episode_gids: list, importance_boost: float = 1.0):
        """
        Syncs specialized Focus DNA: Summaries, episode links, and importance.
        """
        dna = {
            "compressed_context_summary": summary_text,
            "active_episodes_in_focus": active_episode_gids,
            "focus_attention_weight": importance_boost,
            "neuron_type": "ACTIVE_SHORT_TERM"
        }
        
        logger.info(f" [FocusSummaryNode] Syncing Context Cache for {self.gid} (Episodes: {len(active_episode_gids)})")
        await self.sync_to_neo4j(dna=dna)

# Helper
def create_focus_summary_node(focus_id: str, org_id: str):
    return FocusSummaryNode(focus_id, org_id)
