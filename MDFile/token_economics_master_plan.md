# 💰 Token Economics Master Plan

> **Status:** Finalized & Approved
> **Core Philosophy:** "High Profit Subscription, Low Cost Usage"
> **Pricing Model:** 1x Direct Pass-Through (Cost-to-Cost)

---

## 1. The Implementation Logic (Combo Mode) 🎯

To maximize user value, we will use smart engineering to reduce token consumption by 50%.

*   **Old Way:** Input -> Summary (Cost 1) | Input -> Learning (Cost 2) = **Double Cost**
*   **New "Combo" Way:**
    *   **Action:** Send Chat History ONCE to AI.
    *   **Prompt:** "Summarize this AND extract learned entities in JSON."
    *   **Cost:** Input counted only ONCE.
    *   **Impact:** User saves 50% tokens, feels the system is efficient.

---

## 2. Training & Connectivity Rates (Sell Price) 🧠

Detailed multipliers for knowledge ingestion, external connections, and chat features.

| Feature Module     | Item Name             | Base Cost (Internal) | **Sell Price (Token Burn)** | Logic                                         |
| :----------------- | :-------------------- | :------------------- | :-------------------------- | :-------------------------------------------- |
| **Brain Training** | Websites Crawling     | 0.5x                 | **1x**                      | Token-to-Token mapping after processing.      |
| **Brain Training** | File Processing (OCR) | 0.5x                 | **1x**                      | Covers vision API and parsing complexity.     |
| **Brain Training** | Manual Training       | 0.2x                 | **0.5x**                    | Budget-friendly rate for user effort.         |
| **Service Link**   | API Connections       | 0.5x                 | **1x**                      | Real-time fetching and data context ingress.  |
| **ChatBot AI**     | Widget UI & Hosting   | 0.1x                 | **0x (FREE)**               | Essential visual components; no LLM cost.     |
| **ChatBot AI**     | Human Handoff         | 0.1x                 | **0.3x**                    | Fee for real-time socket infrastructure.      |
| **ChatBot AI**     | AI Conversation       | 0.3x                 | **1x**                      | Core neural inference billing (LLM).          |
| **Advanced**       | Gen Image Studio      | 3,000 / img          | **5,000 Tokens / Img**      | Text-to-Image GPU generation (Approx ₹2/img). |
| **Advanced**       | Voice AI & Transcribe | 1,000 / min          | **1,500 Tokens / Min**      | Audio processing & Neural TTS.                |
| **Advanced**       | Automations (Flows)   | 0.5x                 | **1.2x**                    | Background workflow & reliability premium.    |

---

## 3. 1 Million Tokens Capacity (User Tiers) 👥

Based on **1x Billing** (Direct Usage) and **Combo Mode** efficiency.
*Assumed Cost per Fully Loaded Chat (Chat + Summary + Learn):* **~2,800 Tokens**

| User Type     | Daily Traffic | Monthly Customers | Token Usage     | Plan Fit                                            |
| :------------ | :------------ | :---------------- | :-------------- | :-------------------------------------------------- |
| **🌱 Starter** | 2-3 Chats     | ~100              | **280k** (28%)  | **Perfect.** Lots of rollover potential.            |
| **🏢 Medium**  | 10-12 Chats   | ~350              | **980k** (98%)  | **Perfect.** Fits exactly in 1M plan.               |
| **🔥 Heavy**   | 50+ Chats     | ~1,500            | **4.2M** (420%) | **Needs Upgrade.** Valid candidate for 5M/10M Plan. |

---

## 4. Financial Breakdown (Your Business) 💵

Why 1x Billing is safe and highly profitable.

*   **Your Buy Price (Google):** ₹13.50 per Million Tokens (at ₹90/$)
*   **Your Sell Price (Subscription):** ₹399 (India) / ₹775 ($9 Global)

| Plan Sold             | Cost to You | Profit     | Margin      |
| :-------------------- | :---------- | :--------- | :---------- |
| **India Plan (₹399)** | ₹13.5       | **₹385.5** | **~2,900%** |
| **Global Plan ($9)**  | $0.15       | **$8.85**  | **~5,900%** |

**Conclusion:**
Profit is driven by the **Subscription Fee**. Token usage is kept at **1x** (with 0.5x for manual work) to provide maximum transparency, while internal costs are negligible (~3.4% of revenue).

---

## 6. Storage Economics (Memory Space) 📂

Managing long-term data storage through Plan-based Quotas and Daily Token Rent.

| Plan Tier            | Free Quota | **Over-limit Rent (Daily)** | Logic                                          |
| :------------------- | :--------- | :-------------------------- | :--------------------------------------------- |
| **🌱 Trial**          | **30 MB**  | 1 Token / MB / **DAY**      | Small entry; daily burn encourages upgrades.   |
| **🏢 Starter (₹399)** | **40 MB**  | 1 Token / MB / **DAY**      | Perfect for small business docs.               |
| **🌎 Standard (1M)**  | **100 MB** | 1 Token / MB / **DAY**      | Industry standard capacity for medium traffic. |

**Policy:**
*   **1:1 Simplicity:** 1 MB extra = 1 Token deducted every single day.
*   **Real-time Burn:** User sees their balance drop slightly daily if over-limit, making storage feel "Live".
*   **Passive Revenue:** Long-term users with large data (Leads/Knowledge) provide steady token burn for hosting costs.

---

## 7. Next Steps (Development) 🛠️

Now we execute the **"BMW Architecture"**:

1.  **Phase 1 (AI Engine):** Update `chat_service.py` to return precise `input_tokens` and `output_tokens` in the response.
2.  **Phase 2 (Backend):** Create `ActivityLog` schema to record these exact numbers. Apply the multipliers from Section 2.
3.  **Phase 3 (Frontend):** Build the "Fuel Gauge" Dashboard to show this transparency to the user.
