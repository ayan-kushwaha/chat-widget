"""
⏱️ Load & Latency Audit Suite
============================
Measures concurrency performance, VRAM impact, and latency of local LLMs.
Usage: python tests/audit_load_performance.py
"""

import asyncio
import time
import psutil
import statistics
from loguru import logger
from src.services.routing.local_llm_router import local_router
from src.services.routing.shadow_boss import shadow_boss

# Mock Context for End-to-End
MOCK_USER_ID = "test_boss_1"
MOCK_BIZ_ID = "default"
MOCK_EMP_ID = "rocky_support"

async def run_stage_1_benchmark(n_concurrent: int = 5):
    """Benchmark 0.6b Router Latency"""
    logger.info(f"⚡ [Audit] Starting Stage 1 (0.6b) Benchmark with {n_concurrent} concurrent users...")
    
    start_time = time.perf_counter()
    tasks = []
    
    for i in range(n_concurrent):
        prompt = f"User {i}: I want to track my order #ORD-123"
        tasks.append(local_router.quick_classify(prompt))
        
    results = await asyncio.gather(*tasks)
    total_time = time.perf_counter() - start_time
    avg_latency = total_time / n_concurrent
    
    logger.info(f"✅ Stage 1 Finish | Total: {total_time:.2f}s | Avg: {avg_latency*1000:.1f}ms per query")
    return avg_latency

async def run_stage_2_benchmark(n_concurrent: int = 3):
    """Benchmark 4b Expert Brain Latency"""
    logger.info(f"🧠 [Audit] Starting Stage 2 (4b) Benchmark with {n_concurrent} concurrent users...")
    
    start_time = time.perf_counter()
    tasks = []
    
    for i in range(n_concurrent):
        prompt = f"User {i}: Explain your refund policy for return items in Hinglish."
        tasks.append(local_router.deep_reason(prompt))
        
    results = await asyncio.gather(*tasks)
    total_time = time.perf_counter() - start_time
    avg_latency = total_time / n_concurrent
    
    logger.info(f"✅ Stage 2 Finish | Total: {total_time:.2f}s | Avg: {avg_latency*1000:.1f}ms per query")
    return avg_latency

async def run_e2e_benchmark(n_concurrent: int = 3):
    """Benchmark Full Shadow Boss Pipeline"""
    logger.info(f"🧭 [Audit] Starting E2E (Shadow Boss) Benchmark with {n_concurrent} concurrent users...")
    
    start_time = time.perf_counter()
    tasks = []
    
    for i in range(n_concurrent):
        query = f"User {i}: Help me track my coffee order."
        tasks.append(shadow_boss.process_user_query(
            user_message=query,
            employee_id=MOCK_EMP_ID,
            context={"business_id": MOCK_BIZ_ID, "session_id": f"sess_{i}"}
        ))
        
    results = await asyncio.gather(*tasks)
    total_time = time.perf_counter() - start_time
    avg_latency = total_time / n_concurrent
    
    logger.info(f"✅ E2E Finish | Total: {total_time:.2f}s | Avg: {avg_latency*1000:.1f}ms per query")
    return avg_latency

def get_vram_usage():
    """Attempt to get VRAM usage via NVIDIA-SMI"""
    import subprocess
    try:
        output = subprocess.check_output(['nvidia-smi', '--query-gpu=memory.used', '--format=csv,nounit,noheader'], encoding='utf-8')
        return [int(x) for x in output.strip().split('\n')]
    except:
        return []

async def main():
    logger.info("🚀 Starting Load & Latency Audit...")
    
    initial_vram = get_vram_usage()
    initial_cpu = psutil.cpu_percent()
    
    logger.info(f"📊 Initial Baseline | CPU: {initial_cpu}% | VRAM: {initial_vram}MB")

    # 1. Stage 1 Stress Test
    s1_latency = await run_stage_1_benchmark(n_concurrent=10)
    
    # 2. Stage 2 Stress Test
    s2_latency = await run_stage_2_benchmark(n_concurrent=3)
    
    # 3. E2E Stress Test
    e2e_latency = await run_e2e_benchmark(n_concurrent=5)
    
    peak_vram = get_vram_usage()
    peak_cpu = psutil.cpu_percent()
    
    logger.info("--- AUDIT REPORT ---")
    logger.info(f"Latency 0.6b (10 concurrent): {s1_latency*1000:.1f}ms")
    logger.info(f"Latency 4b (3 concurrent):   {s2_latency*1000:.1f}ms")
    logger.info(f"Latency E2E (5 concurrent):  {e2e_latency*1000:.1f}ms")
    logger.info(f"Peak CPU Usage:              {peak_cpu}%")
    logger.info(f"Projected VRAM Impact:       {peak_vram}MB")
    
    if peak_vram and any(v > 6000 for v in peak_vram):
        logger.warning("[WARNING] High VRAM usage detected (>6GB). XTTS might face issues.")
    else:
        logger.info("[PASS] VRAM look safe for XTTS coexistence (<6GB).")

if __name__ == "__main__":
    asyncio.run(main())
