"""
Metadata Aggregator Service
Fetches and aggregates metadata (description, intent, keywords) from Brain Studio sources.
NO RAW FILE CONTENT - Only metadata!
"""

from typing import List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient
from loguru import logger
from datetime import datetime, timedelta
import os

# Simple cache for metadata (5 min TTL)
_metadata_cache: Dict[str, tuple[List[Dict[str, Any]], datetime]] = {}
CACHE_TTL_SECONDS = 300  # 5 minutes

class MetadataAggregator:
    def __init__(self):
        mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/cluaiz")
        self.client = AsyncIOMotorClient(mongo_uri)
        self.db = self.client.get_default_database()
        
    async def fetch_user_metadata(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Fetch ALL metadata from user's Brain Studio sources.
        Returns: List of {description, intent, keywords, source_type, source_id}
        CACHED for 5 minutes to avoid repeated DB queries.
        """
        # Check cache first
        if user_id in _metadata_cache:
            cached_data, cached_time = _metadata_cache[user_id]
            if datetime.now() - cached_time < timedelta(seconds=CACHE_TTL_SECONDS):
                logger.info(f" Cache HIT for user {user_id} ({len(cached_data)} sources)")
                return cached_data
        
        try:
            # Query sources collection
            sources = await self.db.sources.find({
                "userId": user_id,
                "status": {"$in": ["completed", "indexed"]}
            }).to_list(length=None)
            
            metadata_list = []
            
            for source in sources:
                metadata = {
                    "source_id": str(source.get("_id")),
                    "source_type": source.get("type", "unknown"),
                    "title": source.get("text", "Untitled"),
                    "description": source.get("metadata", {}).get("description", ""),
                    "intent": source.get("metadata", {}).get("intent", []),
                    "keywords": source.get("metadata", {}).get("keywords", []),
                    "url": source.get("url", "")
                }
                
                # Only include if there's meaningful metadata
                if metadata["description"] or metadata["keywords"]:
                    metadata_list.append(metadata)
            
            # Store in cache
            _metadata_cache[user_id] = (metadata_list, datetime.now())
            
            logger.info(f" Fetched & CACHED {len(metadata_list)} metadata sources for user {user_id}")
            return metadata_list
            
        except Exception as e:
            logger.error(f"Error fetching metadata: {e}")
            return []
    
    async def aggregate_by_role(self, metadata_list: List[Dict[str, Any]], role: str) -> str:
        """
        Aggregate metadata and format for specific AI role.
        Returns: Formatted string for LLM context
        """
        if not metadata_list:
            return "No metadata available."
        
        # Build role-specific context
        context_parts = []
        
        # Add summary header
        context_parts.append(f"=== BUSINESS KNOWLEDGE BASE ({len(metadata_list)} sources) ===\n")
        
        for idx, meta in enumerate(metadata_list, 1):
            source_block = []
            source_block.append(f"SOURCE {idx}: {meta['title']}")
            
            if meta['description']:
                source_block.append(f"Description: {meta['description']}")
            
            if meta['keywords']:
                keywords_str = ", ".join(meta['keywords'][:10])  # Limit keywords
                source_block.append(f"Keywords: {keywords_str}")
            
            if meta['intent']:
                intents_str = ", ".join(meta['intent'][:5])
                source_block.append(f"Intent: {intents_str}")
            
            context_parts.append("\n".join(source_block))
            context_parts.append("-" * 50)
        
        aggregated = "\n\n".join(context_parts)
        return aggregated
    
    def count_metadata_tokens(self, aggregated_text: str) -> int:
        """
        Estimate token count (simple char/4 method).
        For accurate counting, use tiktoken in token_estimator.py
        """
        return len(aggregated_text) // 4

# Singleton instance
metadata_aggregator = MetadataAggregator()
