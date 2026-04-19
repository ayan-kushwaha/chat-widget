import os
import time
import subprocess
import pynvml
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Auto-Pilot")

def get_vram():
    try:
        pynvml.nvmlInit()
        handle = pynvml.nvmlDeviceGetHandleByIndex(0)
        info = pynvml.nvmlDeviceGetMemoryInfo(handle)
        total = info.total / 1024**2
        free = info.free / 1024**2
        return total, free
    except Exception as e:
        logger.error(f"Failed to get VRAM: {e}")
        return 4096, 2000 # Fallback

def start_engine():
    total, free = get_vram()
    logger.info(f"🚀 [AUTO-PILOT] Total VRAM: {total:.0f}MB | Free VRAM: {free:.0f}MB")
    
    model_size = 2400 # Qwen3-4B-AWQ base size in MB
    system_reserve = 350
    
    # Calculate KV Cache Budget
    # Buffer = Free - Model - Safety
    pa_gpu_mem = int(max(free - model_size - system_reserve, 128))
    
    logger.info(f"🎯 [AUTO-PILOT] Allocating {pa_gpu_mem}MB for KV Cache buffer...")
    
    model_path = os.getenv("MODEL_PATH", "/app/models/Qwen3-4B-AWQ")
    
    cmd = [
        "mistral-rs-server",
        "--model-id", model_path,
        "--port", "8000",
        "--pa-gpu-mem", str(pa_gpu_mem),
        "--pa-blk-size", "16",
        "plain" # For standard model loading
    ]
    
    logger.info(f"🎬 Starting Mistral-RS: {' '.join(cmd)}")
    return subprocess.Popen(cmd)

if __name__ == "__main__":
    process = start_engine()
    try:
        while True:
            if process.poll() is not None:
                logger.error("❌ Engine crashed! Restarting...")
                process = start_engine()
            time.sleep(5)
    except KeyboardInterrupt:
        process.terminate()
