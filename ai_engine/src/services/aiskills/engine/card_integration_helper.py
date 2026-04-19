"""
Protocol Card Integration Helper
Add this to base_employee.py for card retrieval
"""

async def _fetch_protocol_cards(self, user_id: str, user_message: str, top_k: int = 5):
    """
    Fetch relevant Protocol Cards for conversation context.
    Called before LLM generation in fallback conversation.
    """
    try:
        from src.services.workforce.card_retrieval_service import card_retrieval_service
        
        # Query ChromaDB for relevant cards
        relevant_cards = await card_retrieval_service.query_relevant_cards(
            user_id=user_id,
            agent_id=self.folder_name,  # e.g., "rocky_sales"
            query_text=user_message,
            top_k=top_k
        )
        
        # Format cards for LLM context
        if relevant_cards:
            cards_context = card_retrieval_service.inject_cards_to_context(relevant_cards)
            logger.info(f" Injected {len(relevant_cards)} Protocol Cards into context")
            return cards_context, relevant_cards
        
        return "", []
        
    except Exception as e:
        logger.error(f"Failed to fetch Protocol Cards: {e}")
        return "", []


async def _track_card_usage(self, cards: list, user_id: str):
    """Update usage analytics for retrieved cards"""
    if not cards:
        return
    
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        from datetime import datetime
        import os
        
        mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/cluaiz")
        client = AsyncIOMotorClient(mongo_uri)
        db = client.get_default_database()
        
        for card in cards:
            card_id = card.get("card_id")
            if card_id:
                await db.protocolcards.update_one(
                    {"card_id": card_id},
                    {
                        "$inc": {"usage_count": 1},
                        "$set": {"last_used_at": datetime.utcnow()}
                    }
                )
        
        logger.info(f" Updated usage for {len(cards)} cards")
        
    except Exception as e:
        logger.error(f"Failed to track card usage: {e}")


# Usage in _fallback_conversation method:
"""
async def _fallback_conversation(self, user_message: str, intent: str, entities: dict, lang: str) -> dict:
    # ... existing code ...
    
    # NEW: Fetch Protocol Cards BEFORE LLM call
    cards_context, used_cards = await self._fetch_protocol_cards(
        user_id=context.get("user_id", "unknown"),
        user_message=user_message,
        top_k=5
    )
    
    # Inject cards into system prompt
    enhanced_prompt = self.system_prompt
    if cards_context:
        enhanced_prompt = f\"\"\"{self.system_prompt}

{cards_context}

**IMPORTANT:** Use the above Protocol Cards to inform your response. 
Prioritize information from critical/high priority cards.
\"\"\"
    
    # Call LLM with enhanced context
    response = await chat_ai_service.generate_content(
        contents=conversation_history,
        config={"system_instruction": enhanced_prompt, ...}
    )
    
    # Track card usage (async, fire-and-forget)
    if used_cards:
        asyncio.create_task(self._track_card_usage(used_cards, user_id))
    
    return {"reply": response.text, "agent_name": self.name}
"""
