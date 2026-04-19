import asyncio
import os
from src.services.metadata_service import metadata_service

async def test_metadata():
    text = "This is a dummy document about Artificial Intelligence in healthcare. It discusses how neural networks and LLMs are revolutionizing diagnosis and personalized medicine."
    res = await metadata_service.generate_metadata(text, "Healthcare_AI_Doc.pdf")
    print("\n[RESULT]")
    print(res)

if __name__ == "__main__":
    asyncio.run(test_metadata())
