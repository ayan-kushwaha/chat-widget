import requests
from qdrant_client import QdrantClient
from qdrant_client.http import models
from typing import List, Dict, Any, Optional
from src.core.config import settings
from loguru import logger

class VectorStore:
    """
Unified Vector Store Engine (Pure Pillar C)
Exclusively powered by Qdrant (Rust-based) for Billion-scale scalability.
Offloads embeddings to Ollama (BGE-M3).
"""
    def __init__(self):
        # Initialize Qdrant Client (Pure Pillar C)
        qdrant_host = settings.QDRANT_URL.replace("http://", "").split(":")[0]
        qdrant_port = int(settings.QDRANT_URL.split(":")[-1])
        
        try:
            self.q_client = QdrantClient(host=qdrant_host, port=qdrant_port)
            logger.info("Connected to Pure Qdrant Engine (Pillar C)")
        except Exception as e:
            logger.error(f"Failed to connect to Qdrant: {e}")
            self.q_client = None

    async def get_embedding(self, text: str) -> List[float]:
        """Fetch embeddings from offloaded Ollama service (BGE-M3)."""
        if not text or not text.strip():
            return [0.0] * 1024
            
        try:
            response = requests.post(
                f"{settings.OLLAMA_URL}/api/embeddings",
                json={"model": settings.OLLAMA_EMBED_MODEL, "prompt": text}
            )
            data = response.json()
            if "embedding" in data:
                return data["embedding"]
            else:
                logger.error(f"Ollama embedding error: {data}")
                return [0.0] * 1024
        except Exception as e:
            logger.error(f"Embedding exception: {e}")
            # Fallback to zero vector if service is down (should not happen in prod)
            return [0.0] * 1024 # BGE-M3 dimension

    async def add_documents(self, collection_name: str, documents: List[str], metadatas: List[Dict[str, Any]] = None, ids: List[str] = None):
        """Pure Qdrant Document Storage."""
        if not self.q_client: return
        
        # Ensure collection exists
        try:
            self.q_client.get_collection(collection_name)
        except:
            self.q_client.create_collection(
                collection_name=collection_name,
                vectors_config=models.VectorParams(size=1024, distance=models.Distance.COSINE),
            )
            logger.info(f"Created Qdrant collection: {collection_name}")

        points = []
        import uuid
        for i, text in enumerate(documents):
            vector = await self.get_embedding(text)
            meta = metadatas[i] if metadatas else {}
            meta["content"] = text
            raw_id = ids[i] if (ids and i < len(ids)) else str(uuid.uuid4())
            
            # Convert string ID to valid Qdrant UUID format if needed
            if isinstance(raw_id, str):
                try:
                    uuid.UUID(raw_id)
                    point_id = raw_id
                except ValueError:
                    # Convert 24-char MongoDB ObjectId to UUID format
                    if len(raw_id) == 24:
                        point_id = str(uuid.UUID(raw_id + "00000000"))
                    else:
                        point_id = str(uuid.uuid5(uuid.NAMESPACE_OID, raw_id))
            else:
                point_id = raw_id
            
            points.append(models.PointStruct(
                id=point_id,
                vector=vector,
                payload=meta
            ))

        self.q_client.upsert(collection_name=collection_name, points=points)
        logger.info(f"📥 Synced {len(documents)} points to Qdrant.")
        return [p.id for p in points]

    async def search(
        self, 
        collection_name: str, 
        query: str, 
        limit: int = 3,
        score_threshold: Optional[float] = None,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        High-speed Qdrant Semantic Search (Pillar C).
        Uses modern query_points API for better performance and filtering.
        """
        if not self.q_client: return []
        
        query_vector = await self.get_embedding(query)
        
        # Build query filter if metadata filtering is requested
        query_filter = None
        if filter_metadata:
            must_filters = []
            for key, value in filter_metadata.items():
                must_filters.append(models.FieldCondition(
                    key=key,
                    match=models.MatchValue(value=value)
                ))
            query_filter = models.Filter(must=must_filters)
        
        try:
            # Using query_points (Modern Qdrant API)
            response = self.q_client.query_points(
                collection_name=collection_name,
                query=query_vector,
                limit=limit,
                score_threshold=score_threshold,
                query_filter=query_filter,
                with_payload=True
            )
            
            return [{
                "content": hit.payload.get("content", ""),
                "metadata": hit.payload,
                "score": hit.score
            } for hit in response.points]

        except Exception as e:
            logger.error(f" Qdrant search failed: {e}")
            return []

    async def delete_by_ids(self, collection_name: str, ids: List[str]):
        """Remove specific points from Qdrant by ID."""
        if not self.q_client: return
        
        import uuid
        norm_ids = []
        for raw_id in ids:
            if isinstance(raw_id, str):
                try:
                    uuid.UUID(raw_id)
                    norm_ids.append(raw_id)
                except ValueError:
                    if len(raw_id) == 24:
                        norm_ids.append(str(uuid.UUID(raw_id + "00000000")))
                    else:
                        norm_ids.append(str(uuid.uuid5(uuid.NAMESPACE_OID, raw_id)))
            else:
                norm_ids.append(raw_id)

        try:
            self.q_client.delete(
                collection_name=collection_name,
                points_selector=models.PointIdsList(points=norm_ids)
            )
            logger.info(f" Deleted {len(ids)} points from {collection_name}")
        except Exception as e:
            logger.error(f" Qdrant delete failed: {e}")

    async def delete_by_filter(self, collection_name: str, filter_metadata: Dict[str, Any]):
        """Remove points matching metadata filters."""
        if not self.q_client: return
        
        must_filters = []
        for key, value in filter_metadata.items():
            must_filters.append(models.FieldCondition(
                key=key,
                match=models.MatchValue(value=value)
            ))
        
        try:
            self.q_client.delete(
                collection_name=collection_name,
                points_selector=models.FilterSelector(
                    filter=models.Filter(must=must_filters)
                )
            )
            logger.info(f" Cleaned vectors from {collection_name} matching filter: {filter_metadata}")
        except Exception as e:
            logger.error(f" Qdrant filter delete failed: {e}")

vector_store = VectorStore()
