# 🏛️ Cluaiz Interview Mastery: Global Architecture & System Design
**Status:** Expanded | **Count:** 20 Questions | **Language:** Hinglish (Asli Sach)

---

## 🏗️ The Foundation (Monolith vs Microservices)

### Q1: Cluaiz ka Architecture kya hai? Monolith ya Microservices?
**The Short Answer:**
"It's a **Modular Monolith** transitioning into **Microservices**."
**The 50 LPA Explanation:**
"Sir, Cluaiz abhi hybrid state mein hai.
- **Backend (Node.js)**: Ye Orchestrator hai. Auth & DB handle karta hai.
- **AI Engine (Python)**: Ye isolated Microservice hai.
Humne puraan monolithic approach nahi li jahan sab kuch ek hi server pe ho, aur na hi premature microservices kiye jahan 50 services hon.
Humne **Service-Oriented Architecture (SOA)** approach li hai jahan heavy compute (AI) alag hai, aur I/O bound (Node) alag hai."

### Q2: Backend aur AI Engine communicate kaise karte hain?
**Answer:**
"Do modes hain:
1.  **Sync (HTTP/Axios):** Choti requests ke liye (e.g., 'Check API Status'). Ye fast hai par blocking ho sakta hai agar Python busy ho.
2.  **Async (Producer-Consumer via BullMQ/Redis):** Heavy tasks ke liye (e.g., 'Summarize 500 page PDF').
    - User request karta hai -> Node usse Queue mein daalta hai -> User ko 'Processing' bolta hai -> Python worker fursat mein uthata hai -> Result Webhook ke through wapas Node ko deta hai."

### Q3: Why did you keep AI Engine separate in Python? Why not Node.js for everything?
**Logic:**
"Node.js AI/ML libraries (PyTorch, TensorFlow, LangChain) ke liye mature nahi hai. Python is the king there.
Agar hum Node pe AI run karte (child_process), to Node ka Event Loop block ho jata heavy calculation se.
Isliye 'Best Tool for the Job' strategy use ki: **Python for Compute, Node for I/O**."

### Q4: Scalability Strategy explain karo (Vertical vs Horizontal)?
**Answer:**
"Hum **Horizontal Scaling** use karte hain.
- **State:** Hamara backend stateless hai. Session Redis mein hai, Data Mongo mein.
- **Auto-Scaling:** Agar traffic badhta hai, to hum AWS par Node.js containers `n` se `n+10` kar sakte hain load balancer ke peeche.
- **Vertical Scaling** (Server bada karna) fail ho jata hai ek limit ke baad, aur expensive bhi hai."

### Q5: Database Choice: Why MongoDB (NoSQL) over Postgres (SQL)?
**Answer:**
"Cluaiz ka data structure fixed nahi hai.
AI jo data return karta hai (JSON), wo har model ke liye alag ho sakta hai. RAG ke documents unstructured hote hain.
MongoDB ka **Flexible Schema** humein allow karta hai ki hum naye features bina migration scripts run kiye add kar sakein.
Aur `Mongoose` humein application layer pe Validation deta hai, to data ganda nahi hota."

---

## 🚀 Scaling & Performance (The Heavy Lifting)

### Q6: 1 Million Users aa gaye to kya phatega? Kaise rokoge?
**Answer:**
1.  **Database Connection Limit:** Mongo ke connections exhaust ho jayenge.
    - *Fix:* Connection Pooling implementation aur Read Replicas (Separating Read/Write operations).
2.  **Socket.io Bottleneck:** Ek server max 65k ports handle kar sakta hai.
    - *Fix:* **Redis Adapter** for Socket.io. Multiple servers users ko handle karenge aur Redis ke through aapas mein baat karenge.

### Q7: Redis ka role kya hai Cluaiz mein? (Sirf Caching nahi!)
**Answer:**
"Redis hamari **Central Nervous System** hai.
1.  **Queue Broker:** BullMQ ke jobs hold karta hai.
2.  **Pub/Sub:** Socket events distribute karta hai.
3.  **Caching:** Expensive API responses (e.g., User Dashboard Stats) cache karta hai 5 min ke liye.
4.  **Session Store:** User login sessions rakhta hai."

### Q8: Load Balancing logic kya hai? Sticky Session zaroori hai?
**Answer:**
"Haan, WebSockets ke liye **Sticky Sessions** (Session Affinity) zaroori hain.
Jab client handshake karta hai, to wo kai HTTP requests bhejta hai. Agar Load Balancer ne usse har baar alag server pe bheja, to handshake fail ho jayega.
Nginx/AWS ALB mein hum 'IpHash' use karte hain taaki same user same server pe land kare."

### Q9: Rate Limiting kaise implement ki hai?
**Answer:**
"Humne **Fixed Window Counter** use kiya hai Redis ke saath.
Middleware check karta hai: `IP_ADDRESS_TIMESTAMP`.
Agar 1 minute mein > 100 requests hain, to `429 Too Many Requests` return karte hain.
Ye DDoS attacks aur API abuse se bachata hai."

### Q10: CDN (Content Delivery Network) kahan use ho raha hai?
**Answer:**
"Static assets (Images, CSS, JS) aur User Uploaded files (PDFs, Avatars) hum **S3 Compatible Storage (MinIO/AWS S3)** pe rakhte hain aur Cloudflare CDN ke through serve karte hain.
Backend server se kabhi file serve nahi karte (Node is bad at serving static files under load)."

---

## 🛡️ Security & Reliability

### Q11: Security Architecture ki 3 layers kya hain?
**Answer:**
1.  **Transport Layer:** HTTPS/TLS mandatory.
2.  **Application Layer:** JWT verification, Input Sanitization (Zod), XSS protection (React default).
3.  **Database Layer:** Network isolation (DB public internet pe access nahi hai, sirf Docker internal network mein hai).

### Q12: JWT Store kahan karte ho? Header ya Cookie?
**Answer:**
"Hum **HttpOnly Cookie** use karte hain.
- **LocalStorage:** XSS attack se access ho sakta hai.
- **HttpOnly Cookie:** JS isse read nahi kar sakti. Ye automatically har request ke saath jata hai. CSRF protection ke liye `SameSite=Strict` use karte hain."

### Q13: 'Single Point of Failure' (SPOF) kya hai system mein?
**Trap Question.** "Accept your weakness."
**Answer:**
"Filhal hamara **Master Database** SPOF hai. Agar Primary Mongo node gir gaya, to write operations ruk jayenge.
Production mein hum **Replica Set** use karenge auto-failover ke liye."

### Q14: CI/CD Pipeline kaise design ki hai?
**Answer:**
"GitHub Actions use karte hain.
1.  **Push:** Code push hote hi Linting aur Test run hote hain.
2.  **Build:** Docker image banti hai.
3.  **Deploy:** Watchtower/ArgoCD naya image pull karke container restart karta hai.
Manual SSH karke `git pull` karna mana hai."

### Q15: Logging & Monitoring Strategy?
**Answer:**
"Hum **Winston/Pino** use karte hain structured logging (JSON) ke liye.
`Server crashed` log se kuch pata nahi chalta.
Hum log karte hain: `{ timestamp, level, userId, route, errorStack }`.
Monitoring ke liye **Prometheus + Grafana** dashboard hai jo CPU/RAM aur Request Latency track karta hai."

---

## 🧩 Advanced Logic

### Q16: Webhooks vs Polling? Cluaiz mein kya use hota hai?
**Answer:**
"Dono.
- **Frontend -> Backend:** Hum Polling avoid karte hain. **WebSockets** use karte hain real-time updates ke liye.
- **AI Service -> Backend:** Hum Webhooks use karte hain. Jab job complete hoti hai, worker Backend ke `/webhooks/job-complete` endpoint pe data POST karta hai."

### Q17: Idempotency kya hoti hai? Kyun zaroori hai?
**Answer:**
"Agar user ne 'Payment' button do baar click kar diya galti se, to do baar paise nahi katne chahiye.
Hum har critical request mein `Idempotency-Key` header maangte hain. Redis mein check karte hain ki kya ye key pehle process hui hai? Agar haan, to purana result hi return kar dete hain bina dubara process kiye."

### Q18: Database Indexing strategy kya hai?
**Answer:**
"Blindly index nahi karte.
Hum `Explain Plan` use karke dekhte hain kaunsi queries slow hain.
Mostly `email`, `userId`, `createdAt` aur compound indexes (e.g., `orgId + status`) banaye hain taaki filtering fast ho."

### Q19: Docker volumes vs Bind Mounts?
**Answer:**
"Development mein **Bind Mounts** use karte hain taaki code change hote hi restart ho (Hot Reload).
Production mein **Volumes** use karte hain Database persistence ke liye, kyunki wo OS file system se decoupled aur managed hote hain."

### Q20: Agar kal AWS band ho jaye, to migration plan kya hai? (Vendor Lock-in)
**Answer:**
"Hamara poora stack **Containerized (Docker)** hai.
Hum kisi bhi cloud (GCP, Azure, DigitalOcean) ya on-premise server pe 1 ghante mein shift ho sakte hain. Humne AWS specific services (Lambda, DynamoDB) avoid ki hain aur standard Open Source tools (Express, Mongo, Redis) use kiye hain."
