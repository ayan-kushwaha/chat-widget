from typing import List, Dict, Any, Optional
from src.core.config import settings
from src.utils.logger import logger
from src.core.gemini_client import gemini_client
from src.config.model_routing import master_model_router, TaskType, RouteDestination
import os

class Brain:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Brain, cls).__new__(cls)
            cls._instance.client = gemini_client
        return cls._instance

    def __init__(self):
        pass

    async def generate(self, prompt: str, system_instruction: Optional[str] = None, task_type: TaskType = TaskType.CORE_CHAT):
        """
        Text generation using the configured model from Master Model Router.
        Acts as the 'Voice Generation' engine for final conversational output.
        
        Returns a dictionary: { "text": str, "usage": { "input": int, "output": int } }
        """
        try:
            route = await master_model_router.get_route(task_type)
            provider = route["provider"]
            model_name = route["model_name"]
            
            print(f"DEBUG: Brain Routing Task={task_type.name} to {provider.name} model={model_name}")
            
            if provider == RouteDestination.OLLAMA:
                try:
                    from src.core.ollama_client import ollama_client
                    logger.info(f" Brain Generating via Ollama ({model_name})")
                    
                    response = await ollama_client.generate(
                        prompt=prompt,
                        model=model_name,
                        system=system_instruction
                    )
                    
                    return {
                        "text": response["text"],
                        "usage": response["usage"]
                    }
                except Exception as e:
                    logger.error(f" Ollama Generation Failed: {str(e)}")
                    return { "text": "", "usage": { "input": 0, "output": 0 } }


            elif provider == RouteDestination.GEMINI:
                logger.info(f" Brain Generating via Vertex AI ({model_name})")
                
                # Gemini SDK uses config for system_instruction
                from google.genai import types
                config = types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.7
                ) if system_instruction else types.GenerateContentConfig(temperature=0.7)

                #  Use Native Async Client (client.aio)
                response = await self.client.aio.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=config
                )
                
                # Robust extraction for Cloud Gemini
                res_text = ""
                if hasattr(response, 'text') and response.text:
                    res_text = response.text
                elif hasattr(response, 'candidates') and response.candidates:
                    cand = response.candidates[0]
                    if cand.content and cand.content.parts:
                        res_text = cand.content.parts[0].text

                if not res_text.strip():
                    logger.error(f" Empty response from Vertex AI ({model_name})")
                    return { "text": "", "usage": { "input": 0, "output": 0 } }
                
                return {
                    "text": res_text,
                    "usage": {
                        "input": getattr(response.usage_metadata, 'prompt_token_count', 0) if hasattr(response, 'usage_metadata') else 0,
                        "output": getattr(response.usage_metadata, 'candidates_token_count', 0) if hasattr(response, 'usage_metadata') else 0
                    }
                }
            
            else:
                 logger.error(f" Unknown model provider: {provider}")
                 return { "text": "", "usage": { "input": 0, "output": 0 } }
            
        except Exception as e:
            logger.error(f" AI Generation Failed for task {task_type.name}: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return { "text": "", "usage": { "input": 0, "output": 0 } }

brain = Brain()
