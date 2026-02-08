# 🗺️ Zero to Hero: 50 LPA AI Architect Roadmap
**Goal:** Build `ai_engine` from scratch without AI help.

Ye roadmap step-by-step hai. Ek step skip kiya to agla samajh nahi aayega.

---

## 🟢 Phase 1: Python Foundation (The Base)
**Time:** 1 Week
**Goal:** Python ka syntax aur behavior samajhna.

1.  **Variables & Types**: `int`, `str`, `bool`. (Python dynamic hai, `var` likhne ki zaroorat nahi).
2.  **Data Structures**: 
    -   `List []`: Arrays.
    -   `Dict {}`: JSON objects aka HashMaps. (Sabse zaroori!).
    -   `Tuple ()`: Immutable lists.
3.  **Control Flow**: `if/else`, `for loops`, `while loops`.
4.  **Functions**: `def function_name():`. `return` kya karta hai.

✅ **Check:** Kya tum bina Google kiye "Factorial of a number" ka code likh sakte ho?

---

## 🟡 Phase 2: Modern Python (The 50 LPA Logic)
**Time:** 1 Week (Most Important for Cluaiz)
**Goal:** Wo Python jo real software mein use hoti hai, school mein nahi.

1.  **Type Hinting**: `def add(a: int, b: int) -> int:`. (Pydantic ke liye foundation).
2.  **Decorators**: `@app.get` ka kya matlab hai? (`@` symbol). Wrapper functions samjho.
3.  **Default Arguments**: `def func(a, b=10):`.
4.  **🔥 AsyncIO (CRITICAL)**:
    -   Sync vs Async samjho.
    -   `async def` aur `await` keywords.
    -   Cluaiz mein **har function** async hai. Agar ye nahi samjha, to code block ho jayega.

✅ **Check:** Kya tum samjha sakte ho ki `await` code ko rokta hai ya chalaata hai?

---

## 🟠 Phase 3: The API Layer (FastAPI)
**Time:** 1 Week
**Goal:** Server banana.

1.  **FastAPI Basics**: `GET`, `POST`, `PUT`, `DELETE` requests.
2.  **Path & Query Parameters**: `/users/{id}` vs `/users?id=1`.
3.  **Pydantic Models**: Data validation.
    ```python
    class User(BaseModel):
        name: str
        age: int
    ```
4.  **Dependencies**: `Depends()`. Database session kaise inject karein.

✅ **Check:** Ek API banao jo `POST /add` par 2 numbers le aur sum return kare.

---

## 🔴 Phase 4: The Data Layer (Mongo & Redis)
**Time:** 1 Week
**Goal:** Data save karna.

1.  **MongoDB (NoSQL)**: Data "Documents" mein store hota hai, "Tables" mein nahi.
    -   `Library`: `motor` (Async Mongo driver).
2.  **CRUD Operations**: Create, Read, Update, Delete.
3.  **Redis**: Caching. Key-Value pair storage.

✅ **Check:** User ka data Mongo mein save karo aur Redis mein cache karo.

---

## 🟣 Phase 5: The AI Layer (The Magic)
**Time:** 2 Weeks (Final Boss)
**Goal:** LLMs ko control karna.

1.  **LangChain Basics**: Prompts aur Chains.
    -   User ka input -> Prompt Template -> OpenAI/Gemini -> Output.
2.  **Embeddings & Vector DB (ChromaDB)**: 
    -   Text ko numbers mein todna.
    -   Similarity Search ("Apple" is closer to "Start" than "Car").
3.  **RAG (Retrieval Augmented Generation)**:
    -   PDF -> Text -> Vectors -> ChromaDB.
    -   User Question -> Search ChromaDB -> Send Context to Gemini -> Answer.

✅ **Check (Sample Project):** "Cluaiz Mini". 
Ek aisa bot jo PDF upload kare aur usse related sawal ka jawab de.

---

## 🏆 Project Ideas (To Build Portfolio)

### 1. The "ToDo" API
-   **Tech**: FastAPI, Pydantic.
-   **Task**: Task add, delete, list karne ka API. 
-   **Level**: Easy.

### 2. The "Blog" Engine
-   **Tech**: FastAPI, MongoDB (Motor), User Auth.
-   **Task**: User register kare, login kare, blog post likhe.
-   **Level**: Medium.

### 3. "Cluaiz" Clone (RAG)
-   **Tech**: FastAPI, LangChain, ChromaDB, PDF parsing.
-   **Task**: PDF upload karke chat karna.
-   **Level**: 50 LPA Mastery.

---

## 📚 Resources
-   **Official Docs**: FastAPI, Pydantic, LangChain documentation (Best hai).
-   **YouTube Channels**: ArjanCodes, Tech With Tim, Hussein Nasser (Backend Engineering).
