"""
 LocalLLMRouter  The Gateway to Qwen3
=========================================
Handles all local LLM interactions via Ollama. 
Separates 'Shadow Boss' (0.6b CPU) from 'Expert Brain' (4b GPU).
"""

from typing import Dict, Any, Optional, List
from src.core.config import settings
from src.core.ollama_client import ollama_client
from src.core.gemini_client import gemini_client
from src.core.executor import executor
from src.config.model_routing import master_model_router, TaskType, RouteDestination
import asyncio
from src.utils.logger import logger
import json
import re

class LocalLLMRouter:
    """
    Unified router for local model execution.
    Replaces Cloud Gemini for internal reasoning tasks.
    """
    @staticmethod
    async def quick_classify(prompt: str, system: Optional[str] = None) -> str:
        """
         Stage 1: The Shadow Boss (0.6b) or Gemini Flash-Lite
        Latency: < 50ms | Usage: Routing, security, classification.
        """
        route = await master_model_router.get_route(TaskType.LOCAL_ROUTER_FAST)
        
        if route["provider"] == RouteDestination.GEMINI:
            logger.debug(f" [Hybrid-Proxy] Routing quick_classify to Gemini ({route['model_name']})...")
            from google.genai import types
            config = types.GenerateContentConfig(
                system_instruction=system or "You are a precise classifier. Reply with the final answer only.",
                temperature=0.7
            )
            response = await asyncio.get_event_loop().run_in_executor(
                None, 
                lambda: gemini_client.models.generate_content(
                    model=route["model_name"],
                    contents=prompt,
                    config=config
                )
            )
            return response.text.strip() if response and response.text else ""

        logger.debug(f" [ShadowBoss Local] Processing quick_classify with {route['model_name']}...")
        response = await ollama_client.generate(
            prompt=prompt,
            model=route["model_name"],
            system=system or "You are a precise classifier. Reply with the final answer only.",
            stream=False
        )
        return response.get("text", "").strip()

    @staticmethod
    async def deep_reason(prompt: str, system: Optional[str] = None) -> str:
        """
         Stage 2: The Master Gatekeeper (4b) or Gemini Flash-Lite
        Latency: ~500ms | Usage: Response generation, complex reasoning.
        """
        route = await master_model_router.get_route(TaskType.LOCAL_ROUTER_DEEP)
        
        if route["provider"] == RouteDestination.GEMINI:
            logger.debug(f" [Hybrid-Proxy] Routing deep_reason to Gemini ({route['model_name']})...")
            from google.genai import types
            config = types.GenerateContentConfig(
                system_instruction=system or "You are an expert AI assistant. Think clearly and help the user.",
                temperature=0.7
            )
            response = await asyncio.get_event_loop().run_in_executor(
                None, 
                lambda: gemini_client.models.generate_content(
                    model=route["model_name"],
                    contents=prompt,
                    config=config
                )
            )
            return response.text.strip() if response and response.text else ""

        logger.debug(f" [MasterGatekeeper Local] Processing deep_reason with {route['model_name']}...")
        response = await ollama_client.generate(
            prompt=prompt,
            model=route["model_name"],
            system=system or "You are an expert AI assistant. Think clearly and help the user.",
            stream=False
        )
        return response.get("text", "").strip()

    @staticmethod
    async def json_reason(prompt: str, system: Optional[str] = None) -> Dict[str, Any]:
        """
        Force the Master Gatekeeper (or Gemini) to return strictly valid JSON for extraction tasks.
        Uses 0.1 temperature for deterministic JSON output.
        """
        system_prompt = system or "You are a JSON assistant. Return ONLY valid JSON."
        route = await master_model_router.get_route(TaskType.LOCAL_ROUTER_DEEP)
        
        if route["provider"] == RouteDestination.GEMINI:
            logger.debug(f" [Hybrid-Proxy] Routing json_reason to Gemini ({route['model_name']})...")
            from google.genai import types
            config = types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.1,  # Strict adherence
                response_mime_type="application/json" # Gemini specific strict JSON mode
            )
            
            try:
                response = await asyncio.get_event_loop().run_in_executor(
                    None, 
                    lambda: gemini_client.models.generate_content(
                        model=route["model_name"],
                        contents=prompt,
                        config=config
                    )
                )
                text = response.text.strip() if response and response.text else "{}"
                
                if text.startswith("```"):
                    text = re.sub(r"^```(json)?|```$", "", text, flags=re.IGNORECASE | re.MULTILINE).strip()
                return json.loads(text)
            except Exception as e:
                logger.error(f" Failed to parse JSON from Gemini Proxy: {e}")
                return {}

        logger.debug(f" [MasterGatekeeper Local] Processing json_reason with {route['model_name']}...")
        response = await ollama_client.generate(
            prompt=prompt,
            model=route["model_name"],
            system=system_prompt,
            stream=False,
            temperature=0.1
        )
        
        text = response.get("text", "").strip()
        
        try:
            if text.startswith("```"):
                text = re.sub(r"^```(json)?|```$", "", text, flags=re.IGNORECASE | re.MULTILINE).strip()
            return json.loads(text)
        except Exception as e:
            try:
                match = re.search(r"(\{.*\})", text, re.DOTALL)
                if match:
                    return json.loads(match.group(1))
            except Exception:
                pass
            
            logger.error(f" Failed to parse JSON from Local Model: {e} | Text: {text[:100]}")
            return {}

# Singleton for easy import
local_router = LocalLLMRouter()
