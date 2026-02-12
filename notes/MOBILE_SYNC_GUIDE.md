
# 📱 Mobile Sync Guide (Offline Access)

Bhai, agar tumhe laptop off hone par bhi notes padhne hain aur edit karne hain, toh **GitHub + Obsidian** best combo hai.

---

## 🚀 Strategy 1: The "Reader" Mode (Easiest)
Use this if you mostly want to READ notes on mobile.

1.  **Download GitHub App:**
    -   [Android](https://play.google.com/store/apps/details?id=com.github.android&hl=en_IN) | [iOS](https://apps.apple.com/us/app/github/id1477376905)
2.  **Login:** Apne GitHub account se login karo.
3.  **Open Repo:** `my/cluaiz` repository search karo.
4.  **Read:** `notes/backend/database/` folder me jao. **Markdown wahan mast dikhta hai.**
5.  **Edit:** Chhota-mota edit wahin "Pencil Icon" se kar sakte ho.

---

## ⚡ Strategy 2: The "Pro Editor" Mode (Offline Sync)
Use this if you want full offline access using **Obsidian**.

### Step 1: Push to GitHub (Laptop)
Maine abhi laptop pe Git initialize kar diya hai. Tumhe bas ise apne GitHub account se jodna hai.
Run these commands in terminal:

```bash
git remote add origin https://github.com/YOUR_USERNAME/cluaiz.git
git push -u origin master
```

### Step 2: Setup on Mobile
1.  **Install Obsidian:** (Free on Play Store / App Store).
2.  **Install Git Tool:**
    -   **Android:** Install **Termux** or use **Obsidian Git Plugin** (Requires paid sync or complex setup).
    -   **EASIER WAY (Android):** Use **"GitJournal"** app. Connect it to your GitHub Repo. It syncs Markdown files perfectly.
    -   **iOS:** Use **"Working Copy"** app (Best Git client for iOS). Sync it with Obsidian.

---

## 🔄 My Recommendation (Best for You)

Bhai, **GitJournal** (Android) ya **Working Copy** (iOS) use karo.
1.  Ye apps seedha **GitHub** se connect ho jate hain.
2.  Note changes **auto-sync** ho jate hain.
3.  Laptop on karne ki zaroorat nahi.
4.  Offline hone pe bhi edit kar sakte ho, net aate hi sync ho jayega.

**Try Strategy 1 (GitHub App) first.** It's zero setup.
