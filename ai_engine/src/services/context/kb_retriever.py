"""
 KBRetriever  Phase 2 Business-Scoped Retrieval
===================================================
Handles fetching the most relevant "Knowledge Chunks" for a specific query.

Context:
  Cluaiz stores knowledge in Qdrant. Each business has a scoped collection
  (or uses partition keys). This module retrieves top-K chunks to be
  injected into the Skill execution context.

Logic:
  1. Embed user query using BGE-M3.
  2. Search Qdrant collection `{business_id}_knowledge`.
  3. Filter by `employee_id` if scope permits.
  4. Return formatted chunks for ContextPackage.
"""

from typing import List, Dict, Any, Optional
from loguru import logger

# Local imports
from src.core.vector_store import VectorStore


class KBRetriever:
    """
    Retrieves business-specific knowledge chunks from Qdrant.
    """

    def __init__(self, business_id: str, employee_id: Optional[str] = None):
        self.business_id = business_id
        self.employee_id = employee_id
        self.vector_store = VectorStore()

    async def retrieve_relevant_chunks(
        self, 
        query: str, 
        top_k: int = 3,
        min_score: float = 0.65
    ) -> List[Dict[str, Any]]:
        """
        Retrieves top-K relevant chunks for the current query.
        """
        logger.info(f" [KBRetriever] Searching KB for: '{query[:50]}...' (biz: {self.business_id})")
        
        try:
            # Collection naming convention: {business_id}_knowledge
            collection_name = f"{self.business_id}_knowledge"
            
            # Semantic search via Qdrant
            results = await self.vector_store.search(
                collection_name=collection_name,
                query=query,
                limit=top_k,
                score_threshold=min_score,
                filter_metadata={"employee_id": self.employee_id} if self.employee_id else None
            )
            
            # Format for ContextPackage
            chunks = []
            for res in results:
                chunks.append({
                    "source": res["metadata"].get("source_name", "Unknown Document"),
                    "chunk":  res["content"],
                    "score":  res["score"]
                })
            
            logger.debug(f" [KBRetriever] Found {len(chunks)} relevant chunks.")
            return chunks

        except Exception as e:
            # If collection doesn't exist or search fails, return empty list
            # We don't want to crash the skill call just because KB search failed.
            logger.warning(f" [KBRetriever] Retrieval failed/empty: {e}")
            return []
