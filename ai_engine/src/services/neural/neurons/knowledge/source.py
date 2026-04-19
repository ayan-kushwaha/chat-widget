"""

    SOURCE INDEX  Root Document Pointers & Sync Metadata    
  Cluaiz Neural OS | neurons/knowledge/source.py                 
                                                                  
  Role: Specialized Neuron for Root Knowledge Sources.            
        Acts as the parent for all Page and Chunk neurons.       

"""

from src.services.neural.neurons.base_neuron import BaseNeuron
from loguru import logger

class SourceIndex(BaseNeuron):
    def __init__(self, source_id: str, org_id: str, name: str):
        super().__init__(
            gid=source_id, 
            org_id=org_id, 
            label="KnowledgeSource", 
            pillar="Cognition", 
            name=name,
            description=f"Neural Source Pointer for {name}."
        )

    async def sync_dna(self, source_type: str, total_chunks: int, last_sync: int):
        """
        Syncs specialized Source DNA: Type, size, and temporal metadata.
        """
        dna = {
            "source_origin_type": source_type,
            "total_extracted_chunks": total_chunks,
            "last_ingestion_timestamp": last_sync,
            "neuron_type": "KNOWLEDGE_ROOT"
        }
        
        logger.info(f" [SourceIndex] Syncing Source: {self.name} (Chunks: {total_chunks})")
        await self.sync_to_neo4j(dna=dna)

# Helper
def create_source_index(source_id: str, org_id: str, name: str):
    return SourceIndex(source_id, org_id, name)
