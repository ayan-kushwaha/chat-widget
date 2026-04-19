from src.core.config import settings
from src.core.brain import brain
import asyncio

print(f"\n--- CONFIG CHECK ---")
print(f"ENABLE_GROQ: {settings.ENABLE_GROQ}")
print(f"GROQ_API_KEY: {settings.GROQ_API_KEY[:5]}..." if settings.GROQ_API_KEY else "GROQ_API_KEY: None")
print(f"GROQ_MODEL: {settings.GROQ_MODEL}")
print(f"OLLAMA_URL: {settings.OLLAMA_URL}")

async def test():
    try:
        print("\n--- GENERATION TEST ---")
        if settings.ENABLE_GROQ:
            print("Expected Provider: Groq")
        else:
            print("Expected Provider: Unknown")

        res = await brain.generate("Reply with 'Success' if you can read this.")
        print(f"Result: {res}")
    except Exception as e:
        print(f" Error: {e}")

asyncio.run(test())
