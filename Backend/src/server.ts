import dotenv from "dotenv";
if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
  require('module-alias/register');
}
dotenv.config();

import express from "express";
import cors from "cors";
import http from "http";
import { connectDB } from "@shared/libs/mongo.js";
import routes from "./modules/routes.js";
import { mountBullBoard } from "./jobs/dashboard.js";
import { autoPullModels } from "./startup/ollamaAutoPull.js";
import { monitoringMiddleware } from "./services/monitoring.service.js";

if (process.env.AUTO_PULL_MODELS === "true") {
  setTimeout(autoPullModels, 5000);
}

// ONLY THIS — no queue, no socket.
import "./jobs/events.js";
import "./jobs/crawl.worker.js";
import "./jobs/embed.worker.js";
import "./jobs/summarize.worker.js";
import "./jobs/analysis.worker.js";
import "./jobs/workforce.worker.js";

// 🕐 Memory System Cron Jobs with Error Handling
// 🕐 Memory System Cron Jobs with Error Handling
(async () => {
  try {
    const { startDailySummarizer } = await import("./jobs/daily-summarizer.js");
    const { startWeeklyRollup } = await import("./jobs/weekly-rollup.js");
    const { startDataCleanup } = await import("./jobs/cleanup.js");
    const { startAnalyticsAggregator } = await import("./cron/analytics.cron.js");
    const { startStorageBillingJob } = await import("./cron/storage.cron.js");
    const { startSubscriptionCron } = await import("./jobs/subscription.cron.js");
    const { startRetentionCron } = await import("./jobs/retention.cron.js");
    const { startWebsiteAutoRefresh } = await import("./jobs/website-auto-refresh.js");

    startDailySummarizer();
    startWeeklyRollup();
    startDataCleanup();
    startAnalyticsAggregator();
    startStorageBillingJob();
    startSubscriptionCron();
    startRetentionCron();
    startWebsiteAutoRefresh();  // 🔄 Auto-refresh websites
    console.log("✅ Memory & Analytics & Billing & Auto-Refresh cron jobs activated");
  } catch (error) {
    console.warn("⚠️ Cron jobs failed to load (non-critical):", (error as any).message);
  }
})();

const app = express();
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001", // Fallback if 3000 is busy
  "http://127.0.0.1:3001"
];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(null, true); // During local dev, we can be more lenient, or restrict strictly
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-org-id"]
}));
app.use(express.json({ limit: '50mb' })); // Increased limit for heavy config payloads

// 📊 Monitoring Middleware - Track all API performance
app.use(monitoringMiddleware);

connectDB();

const server = http.createServer(app);

// 🔒 Secure the Admin Queue Dashboard
import basicAuth from "express-basic-auth";
app.use("/admin/queues", basicAuth({
  users: {
    [process.env.ADMIN_USER || "admin"]: process.env.ADMIN_PASS || "cluaiz_secret_123"
  },
  challenge: true,
}));

mountBullBoard(app);
app.use("/v1", routes);

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cluaiz Intelligence Core</title>
        <style>
            :root {
                --primary: #8b5cf6;
                --bg: #0f172a;
                --surface: #1e293b;
                --text: #e2e8f0;
            }
            body {
                background-color: var(--bg);
                color: var(--text);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
            }
            .card {
                background: var(--surface);
                padding: 2.5rem;
                border-radius: 1rem;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                text-align: center;
                border: 1px solid rgba(139, 92, 246, 0.2);
                max-width: 400px;
                width: 90%;
            }
            .status-dot {
                height: 12px;
                width: 12px;
                background-color: #22c55e;
                border-radius: 50%;
                display: inline-block;
                margin-right: 8px;
                box-shadow: 0 0 10px #22c55e;
            }
            h1 { margin: 0 0 1rem 0; font-size: 1.5rem; color: #fff; }
            p { color: #94a3b8; margin-bottom: 2rem; line-height: 1.6; }
            .badge {
                background: rgba(139, 92, 246, 0.1);
                color: var(--primary);
                padding: 0.5rem 1rem;
                border-radius: 9999px;
                font-size: 0.875rem;
                font-weight: 500;
                display: inline-block;
            }
        </style>
    </head>
    <body>
        <div class="card">
            <div style="margin-bottom: 1.5rem;">
                <span class="status-dot"></span>
                <span style="color: #22c55e; font-weight: 600; font-size: 0.875rem; letter-spacing: 0.05em;">SYSTEM OPERATIONAL</span>
            </div>
            <h1>Cluaiz Intelligence Core</h1>
            <p>The neural backend is active and processing requests. All systems are functioning within normal parameters.</p>
            <div class="badge">v1.0.0 • Beta Live</div>
        </div>
    </body>
    </html>
  `);
});
console.log("MONGO_URI:", process.env.MONGO_URI ? "✅ LOADED" : "❗ MISSING");
console.log("CHROMA_URL:", process.env.CHROMA_URL ? "✅ LOADED" : "❗ MISSING");
console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "✅ LOADED" : "❗ MISSING");
console.log("REDIS_URL:", process.env.REDIS_URL ? "✅ LOADED" : "❗ MISSING");
console.log("OLLAMA_URL:", process.env.OLLAMA_URL ? "✅ LOADED" : "❗ MISSING");
console.log("CHROMA_URL:", process.env.CHROMA_URL ? "✅ LOADED" : "❗ MISSING");
console.log("GEMINI_API_KEYS:", process.env.GEMINI_API_KEYS ? "✅ LOADED" : "❗ MISSING");
console.log("AUTO_PULL_MODELS:", process.env.AUTO_PULL_MODELS ? "✅ LOADED" : "❗ MISSING");
console.log("AI_ENGINE_URL:", process.env.AI_ENGINE_URL ? "✅ LOADED" : "❗ MISSING");

import { initSocket } from "./sockets/index.js";

const PORT = process.env.PORT || 4000;
const io = initSocket(server);

console.log("🎧 Initializing Queue Listeners...");
import { initQueueListeners } from "./jobs/listeners.js";
initQueueListeners(io);

console.log("🚀 Starting Server Listen...");
server.listen(PORT, () =>
  console.log(`🚀 Server running at-> http://localhost:${PORT}`)
);
// Force restart for analytics routes and modular socket core
