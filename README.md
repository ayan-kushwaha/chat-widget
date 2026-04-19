# 🏛️ Clage: The AI-Native OS Prototype Hub
## *(Legacy Cluaiz Beta • Learning & Research Sanctuary)*

> [!IMPORTANT]
> This repository is a historical archival of the early-stage experiments for the **Cluaiz Ecosystem**. It tracks the iterative transition from high-level simulations to bare-metal silicon orchestration. This is a "Learning Project" and should be treated as an experimental sandbox.

---

## 🚀 The Vision
Clage (a fusion of *Cluaiz* and *Age/Stage*) was designed to answer a fundamental architectural question: **"What if the AI was the kernel?"** 

Traditionally, AI is treated as a user-space application. Clage flips this paradigm, exploring a world where neural logic manages hardware resources, process isolation, and cross-service communication at the core level.

---

## 🏗️ System Architecture (The "Pillar" Framework)

The project is structured into modular "Pillars" that interact through a containerized cluster.

### 🧠 Pillar A: The Brain (`ai_engine`)
A high-performance Python/FastAPI environment that serves as the central multi-agent orchestrator.
- **Neural Knowledge Graph**: Uses **Neo4j** (Bolt protocol) to maintain a persistent "Mind Map" of information.
- **Vector Intelligence**: Integrates with **Qdrant** for semantic retrieval and long-term memory.
- **Search Capability**: Bound to **SearxNG** for real-time web-grounding.
- **Background Tasks**: Powered by **Celery & Redis** for "Brain Janitor" maintenance.

### ⚙️ Pillar B: The Manager (`Backend`)
The logistical heart of the system, written in **TypeScript (Node.js/Express)**.
- **Orchestration**: Manages job queuing via **BullMQ**.
- **Data Persistence**: Uses **MongoDB (Mongoose)** for user-data and document meta-data.
- **Real-time Sync**: **Socket.io** enables low-latency communication between the AI and the user.
- **Storage**: Integrated with **MinIO (S3)** for handling massive document blobs.

### 🎨 Pillar C: The Face (`Frontend`)
A reactive, high-performance UI built with **Next.js**.
- Designed to provide a "Glassmorphic" interface into the AI's internal state.
- Real-time rendering of Neural Graph nodes.

### 🚀 Pillar D: Rocket-Mode (`turbo_LLM_engine`)
A specialized inference engine designed for speed.
- **Logic**: Uses **LMDeploy** (AWQ/Quantized) for near-instant token generation.
- **Primary Model**: Optimized for **Qwen3-4B-AWQ** and similar silicon-efficient architectures.

### 🔊 Pillar E: Sonic Layer (`voice-service`)
The ears and mouth of the prototype.
- **STT**: Uses **OpenAI Whisper (Turbo)** for real-time voice-to-text.
- **Local Execution**: CPU-bound optimization but ready for GPU acceleration.

### ⚛️ Pillar F: Atma (`bitnet-service`)
The sovereign intelligence experiment.
- **Tech**: Exploring **1.58-bit (BitNet)** ternary quantization.
- **Philosophy**: Localized, personalized intelligence on "Bare-Metal" without cloud dependencies.

---

## 🛠️ Installation & Setup

### 🐳 The Docker Path (Recommended)
This is a cluster-grade project. Ensure you have **Docker Desktop** and **NVIDIA Container Toolkit** installed.

1.  **Clone the Repo**:
    ```bash
    git clone https://github.com/aryan7122/Cluaiz-beta.git
    cd cluaiz
    ```

2.  **Environment Setup**:
    - Rename `.env.example` to `.env`.
    - Provide your `GEMINI_API_KEY` and other credentials.

3.  **Boot the Cluster**:
    ```bash
    docker-compose up --build
    ```
    *This will initialize 15+ containers including Neo4j, Qdrant, Redis, Mongo, and the AI Engine.*

### 🖥️ Manual Startup (Developer Mode)
If running outside Docker:
- **Backend**: `cd Backend && npm install && npm run dev`
- **AI Engine**: `cd ai_engine && pip install -r requirements.txt && uvicorn main:app --reload`
- **Frontend**: `cd Frontend && npm install && npm run dev`

---

## 🧪 Documentation & Research Trace
This repo contains raw research logs and architectural notes produced during the "Sovereign Lockdown" iterations.
- See `NEW_CLUAIZ_MASTER_ARCHER__RESEARCH_DOCUMENT.txt` for the deep-trace logs.
- See `MDFile` for early-stage design mocks.

---

## 🛡️ Sovereign Protocol Disclaimer
This project is part of a larger mission to build **unbreakable, local, and hardware-agnostic AI**. It contains "Learning Code" that documents the struggle against simulation-era technical debt. 

**Architectural Purity is the Goal. Performance is the Metric.**

---
*Authored by Aryan | Engineered via Archer CTO Protocol*
