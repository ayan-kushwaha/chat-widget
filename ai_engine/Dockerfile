# Lightweight Python 3.10
FROM python:3.10-slim

# Install system dependencies for Vision/PDF (Tesseract, Poppler)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpoppler-cpp-dev \
    pkg-config \
    tesseract-ocr \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set Workdir
WORKDIR /app

# Install Python Deps
# Install Python Deps
RUN pip install --upgrade pip

# 1. Install Torch separately (Heavy ~800MB) - Cached Layer
RUN pip install --no-cache-dir --default-timeout=1000 torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# 2. Install Unstructured (Heavy) - Cached Layer
RUN pip install --no-cache-dir --default-timeout=1000 "unstructured[all-docs]"

# 3. Install Playwright (Medium) - Cached Layer
RUN pip install --no-cache-dir --default-timeout=1000 playwright

# 4. Install remaining deps
COPY requirements.txt .
RUN pip install --no-cache-dir --default-timeout=1000 --retries 10 -r requirements.txt

# Copy Code
COPY . .

# Expose Port 5000 (Internal)
EXPOSE 5000

# Run Command (Overridden by docker-compose)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]
