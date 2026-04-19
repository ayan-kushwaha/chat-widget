# 🚀 Master Engineering Blueprint v2.0: Cluaiz Skill 13 - The UI Teleporter, Action Executor & Live Search Engine

**Author/Architect:** Aryan (CTO) & AI Subordinate
**Version:** 2.0 (The "Live Web Browser Agent" Update)
**Status:** Locked & Approved for Production 🔏
**Core Philosophy:** "AI should not just talk; it should DO. It should drive the website like a human user."

---

## 📌 1. Executive Summary & The "Why"
Purane bots sirf sawaal ka jawaab dete hain, jis se user ko manually wo kaam karna padta hai jo AI bataata hai. Cluaiz Skill 13 us friction ko 0% par lata hai. Yeh skill AI ko ek **"Zero-Code, Browser-Native Agent"** banati hai jo user ke bolne par:
1. Website ke pages badal sakta hai (`navigate`).
2. DOM ke elements ko click kar sakta hai (`click`).
3. Form/Modals khol sakta hai.
4. Live page ka data padh kar real-time answers de sakta hai bina purane database ko hit kiye (`Millisecond Scan`).
5. Client ki existing search functionality ko hijack kar sakta hai (`Native Search`).

**Sabswe Badhiya Baat:** Kyunki saare click/scroll/navigation events client ke browser (JS) me execute hote hain (using standard web APIs), Cluaiz server par **0% Extra Load** padta hai. Yeh feature hum Boss/Client ko "Free Automation" bol kar bech sakte hain.

---

## 🏗️ 2. Core Components Architecture & The "Brain-Hands" Model

Cluaiz Skill 13 ka poora architecture "Brain" aur "Hands" ke separation par based hai.

### A. The Brain (Qwen-4B on Cluaiz Server)
*   **Role:** Intent samajhna, extracted parameters (jaise Order ID) nikalna, aur ek JSON command generate karna.
*   **Limitation:** Crossover APIs ya frontend code directly run nahi kar sakta. Bas ek strict JSON format emit karta hai.

### B. The Hands & Eyes (Cluaiz JS Widget on Client Browser)
*   **Role:** AI ke bheje gaye JSON ko intercept karna aur browser ke JS engine (DOM APIs) se usko execute karna. Chat bhejne se pehle, ye current screen ka short context padh kar "Eyes" ka kaam karta hai.
*   **Tech:** Pure Vanilla JavaScript. No heavy React/Angular dependencies.

---

## 📡 3. The Eyes: "Live Millisecond DOM Scan" (Zero-Latency RAG)

Vector DB purana ho sakta hai, par banda jo page dekh raha hai wo hamesha latest hota hai. Jab bhi user chat box me message type karke Send dabayega, JS Widget 1 millisecond me page ka short context AI ko bhej dega.

### Kaise Kaam Karega (The Pipeline):
1.  **Event:** User clicks "Send".
2.  **JS Widget Extraction:** Widget page par maujood main content container (body ya main tag) se `innerText` aur specific data-attributes extract karega.
3.  **Filtration (Security):** `password`, `ssn`, `credit-card` jaise masked fields ko ignore karega taaki privacy breach na ho. Navbar aur footer ko bhi ignore karega taaki token waste na ho.
4.  **Payload to Backend:** Message ke sath hidden context me bhejega:
    ```json
    {
      "message": "Iski warranty kitni hai?",
      "screen_context": "Product: Sony Headphones ABC. Price: $200. Warranty: 2 Years. Highlights: Noise Cancelling.",
      "current_url": "https://client-store.com/sony-abc"
    }
    ```
5.  **AI Response:** Qwen-4B context padhega aur sidha bolega: *"Bhai, iski warranty 2 saal hai."* bina slow Vector DB lookup ke!

---

## 🖱️ 4. The Hands: "DOM Action Executor" (3-Step Targeting Engine)

Jab AI decide karta hai ki use koi element "Click" karna hai (jaise "Add to Cart"), toh JS widget 3 failsafe steps me target dhoondhta hai. Website layouts badalte rehte hain, toh AI ko "blind" hone se bachana zaroori hai.

### Target Matching Pipeline (Inside `cluaiz-widget.js`):

#### 🏆 Priority 1: `aria-label` (The Semantic Gold Standard)
*   **Kyun?** Accessible aur hamesha wahi rehta hai bhale class/id badal jaye.
*   **Code:** `document.querySelector('[aria-label="Add Red Sneakers to Cart"]')`
*   **Client SOP:** Developers ko hum enforce karenge ki important buttons par aria-labels lagayein.

#### 🥈 Priority 2: `id` (The Rigid Anchor)
*   **Kyun?** IDs strict hoti hain, aur CSS me use hoti hain.
*   **Code:** `document.getElementById('add-cart-btn-red')`
*   **Risk:** Agar page me do IDs ho gaye ya developer ne galti ki, toh galat click ho sakta hai. Isliye isko 2nd par rakha.

#### 🥉 Priority 3: `innerText` (The AI Intuition Fallback)
*   **Kyun?** Agar client/developer itna lazy hai ki na aria-label lagaya na ID.
*   **Kaise?** Widget saare `<button>` aur `<a>` tags scan karega, jiska text AI ki bheji gayi string (e.g., "Add to Cart") se fuzzy match karega, usko dba dega.
*   **Code Concept:**
    ```javascript
    const buttons = document.querySelectorAll('button, a');
    for(let btn of buttons) {
        if(btn.innerText.trim().toLowerCase().includes(targetText.toLowerCase())) {
            btn.click();
            break;
        }
    }
    ```

---

## 🔄 5. The Teleporter: Dynamic Routing & SPA Handling

Humara N1 Action (`navigate`) sirf static pages ke liye nahi, balki AI-driven Dynamic URLs ke liye use hoga. Example: Order summary dikhana.

### Dynamic Context Resolution (The Magic):
1.  **AI System Prompt:** AI ke paas ek tool defined hoga: `navigateToPage(path)`.
2.  **Context Extraction:** User ne pucha *"Mera order #8899 ka status kya hai?"*. Chat history se AI ne samajh liya user us order ki baat kar raha hai.
3.  **Pattern Construction:** AI ko pata hai ki orders ka path `/orders/:orderId` hota hai. AI `orderId` variable ki jagah `8899` apply karke final URL`/orders/8899` banayega.

### SPA (Single Page Application) vs MPA Handling

Client ki website Next.js (React) ho sakti hai ya normal Shopify (MPA). Humara Widget dono handle karega bina page fail kiye.

*   **For Next.js / React (SPA):** Hum direct `window.location.href = url` nahi chalayenge kyunki us se full page reload hota hai jo laggy feel deta hai.
    *   Widget check karega ki SPA router majood hai ya nahi (`window.next` ya React ka listener). Agar SPA hai, toh Native History PushTrigger karega:
    *   ```javascript
        window.history.pushState({}, '', targetUrl);
        window.dispatchEvent(new Event('popstate')); // Triggers React Router to update view
        ```
*   **For Classic Websites (Shopify / WordPress - MPA):**
    *   Agar normal site hai, toh direct reload: `window.location.href = targetUrl;`

---

## 🔍 6. Native Search Hijacker (Crawler-Free Discovery)

Agar user kisi aise product ya policy ko dhoondh raha hai jo Vector DB (RAG) me sync nahi hua hai (maybe new product added 10 mins ago).

1.  **Boss Dashboard Setup:** Store owner `Search URL Pattern` define karega. E.g., `https://mystore.com/search?q={query}`.
2.  **The Trigger:** User: *"Gaming laptops hain kya?"*
3.  **AI JSON:** `{"action": "search_site", "query": "Gaming laptops"}`.
4.  **JS Widget Action:** Frontend seedha usko website ke default native search result page par le jayega `/search?q=Gaming+laptops`.
5.  **Benefit:** Real-time data milega client ko, zero latency aur zero embedding costs (OpenAI/Ollama tokens saved) humare server par.

---

## 📝 7. Data Models & JSON Payloads (Strict Typing)

AI se Widget tak jo commands aayenge, wo 100% strict JSON format me hone chahiye.

### Action Types & Payloads:

**1. Navigate (The Teleporter)**
```json
{
  "action": "navigate",
  "data": {
    "path": "/user/settings",
    "method": "spa_push" // Fallback: "hard_reload"
  }
}
```

**2. Click (DOM Action Executor)**
```json
{
  "action": "click",
  "data": {
    "targetType": "aria-label", // or 'id', 'text'
    "targetValue": "Confirm Purchase",
    "waitToBeClickable": true
  }
}
```

**3. Site Search (Hijacker)**
```json
{
  "action": "search_site",
  "data": {
    "searchQuery": "Wireless Mouse"
  }
}
```

**4. Modal / Form Trigger (State Mutation)**
```json
{
  "action": "dispatch_event",
  "data": {
    "eventName": "cluaiz_open_signup_modal",
    "payload": { "reason": "user_asked" }
  }
}
```

---

## 💻 8. Frontend Widget Logic (The JavaScript Event Loop)

Ye code snippet `cluaiz-widget.js` ka core brain hai jo commands ko intercept karke UI me magic karta hai.

```javascript
// A simple observer that listens for JSON messages tagged as "action"
window.cluaiz.on('serverMessage', async (msg) => {
    if(msg.type === 'ui_action' && msg.payload) {
        
        const actionPayload = msg.payload;

        if (actionPayload.action === 'navigate') {
            const url = actionPayload.data.path;
            // Check for SPA vs MPA
            if (typeof window.next !== 'undefined' || window.React) {
                window.history.pushState({}, '', url);
                window.dispatchEvent(new Event('popstate'));
            } else {
                window.location.href = url;
            }
        } 
        
        else if (actionPayload.action === 'click') {
            const { targetType, targetValue } = actionPayload.data;
            let element = null;

            // Step 1: ARIA Label
            if(targetType === 'aria-label') {
                element = document.querySelector(`[aria-label="${targetValue}"]`);
            } 
            // Step 2: ID
            else if (targetType === 'id') {
                element = document.getElementById(targetValue);
            } 
            // Step 3: Fuzzy Text Matching
            else if(targetType === 'text') {
                const buttons = document.querySelectorAll('button, a, .clickable');
                element = Array.from(buttons).find(el => el.innerText.trim().toLowerCase().includes(targetValue.toLowerCase()));
            }

            // Perform Click with a slight delay for visual human-like effect
            if(element) {
                element.style.outline = "2px solid #5C67F2"; // Provide visual feedback
                setTimeout(() => {
                    element.click();
                    element.style.outline = "none";
                }, 400); // 400ms delay looks natural
            } else {
                console.warn("Cluaiz Warning: AI target element not found on current DOM.");
            }
        }
        
        else if (actionPayload.action === 'search_site') {
            const query = encodeURIComponent(actionPayload.data.searchQuery);
            // Defaulting to standard query param ?q=
            window.location.href = `/search?q=${query}`;
        }
    }
});
```

---

## 🎛️ 9. The Boss Dashboard (Admin Configuration)

Client ko setup karne ke liye ek dashboard milega (Next.js Admin Panel me). Yahan Boss apna "Sitemap Intelligence" banayega.

**1. Static Route Definition Form:**
*   **Route Name:** `Pricing Page`
*   **Path:** `/pricing`
*   **Trigger Keywords (Comma separated):** `paisa, kitna cost, upgrade, plans`
*   *(Internal: Yeh data MongoDB ke `sitemap` collection me save hoga)*

**2. Dynamic Route Pattern Builder:**
*   **Route Name:** `Order Details`
*   **Path Pattern:** `/account/orders/{order_id}`
*   **Extract Params:** Instruct AI to extract `{order_id}` from conversation.

**3. DOM Target Naming Tool (SOP Helper):**
*   Dashboard me ek tooltip hoga jo Client ke developers ko sikhayega: *"Please use descriptive IDs like `id='buy-now-premium'` on your buttons for Cluaiz AI to see them."*

---

## 🚨 10. Edge Cases, Retry Logic & Failure Protocols

Humara AI andha nahi ho sakta. Agar screen par button load hone me time le raha hai, ya URL 404 de, uske liye strict protocols honge.

### Failure Scenario 1: Button is hiding inside a slow React component
*   **Problem:** AI ne "click" command bheja, par button ab तक render nahi hua API delay ke karan.
*   **Solution (The Observer Pattern):** Agar element `document.querySelector` se turant nahi milta, toh Widget us target ko **Poller Queue** me daal dega. Har 500ms par 3s tak check karega. Agar 3 second me element aagaya, toh click kar dega, warna fail hoke AI ko silent alert bhej dega (Taaki AI next message me bole: "Bhai, wo button dikh nahi raha, manual check kar le").

### Failure Scenario 2: Element Exists But Parent is `display: none`
*   **Problem:** Modal hidden hai, toh AI ne "click" toh code se kar diya, par UI pe kuch farak nahi pada.
*   **Solution:** JS Widget check karega `getComputedStyle(element).display !== 'none'`. Agar hidden hai, toh action reject karke error state log karega.

### Failure Scenario 3: AI hallucinates a Route (Spamming URLs)
*   **Problem:** AI ne ek random path bana diya `/magic-page-123` jo website par exist nahi karta, jo user ko 404 page par gira dega.
*   **Solution:** Backend par AI "Routing Guard" skill se cross-verify karega. Agar path explicitly MongoDB Sitemap ya Dynamic Route Schema me defined nahi hai, toh `navigate` payload block kar diya jayega.

---

## 🏁 11. Final Wrap Up & The Moat

Yeh document establish karta hai ki **Cluaiz koi SaaS chatbot nahi hai, ye ek "AI Co-Browser" hai.**
By moving the processing power, context extraction, and DOM traversal onto the edge (Client's Browser via JS), we achieve:
*   Infinite Scalability (No GPU load for crawling).
*   Zero Latency RAG (Reading DOM instantly).
*   Deep Website Integration without teaching the Client Developer complex APIs.

**Approved by:** Aryan (Chief Technology Officer)
**Implementation:** Ready for Frontend / Backend Sprint Execution. 🚀
