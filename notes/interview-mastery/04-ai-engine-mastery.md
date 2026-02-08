# 🧠 Cluaiz Interview Mastery: AI Engine Breakdown (RAG, Vectors & Python)
**Status:** Expanded | **Count:** 25 Questions | **Tech:** Python, FastAPI, LangChain, ChromaDB, Gemini

---

## 🤖 The "Brain" Architecture (RAG & LLMs)

### Q1: RAG (Retrieval Augmented Generation) kya hai? (Simple)
**Story:** "Imagine exam hall mein book le jana allowed hai."
Open Book Exam = RAG.
Closed Book Exam = Standard LLM.
**Formal:** "RAG LLM ko external data (PDFs/Web) access karne ki taqat deta hai bina training ke."

### Q2: RAG Pipeline ke steps kya hain? (Deep Dive)
**Answer:**
1.  **Ingestion:** PDF -> Text extraction (`unstructured`).
2.  **Chunking:** Text ko split karna (e.g., 500 chars). *Important: Overlap rakhna taaki context na tute.*
3.  **Embedding:** Text -> Vector conversion (`sentence-transformers`).
4.  **Retrieval:** Vector similarity search (Top-k results).
5.  **Generation:** Prompt + Content -> LLM -> Answer.

### Q3: Chunking (Splitting) strategies?
**Answer:**
- **Fixed Size:** Har 1000 characters pe kaat do. (Risk: Sentence beech mein kat sakta hai).
- **Recursive Character Splitter:** Paragraph (`\n\n`) -> Line (`\n`) -> Space (` `). Best approach LangChain mein.
- **Semantic Chunking:** Meaning change hone pe split karo (New innovation).

### Q4: Embeddings kya hoti hain? (Vector Math)
**Answer:**
"Ye words ka numerical representation hai (e.g., `[0.1, -0.5, 0.9...]`).
King - Man + Woman = Queen.
Hum `all-MiniLM-L6-v2` heavy use karte hain kyunki ye fast aur accurate hai."

### Q5: ChromaDB vs Pinecone vs Weaviate?
**Answer:**
- **Pinecone:** Managed Cloud (Easy, expensive).
- **Weaviate:** Complex features (Hybrid Search).
- **ChromaDB:** Simple, Local, Open Source. Perfect for MVP and self-hosting.
Humne **Chroma** choose kiya kyunki hum data user ke server pe rakhna chahte the for privacy.

---

## 🐍 Python & Async Performance

### Q6: `async def` ka kya matlab hai Python mein?
**Answer:**
"Python GIL (Global Interpreter Lock) ki wajah se single threaded hai.
`async` humein allow karta hai **Concurrency** bina Threads ke.
Jab `await db.query()` chalta hai, Python rukta nahi, dusri request handle karta hai. Ye I/O bound tasks ke liye game changer hai."

### Q7: Pydantic kya hai? (Validation)
**Answer:**
"Ye Runtime type checking hai.
Agar humne bola `age: int` aur user ne `"25"` string bheja, to Pydantic usse `25` integer bana dega automatically.
Agar `"twenty"` bheja to Error dega. This prevents dirty data entering our system."

### Q8: FastAPI dependency injection?
**Answer:**
"`Depends()` function.
Hum database session ya auth user har route mein inject karte hain:
`def route(user: User = Depends(get_current_user)):`
Isse code modular aur testable banta hai."

### Q9: `yield` keyword kya karta hai?
**Answer:**
"Ye function ko pause karta hai aur value return karta hai, fir wahi se resume hota hai.
Streaming Response ke liye use hota hai. LLM ek-ek word generate karta hai aur `yield` karta hai. Client ko typewriter effect dikhta hai."

### Q10: Python Virtual Environments (`venv`) kyun zaroori hain?
**Answer:**
"Dependency Conflict bachane ke liye.
Project A ko `numpy 1.0` chahiye, Project B ko `numpy 2.0`.
Global install karne se conflict hoga. `venv` har project ko isolate karta hai."

---

## 🛠️ Advanced AI Engineering

### Q11: "Hallucination" kya hai aur kaise rokte ho?
**Answer:**
"Jab AI confident hoke jhoot bolta hai.
**Fixes:**
1.  **Temperature 0:** Creativity band karo.
2.  **Strict Prompting:** 'Answer ONLY from the provided context. If unknown, say I don't know'."
3.  **Citations:** Source dikhana zaroori hai.

### Q12: Vector Search: Cosine Similarity vs Euclidean Distance?
**Answer:**
- **Euclidean:** Do points ke beech ki *duri* (Magnitide matters).
- **Cosine:** Do arrows ka *angle* (Direction matters).
Text similarity ke liye **Cosine** best hai kyunki document ki length matter nahi karti, topic matter karta hai."

### Q13: Hybrid Search (Keyword + Vector) kya hai?
**Answer:**
"Vector search kabhi-kabhi exact details (like 'Email: abc@gmail.com') miss kar deta hai.
Keyword search (BM25) exact match dhundta hai.
**Hybrid Search** dono ko combine karta hai best results ke liye (Reciprocal Rank Fusion - RRF)."

### Q14: Prompt Engineering tricks?
**Answer:**
1.  **Chain of Thought (CoT):** "Think step by step."
2.  **Few-Shot Learning:** Examples dena prompt mein.
3.  **Role Play:** "You are a senior lawyer..."

### Q15: LLM Context Window limit kya hai?
**Answer:**
"Gemini 1.5 Pro ka 1 Million tokens hai. GPT-4 ka 128k.
Agar PDF badi hai, to hum poori nahi bhej sakte. RAG isliye zaroori hai taaki hum relevant parts hi bhejein."

---

## 🌐 Real-World Implementation

### Q16: PDF Parsing challenges? (OCR)
**Answer:**
"Scanned PDF se text nikalna mushkil hai.
Hum `tesseract` (OCR) use karte hain agar `pypdf` fail ho jaye.
Tables aur Images extract karna abhi bhi hard problem hai (Layout Analysis Models use karne padte hain)."

### Q17: LangChain 'Memory' kaise kaam karti hai?
**Answer:**
"LLMs stateless hote hain. Har request nayi hoti hai.
LangChain `ConversationBufferMemory` use karta hai. Purani chats ko prompt mein append karke bhejta hai:
`History: User said Hi -> AI said Hello. Current: What is my name?`"

### Q18: Streaming latency kam kaise karein? (Time to First Token)
**Answer:**
1.  Chota Model use karo (Gemini Flash vs Pro).
2.  Parallel Processing (MapReduce) agar summarization hai.
3.  Aggressive Caching (Redis) agar same sawal baar baar aa raha hai.

### Q19: OpenAI vs Gemini cost comparison?
**Answer:**
"Gemini Flash currently sabse sasta hai aur fast hai.
GPT-4o expensive hai par reasoning mein better hai.
Humne abstract layer banayi hai taaki model switch karna easy ho config change karke."

### Q20: Function Calling (Tool Use) kya hai?
**Answer:**
"LLM ko batana ki hamare paas ek function hai `get_weather(city)`.
User: 'Delhi ka mausam kaisa hai?'
LLM JSON return karega: `{'function': 'get_weather', 'args': 'Delhi'}`.
Hum function run karke result wapas LLM ko denge final answer ke liye."

---

## ⚡ Deployment & Ops

### Q21: GPU requirement for Inference?
**Answer:**
"Agar hum Local LLM (Llama 3) run karte hain, to 24GB VRAM chahiye (A10G).
Cloud APIs (OpenAI) use karne pe hamare server pe load nahi padta."

### Q22: Python concurrency limitations?
**Answer:**
"CPU bound tasks (Image processing) ke liye `multiprocessing` use karna padta hai instead of `asyncio/threading` kyunki Python ek waqt pe ek hi CPU core use karta hai."

### Q23: Environment Variables handling?
**Answer:**
"`python-dotenv` use karte hain `.env` file load karne ke liye.
Production mein ye values Docker Compose ya Kubernetes Secrets se aati hain."

### Q24: Error Handling in AI pipelines?
**Answer:**
"Retry mechanism zaroori hai (`tenacity` library).
OpneAI kabhi-kabhi `503 Service Unavailable` deta hai. Exponential backoff ke saath retry karte hain."

### Q25: Evaluating RAG Quality (RAGAS)?
**Answer:**
"Kaise pata chalega system accha hai?
**RAGAS** metric use karte hain:
1.  **Faithfulness:** Answer context se hi aaya na?
2.  **Answer Relevance:** User ke sawal ka jawab mila?"
