import os
import asyncio
from typing import Optional, List, Any, Dict
import httpx
from src.utils.logger import logger
from src.core.vector_store import vector_store
from qdrant_client.http import models

class MemoryManager:
    def __init__(self):
        self.ollama_url = os.getenv("OLLAMA_URL", "http://ollama:11434")
        self.async_client = httpx.AsyncClient()
        logger.info(" MemoryManager (Pillar C) initialized using Pure Qdrant via VectorStore.")

    async def add_document(self, collection_name: str, document: str, metadata: dict, doc_id: str = None):
        """Add a single document to Qdrant memory."""
        try:
            res = await vector_store.add_documents(
                collection_name=collection_name,
                documents=[document],
                metadatas=[metadata],
                ids=[doc_id] if doc_id else None
            )
            return res[0] if res else None
        except Exception as e:
            logger.error(f" Error adding document to memory: {e}")
            return False

    async def add_documents(self, collection_name: str, documents: List[str], metadatas: List[dict], ids: List[str] = None):
        """Batch adds documents to the Qdrant vector store."""
        try:
            return await vector_store.add_documents(
                collection_name=collection_name,
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )
        except Exception as e:
            logger.error(f" Error batch adding to memory: {e}")
            return False

    async def delete_document(self, collection_name: str, doc_id: str):
        """Deletes a document from the Qdrant vector store by ID."""
        if not vector_store.q_client: return False
        try:
            vector_store.q_client.delete(
                collection_name=collection_name,
                points_selector=models.PointIdsList(points=[doc_id])
            )
            logger.info(f" Deleted document {doc_id} from {collection_name}")
            return True
        except Exception as e:
            logger.error(f" Error deleting document from memory: {e}")
            return False

    async def query_similar(self, query_text: str, n_results: int = 5, collection_name: str = "default", where: dict = None, query_embedding: Optional[List[float]] = None):
        """
        Query Qdrant for similar documents.
        """
        try:
            results = await vector_store.search(
                collection_name=collection_name,
                query=query_text,
                limit=n_results
            )
            
            # Post-filtering for 'where' if needed (for now keep it simple)
            formatted_results = []
            for r in results:
                meta = r.get("metadata", {})
                # Simple manual filter for now if where is provided
                if where:
                    match = True
                    for k, v in where.items():
                        if meta.get(k) != v:
                            match = False
                            break
                    if not match: continue

                formatted_results.append({
                    "content": r.get("content"),
                    "metadata": meta,
                    "id": meta.get("id") or meta.get("points_id")
                })
            return formatted_results
        except Exception as e:
            logger.error(f" Error querying memory: {e}")
            return []

    async def verify_asset_availability(self, asset_names: List[str], collection_name: str = "default") -> Dict[str, bool]:
        """
        Fast verification if assets exist in Qdrant (by metadata 'source' or 'filename').
        """
        if not vector_store.q_client:
            return {name: False for name in asset_names}
            
        status = {}
        try:
            for name in asset_names:
                # Optimized Qdrant check using scroll/count with filters
                check = vector_store.q_client.scroll(
                    collection_name=collection_name,
                    scroll_filter=models.Filter(
                        must=[
                            models.FieldCondition(key="source", match=models.MatchValue(value=name))
                        ]
                    ),
                    limit=1,
                    with_payload=False,
                    with_vectors=False
                )
                status[name] = len(check[0]) > 0
        except Exception as e:
            logger.error(f" Error verifying asset availability: {e}")
            return {name: False for name in asset_names}
            
        return status

    async def delete_by_ids(self, collection_name: str, ids: List[str]):
        """Remove specific documents by IDs."""
        return await vector_store.delete_by_ids(collection_name, ids)

    async def delete_by_filter(self, collection_name: str, filter: Dict[str, Any]):
        """Remove documents by metadata filter."""
        return await vector_store.delete_by_filter(collection_name, filter)

# Singleton instance
memory = MemoryManager()
