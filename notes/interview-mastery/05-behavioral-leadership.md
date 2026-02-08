# ⚔️ Cluaiz Interview Mastery: The CTO Mindset (Behavioral & HR)
**Status:** Expanded | **Count:** 15 Questions | **Target:** 50 LPA Pay Scale

---

## 💼 Leadership & Decision Making

### Q1: Tell me about a time you failed? (The Most Important Question)
**The Trap:** "Maine aaj tak galti nahi ki" bolna matlab tumne kaam hi nahi kiya.
**The Cluaiz Answer:**
"Sir, project ke start mein humne **Monolithic architecture** socha tha jisme Python aur Node.js ek hi server pe honge.
Result? **Deploy karne mein nightmares**. Agar Python crash hota to Node bhi crash ho jata. Debugging impossible thi.
**The Fix:** Humne turant **Docker Containers** adopt kiye. Dono ko alag kiya. API Gateway (Nginx) lagaya.
Is failure ne mujhe sikhaya ki **'Decoupling'** theoretical nahi, practical requirement hai."

### Q2: Why should we hire you? (The Pitch)
"Aap mujhe hire mat kijiye agar aapko sirf code likhwana hai.
Hire me because **I understand the Product, not just the Tech.**
Maine Cluaiz ko **Idea se Deployment** tak pahuchaya hai:
1.  **Business Logic:** Samjha ki user ko kya chahiye (Speed + Accuracy).
2.  **Architecture:** Sahi tools (FastAPI, Next.js 16) choose kiye jo scalable hain.
3.  **Ownership:** Main sirf ticket close nahi karta, main feature own karta hoon."

### Q3: How do you handle conflict with a team member? (Code Review Fight)
**The Method:**
"Ego ko darwaze ke bahar chod kar aana chahiye.
Agar mera junior kehta hai 'Bhai ye code Galat hai', to main poochunga **'Kyun?'**.
Agar uska logic sahi hai (e.g., performance issue), main accept karunga.
Agar opinion subjective hai (Style/Formatting), hum **Linting Rules (Prettier/ESLint)** follow karenge.
Conflict resolve karne ka best tareeka hai **Data**: 'Benchmark karke dekhte hain kaun fast hai'."

### Q4: Salary Negotiation (50 LPA maang rahe ho?)
**The Mindset:**
"Value based baat karo, need based nahi."
**The Script:**
"Current market mein ek **Principal Engineer** jo Frontend (Next.js), Backend (Scalability), aur AI (RAG Pipelines) teeno sambhal sake, wo unicorn hai.
Main aapke 3 developers ka kaam akele architecture level pe sambhal sakta hoon.
My expectation is based on the **ROI (Return on Investment)** I bring to the table. I save you server costs (Optimization) and development time (Architecture decisions)."

### Q5: Future of Tech? Kya seekh rahe ho? (Curiosity Check)
"Abhi main **Agentic Workflows** pe focus kar raha hoon.
Sirf Chatbot nahi, but AI Agents jo khud tools use kar sakein (Email bhejna, Code likhna).
LangGraph aur AutoGPT ko explore kar raha hoon taaki Cluaiz ko 'Chat' se 'Action' platform bana sakun."

---

## 🧠 Strategic Thinking

### Q6: Build vs Buy decision? (Video Processing)
**Scenario:** Khud ka Video Transcoder banaoge ya AWS MediaConvert use karoge?
**Answer:**
"Startups mein **Speed > Cost**.
Agar core business video hai (Netflix), to khud banao (FFmpeg).
Agar side feature hai (Cluaiz), to **Buy (API)** karo.
Humne `moviepy` use kiya MVP ke liye, par scale pe hum API use karenge maintenance cost bachane ke liye."

### Q7: Technical Debt kaise manage karte ho?
**Answer:**
"Debt bura nahi hai agar conscious ho.
Hum **'20% Rule'** follow karte hain. Sprint ka 20% time Refactoring aur Testing ke liye reserve hota hai.
Agar hum sirf feature ship karte rahenge, to ek din velocity zero ho jayegi."

### Q8: Prioritization: Bug vs Feature?
**Answer:**
"Agar **Critical Bug** hai (Data Loss, Login Fail), to **Immediate Fix** (Stop limits).
Agar minor UI glitch hai, to backlog mein dalo.
Feature tabhi banao jab Business Value clear ho. 'Nice to have' features startup killers hote hain."

### Q9: Code Quality maintain karne ke strict rules?
**Answer:**
1.  **Strict TypeScript:** `any` use karna mana hai.
2.  **Husky hooks:** Commit se pehle Test run hote hain.
3.  **Code Reviews:** Kam se kam 1 approval zaroori hai merge ke liye.

### Q10: Scaling Team: Pehla hire kaun hoga?
**Answer:**
"Main ek **Senior Backend Engineer** hire karunga.
AI aur Frontend main sambhal sakta hoon, par Backend aur Database reliability critical hai.
Mujhe koi aisa chahiye jo raat ko 3 baje server crash hone pe panic na kare."

---

## 🚧 Handling Pressure

### Q11: Deadline miss hone wali hai, kya karoge?
**Answer:**
"Jhoot nahi bolunga.
Stakeholders (Product Manager) ko 1 week pehle bata dunga: 'Feature A complete hai, B mein risk hai'.
Options dunga:
1.  Date extend karein?
2.  Scope cut karein (MVP release)?
Last minute surprise business ke liye sabse bura hota hai."

### Q12: Production DB delete ho gaya galti se. Step 1?
**Answer:**
"Step 1: **Saans lo.** Panic se aur galti hogi.
Step 2: **Write Access band karo.**
Step 3: **Restore from Backup.** (Hum har 6 ghante mein Mongo dump lete hain S3 pe).
Step 4: **Post-mortem:** Blame game nahi, Process fix karo taaki dubara na ho (Permissions revoke karo)."

### Q13: Remote Work manage kaise karte ho?
**Answer:**
"Trust aur Output over Hours.
Mujhe fark nahi padta koi 9-5 kaam kar raha hai ya raat ko.
Daily Standup (15 min) zaroori hai blockers discuss karne ke liye.
Documentation (Notion/Jira) hamara source of truth hai."

### Q14: 'Not My Job' situation?
**Answer:**
"Startup mein 'Not my job' exist nahi karta.
Agar Frontend wala bimar hai, to main CSS fix karunga.
Agar Tester nahi hai, to main Test likhunga.
Goal 'Ticket Close' karna nahi, 'Value Deliver' karna hai."

### Q15: Work-Life Balance (50 LPA demand ke saath)?
**Answer:**
"Main hard work mein believe karta hoon par burnout mein nahi.
Agar main 14 ghante kaam kar raha hoon to main inefficient hoon.
Main automation (CI/CD, Scripts) pe focus karta hoon taaki weekend pe laptop na kholna pade."
