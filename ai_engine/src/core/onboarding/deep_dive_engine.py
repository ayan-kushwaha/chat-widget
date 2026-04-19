import os
import json
from typing import Dict, Any, List
from loguru import logger
from src.config.model_routing import master_model_router, TaskType, RouteDestination


class DeepDiveEngine:
    """
     The Rule Discovery Engine (V2  Model Router Powered).
    Maps Skill Manifest "Needs" to Knowledge Base content during Onboarding Step 2.
    Dynamically routes to Gemini or Local Qwen via ACTIVE_ROUTING_CONFIG[ONBOARDING].
    """

    async def _call_llm_json(self, prompt: str) -> dict:
        """
        Universal LLM caller. Routes via ACTIVE_ROUTING_CONFIG[ONBOARDING].
        Always expects a JSON response back.
        """
        route_config = await master_model_router.get_route(TaskType.ONBOARDING)
        provider = route_config["provider"]
        model_name = route_config["model_name"]
        sys_prompt = "You are a business rules analyst. Return ONLY valid JSON, no markdown, no extra text."
        
        try:
            if provider == RouteDestination.OLLAMA:
                from src.core.ollama_client import ollama_client
                logger.info(f" DeepDive -> Ollama ({model_name})")
                response = await ollama_client.generate(
                    prompt=prompt,
                    model=model_name,
                    system=sys_prompt
                )
                raw = response.get("text", "{}").strip()
            else:
                from src.core.gemini_client import gemini_client
                from google.genai import types
                from src.services.ai.config import get_default_config
                import asyncio
                from src.core.executor import executor
                logger.info(f" DeepDive -> Gemini ({model_name})")
                contents = [types.Content(role="user", parts=[types.Part(text=prompt)])]
                config_params = {
                    "temperature": 0.0,
                    "system_instruction": sys_prompt,
                    "response_mime_type": "application/json"
                }
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

            clean = raw.replace("```json", "").replace("```", "").strip()
            return json.loads(clean)

        except Exception as e:
            logger.error(f" DeepDive LLM call failed ({provider.value}/{model_name}): {e}")
            return {}

    async def run_discovery(self, kb_content: str) -> Dict[str, Any]:
        """
        Scans KB content based on all discovered skill manifests, including Global Config.
        """
        manifests = {}
        skills_dir = "src/services/aiskills/manifests/skills"
        
        if os.path.exists(skills_dir):
            for filename in os.listdir(skills_dir):
                if filename.endswith(".json"):
                    with open(os.path.join(skills_dir, filename), 'r') as f:
                        data = json.load(f)
                        skill_id = data.get("metadata", {}).get("id") or data.get("id")
                        if skill_id:
                            manifests[skill_id] = data
        
        global_reqs = {}
        global_path = "src/services/aiskills/manifests/global_config.json"
        if os.path.exists(global_path):
            with open(global_path, 'r') as f:
                data = json.load(f)
                global_reqs = {
                    "id": "global_config",
                    "needs": data.get("discovery_contract", {}).get("needs", [])
                }

        discovery_results = {"skills": {}, "global": {}}

        if global_reqs:
            logger.info(" Discovering Global Business Principles...")
            global_results = await self._discover_rules(kb_content, "global_config", global_reqs["needs"])
            discovery_results["global"] = global_results

        for skill_id, details in manifests.items():
            needs_list = details.get("discovery_contract", {}).get("needs", [])
            needs = [n["prop"] for n in needs_list] if needs_list and isinstance(needs_list[0], dict) else needs_list
            logger.info(f" Discovering rules for {skill_id}...")
            mandate = await self._discover_rules(kb_content, skill_id, needs)
            discovery_results["skills"][skill_id] = mandate

        return discovery_results

    async def _discover_rules(self, kb_content: str, target_id: str, needs: List[Any]) -> Dict[str, Any]:
        """
        LLM based extraction that returns a structured SUCCESS vs GAP analysis.
        """
        needs_text = ", ".join([n["prop"] if isinstance(n, dict) else n for n in needs])
        
        prompt = f"""
        Analyze the Knowledge Base for '{target_id}' requirements.
        
        REQUIRED PROPERTIES:
        {needs_text}
        
        KB CONTENT:
        {kb_content}
        
        INSTRUCTIONS:
        1. For each property, check if a value or rule exists in the KB.
        2. Identify 'GAP': If a property is not mentioned or ambiguous.
        3. Formulate a final 'Mandate' based ONLY on found rules.
        
        Return ONLY a JSON with this structure:
        {{
            "mandate": "string",
            "found_props": ["list of props found"],
            "gaps": ["list of missing props"]
        }}
        """
        
        result = await self._call_llm_json(prompt)
        if result:
            return result
        
        return {
            "mandate": "Follow general guidelines.",
            "found_props": [],
            "gaps": [n["prop"] if isinstance(n, dict) else n for n in needs]
        }


deep_dive_engine = DeepDiveEngine()
