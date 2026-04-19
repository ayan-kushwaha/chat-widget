from groq import AsyncGroq
from src.core.config import settings

class GroqClient:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(GroqClient, cls).__new__(cls)
            cls._instance.client = None
            cls._instance.initialized = False
        return cls._instance

    def __init__(self):
        if self.initialized:
            return

        # Use settings (pydantic-settings)  reads .env file automatically.
        # DO NOT use os.getenv() here  it does NOT load .env.
        api_key = settings.GROQ_API_KEY
        if api_key:
            self.client = AsyncGroq(api_key=api_key)
            self.initialized = True
            print(f" Groq client initialized | model={settings.GROQ_MODEL}")
        else:
            print(" GROQ_API_KEY not set in .env. Groq integration disabled.")

    async def generate_response(self, model: str, messages: list, temperature: float = 0.7, stream: bool = False):
        """Standard generation wrapper for Groq."""
        if not self.client:
            raise ValueError("Groq client not initialized.")
            
        return await self.client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            stream=stream
        )

# Global Instance
groq_client = GroqClient()
