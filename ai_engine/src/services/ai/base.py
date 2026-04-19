from src.core.gemini_client import gemini_client
from src.core.groq_client import groq_client
from src.core.config import settings
from .config import get_default_config
from src.utils.logger import logger
import os

class BaseAIService:
    def __init__(self, model: str = None):
        self.use_model = os.getenv("USE_MODEL", settings.USE_MODEL).lower()
        self.enable_groq = os.getenv("ENABLE_GROQ", str(settings.ENABLE_GROQ)).lower() == "true"
        
        # Override to Groq if enabled and requested
        if self.enable_groq and (self.use_model == "groq" or model == "groq"):
            self.model = os.getenv("GROQ_MODEL", settings.GROQ_MODEL)
            self.client_type = "groq"
            self.client = groq_client
        else:
            self.model = model or "gemini-2.0-flash-lite-001" # Safe fallback
            self.client_type = "gemini"
            self.client = gemini_client

    async def generate_content(self, contents: any, config_params: dict = None, model: str = None):
        """Standard non-streaming generation."""
        target_model = model or self.model
        if self.client_type == "gemini":
            config = get_default_config(**(config_params or {}))
            # Run blocking genai call in thread
            import asyncio
            return await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.client.models.generate_content(
                    model=target_model,
                    contents=contents,
                    config=config
                )
            )
        elif self.client_type == "groq":
            # Convert Gemini-style contents to Groq messages
            messages = self._convert_to_groq_messages(contents, config_params)
            return await self.client.generate_response(
                model=target_model,
                messages=messages,
                temperature=config_params.get("temperature", 0.7) if config_params else 0.7
            )

    async def generate_content_stream(self, contents: any, config_params: dict = None, model: str = None):
        """Standard streaming generation."""
        target_model = model or self.model
        if self.client_type == "gemini":
            config = get_default_config(**(config_params or {}))
            # Gemini SDK streaming is an iterator, needs careful async handling
            for chunk in self.client.models.generate_content_stream(
                model=target_model,
                contents=contents,
                config=config
            ):
                yield chunk
        elif self.client_type == "groq":
            messages = self._convert_to_groq_messages(contents, config_params)
            stream = await self.client.generate_response(
                model=target_model,
                messages=messages,
                temperature=config_params.get("temperature", 0.7) if config_params else 0.7,
                stream=True
            )
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    # Mock a Gemini-style chunk for compatibility
                    class MockChunk:
                        def __init__(self, text):
                            self.text = text
                            self.candidates = [type('obj', (object,), {'content': type('obj', (object,), {'parts': [type('obj', (object,), {'text': text})]})})]
                    yield MockChunk(chunk.choices[0].delta.content)

    def _convert_to_groq_messages(self, contents, config_params):
        """Helper to convert Gemini contents to Groq messages."""
        messages = []
        
        # Add system instruction if present
        sys_instr = config_params.get("system_instruction") if config_params else None
        if sys_instr:
            messages.append({"role": "system", "content": sys_instr})
            
        # contents can be a list of types.Content or raw dicts
        for content in contents:
            role = content.role if hasattr(content, "role") else content.get("role", "user")
            # Gemini uses 'model' for 'assistant'
            role = "assistant" if role == "model" else role
            
            text = ""
            if hasattr(content, "parts"):
                text = " ".join([p.text for p in content.parts if hasattr(p, "text")])
            elif isinstance(content, dict) and "parts" in content:
                text = " ".join([p.get("text", "") for p in content["parts"]])
                
            messages.append({"role": role, "content": text})
            
        return messages
