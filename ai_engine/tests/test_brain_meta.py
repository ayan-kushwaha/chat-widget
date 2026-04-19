import asyncio
import os
import sys
from src.services.metadata_service import metadata_service

async def run():
    try:
        text = "This is a dummy document about AI."
        # Directly call the LLM generating step to see what brain.py does
        from src.core.brain import brain
        prompt = "Return exactly: {\"title\": \"A\", \"summary\": \"B\", \"tags\": [], \"intent_summary\": \"C\"}"
        print("Calling brain.generate...")
        res = await brain.generate(prompt)
        print("Brain result:", res)
        
        print("\nCalling metadata_service...")
        meta = await metadata_service.generate_metadata(text, "dummy.txt")
        print("Meta result:", meta)
    except Exception as e:
        print("FATAL EXCEPTION:", e, type(e))
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(run())
