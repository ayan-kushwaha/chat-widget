import httpx
import time
import asyncio
from enum import Enum
import os
from typing import Dict, TypedDict, Optional
from src.utils.logger import logger

# Import the dedicated task mapping configuration
from src.config.task_mappings import TaskType, DEFAULT_TASK_MAPPING

class RouteDestination(Enum):
    GEMINI = "gemini"
    OLLAMA = "ollama"

class ModelConfig(TypedDict):
    provider: RouteDestination
    model_name: str
    model_key: str  # Backend billing key (e.g. 'qwen-local')



#  Hard Fallback Routing (If Backend is dead)
FALLBACK_ROUTES: Dict[str, ModelConfig] = {
    "gemini-2.0-flash-lite":     {"provider": RouteDestination.GEMINI, "model_name": "gemini-2.0-flash-lite-001", "model_key": "gemini-2.0-flash-lite"},
    "gemini-2.0-flash-lite-001": {"provider": RouteDestination.GEMINI, "model_name": "gemini-2.0-flash-lite-001", "model_key": "gemini-2.0-flash-lite-001"},
    "qwen3.5:0.8b":              {"provider": RouteDestination.OLLAMA, "model_name": "qwen3.5:0.8b", "model_key": "qwen3.5:0.8b"}
}


class ConfigManager:
    """Manages dynamic configuration fetched from Backend."""
    _config = {}
    _last_fetched = 0
    _ttl = 300 # 5 minutes cache

    @classmethod
    async def get_billing_config(cls):
        now = time.time()
        if cls._config and (now - cls._last_fetched) < cls._ttl:
            return cls._config

        backend_url = os.getenv("BACKEND_URL", "http://localhost:4000")
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{backend_url}/api/v1/system/config", timeout=5.0)
                if response.status_code == 200:
                    data = response.json()
                    cls._config = data.get("data", {}).get("billing", {}).get("models", {})
                    cls._last_fetched = now
                    logger.info(" Successfully synced model config from Backend")
                    return cls._config
        except Exception as e:
            logger.error(f" Failed to fetch model config from Backend: {e}")
        
        return cls._config if cls._config else {}


class ModelRouter:
    """Traffic Cop for Cluaiz AI Engine."""
    
    @classmethod
    async def get_route(cls, task: TaskType) -> ModelConfig:
        # 1. Map Task to Billing Key
        model_key = DEFAULT_TASK_MAPPING.get(task, "gemini-2.0-flash-lite")
        
        # 2. Master Emergency Override from .env
        if os.getenv("ENABLE_OLLAMA") == "true":
            return {"provider": RouteDestination.OLLAMA, "model_name": "qwen3.5:0.8b", "model_key": "qwen-local"}
            
        # 3. Try to get dynamic config from Backend for this specific key
        dynamic_models = await ConfigManager.get_billing_config()
        model_info = dynamic_models.get(model_key)
        
        if model_info:
            return {
                "provider":   RouteDestination.OLLAMA if model_info.get("is_local") else RouteDestination.GEMINI,
                "model_name": model_info.get("api_model", "gemini-2.0-flash-lite-001"), # mapping backend api_model field
                "model_key":  model_key
            }
            
        # 4. Final Fallback if backend didn't return info for this key
        fallback = FALLBACK_ROUTES.get(model_key, FALLBACK_ROUTES["gemini-2.0-flash-lite"])
        return fallback

master_model_router = ModelRouter()
