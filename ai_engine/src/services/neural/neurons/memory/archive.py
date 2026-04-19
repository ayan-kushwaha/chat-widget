"""

    ARCHIVE NEURON  Compressed Neural Memory & Condensation 
  Cluaiz Neural OS | neurons/memory/archive.py                  
                                                                  
  Role: Specialized Neuron for storing Condensed History.          
        Created during the Metabolic Decay cycle.                

"""

from src.services.neural.neurons.base_neuron import BaseNeuron
from loguru import logger

class ArchiveNeuron(BaseNeuron):
    def __init__(self, archive_id: str, org_id: str):
        super().__init__(
            gid=archive_id, 
            org_id=org_id, 
            label="HistoricalArchive", 
            pillar="Memory", 
            name=f"Archive: {archive_id[:8]}",
            description="A condensed neural summary of historical chat episodes."
        )

    async def sync_dna(self, summary_blob: str, date_range: str, importance_remnant: float):
        """
        Syncs specialized Archive DNA: Summaries, dates, and leftover importance.
        """
        dna = {
            "historical_summary_blob": summary_blob,
            "temporal_range_covered": date_range,
            "residual_relevance": importance_remnant,
            "neuron_type": "CONDENSED_MEMORY"
        }
        
        logger.info(f" [ArchiveNeuron] Condensing history for {self.gid} (Range: {date_range})")
        await self.sync_to_neo4j(dna=dna)

# Helper
def create_archive_neuron(archive_id: str, org_id: str):
    return ArchiveNeuron(archive_id, org_id)
