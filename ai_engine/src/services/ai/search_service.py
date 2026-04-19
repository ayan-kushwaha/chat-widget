from typing import List, Dict, Optional, Any
from src.core.memory import memory
from src.utils.logger import logger
import re

class SearchService:
    """
    Powerful Global Search Service
    Handles hybrid search (Semantic + Keyword) across chat history.
    """

    async def global_search(self, query: str, org_id: str, n_results: int = 15) -> List[Dict[str, Any]]:
        """
        Performs a semantic search across indexed messages for an organization.
        """
        try:
            # We use a dedicated collection for messages per organization
            collection_name = f"msg_{org_id}"
            
            logger.info(f" [SearchService] Performing semantic search in {collection_name} for: {query}")
            
            # 1. Intent Recognition (Meta-Filters)
            # If user searches for "image", "png", "voice", etc.
            # We can use metadata filters for more accurate results.
            where_filter = None
            q = query.lower().strip()
            
            if "image" in q or "img" in q or "png" in q or "jpg" in q:
                where_filter = {"type": "image"}
            elif "voice" in q or "audio" in q or "recording" in q:
                where_filter = {"type": {"$in": ["voice", "audio"]}}
            elif "call" in q or "dial" in q:
                where_filter = {"type": "call"}

            # 2. Hybrid Search (Vector + Optional Meta Filter)
            results = await memory.query_similar(
                query_text=query,
                n_results=n_results,
                collection_name=collection_name,
                where=where_filter
            )
            
            processed_results = []
            for res in results:
                processed_results.append({
                    "chatId": res.get("metadata", {}).get("chatId"),
                    "messageId": res.get("id"),
                    "content": res.get("content"),
                    "metadata": res.get("metadata"),
                    "score": res.get("score", 0)
                })
                
            return processed_results

        except Exception as e:
            logger.error(f" Search Service Failed: {str(e)}")
            return []

    async def index_message(self, org_id: str, chat_id: str, message_id: str, content: str, metadata: Dict[str, Any]):
        """
        Indexes a new message into the vector store.
        """
        try:
            collection_name = f"msg_{org_id}"
            
            # Enrich metadata
            enriched_metadata = {
                **metadata,
                "orgId": org_id,
                "chatId": chat_id,
                "messageId": message_id,
                "type": metadata.get("type", "text")
            }
            
            # Basic content cleaning
            clean_content = content.strip()
            if not clean_content or len(clean_content) < 2:
                return False
                
            success = await memory.add_document(
                collection_name=collection_name,
                document=clean_content,
                metadata=enriched_metadata,
                doc_id=message_id
            )
            
            if success:
                logger.info(f" Indexed message {message_id} for chat {chat_id}")
            return success

        except Exception as e:
            logger.error(f" Indexing Failed for message {message_id}: {str(e)}")
            return False

    async def delete_message(self, org_id: str, message_id: str) -> bool:
        """
        Removes a message from the vector index.
        """
        try:
            collection_name = f"msg_{org_id}"
            success = await memory.delete_document(collection_name, message_id)
            if success:
                logger.info(f" [SearchService] Removed vector for message {message_id}")
            return success
        except Exception as e:
            logger.error(f" Deletion Failed for message {message_id}: {str(e)}")
            return False

search_service = SearchService()
