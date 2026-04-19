import asyncio
import sys
import os
from dotenv import load_dotenv

# Add current directory and parent to path to find src
root_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.append(root_path)

# Load environment variables
load_dotenv(os.path.join(root_path, ".env"))
print(f"DEBUG: GOOGLE_CLOUD_API_KEY found: {'Yes' if os.environ.get('GOOGLE_CLOUD_API_KEY') else 'No'}")

from src.services.ai.chat_service import chat_ai_service
from src.services.ai.analysis_service import analysis_ai_service

async def verify_services():
    print("🚀 Verifying AI Services (New Architecture)...\n")
    
    # 1. Test Chat AIService (Streaming)
    print("--- Test 1: Chat AIService (Streaming) ---")
    print("User: Hello, who are you?")
    print("AI: ", end="", flush=True)
    async for chunk in chat_ai_service.generate_response_stream("Hello, who are you?"):
        print(chunk, end="", flush=True)
    print("\n")
    
    # 2. Test Analysis AIService (JSON Mode)
    print("--- Test 2: Analysis AIService (JSON Mode) ---")
    transcript = "User: Hi\nAssistant: Hello! How can I help you today?\nUser: Tell me about my billing.\nAssistant: Your billing is up to date."
    print(f"Transcript:\n{transcript}")
    result = await analysis_ai_service.analyze_chat(transcript)
    print(f"Analysis Result: {result}")
    
    if "summary_hindi" in result and result.get("is_garbage") is not None:
        print("\n✅ Verification SUCCESS: Services are working with centralized logic.")
    else:
        print("\n❌ Verification FAILED: Unexpected response format.")

if __name__ == "__main__":
    asyncio.run(verify_services())
