from typing import List, Dict, Optional, Tuple, Any
import numpy as np
import os
from loguru import logger
from src.core.vector_store import vector_store

class AmbiguityEngine:
    """
    AMBIGUITY ENGINE V5 (The Semantic Router & Intent Resolver)
    Consolidated Authority for understanding user intent and mapping to phases/employees.
    Exclusively powered by Ollama (BGE-M3) embeddings.
    """
    
    _scope_cache = {}

    def __init__(self, org_id: str = None):
        self.org_id = org_id
        self.sources = [] # Knowledge map sources

    def _cosine_similarity(self, v1: List[float], v2: List[float]) -> float:
        """Simple Cosine Similarity using NumPy (Replaces torch/util.cos_sim)"""
        v1 = np.array(v1)
        v2 = np.array(v2)
        return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))

    async def encode(self, text: str) -> List[float]:
        """Generates vector embedding for the input text using Ollama."""
        return await vector_store.get_embedding(text)

    async def refresh_knowledge_map(self):
        """Stub for compatibility."""
        return

    async def get_scope_embedding(self, org_name: str, goals: List[str] = None):
        """Creates or retrieves business truth vector."""
        if not goals: goals = ["providing helpful services"]
        cache_key = f"{org_name}_{'_'.join(goals)}"
        
        if cache_key not in self._scope_cache:
            scope_text = f"{org_name} is focused on: " + ", ".join(goals)
            self._scope_cache[cache_key] = await self.encode(scope_text)
            
        return self._scope_cache[cache_key]

    async def analyze_intent(self, query: str, org_name: str = "this organization", description: str = "", user_role: str = "customer") -> Dict[str, Any]:
        """
        High-level analysis pass. 
        Checks Relevance and Maps to Core Business Intents.
        """
        user_embedding = await self.encode(query)
        
        # 1. Relevance Check (Baseline: 0.15)
        scope_embedding = await self.get_scope_embedding(org_name)
        relevance_score = self._cosine_similarity(user_embedding, scope_embedding)
        
        # 2a. FAST GUARDRAILS (Neuro-Symbolic Local Filter)
        query_lower = query.lower()
        guardrails = ["pagal", "stupid", "idiot", "bakwaas", "weather", "mausam", "cricket", "score", "modi", "election", "politics", "sex", "date", "love", "hate", "kill", "shut up"]
        
        hit = next((word for word in guardrails if word in query_lower), None)
        if hit:
            return {
                "status": "filtered",
                "intent": "irrelevant",
                "score": 1.0,
                "match": "guardrail_keyword",
                "options": []
            }

        # 3. Intent Mapping Logic
        context_str = f"Context: {description}." if description else ""
        
        intent_definitions = {
            "greeting": "A standard opening greeting like hello, hi, namaste, kaiso ho, hey, good morning.",
            "identity_intent": "sharing personal identity, name, or phone number to register.",
            "discovery": f"asking what {org_name} does, exploring services, catalogue, menu, list, collection. {context_str}",
            "solution": f"asking how {org_name} works, methodology, process. {context_str}",
            "booking": f"desire to schedule a meeting, book an appointment, reserve a table for {org_name}. {context_str}",
            "purchasing": f"inquiries regarding buying, costs, price, checkout for {org_name}. {context_str}",
            "support": f"reporting an issue, complaint, bug, refund, status with {org_name}. {context_str}",
            "knowledge": f"asking for specific policies, manuals, terms, documents of {org_name}. {context_str}"
        }
        
        if user_role == "admin":
            admin_intents = {
                "admin_analytics": f"BUSINESS PERFORMANCE: Fetching revenue stats, earnings, and analytics for {org_name}.",
                "admin_inventory": f"INVENTORY MANAGEMENT: Updating stock, prices, adding/deleting items for {org_name}.",
                "admin_control": f"SYSTEM GOVERNANCE: Changing bot settings, behavior, emergency pause for {org_name}."
            }
            intent_definitions.update(admin_intents)
        
        scores = {}
        for intent, description in intent_definitions.items():
            desc_embedding = await self.encode(description)
            score = self._cosine_similarity(user_embedding, desc_embedding)
            if user_role == "admin" and intent.startswith("admin_"):
                score += 0.05 
            scores[intent] = score

        best_intent = max(scores, key=scores.get)
        best_score = scores[best_intent]

        # 4. BUSINESS PRIORITY LOGIC
        business_intents = ["sales", "support", "booking", "solution", "discovery", "identity_intent", "admin_analytics", "admin_inventory", "admin_control"]
        if best_intent in ["greeting", "irrelevant"]:
            potential_business = {k: v for k, v in scores.items() if k in business_intents and v > 0.28}
            if potential_business:
                best_intent = max(potential_business, key=potential_business.get)
                best_score = potential_business[best_intent]

        # 5. AMBIGUITY DETECTION
        sorted_intents = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        top_intent, top_score = sorted_intents[0]
        second_intent, second_score = sorted_intents[1] if len(sorted_intents) > 1 else (None, 0.0)
        
        if 0.20 <= top_score < 0.45:
            return {
                "status": "ambiguous",
                "intent": "ambiguous",
                "score": top_score,
                "match": None,
                "options": [top_intent, second_intent] if second_score > 0.15 else [top_intent]
            }

        if top_score >= 0.45 and (top_score - second_score) < 0.02:
             return {
                "status": "ambiguous",
                "intent": "ambiguous",
                "score": top_score,
                "match": None,
                "options": [top_intent, second_intent]
            }

        if best_score < 0.20:
            best_intent = "irrelevant"

        return {
            "status": "confirmed" if best_score >= 0.45 else "low_confidence",
            "intent": best_intent,
            "score": best_score,
            "match": None,
            "options": []
        }

    async def find_best_match(self, user_text: str, phase_configs: List[Dict]) -> Tuple[Optional[str], float]:
        user_embedding = await self.encode(user_text)
        best_phase = None
        highest_score = 0.0

        for config in phase_configs:
            phase_id = config['phase_id']
            keywords = config.get('keywords', [])
            if not keywords: continue
            
            # Using async loop for keyword embeddings
            keyword_scores = []
            for kw in keywords:
                kw_emb = await self.encode(kw)
                keyword_scores.append(self._cosine_similarity(user_embedding, kw_emb))
            
            if not keyword_scores: continue
            max_score = max(keyword_scores)

            if max_score > highest_score:
                highest_score = max_score
                best_phase = phase_id

        return best_phase, highest_score

# Singleton Instance
engine = AmbiguityEngine()
