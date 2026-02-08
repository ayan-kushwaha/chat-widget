# 🏗️ System Architecture Audit: Token Management System

## 🔍 Current Status Deep Dive

### 1. Backend (`@[Backend]`)
*   **Existing:** `Usage.ts` model exists. It has a `tokens_burned` counter.
*   **Existing:** `UsageService.ts` exists. It can increment `tokens_burned`.
*   **MISSING:** 
    *   **The "Black Box" Recorder:** Currently, when tokens increase, we don't know *why*. Was it a chat? A crawl? A file upload?
    *   **Dynamic Pricing Engine:** Prices (e.g., "3 tokens per msg") are not connected to logic. They are likely hardcoded scattered across controllers.
    *   **Activity Logs:** No database collection exists to store the "Console Log" history (e.g., "User X used Feature Y: -5 Tokens").

### 2. AI Engine (`@[ai_engine]`)
*   **Existing:** `Services/communication/chat_service.py` generates answers effectively.
*   **MISSING:**
    *   **The "Fuel Gauge":** The code returns the *answer text* but throws away the *receipt*. It needs to capture `input_tokens` (Context) and `output_tokens` (Generation) from the LLM response metadata and send it back to the Backend.

### 3. Frontend (`@[Frontend]`)
*   **Existing:** `UsageOverview.tsx` shows the total number.
*   **MISSING:**
    *   **The "BMW Dashboard":** There is no Live Terminal or Real-time Log stream. Users can't see their balance dropping in real-time or check *why* it dropped.

---

## 🚀 The "BMW Architecture" Plan (Proposed)

To give the user that "Premium Control" feel where they see every generic movement, we need this 3-Part Architecture:

### Phase 1: The Sensor (AI Engine Update)
We must upgrade `chat_service.py` to function like a smart meter.
*   **Change:** Extract `usage_metadata` from LangChain response.
*   **Output:** Return `{ content: "...", input_tokens: 150, output_tokens: 50, model: "Gemini-Pro" }`.

### Phase 2: The Recorder (Backend "ActivityLog")
We create a centralized "Central Bank" for tokens.
*   **New Collection:** `ActivityLog` (Stores: `User`, `Action`, `Cost`, `Details`, `Timestamp`).
*   **Logic:** Every time *any* service (Chat, Crawl, Form) does work, it **MUST** call `UsageService.logActivity()`.
    *   *Example:* `logActivity(userId, 'AI_CHAT', 5, 'Chat with bot: Customer Support')`
*   **Dynamic Rates:** `UsageService` will read the burn rates (e.g., `Multiplier: 1.5x`) dynamically.

### Phase 3: The Dashboard (Frontend "Live Terminal")
A new, high-tech looking component.
*   **Visual:** A scrolling terminal-like list (Green/Red text).
*   **Stream:** Shows live deductions. "Warning: High token usage detected" alerts.
*   **Charts:** "Where did my money go?" Pie chart (Chat vs Storage vs Crawling).

---

## ✅ Action Plan (What we will do)

1.  **AI Engine:** Modify `chat_service.py` to return token counts.
2.  **Backend:** Create `models/ActivityLog.ts` and update `services/usage.service.ts` to log every transaction.
3.  **Frontend:** Build the `ActivityStream` component in the Billing page.

This ensures precise, penny-perfect tracking visible to the user.
