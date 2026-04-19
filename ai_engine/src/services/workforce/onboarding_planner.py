import json
import os
from typing import List, Dict, Any, Optional
from loguru import logger
from src.config.model_routing import master_model_router, TaskType, RouteDestination

try:
    import spacy
    _spacy_nlp = spacy.load("en_core_web_sm")
except Exception:
    _spacy_nlp = None
    logger.warning("SpaCy model not found. Using fallback NER.")


class OnboardingPlanner:
    """
    The Fractal Brain of Onboarding (V3 - Model Router Powered).
    Handles Deep Discovery, Dependency Graphs, ROI Prediction, and VectorStore Sync.
    Uses model_routing.py (ACTIVE_ROUTING_CONFIG) to dynamically pick Gemini or Local Ollama.
    """

    def __init__(self):
        self.nlp = _spacy_nlp

    async def _call_llm(self, prompt: str) -> dict:
        """
        Universal LLM caller via ModelRouter.
        Routes automatically to Gemini or Local Qwen based on ACTIVE_ROUTING_CONFIG[ONBOARDING].
        """
        route_config = await master_model_router.get_route(TaskType.ONBOARDING)
        provider = route_config["provider"]
        model_name = route_config["model_name"]

        try:
            if provider == RouteDestination.OLLAMA:
                from src.core.ollama_client import ollama_client
                logger.info(f" Onboarding Planner -> Ollama ({model_name})")
                response = await ollama_client.generate(
                    prompt=prompt,
                    model=model_name,
                    system="You are a business analyst AI. Return ONLY valid JSON, no markdown."
                )
                raw = response.get("text", "{}").strip()
            else:
                # Gemini path
                from src.core.gemini_client import gemini_client
                from google.genai import types
                from src.services.ai.config import get_default_config
                logger.info(f" Onboarding Planner -> Gemini ({model_name})")
                contents = [types.Content(role="user", parts=[types.Part(text=prompt)])]
                config_params = {
                    "temperature": 0.2,
                    "system_instruction": "You are a business analyst AI. Return ONLY valid JSON, no markdown.",
                    "response_mime_type": "application/json"
                }
                import asyncio
                from src.core.executor import executor
                config = get_default_config(**config_params)
                response = await asyncio.get_event_loop().run_in_executor(
                    executor,
                    lambda: gemini_client.models.generate_content(
                        model=model_name,
                        contents=contents,
                        config=config
                    )
                )
                raw = response.text.strip()

            # Clean markdown if any
            clean = raw.replace("```json", "").replace("```", "").strip()
            return json.loads(clean)

        except Exception as e:
            logger.error(f" Onboarding LLM call failed ({provider.value}/{model_name}): {e}")
            return {}

    async def run_high_reasoning_discovery(self, business_context: Dict[str, Any], documents: List[Dict[str, Any]], role: str) -> Dict[str, Any]:
        """
        One-time High-Reasoning call to perform deep business DNA extraction.
        """
        doc_names = ", ".join([d.get("name", "Asset") for d in documents])
        prompt = f"""
        Perform a Deep Business DNA Audit for hiring a {role}.
        Business Description: {business_context.get('description', '')}
        Available Assets: {doc_names}
        
        TASKS:
        1. Identify the core Domain (e.g. Fintech, E-commerce).
        2. Extract 5 Critical Business Entities (e.g. Member, Subscription, Inventory).
        3. Identify 3 High-Priority Logical Gaps in the documents.
        4. Propose a NON-LINEAR Roadmap (Graph) of 4-6 steps. Each step must have 'prerequisites' (Step IDs).
        5. Predict ROI: How many hours per month will this agent save in this specific role?
        
        Return ONLY a JSON object with keys: domain, entities, logical_gaps, roadmap, projected_roi.
        """
        result = await self._call_llm(prompt)
        if result:
            logger.info(f" High-Reasoning Discovery Completed for {role}")
            return result
        return self._generate_fallback_discovery(role)

    async def generate_dependency_roadmap(self, discovery_result: Dict[str, Any], documents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Converts the discovery result into a stateful roadmap with dependency checks.
        """
        raw_steps = discovery_result.get("roadmap", [])
        final_roadmap = []
        
        for step in raw_steps:
            status = await self._local_audit(step.get("action", ""), documents)
            final_roadmap.append({
                "id": step.get("id"),
                "label": step.get("label"),
                "action": step.get("action"),
                "prerequisites": step.get("prerequisites", []),
                "status": status,
                "is_locked": len(step.get("prerequisites", [])) > 0,
                "suggested_failsafe": step.get("failsafe", "Contact Boss for clarification.")
            })
            
        return final_roadmap

    async def _local_audit(self, action: str, documents: List[Dict[str, Any]]) -> str:
        """Zero-cost local check using Unified VectorStore (Ollama Embeddings)."""
        if not documents:
            return "Missing Knowledge"
        
        try:
            from src.core.vector_store import vector_store
            doc_source = " ".join([d.get("name", "") + " " + d.get("content", "")[:500] for d in documents])
            q_emb = vector_store._get_ollama_embedding(action)
            d_emb = vector_store._get_ollama_embedding(doc_source[:2000])
            
            import numpy as np
            a = np.array(q_emb)
            b = np.array(d_emb)
            sim = np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
            
            if sim > 0.5: return "Found"
            if sim > 0.35: return "Partial"
            return "Not Found"
        except Exception as e:
            logger.error(f"Local audit failed (vector_store): {e}")
            return "Audit Error"

    async def generate_discovery_interview(self, discovery_result: Dict[str, Any]) -> List[str]:
        """Generate 3-5 targeted questions to resolve logical gaps."""
        gaps = discovery_result.get("logical_gaps", [])
        questions = [f"Regarding {gap}: Can you clarify how you handle this currently?" for gap in gaps[:3]]
        if not questions:
            questions = ["How do you currently handle exceptions in this workflow?"]
        return questions

    def _generate_fallback_discovery(self, role: str) -> Dict[str, Any]:
        """Fallback if LLM call fails."""
        return {
            "domain": "General Business",
            "entities": ["Customer", "Task", "Schedule"],
            "logical_gaps": ["Detailed workflow steps missing"],
            "roadmap": [
                {"id": 1, "label": "Context Mapping", "action": "Analyzing basic business strings.", "prerequisites": []},
                {"id": 2, "label": "Rule Extraction", "action": "Mapping local SOPs to agent logic.", "prerequisites": [1]}
            ],
            "projected_roi": "10-20 hours/month"
        }

    async def sync_roadmap_to_vector_vault(self, agent_id: str, roadmap: List[Dict[str, Any]]):
        """Anchors the roadmap into the Unified VectorStore."""
        try:
            from src.core.vector_store import vector_store
            for step in roadmap:
                await vector_store.add_documents(
                    collection_name=f"roadmap_{agent_id}",
                    documents=[step["action"]],
                    metadatas=[{"label": step["label"], "status": step["status"]}]
                )
            logger.info(f" Syncing Roadmap for Agent {agent_id} to Vector Vault.")
        except Exception as e:
            logger.error(f"Failed to sync roadmap: {e}")

# Singleton for easy access
onboarding_planner = OnboardingPlanner()
