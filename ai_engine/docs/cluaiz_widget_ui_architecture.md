# 🚀 Cluaiz Frontend UI/UX Architecture: The Smart Copilot Widget (Final Document)

**Core Vision:** Ek intelligent, draggable, aur space-aware chat widget jo user ki marzi ke hisaab se screen par adjust ho jaye. Yeh normal chat bubble ki tarah bhi kaam karega aur pro-users ke liye full-height Copilot Sidebar mein bhi convert ho jayega.

---

### 🧠 1. The "Smart Positioning" Engine (Space Awareness)

Jab user chat icon ko drag karke screen ke kisi bhi hisse mein chhodta hai, toh chat window andhe ki tarah center mein nahi khulegi. Hum **JavaScript ke `getBoundingClientRect()`** method ka use karenge.

* **Logic:** Widget check karega ki uske aaspas kitni jagah (space) baaki hai.
* **Left Edge:** Agar icon left side mein rakha hai, toh chat window uske **Right** mein khulegi.
* **Right Edge:** Agar icon right side mein hai, toh window **Left** mein khulegi.
* **Top/Bottom:** Agar icon ekdum upar hai, toh window **Neeche (Down)** khulegi.
* **Fayda:** Chat window kabhi bhi screen se bahar (cut off) nahi hogi. Yeh ekdum butter-smooth feel dega.

### 🧲 2. Edge-Detection & Auto-Snapping (The Copilot Mode)

Agar user chat icon ko drag karte hue left ya right edge (kinare) ke bohot kareeb (e.g., less than 50px) le jata hai:

* **The Drop Zone:** Screen ke kinare par ek halka sa translucent shadow dikhega (hint dene ke liye).
* **The Snap:** Jaise hi user mouse chhodega, chat bubble apne aap ko expand karke ek **100vh (Full Height) Sidebar** mein badal lega.
* **Website Push:** Main website ka content thoda side mein push ho jayega taaki chat kisi text ke upar overlap na kare (Z-index aur Width adjustment).

### 💾 3. State Persistence (Yaad Rakhne Wali Power)

"Jahan ek baar drag-drop karke rakh diya, agli baar wahi dikhega". Iske liye hum browser ke **`localStorage`** ka use karenge.

* Har baar jab user icon ko drop karega ya mode change karega, hum JS mein save karenge:
  ```javascript
  localStorage.setItem('cluaiz_ui_state', JSON.stringify({ mode: 'sidebar', position: {x: 10, y: 50} }))
  ```
* Jab user page refresh karega ya naye page par jayega, widget sabse pehle `localStorage` check karega aur wahi se open hoga (Chahe wo floating icon ho ya snapped sidebar).

### 📱 4. Mobile & Tablet Strategy (Responsive Execution)

Mobile screen par itni jagah nahi hoti ki hum floating drag-drop ya left/right sidebar chalayein.

* **Screen size < 768px (Mobile):** 
  * Drag and Drop aur Edge-Snapping **disable** ho jayenge.
  * Chat icon by default Right-Bottom corner mein fix rahega.
  * Click karne par chat window **Full Screen** (100vw, 100vh) open hogi taaki user aasaani se type kar sake (WhatsApp jaisa experience).

---

### 🛠️ Developer Execution Plan (Tech Stack & Events)

Is poore system ko banane ke liye kisi heavy library ki zaroorat nahi hai. Humara `cluaiz-widget.js` sirf **Vanilla JavaScript** aur **CSS3 Transitions** par banega.

**Developer ke liye Required JS Events:**

1. `mousedown` / `touchstart`: Dragging start karne ke liye.
2. `mousemove` / `touchmove`: Screen par X aur Y coordinates live track karne ke liye.
3. `mouseup` / `touchend`: Drop karne par position lock karne aur `localStorage` mein save karne ke liye.
4. `window.innerWidth` & `getBoundingClientRect()`: Screen boundaries aur available space calculate karne ke liye taaki window bahar na khule.

**CSS Requirements:**

* `.cluaiz-floating`: `position: fixed; z-index: 9999;`
* `.cluaiz-sidebar-snapped`: `position: fixed; top: 0; height: 100vh; transition: width 0.3s ease;`

---

### 🏁 CTO's Final Verdict
Yeh document ab 100% final hai. Frontend Dev team is Drag-and-Drop + Snapping UI ka pehla prototype code karna shuru kar sakti hai. 🚀
