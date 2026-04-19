#!/bin/bash
set -e

# ============================================================
# Cluaiz Atma (BitNet-b1.58-2B-4T) — Sovereign Entrypoint
# Model stored in mounted volume: /models (host: bitnet-personalized-llm/)
# ============================================================

MODEL_DIR="/models"
MODEL_FILE="$MODEL_DIR/ggml-model-i2_s.gguf"
HOST="0.0.0.0"
PORT="${BITNET_PORT:-8081}"
THREADS="${BITNET_THREADS:-$(nproc)}"
CTX_SIZE="${BITNET_CTX_SIZE:-2048}"

echo "🧠 Cluaiz Atma (BitNet-b1.58-2B-4T) starting..."
echo "   Model Dir : $MODEL_DIR"
echo "   Port      : $PORT"
echo "   Threads   : $THREADS"
echo "   Context   : $CTX_SIZE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Auto-download model if not present ──────────────────────
if [ ! -f "$MODEL_FILE" ]; then
    echo "📥 Model not found. Downloading microsoft/BitNet-b1.58-2B-4T..."
    echo "   (This is a one-time download ~700MB)"
    mkdir -p "$MODEL_DIR"
    
    # Use python to download + convert + quantize
    cd /app
    python3 -c "
from huggingface_hub import snapshot_download
import os
print('Downloading HF weights...')
snapshot_download(
    repo_id='microsoft/BitNet-b1.58-2B-4T',
    local_dir='/models/hf-weights',
    ignore_patterns=['*.md', '*.txt']
)
print('Download complete!')
"
    echo "⚙️  Quantizing to I2_S (1.58-bit)..."
    python3 /app/setup_env.py --hf-repo microsoft/BitNet-b1.58-2B-4T \
        -q i2_s \
        --model-dir /models/hf-weights \
        --output /models/ggml-model-i2_s.gguf 2>/dev/null || \
    # Fallback: manual convert + quantize
    (python3 /app/convert_hf_to_gguf.py /models/hf-weights --outfile /models/ggml-model-f32.gguf --outtype f32 && \
     /app/bin/llama-quantize /models/ggml-model-f32.gguf /models/ggml-model-i2_s.gguf i2_s && \
     rm -f /models/ggml-model-f32.gguf)
    
    echo "✅ Model ready at $MODEL_FILE"
else
    echo "✅ Model found — skipping download"
fi

# ── Auto-detect llama-server binary ─────────────────────────
SERVER_BIN=""
for path in /app/bin/llama-server /app/bin/Release/llama-server; do
    if [ -x "$path" ]; then
        SERVER_BIN="$path"
        break
    fi
done

if [ -z "$SERVER_BIN" ]; then
    echo "❌ llama-server binary not found!"
    ls -la /app/bin/ 2>/dev/null || echo "  (bin/ not found)"
    exit 1
fi

echo "✅ Using server: $SERVER_BIN"
echo "🚀 Atma is LIVE at http://0.0.0.0:$PORT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

exec "$SERVER_BIN" \
    --model "$MODEL_FILE" \
    --host "$HOST" \
    --port "$PORT" \
    --threads "$THREADS" \
    --ctx-size "$CTX_SIZE" \
    --log-disable
