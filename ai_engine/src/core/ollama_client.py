import httpx
from src.core.config import settings
from src.utils.logger import logger
import json

class OllamaClient:
    def __init__(self):
        self.base_url = settings.OLLAMA_URL.rstrip('/')
        self.brain_model = settings.OLLAMA_MODEL_EXPERT
        self.shadow_model = settings.OLLAMA_MODEL_SHADOW

    async def generate(self, prompt: str, model: str = None, system: str = None, stream: bool = False, format: str = None, **kwargs) -> dict:
        """
        Generic generation call to Ollama.
        """
        target_model = model or self.brain_model
        url = f"{self.base_url}/api/generate"
        
        #  DYNAMIC TRIGGER / SAMPLING LOGIC (Qwen 3.5 0.8B Optimized)
        is_thinking = "/think" in prompt.lower() or "reason step by step" in prompt.lower()
        
        # Standardize Prompt
        clean_prompt = prompt.replace("/think", "").replace("/THINK", "").strip()
        
        if is_thinking:
            #  THINKING MODE (High-Fidelity)
            temperature = 0.1 #  CRITICAL: Must be LOW
            top_p = 0.9 # Default
            presence_penalty = 0.0 #  CRITICAL: Any value > 0 kills speed on 0.8B
            if "reason step by step" not in clean_prompt.lower():
                clean_prompt += "\nPlease reason step by step before providing the final answer."
        else:
            #  FAST MODE (Direct)
            temperature = 0.1 #  CRITICAL: Must be LOW
            top_p = 0.9 # Default
            presence_penalty = 0.0 #  CRITICAL: Any value > 0 kills speed on 0.8B
            if "only output" not in clean_prompt.lower() and format == "json":
                clean_prompt += "\nDo NOT reason. Output ONLY the raw JSON object."

        payload = {
            "model": target_model,
            "prompt": clean_prompt,
            "stream": stream,
            "options": {
                "num_predict": kwargs.get("max_tokens", 512),
                "temperature": temperature,
                "top_p": top_p,
                "presence_penalty": presence_penalty,
                "top_k": 20,
                "num_ctx": kwargs.get("num_ctx", 4096)
            }
        }
        
        if format:
            payload["format"] = format
            
        if system:
            payload["system"] = system

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                # Always read line-by-line in case Ollama enforces NDJSON streaming for this model
                response = await client.post(url, json=payload)
                response.raise_for_status()
                
                final_text = ""
                total_duration = 0
                eval_count = 0
                prompt_eval_count = 0
                
                for line in response.iter_lines():
                    if not line:
                        continue
                    try:
                        data = json.loads(line)
                        if "response" in data and data["response"]:
                            final_text += data["response"]
                        elif "thinking" in data and data["thinking"]:
                            final_text += data["thinking"]
                        elif "message" in data and "content" in data["message"]:
                            final_text += data["message"]["content"]
                            
                        # Capture final stats
                        if data.get("done"):
                            total_duration = data.get("total_duration", 0)
                            eval_count = data.get("eval_count", 0)
                            prompt_eval_count = data.get("prompt_eval_count", 0)
                    except json.JSONDecodeError:
                        pass
                
                return {
                    "text": final_text.strip(),
                    "usage": {
                        "input": prompt_eval_count,
                        "output": eval_count
                    },
                    "duration": total_duration / 1e9  # seconds
                }
        except Exception as e:
            logger.error(f" Ollama Generation Error: {str(e)}")
            return {"text": "", "usage": {"input": 0, "output": 0}}

    async def chat(self, messages: list, model: str = None, stream: bool = False, **kwargs) -> dict:
        """
        Chat completion call to Ollama.
        """
        target_model = model or self.brain_model
        url = f"{self.base_url}/api/chat"
        
        #  DYNAMIC TRIGGER / SAMPLING LOGIC (Chat)
        # Check last user message for triggers
        last_user_msg = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
        is_thinking = "/think" in last_user_msg.lower() or "reason step by step" in last_user_msg.lower()
        
        if is_thinking:
            temperature = 1.0
            top_p = 0.95
            presence_penalty = 1.5
        else:
            temperature = 1.0
            top_p = 1.0
            presence_penalty = 2.0

        payload = {
            "model": target_model,
            "messages": messages,
            "stream": stream,
            "options": {
                "num_predict": kwargs.get("max_tokens", 1024),
                "temperature": temperature,
                "top_p": top_p,
                "presence_penalty": presence_penalty,
                "top_k": 20,
                "num_ctx": kwargs.get("num_ctx", 8192)
            }
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()
                
                message = data.get("message", {})
                # Qwen 3.5 puts response in 'thinking' when content is empty
                content = message.get("content", "")
                if not content.strip() and message.get("thinking"):
                    content = message["thinking"]
                
                return {
                    "text": content.strip(),
                    "role": message.get("role", "assistant"),
                    "usage": {
                        "input": data.get("prompt_eval_count", 0),
                        "output": data.get("eval_count", 0)
                    }
                }
        except Exception as e:
            logger.error(f" Ollama Chat Error: {str(e)}")
            return {"text": "", "usage": {"input": 0, "output": 0}}


ollama_client = OllamaClient()
