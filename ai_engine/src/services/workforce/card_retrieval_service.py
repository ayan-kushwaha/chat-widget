"""
Card Retrieval Service (Pillar C)
Fetches relevant Protocol Cards from Unified VectorStore (Qdrant/Chroma).
"""

from typing import List, Dict, Any
from loguru import logger
from src.core.vector_store import vector_store

class CardRetrievalService:
    def __init__(self):
        # Collection name for protocol cards
        self.collection_name = "protocol_cards"
        logger.info(f" CardRetrievalService initialized for collection: {self.collection_name}")
    
    async def store_card_embedding(self, card: Dict[str, Any]) -> bool:
        """
        Store Protocol Card in Unified VectorStore.
        """
        try:
            card_id = card.get("card_id")
            
            # Create searchable text from card content
            searchable_text = f"{card.get('title', '')} {card.get('description', '')} {card.get('content', '')}"
            keywords_text = " ".join(card.get('keywords', []))
            intent_text = " ".join(card.get('intent', []))
            full_text = f"{searchable_text} {keywords_text} {intent_text}"
            
            # Store using unified vector_store
            await vector_store.add_documents(
                collection_name=self.collection_name,
                documents=[full_text],
                ids=[card_id],
                metadatas=[{
                    "user_id": str(card.get("user_id")),
                    "agent_id": card.get("agent_id"),
                    "title": card.get("title"),
                    "rule_type": card.get("rule_type"),
                    "priority": card.get("priority"),
                    "status": card.get("status", "active")
                }]
            )
            
            logger.info(f" Stored card in Unified VectorStore: {card_id}")
            return True
        except Exception as e:
            logger.error(f" Failed to store card embedding: {e}")
            return False
    
    async def query_relevant_cards(self, user_id: str, agent_id: str, 
                                   query_text: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Query Unified VectorStore for relevant Protocol Cards.
        """
        try:
            # Search using unified vector_store (Handles Qdrant/Chroma logic)
            results = await vector_store.search(
                collection_name=self.collection_name,
                query=query_text,
                limit=top_k
            )
            
            # Filter results by user_id and agent_id if needed 
            # (In production, we would use native filter params in Qdrant/Chroma)
            cards = []
            for r in results:
                meta = r.get("metadata", {})
                # Simple post-search filtering for now (Unified search handles basic retrieval)
                if str(meta.get("user_id")) == str(user_id) and meta.get("agent_id") == agent_id:
                    cards.append({
                        "card_id": meta.get("id") or meta.get("points_id"),
                        "title": meta.get("title"),
                        "content": r.get("content"),
                        "rule_type": meta.get("rule_type"),
                        "priority": meta.get("priority"),
                        "relevance_score": r.get("score", 0.0)
                    })
            
            logger.info(f" Retrieved {len(cards)} relevant cards for query: '{query_text[:50]}...'")
            return cards
        except Exception as e:
            logger.error(f" Failed to query cards: {e}")
            return []
    
    def inject_cards_to_context(self, cards: List[Dict[str, Any]]) -> str:
        """
        Format retrieved cards for LLM context injection.
        """
        if not cards:
            return ""
        
        context_parts = ["=== RELEVANT PROTOCOL CARDS ===\n"]
        for idx, card in enumerate(cards, 1):
            priority_emoji = {"critical": "", "high": "", "medium": "", "low": ""}.get(
                card.get("priority", "medium"), ""
            )
            card_block = [
                f"{priority_emoji} CARD {idx}: {card.get('title', 'Unknown')}",
                f"Type: {card.get('rule_type', 'knowledge')}",
                f"Content: {card.get('content', '')}",
                "-" * 40
            ]
            context_parts.append("\n".join(card_block))
        
        return "\n\n".join(context_parts)

# Singleton instance
card_retrieval_service = CardRetrievalService()
