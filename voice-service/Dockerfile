FROM python:3.11-slim

# System dependencies for audio processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    curl \
    espeak-ng \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ⚡ Install PyTorch CPU-ONLY first (saves ~5GB vs full torch)
# Using increased timeout and retries for large downloads
RUN pip install --no-cache-dir \
    --timeout=600 \
    --retries=5 \
    torch==2.5.1+cpu \
    torchaudio==2.5.1+cpu \
    --index-url https://download.pytorch.org/whl/cpu

# Install lighter dependencies first (cached separately)
RUN pip install --no-cache-dir --timeout=600 --retries=5 \
    fastapi==0.115.0 \
    uvicorn[standard]==0.30.0 \
    numpy>=1.24.0 \
    python-multipart>=0.0.9 \
    aiofiles>=23.0.0 \
    pydantic>=2.0.0 \
    soundfile>=0.12.0 \
    onnxruntime==1.19.0

# Install heavy AI packages in a separate layer (easier to retry if timeout)
RUN pip install --no-cache-dir --timeout=600 --retries=5 \
    faster-whisper==1.1.0

# Install Coqui TTS (largest package - separate layer for easy retry)
RUN pip install --no-cache-dir --timeout=600 --retries=5 \
    TTS>=0.22.0

# Install Piper TTS
RUN pip install --no-cache-dir --timeout=600 --retries=5 \
    piper-tts>=1.2.0

# Copy application code
COPY . .

# Create directories for audio files and models
RUN mkdir -p /app/temp /app/models/piper /app/models/xtts

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

EXPOSE 8080

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080"]
