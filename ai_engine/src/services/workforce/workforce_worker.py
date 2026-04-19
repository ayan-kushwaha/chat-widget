"""
Training Worker - Background job processor for AI Employee training.
Listens to Redis queue, processes metadata, calls Gemini API, generates Protocol Cards.
"""

import asyncio
import redis
import json
from typing import Dict, Any, List
from loguru import logger
from motor.motor_asyncio import AsyncIOMotorClient
import os

from src.services.workforce.metadata_aggregator import metadata_aggregator
from src.services.workforce.token_estimator import token_estimator
from src.services.workforce.model_configs import get_training_config, SAFETY_SETTINGS
from src.services.workforce.output_parser import output_parser
from src.services.workforce.training_prompts import build_training_prompt
from src.services.ai.chat_service import chat_ai_service
from google.genai import types

class WorkforceWorker:
    def __init__(self):
        # Redis connection
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.redis_client = redis.from_url(redis_url)
        
        # MongoDB connection
        mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/cluaiz")
        self.mongo_client = AsyncIOMotorClient(mongo_uri)
        self.db = self.mongo_client.get_default_database()
        
        # Queue name
        self.queue_name = "workforce-queue"
        
    async def process_training_job(self, job_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main training job processor.
        Steps:
        1. Fetch metadata
        2. Check if chunking needed
        3. Call Gemini API (with chunks if needed)
        4. Parse Protocol Cards
        5. Store in MongoDB + ChromaDB
        6. Return results
        """
        try:
            user_id = job_data.get("user_id")
            agent_id = job_data.get("agent_id")
            model_key = job_data.get("model_key")
            model_name = job_data.get("model_name", "Gemini 2.0 Flash")
            
            logger.info(f" Starting training for {agent_id} (user: {user_id}) with {model_name}")
            
            # Step 1: Fetch metadata
            metadata_list = await metadata_aggregator.fetch_user_metadata(user_id)
            if not metadata_list:
                return {
                    "status": "failed",
                    "error": "No metadata found for user"
                }
            
            # Step 2: Aggregate for role
            aggregated_metadata = await metadata_aggregator.aggregate_by_role(
                metadata_list, agent_id
            )
            
            # Step 3: Check chunking
            total_tokens = token_estimator.count_tokens(aggregated_metadata)
            logger.info(f" Total metadata tokens: {total_tokens}")
            
            if total_tokens > 100000:
                return {
                    "status": "failed",
                    "error": "Metadata exceeds 100k token limit. Please reduce sources."
                }
            
            # Step 4: Generate Protocol Cards
            if total_tokens > 80000:
                # Use chunking
                cards = await self._train_with_chunking(
                    aggregated_metadata, agent_id, model_name
                )
            else:
                # Single call
                cards = await self._train_simple(
                    aggregated_metadata, agent_id, model_name
                )
            
            # Step 5: Store cards in database
            stored_count = await self._store_protocol_cards(
                cards, user_id, agent_id
            )
            
            logger.info(f" Training complete! Generated {stored_count} Protocol Cards")
            
            # Step 6: Send completion notification to user
            await self._send_training_notification(user_id, agent_id, stored_count)
            
            return {
                "status": "completed",
                "cards_generated": stored_count,
                "total_tokens_processed": total_tokens
            }
            
        except Exception as e:
            logger.error(f" Training job failed: {e}")
            return {
                "status": "failed",
                "error": str(e)
            }
    
    async def _train_simple(self, metadata: str, agent_id: str, model_name: str) -> List[Dict[str, Any]]:
        """Single API call for <80k tokens"""
        
        # Extract role from agent_id (e.g., "rocky_sales" -> "sales")
        role = agent_id.split("_")[-1] if "_" in agent_id else "generic"
        
        # Build role-specific training prompt
        system_prompt = build_training_prompt(agent_id, metadata, role)
        
        # Get model-specific config based on role
        model_config = get_training_config(model_name, role=role)
        
        logger.info(f" Using config: temp={model_config.get('temperature')}, top_p={model_config.get('top_p')}")
        
        contents = [types.Content(role="user", parts=[types.Part(text=metadata)])]
        config = {
            "system_instruction": system_prompt,
            "temperature": model_config.get("temperature", 0.7),
            "top_p": model_config.get("top_p", 0.9),
            "top_k": model_config.get("top_k", 40),
            "max_output_tokens": model_config.get("max_output_tokens", 8192),
            "response_mime_type": "application/json"
        }
        
        response = await chat_ai_service.generate_content(contents, config)
        
        # Validate and parse output
        valid_cards, errors = output_parser.validate_and_parse(response.text)
        
        if errors:
            logger.warning(f" Validation errors in training output: {errors[:3]}")
        
        if not valid_cards:
            logger.error(" No valid cards generated!")
            return []
        
        logger.info(f" Generated {len(valid_cards)} valid Protocol Cards")
        return valid_cards
    
    async def _train_with_chunking(self, metadata: str, agent_id: str, model_name: str) -> List[Dict[str, Any]]:
        """Multiple API calls for >80k tokens, then merge results"""
        chunks = token_estimator.calculate_chunks(metadata, chunk_size=80000)
        logger.info(f" Processing {len(chunks)} chunks")
        
        all_cards = []
        
        for idx, chunk in enumerate(chunks, 1):
            logger.info(f" Processing chunk {idx}/{len(chunks)}")
            chunk_cards = await self._train_simple(chunk, agent_id, model_name)
            all_cards.extend(chunk_cards)
        
        # Deduplicate cards based on title/content similarity
        unique_cards = self._deduplicate_cards(all_cards)
        logger.info(f" Deduplicated {len(all_cards)}  {len(unique_cards)} cards")
        
        return unique_cards
    
    def _deduplicate_cards(self, cards: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicate cards based on title similarity"""
        seen_titles = set()
        unique = []
        
        for card in cards:
            title = card.get("title", "").strip().upper()
            if title and title not in seen_titles:
                seen_titles.add(title)
                unique.append(card)
        
        return unique
    
    async def _store_protocol_cards(self, cards: List[Dict[str, Any]], 
                                    user_id: str, agent_id: str) -> int:
        """Store generated cards in MongoDB and ChromaDB"""
        from bson import ObjectId
        from src.services.workforce.card_retrieval_service import card_retrieval_service
        
        stored = 0
        for card in cards:
            try:
                card_doc = {
                    "user_id": ObjectId(user_id),
                    "agent_id": agent_id,
                    "card_id": f"{agent_id}_{card.get('title', 'unknown')}_{stored}",
                    "title": card.get("title", "Untitled"),
                    "description": card.get("description", ""),
                    "rule_type": card.get("rule_type", "knowledge"),
                    "priority": card.get("priority", "medium"),
                    "content": card.get("content", ""),
                    "keywords": card.get("keywords", []),
                    "intent": card.get("intent", []),
                    "data_source": "metadata_extraction",
                    "confidence": card.get("confidence", 0.8),
                    "status": "active",
                    "verified": False,
                    "version": 1,
                    "created_by": "ai",
                    "usage_count": 0
                }
                
                # Store in MongoDB
                await self.db.protocolcards.insert_one(card_doc)
                
                # Also store in ChromaDB for vector search
                await card_retrieval_service.store_card_embedding(card_doc)
                
                stored += 1
                
            except Exception as e:
                logger.error(f"Failed to store card: {e}")
        
        return stored
    
    async def _send_training_notification(self, user_id: str, agent_id: str, cards_count: int):
        """Send push notification to user about training completion"""
        try:
            import aiohttp
            
            backend_url = os.getenv("BACKEND_URL", "http://localhost:3000")
            notification_payload = {
                "userId": user_id,
                "title": " AI Employee Training Complete!",
                "body": f"Your AI employee '{agent_id}' is trained with {cards_count} Protocol Cards",
                "icon": "/icons/cluaiz-logo.png",
                "badge": "/icons/badge.png",
                "data": {
                    "type": "training_complete",
                    "agent_id": agent_id,
                    "cards_count": cards_count,
                    "url": f"/workforce/{agent_id}/cards"
                }
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{backend_url}/api/notifications/send",
                    json=notification_payload,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    if response.status == 200:
                        logger.info(f" Notification sent to user {user_id}")
                    else:
                        logger.warning(f" Notification failed: {response.status}")
                        
        except Exception as e:
            logger.error(f" Failed to send notification: {e}")
            # Don't fail the job if notification fails
    
    def _build_training_prompt(self, agent_id: str) -> str:
        """Build system prompt for Protocol Card generation"""
        return f"""You are an AI Training Specialist generating Strategic Protocol Cards for {agent_id}.

**Your Task:**
Analyze the provided business knowledge metadata and extract 15-25 Protocol Cards.

**Protocol Card Format:**
Each card should be a JSON object with:
- title: Short, uppercase identifier (e.g., "REFUND_POLICY", "PRICING_B2B")
- description: Human-readable summary
- rule_type: "policy" | "workflow" | "knowledge" | "constraint"
- priority: "critical" | "high" | "medium" | "low"
- content: The actual rule/knowledge (2-3 sentences)
- keywords: Array of searchable keywords (5-10 words)
- intent: Array of user intents this card addresses (e.g., ["refund_request", "pricing_query"])
- confidence: 0.0-1.0 score

**Output JSON Schema:**
{{
    "protocol_cards": [
        {{
            "title": "EXAMPLE_CARD",
            "description": "Brief description",
            "rule_type": "policy",
            "priority": "high",
            "content": "The actual rule text here.",
            "keywords": ["keyword1", "keyword2"],
            "intent": ["intent1", "intent2"],
            "confidence": 0.9
        }}
    ]
}}

**Focus Areas:**
- Extract clear business policies
- Identify common customer questions
- Define workflows and processes
- Document constraints and limitations

Output ONLY valid JSON. No explanations."""
    
    async def start_worker(self):
        """Start listening to Redis queue"""
        logger.info(f" Training Worker started, listening to {self.queue_name}")
        
        while True:
            try:
                # Pop job from queue (blocking with 1s timeout)
                job_raw = self.redis_client.blpop(self.queue_name, timeout=1)
                
                if job_raw:
                    _, job_data_str = job_raw
                    job_data = json.loads(job_data_str)
                    
                    logger.info(f" Received job: {job_data.get('job_id')}")
                    
                    # Process job
                    result = await self.process_training_job(job_data)
                    
                    # Update job status in Redis
                    self.redis_client.set(
                        f"job:{job_data.get('job_id')}:result",
                        json.dumps(result),
                        ex=86400  # Expire after 24 hours
                    )
                    
            except Exception as e:
                logger.error(f"Worker error: {e}")
                await asyncio.sleep(1)

# Singleton instance
workforce_worker = WorkforceWorker()

# Run worker if executed directly
if __name__ == "__main__":
    asyncio.run(workforce_worker.start_worker())
