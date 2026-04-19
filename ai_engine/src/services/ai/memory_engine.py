from typing import List, Dict, Optional, Any
import json
import re
from src.utils.logger import logger
from src.services.ai.chat_service import chat_ai_service
from src.core.memory import memory

class MemoryEngine:
    """
    Rule 7: Auto-Learning (Discovery Layer).
    Rule 11: Smart Hybrid Memory (The Data Vault).
    Rule 12: Conditional Context Injection (Dependency Check).
    """
    
    @staticmethod
    async def discover_new_learnings(query: str, response: str, user_id: str = "system") -> Optional[str]:
        """
        Analyzes the interaction to see if a new fact was shared.
        """
        prompt = f"""
        Analyze the following conversation between a User and an AI Assistant.
        Has the User shared a NEW FACT about themselves (name, preference, business context)?
        
        Conversation:
        User: "{query}"
        AI: "{response}"
        
        Return ONLY a concise single-line description of the fact if found, otherwise return "None".
        Always phrase as: "User's [fact] is [value]". 
        Example: "User's name is Shani".
        """
        
        try:
            result = await chat_ai_service.generate_response(
                user_message=prompt,
                user_id=user_id, #  Passed Correctly
                system_instruction="You are a data extraction bot. Be concise and accurate."
            )
            
            fact = result.get("text", "").strip()
            if fact.lower() == "none" or len(fact) < 5:
                # Secondary check: If user said "My name is X" or "Mera naam X hai"
                q = query.lower()
                if "name is" in q or "naam" in q:
                    # Try simple extract
                    parts = query.split()
                    if len(parts) > 2:
                        return f"User's name might be {parts[-1]}"
                return None
                
            logger.info(f" [MemoryEngine] New potential learning discovered: {fact}")
            return fact
        except Exception as e:
            logger.error(f" MemoryEngine Analysis Failed: {e}")
            return None

    @staticmethod
    async def save_fact(user_id: str, org_id: str, fact: str):
        """
        Saves a discovered fact to the user's permanent vector memory.
        """
        garbage_terms = ["hi", "hello", "ok", "thanks", "wow", "nice", "none", "no fact"]
        if any(term in fact.lower() for term in garbage_terms):
            return

        try:
            await memory.add_document(
                collection_name=f"mem_{user_id}", 
                document=fact,
                metadata={"type": "user_fact", "userId": user_id, "orgId": org_id, "timestamp": "now"}
            )
            logger.info(f" [MemoryEngine] Fact saved for User {user_id}: {fact}")
        except Exception as e:
            logger.error(f" Failed to save fact to Vector DB: {e}")

    @staticmethod
    async def recall_facts(user_id: str, query: str, query_embedding: Optional[List[float]] = None) -> str:
        """
        Retrieves relevant long-term facts.
        """
        try:
            identity_keywords = ["name", "naam", "identity", "who am i", "who is this", "mera nam", "hi", "hello", "hey", "namaste", "hola", "sup"]
            is_identity_query = any(k in query.lower() for k in identity_keywords)
            
            fact_results = []
            
            # 1. Standard Vector Search
            matches = await memory.query_similar(query, n_results=3, collection_name=f"mem_{user_id}", query_embedding=query_embedding)
            if matches:
                 fact_results.extend([m['content'] for m in matches])
            
            # 2. TARGETED IDENTITY FALLBACK
            if is_identity_query or not matches:
                # Note: For targeted identity fallback, we still do a separate query if needed, 
                # but we could also use the same embedding if it's general enough.
                # For now, let's just pass the same one to save time.
                name_matches = await memory.query_similar("User's name is", n_results=2, collection_name=f"mem_{user_id}", query_embedding=None) # Keep None for specific search
                if name_matches:
                    for nm in name_matches:
                        if nm['content'] not in fact_results:
                            fact_results.insert(0, nm['content']) 
            
            if not fact_results:
                return ""
            
            unique_facts = list(dict.fromkeys(fact_results))[:5]
            logger.info(f" [MemoryEngine] Recalled {len(unique_facts)} facts for {user_id}")

            return "USER FACTS RECORDED (USE AS IDENTITY):\n- " + "\n- ".join(unique_facts)
        except Exception as e:
            logger.debug(f" No user memory found for: {user_id}")
            return ""

    @staticmethod
    def check_dependency(query: str) -> bool:
        """
        Logic to see if user is referring to previous context.
        """
        q = query.lower().strip()
        
        # English & Hindi/Hinglish Markers
        markers = [
            r"\bit\b", r"\bthat\b", r"\bthis\b", r"\bthey\b", r"\bhim\b", r"\bher\b",
            r"\byes\b", r"\bno\b", r"\bwhy\b", r"\bcontinue\b", r"\bmore\b", r"\bnext\b",
            r"iska", r"uska", r"wo", r"ye", r"haan", r"nahi", r"aur batao", r"to batao", r"to kia"
        ]
        
        all_regex = "|".join(markers)
        if re.search(all_regex, q):
            return True
        
        if len(q.split()) < 3 and "?" in q:
            return True

        return False

    @staticmethod
    def is_likely_statement(query: str) -> bool:
        """
        Lightweight check to see if the user is sharing information.
        """
        q = query.lower().strip()
        
        statement_indicators = [
            "hai", "hote hain", "khulta hai", "band hota hai", 
            "is at", "we use", "%", "my name", "i have", "we have",
            "mera naam", "mera budget", "our office", "office opens"
        ]
        
        if any(ind in q for ind in statement_indicators):
            return True
            
        if len(q) > 30 and "?" not in q:
            return True
            
        return False

import redis

class SessionManager:
    """
    Stateful 'Sticky' Routing Manager.
    Uses Redis to remember the active employee/flow per user session.
    """
    def __init__(self):
        try:
            self.redis = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
            self.redis.ping()
        except redis.ConnectionError:
            self.redis = None
            logger.warning(" Redis not available. Stateful Sessions will fall back to stateless.")

    def set_active_session(self, user_id: str, source_id: str, ttl_seconds: int = 3600):
        if self.redis:
            self.redis.setex(f"sticky_session:{user_id}", ttl_seconds, source_id)
            logger.info(f" [Session] User {user_id} locked to Source {source_id}")

    def get_active_session(self, user_id: str) -> Optional[str]:
        if self.redis:
            val = self.redis.get(f"sticky_session:{user_id}")
            if val:
                logger.info(f" [Session] Sticky Source {val} recovered for {user_id}")
            return val
        return None

    def clear_session(self, user_id: str):
        if self.redis:
            self.redis.delete(f"sticky_session:{user_id}")
            logger.info(f" [Session] Cleared for Handover: User {user_id}")

memory_engine = MemoryEngine()
session_manager = SessionManager()
