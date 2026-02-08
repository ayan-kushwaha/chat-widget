# 🚦 Cluaiz Interview Mastery: Backend Breakdown (Node.js & Scalability)
**Status:** Expanded | **Count:** 25 Questions | **Tech:** Node.js, Express, Socket.io, BullMQ, Redis

---

## ⚙️ Core Backend Mechanics (The Engine)

### Q1: Node.js Event Loop ko "Loop" kyun kehte hain?
**Answer:**
"Kyunki ye check karta rehta hai:
1.  **Timers:** `setTimeout` expire hua?
2.  **I/O:** Database query aayi? File read hui?
3.  **Poll:** Incoming requests check karo.
4.  **Check:** `setImmediate` run karo.
5.  **Close:** Sockets close karo.
Ye phases baar-baar repeat hote hain jab tak process chal raha hai."

### Q2: `process.nextTick()` vs `setImmediate()`?
**Answer:**
- **`process.nextTick()`:** Ye Event Loop ke phase shuru hone se *pehle* run hota hai. Iska priority highest hai (par starve kar sakta hai loop ko).
- **`setImmediate()`:** Ye Poll phase ke *baad* run hota hai. Check phase mein.
"Hum mostly `setImmediate` use karte hain heavy I/O tasks ke baad cleanup ke liye."

### Q3: Clustering vs Worker Threads?
**Answer:**
- **Clustering:** Naya Process banata hai (alag memory heap). CPU cores utilize karne ke liye best hai (HTTP server scaling).
- **Worker Threads:** Same Process mein thread banata hai (shared memory). Heavy computation (Image Resize, JSON parse) ke liye best.
"Cluaiz mein hum **Clustering (PM2)** use karte hain HTTP traffic distribute karne ke liye."

### Q4: Memory Leak kaise detect karte ho?
**Answer:**
"Symptoms: Server ki RAM usage badhti ja rahi hai bina load ke.
**Tools:** `chrome://inspect` attach karke snapshot lo, ya `heapdump` package use karo.
Common causes: Global variables (`const cache = {}`), Unclosed Sockets, ya `setInterval` jo kabhi clear nahi hua."

### Q5: Streams kya hain? (File Upload Logic)
**Answer:**
"Agar 1GB ki video upload ho rahi hai, to hum usse poora memory mein load nahi karte (Buffer).
Hum **Streams (Chunks)** use karte hain. Jais-jaise data aata hai, hum usse disk pe write karte jate hain.
RAM usage sirf 64KB rehti hai chahe file 10GB ki ho.`pipe()` function use hota hai."

---

## ⚡ BullMQ & Async Processing (The Worker)

### Q6: Queue mein "Stalled Job" kya hoti hai?
**Answer:**
"Agar Worker crash ho jaye job process karte waqt, to job 'Active' state mein hi reh jati hai.
BullMQ usse 'Stalled' mark karta hai aur automatic retry karta hai thodi der baad.
Isliye hamari jobs **Idempotent** honi chahiye (dobara run hone pe nuksan na ho)."

### Q7: Priority Jobs kaise handle hoti hain?
**Answer:**
"Agar Premium User ne request ki hai, to uska PDF pehle summarize hona chahiye.
Hum `queue.add('job', data, { priority: 1 })` set karte hain. Default priority 0 hoti hai. BullMQ high priority jobs ko pehle uthata hai FIFO tod ke."

### Q8: Delayed Jobs (Cron Jobs) kaise banate ho?
**Answer:**
"Email bhejna hai '3 din baad'.
`queue.add('email', data, { delay: 3 * 24 * 60 * 60 * 1000 })`.
Redis mein `ZSET` (Sorted Set) use hota hai time track karne ke liye. Jab time aata hai, to job Active queue mein move hoti hai."

### Q9: Rate Limiting in Queues?
**Answer:**
"OpenAI API limit 3 requests/sec hai.
Hum Queue Worker mein limiter lagate hain:
`itemsPerInterval: 3, interval: 1000`.
Agar 100 jobs queue mein hain, to worker dhere-dhere process karega rate limit cross nahi karega."

### Q10: Job Events & Monitoring?
**Answer:**
"Hum `@bull-board/api` use karte hain UI dashboard ke liye.
Events: `completed`, `failed`, `stalled`.
Failed jobs ka error stack hum log karte hain DB mein debugging ke liye."

---

## 🔌 WebSockets & Real-time (The Pulse)

### Q11: "Heartbeat" mechanism kya hai Socket.io mein?
**Answer:**
"`pingInterval` aur `pingTimeout`. Server har 25s mein 'Ping' bhejta hai. Client 'Pong' bhejta hai.
Agar Pong nahi aaya, to connection 'Closed' maan liya jata hai. Ye 'Ghost Connections' hatane ke liye zaroori hai."

### Q12: Socket.io Middleware?
**Answer:**
"Handshake hone se pehle JWT verify karna.
`io.use(async (socket, next) => { ... })`.
Agar token invalid hai, to connection reject ho jata hai `new Error('Authentication error')` ke saath."

### Q13: Broadcasting vs Emit concept?
**Answer:**
- `socket.emit()`: Sirf sender ko.
- `socket.broadcast.emit()`: Sender ko chhod ke baaki sabko.
- `io.emit()`: Sabko (Sender included).
Example: "User A typing..." -> `socket.broadcast.to(roomId).emit('typing')`.

### Q14: Presence System (Online/Offline status)?
**Answer:**
"Jab user connect hota hai (`connection`), hum Redis set mein `userId` add karte hain.
Jab disconnect hota hai (`disconnect`), hata dete hain.
Par dhyan rakhna padta hai agar user ke multiple tabs open hain. Hum `referenceCount` maintain karte hain. Jab count 0 ho, tab offline mark karte hain."

### Q15: Scaling WebSockets (Redis Adapter)?
**Answer:**
"Jab multiple node instances hain, to User A server 1 pe hai, User B server 2 pe.
Direct baat nahi kar sakte.
**Redis Adapter** pub/sub use karke message Servers ke beech pass karta hai."

---

## 💾 Database & Caching (The Memory)

### Q16: MongoDB Aggregation Pipeline?
**Answer:**
"Complex queries ke liye `find()` kaam nahi karta.
Jise: 'Past 7 days ki chat counts by User'.
`$match` -> `$group` -> `$project` stages use karte hain. Ye SQL `GROUP BY` jaisa hi hai par powerful."

### Q17: `populate()` vs `$lookup`?
**Answer:**
- `populate()`: Mongoose level pe chalta hai wapas query karta hai. Slow ho sakta hai 10k items pe.
- `$lookup`: Aggregation stage hai. Database server pe join hota hai. Fast hai.
Hum reports ke liye `$lookup` use karte hain, UI ke liye `populate()`."

### Q18: Redis Cache Strategies (Cache-Aside vs Write-Through)?
**Answer:**
"Hum **Cache-Aside** (Lazy Loading) use karte hain.
1.  Read Cache -> Miss?
2.  Read DB -> Write to Cache -> Return.
Write-Through slow hota hai writing ke waqt kyunki dono jagah write karna padta hai simultaneously."

### Q19: Transactions (ACID) in Mongo?
**Answer:**
"Payment deduct hui par Premium activate nahi hua? Critical error.
Hum Mongoose `startSession()` aur `withTransaction()` use karte hain.
Agar koi bhi ek step fail hua, to saare changes rollback ho jate hain."

### Q20: Schema Migration handling?
**Answer:**
"Agar hum `User` schema mein `age` field add karte hain, to purane users ka kya?
Hum default values define karte hain Schema level pe.
Ya script likhte hain `db.users.updateMany({}, { $set: { age: 18 } })` jo deployment ke waqt run hoti hai."

---

## 🛡️ API & Security

### Q21: CORS (Cross-Origin Resource Sharing) kya hai?
**Answer:**
"Browser block karta hai AJAX requests agar domain alag ho.
Backend ko allow karna padta hai: `Access-Control-Allow-Origin: *`.
Production mein hum specific domains allow karte hain whitelist karke."

### Q22: XSS (Cross Site Scripting) se defense?
**Answer:**
"Helmet middleware use karte hain headers set karne ke liye.
React most XSS automatically rokta hai (escaping).
`dangerouslySetInnerHTML` use karna avoid karte hain."

### Q23: SQL Injection (NoSQL Injection)?
**Answer:**
"Mongo mein bhi injection ho sakta hai. `{ $gt: '' }` bhej kar password bypass kar sakte hain.
Hum validate karte hain ki input `string` hi hona chahiye, object nahi."

### Q24: API Versioning?
**Answer:**
"`/api/v1/users`.
Agar breaking change hai, to `/api/v2/users` banate hain taaki purane mobile app users crash na ho."

### Q25: Graceful Shutdown?
**Answer:**
"Jab naya deployment hota hai to `SIGTERM` signal aata hai.
Hum server ko force kill nahi karte.
Open Connections complete karte hain, DB disconnect karte hain, fir process exit karte hain. `server.close()`."
