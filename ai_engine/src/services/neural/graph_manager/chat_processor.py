"""

   CHAT PROCESSOR  Vector + Graph Hybrid Store                
  Cluaiz Neural OS | graph_manager/chat_processor.py             
                                                                  
  Role: Converts chat events into EpisodeNeurons (Neo4j)          
        and Semantic Embeddings (Qdrant).                         

"""
from typing import Dict, Any, Optional
from loguru import logger
from src.services.neural.neurons.memory.episode import EpisodeNeuron
from src.core.config import settings

class ChatProcessor:
    """
    Handles the "Dual-Store" logic:
    1. Saving to Neo4j (Relationship Graph)
    2. Saving to Qdrant (Semantic Search)
    """
    
    def __init__(self):
        self.vector_enabled = True # In production, check config
        
    async def process_turn(
        self, 
        user_id: str, 
        org_id: str, 
        message: str, 
        role: str = "user",
        parent_episode_id: Optional[str] = None
    ) -> str:
        """
        Processes a single chat turn:
        - Creates an EpisodeNeuron in Neo4j.
        - Links it to the User and Org.
        - (TODO) Generates vector embedding for Qdrant.
        
        Returns:
            episode_id: The GID of the newly created neuron.
        """
        logger.info(f" [GraphManager] Processing {role} message for {user_id}")
        
        # 1. Neo4j Graph Storage (Structural only, no text)
        import uuid
        episode_id = f"ep_{uuid.uuid4().hex[:8]}"
        
        logger.debug(f" [GraphManager] Creating EpisodeNeuron: {episode_id} (No-Text Mode)")
        # Execute Neo4j sync (No-Text Mode)
        neuron = EpisodeNeuron(episode_id, org_id, role)
        await neuron.sync_dna(role=role, message_length=len(message))
        
        # 2. Vector Storage (Banned for raw text)
        # Only the Structured Topic Matrix will be sent to Qdrant.
        if self.vector_enabled:
            logger.debug(f" [GraphManager] BLOCKED vectorizing raw text for Qdrant. Awaiting Structured Topic Matrix instead.")
            
        return episode_id

chat_processor = ChatProcessor()
