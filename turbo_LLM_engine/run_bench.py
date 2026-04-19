import time, os
from loguru import logger
from src.engine_core import TurboEngineCore

def run_benchmark():
    model_path = os.getenv("MODEL_PATH", "/app/models/Qwen3-4B-AWQ")
    logger.info(f"🏎️ Starting Benchmark for: {model_path}")
    
    engine = TurboEngineCore(model_path)
    engine.load_model()
    
    prompt = "Explain the importance of quantum computing in 200 words."
    max_tokens = 300
    
    logger.info("🧪 Warming up engine...")
    list(engine.generate_stream("Hi", max_tokens=10))
    
    logger.info("🚀 Running Performance Test...")
    start_time = time.time()
    
    tokens_generated = 0
    full_response = ""
    
    for chunk in engine.generate_stream(prompt, max_tokens=max_tokens):
        full_response += chunk
        # Estimate tokens (approx 4 chars per token)
        # In a real scenario, we'd use the tokenizer, but this is a quick bench
    
    end_time = time.time()
    duration = end_time - start_time
    
    # Use tokenizer to be precise
    tokens_generated = len(engine.tokenizer.encode(full_response))
    tps = tokens_generated / duration
    
    print("\n" + "="*50)
    print(f"🚀 ROCKET BENCHMARK RESULTS 🚀")
    print("="*50)
    print(f"🔹 Engine: {engine.engine_name}")
    print(f"🔹 Tokens Generated: {tokens_generated}")
    print(f"🔹 Total Time: {duration:.2f}s")
    print(f"🔥 Speed: {tps:.2f} tokens/sec")
    print("="*50 + "\n")

if __name__ == "__main__":
    run_benchmark()
