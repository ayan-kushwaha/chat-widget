import torch
import subprocess
import sys
import os

def audit_gpu():
    print("═══ CLUAIZ TURBO ENV AUDIT ═══")
    
    # 1. PyTorch / CUDA Check
    print(f"\n[1] PyTorch Info:")
    print(f" - Version: {torch.__version__}")
    cuda_available = torch.cuda.is_available()
    print(f" - CUDA Available: {cuda_available}")
    
    if cuda_available:
        print(f" - GPU Name: {torch.cuda.get_device_name(0)}")
        print(f" - Compute Capability: {torch.cuda.get_device_capability(0)}")
        print(f" - Current VRAM: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")
    
    # 2. Docker GPU Passthrough Check
    print(f"\n[2] Docker GPU Audit:")
    try:
        result = subprocess.run(
            ["docker", "run", "--rm", "--gpus", "all", "nvidia/cuda:12.1.0-base-ubuntu22.04", "nvidia-smi"],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0:
            print(" ✅ Docker GPU Passthrough is WORKING.")
        else:
            print(" ❌ Docker GPU Passthrough FAILED.")
            print(f"    Error: {result.stderr}")
    except Exception as e:
        print(f" ❌ Docker Check Error: {e}")
        print("    (Make sure Docker Desktop is running and 'nvidia-container-toolkit' is active in WSL2)")

    # 3. Flash-Attention Compatibility
    print(f"\n[3] Flash-Attention Info:")
    if cuda_available:
        major, minor = torch.cuda.get_device_capability(0)
        if major >= 8: # Ampere or newer
            print(" ✅ Hardware (RTX 3050 Ampere) supports Flash-Attention v2.")
        else:
            print(" ⚠️ Hardware might only support Flash-Attention v1 or slowed mode.")
    
    print("\n══════════════════════════════")

if __name__ == "__main__":
    audit_gpu()
