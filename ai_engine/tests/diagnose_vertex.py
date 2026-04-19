import sys
import os
# Ensure we map to the local src
sys.path.append(os.getcwd())

from src.core.gemini_client import gemini_client
from google.genai import types

async def test_raw():
    print("Directly calling gemini_client...")
    try:
        model_id = "gemini-2.0-flash-lite-001"
        response = gemini_client.models.generate_content(
            model=model_id,
            contents="Say Hello!"
        )
        print("Response object:", response)
        print("Text:", response.text)
        
        if not response.text:
            print("Why is it empty?")
            # Check candidates
            for cand in response.candidates:
                print("Candidate Finish Reason:", cand.finish_reason)
                print("Safety Ratings:", cand.safety_ratings)
                
    except Exception as e:
        print("DIAGNOSTIC FAILED:", e)
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_raw())
