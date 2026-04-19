import asyncio
import time
import os
import sys
import json
import httpx
from loguru import logger

# 1. Setup Environment Paths
project_root = os.path.join(os.getcwd(), "ai_engine")
sys.path.append(project_root)
if os.path.exists(project_root):
    os.chdir(project_root)

# Configuration
MODELS_TO_TEST = [
    {"name": "QuantTrio/Qwen3.5-2B-AWQ", "engine": "vllm"}
]

TEST_PROMPT = """
TEXT: The Cluaiz Neural OS utilizes a hybrid vector-graph architecture to map organizational knowledge with metabolic decay.
TASK: Analyze in 2 brief bullet points.
BALANCED RESPONSE:
"""

async def run_vllm_test(model_name: str):
    url = "http://localhost:8085/v1/chat/completions"
    headers = {"Content-Type": "application/json"}
    payload = {
        "model": model_name,
        "messages": [
            {"role": "user", "content": TEST_PROMPT}
        ],
        "max_tokens": 128,
        "temperature": 0.1
    }
    
    t0 = time.perf_counter()
    async with httpx.AsyncClient(timeout=1200.0) as client:
        response = await client.post(url, headers=headers, json=payload)
    
    duration = time.perf_counter() - t0
    
    if response.status_code == 200:
        data = response.json()
        tokens = data.get("usage", {}).get("completion_tokens", 0)
        tps = round(tokens / duration, 2) if duration > 0 else 0
        text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        
        return {
            "status": "SUCCESS",
            "startup_latency": round(0.0, 2),
            "generation_time": round(duration, 2),
            "total_time": round(duration, 2),
            "tps": tps,
            "tokens": tokens,
            "text_preview": text[:50].replace('\n', ' ') + "..."
        }
    else:
        logger.error(f"vLLM Error: {response.text}")
        return {"status": "FAILED", "total_time": round(duration, 2)}

async def main():
    logger.info("🚀 [Turbo Benchmark V3] High-Fidelity vLLM Performance Test Starting...")
    results = {}

    for cfg in MODELS_TO_TEST:
        model = cfg["name"]
        logger.info(f" -> Testing {model} on {cfg['engine'].upper()}...")
        try:
            if cfg["engine"] == "vllm":
                res = await run_vllm_test(model)
            else:
                res = {"status": "SKIPPED"}
                
            results[model] = res
            if res["status"] == "SUCCESS":
                logger.success(f" [{model}] Total: {res['total_time']}s | TPS: {res['tps']}")
            else:
                logger.error(f" [{model}] Test Failed.")
        except Exception as e:
            logger.error(f" [{model}] Crash: {e}")
            results[model] = {"status": f"CRASH: {str(e)}"}

    # Save Report
    if not os.path.exists("../tests/turbo"):
        os.makedirs("../tests/turbo", exist_ok=True)
        
    report_path = os.path.join("..", "tests", "turbo", "benchmark_vllm_results.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=4)
    
    # Print Summary Table
    print("\n" + "="*85)
    print(f"{'MODEL':<25} | {'GEN (s)':<8} | {'TPS':<8} | {'STATUS'}")
    print("-" * 85)
    for model, data in results.items():
        if data["status"] == "SUCCESS":
            print(f"{model:<25} | {data['generation_time']:<8} | {data['tps']:<8} | {data['status']}")
        else:
            print(f"{model:<25} | {'N/A':<8} | {'N/A':<8} | {data['status']}")
    print("="*85)

if __name__ == "__main__":
    asyncio.run(main())
