from typing import List, Dict, Any, Optional
from loguru import logger
import os

# Import existing memory manager as the current implementation
try:
    from src.core.memory import memory
except ImportError:
    # Fallback for development/testing if structure is different
    memory = None
    logger.warning(" src.core.memory not found. MemoryBridge will run in mock mode.")

class MemoryBridge:
    """
    The Abstraction Layer for Vector Data.
    Skills call this instead of Chroma/Qdrant directly.
    """
    
    def __init__(self, collection_name: str = "skills_default"):
        self.collection_name = collection_name
        self.db_type = os.getenv("VECTOR_DB_TYPE", "CHROMA") # Future: "QDRANT"

    async def save(self, text: str, metadata: Dict[str, Any], doc_id: Optional[str] = None) -> bool:
        """Saves a document to the vector store."""
        if memory and self.db_type == "CHROMA":
            return await memory.add_document(self.collection_name, text, metadata, doc_id)
        
        logger.warning(f" [Mock] Saving to {self.collection_name}: {text[:50]}...")
        return True

    async def search(self, query: str, limit: int = 5, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Searches for similar documents."""
        if memory and self.db_type == "CHROMA":
            # Translate generic filters to Chroma 'where' syntax if needed
            return await memory.query_similar(query, n_results=limit, collection_name=self.collection_name, where=filters)
        
        logger.warning(f" [Mock] Searching in {self.collection_name} for: {query}")
        return []

    async def delete(self, doc_id: str) -> bool:
        """Deletes a document by ID."""
        if memory and self.db_type == "CHROMA":
            return await memory.delete_document(self.collection_name, doc_id)
        
        logger.warning(f" [Mock] Deleting {doc_id} from {self.collection_name}")
        return True

    @staticmethod
    def get_adapter():
        """Returns the active DB adapter name."""
        return os.getenv("VECTOR_DB_TYPE", "CHROMA")
