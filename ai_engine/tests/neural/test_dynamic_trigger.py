import asyncio
import time
import os
import sys

# Add ai_engine/src to path
sys.path.append(os.path.join(os.getcwd(), "ai_engine"))

from src.core.ollama_client import ollama_client

async def test_dynamic_trigger():
    print("🧬 [Neural OS] Testing Dynamic Thinking Trigger Logic...")
    
    sample_text = "The Cluaiz Neural OS utilizes a hybrid vector-graph architecture to map organizational knowledge."
    
    # 1. TEST FAST MODE (Default)
    print("\n⚡ Testing FAST MODE (Default)...")
    t0 = time.perf_counter()
    res_fast = await ollama_client.generate(
        prompt=f"TEXT: {sample_text}\nGive me a 3-word title as JSON.",
        format="json"
    )
    d_fast = round(time.perf_counter() - t0, 3)
    print(f"   [FAST] Latency: {d_fast}s")
    print(f"   [FAST] Response: {res_fast.get('text')}")
    
    # 2. TEST THINKING MODE (/think)
    print("\n🧠 Testing THINKING MODE (/think)...")
    t0 = time.perf_counter()
    res_think = await ollama_client.generate(
        prompt=f"/think TEXT: {sample_text}\nGive me a 3-word title as JSON.",
        format="json"
    )
    d_think = round(time.perf_counter() - t0, 3)
    print(f"   [THINK] Latency: {d_think}s")
    print(f"   [THINK] Response: {res_think.get('text')}")
    
    # Validation
    if d_fast < 3.0 and d_think > 5.0:
        print("\n✅ VERIFICATION SUCCESS: Dynamic switching confirmed!")
        print(f"   Mode ratio: {round(d_think/d_fast, 1)}x depth increase.")
    else:
        print("\n⚠️ VERIFICATION INCOMPLETE: Latency delta not as expected.")

if __name__ == "__main__":
    asyncio.run(test_dynamic_trigger())
