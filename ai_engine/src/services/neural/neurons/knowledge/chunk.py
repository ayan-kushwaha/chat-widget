"""

    CHUNK NEURON  The Atomic Unit of Stored Knowledge       
  Cluaiz Neural OS | neurons/knowledge/chunk.py                 
                                                                  
  Role: Specialized Neuron for atomic data chunks.                
        Linked to Source Documents and Vector Embeddings.         

"""

from src.services.neural.neurons.base_neuron import BaseNeuron
from loguru import logger

class ChunkNeuron(BaseNeuron):
    def __init__(self, chunk_id: str, org_id: str, name: str):
        super().__init__(
            gid=chunk_id, 
            org_id=org_id, 
            label="KnowledgeChunk", 
            pillar="Cognition", 
            name=name,
            description="An atomic unit of knowledge/data."
        )

    async def sync_dna(self, mongo_id: str, qdrant_id: str, summary: str, relevance: float = 0.8):
        """
        Syncs specialized Chunk DNA: Source IDs and relevance metadata.
        """
        dna = {
            "mongo_id": mongo_id,
            "qdrant_id": qdrant_id,
            "neuron_summary_l1": summary,
            "relevance_score": relevance,
            "neuron_type": "KNOWLEDGE_CHUNK"
        }
        
        logger.info(f" [ChunkNeuron] Syncing DNA for {self.name} (Source: {mongo_id})")
        await self.sync_to_neo4j(dna=dna)

# Helper
def create_chunk_neuron(chunk_id: str, org_id: str, name: str):
    return ChunkNeuron(chunk_id, org_id, name)
