# ============================================================
# Stage 1: BUILD — Compile bitnet.cpp ONLY (no model baked in)
# Model will be downloaded at runtime to mounted volume
# ============================================================
FROM ubuntu:22.04 AS builder

ENV DEBIAN_FRONTEND=noninteractive

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    cmake \
    python3 \
    python3-pip \
    python3-venv \
    wget \
    software-properties-common \
    gnupg \
    lsb-release \
    curl \
    && wget -q https://apt.llvm.org/llvm.sh \
    && chmod +x llvm.sh \
    && ./llvm.sh 18 \
    && apt-get install -y --no-install-recommends clang-18 \
    && update-alternatives --install /usr/bin/clang clang /usr/bin/clang-18 100 \
    && update-alternatives --install /usr/bin/clang++ clang++ /usr/bin/clang++-18 100 \
    && rm -rf /var/lib/apt/lists/* llvm.sh

WORKDIR /build

# Clone BitNet repo (with llama.cpp submodule)
RUN git clone --recursive https://github.com/microsoft/BitNet.git .

# Install Python dependencies
RUN pip3 install --no-cache-dir -r requirements.txt && \
    pip3 install --no-cache-dir huggingface_hub

# THE FIX: Inject -Wno-error into cmake flags to prevent compile errors
ENV CFLAGS="-Wno-error"
ENV CXXFLAGS="-Wno-error"
ENV CMAKE_C_FLAGS="-Wno-error"
ENV CMAKE_CXX_FLAGS="-Wno-error"

RUN sed -i 's/"-DCMAKE_C_COMPILER=clang"/"-DCMAKE_C_COMPILER=clang", "-DCMAKE_C_FLAGS=-Wno-error"/g' setup_env.py && \
    sed -i 's/"-DCMAKE_CXX_COMPILER=clang++"/"-DCMAKE_CXX_COMPILER=clang++", "-DCMAKE_CXX_FLAGS=-Wno-error"/g' setup_env.py

# COMPILE ONLY — no model download here (model stored in mounted volume)
RUN python3 setup_env.py --hf-repo microsoft/BitNet-b1.58-2B-4T -q i2_s --build-only 2>/dev/null || \
    (cmake -B build -DCMAKE_C_COMPILER=clang -DCMAKE_CXX_COMPILER=clang++ \
    -DCMAKE_C_FLAGS="-Wno-error" -DCMAKE_CXX_FLAGS="-Wno-error" \
    -DGGML_OPENMP=OFF && cmake --build build --config Release -j$(nproc))

# ============================================================
# Stage 2: RUNTIME — Lean image with compiled binary only
# ============================================================
FROM ubuntu:22.04 AS runner

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    python3 \
    python3-pip \
    curl \
    && pip3 install --no-cache-dir huggingface_hub \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy ONLY the compiled binaries (no model weights)
COPY --from=builder /build/build/bin/ /app/bin/
COPY --from=builder /build/setup_env.py /app/setup_env.py
COPY --from=builder /build/requirements.txt /app/requirements.txt

# Copy entrypoint
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# MODEL_DIR = mounted volume from host (Cluaiz-OS/Cluaiz-ai/models/bitnet-personalized-llm)
VOLUME ["/models"]

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:8081/health || exit 1

EXPOSE 8081

ENTRYPOINT ["/app/entrypoint.sh"]
