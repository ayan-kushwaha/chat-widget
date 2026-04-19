import { Router } from "express";
import authRoutes from "@modules/core/auth/auth.routes.js";
import siteRoutes from "@modules/dashboard/sites/sites.routes.js";
import knowledgeRoutes from "@modules/dashboard/knowledge/knowledge.routes.js";
import healthRoutes from "@shared/routes/health.route.js";
import teamRoutes from "@modules/core/team/team.routes.js";
import organizationRoutes from "@modules/core/organization/organization.routes.js";
import insightsRoutes from "@modules/dashboard/insights/insights.routes.js";
import memoryRoutes from "@modules/dashboard/memory/memory.routes.js";
import analyticsRoutes from "@modules/dashboard/analytics/analytics.routes.js";
import timelineRoutes from "@modules/dashboard/timeline/timeline.routes.js";
import leadsRoutes from "@modules/tools/chat/leads.routes.js";
import templateRoutes from "./templates/template.routes.js";
import flowRoutes from "./flow/flow.routes.js";
import botRoutes from "./dashboard/bots/bots.routes.js";
import widgetRoutes from "../routes/widget.routes.js";
import userRoutes from "../routes/user.routes.js";
import chatRoutes from "../routes/chat.routes.js";
import learningMemoryRoutes from "../routes/memory.routes.js";
import couponRoutes from "../routes/couponRoutes.js";
import featureRoutes from "../routes/featureRoutes.js";
import planRoutes from "../routes/planRoutes.js";
import statusRoutes from "../routes/status.routes.js";
import subscriptionRoutes from "@modules/core/organization/subscription.routes.js";
import paymentRoutes from "./core/payment/payment.routes.js";
import geoRoutes from "./core/geo/geo.routes.js";
import legalRoutes from "./core/legal/legal.routes.js";
import uploadRoutes from "./shared/upload/upload.routes.js";
import systemRoutes from './system/system.routes.js';
import { transactionRoutes } from "@modules/core/transaction/transaction.routes.js";
import previewRoutes from "../routes/preview.routes.js";
import notificationRoutes from "../routes/notification.routes.js";
import groupRoutes from "../routes/group.routes.js";
import pricingRoutes from "../controllers/pricing.controller.js";  // 💰 Centralized Model Pricing API
import workforceRoutes from "../controllers/workforce.controller.js";    // 🎯 AI workforce Deployment & Protocol Cards API
import voiceRoutes from "./dashboard/voice/voice.routes.js";
import neuralRoutes from "./dashboard/neural/neural.routes.js";
import { requireAuth } from "./shared/middlewares/auth.js";


const router = Router();

router.use("/auth", authRoutes);
router.use("/groups", groupRoutes); // 👥 User Group Segments API
router.use("/sites", siteRoutes);
router.use("/knowledge", knowledgeRoutes);
router.use("/health", healthRoutes);
router.use("/team", teamRoutes);
router.use("/organizations", organizationRoutes);
router.use("/insights", insightsRoutes);
router.use("/memory", memoryRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/timeline", timelineRoutes);
router.use("/leads", leadsRoutes);
router.use("/templates", templateRoutes);
router.use("/flows", flowRoutes);
router.use("/bots", botRoutes); // Bot Configuration (Brand, Home, Security)
router.use("/widget", widgetRoutes); // Widget Heartbeat System
router.use("/users", userRoutes); // User Management API
router.use("/chats", chatRoutes); // Chat & Lead Management API
router.use("/learning-memories", learningMemoryRoutes); // AI Learning Memory API
router.use("/coupons", couponRoutes); // Coupons & Offers API
router.use("/features", featureRoutes); // Dynamic Feature Registry
router.use("/plans", planRoutes); // Dynamic Plan Management
router.use("/status", statusRoutes); // 🟢 Business Weekly Status API (7-Day TTL)
router.use("/payment", paymentRoutes); // Razorpay Payment Integration
router.use("/geo", geoRoutes); // 🌍 Internal GeoIP & Currency API
router.use("/legal", legalRoutes); // ⚖️ Dynamic Legal Pages System
// ...
router.use("/upload", uploadRoutes); // ☁️ File Uploads (MinIO)
router.use("/transactions", transactionRoutes); // 💰 Transaction History API
router.use("/preview", previewRoutes); // 🔗 Link Preview API
router.use("/notifications", notificationRoutes); // 🔔 Web Push Notifications API
router.use("/", subscriptionRoutes); // Subscription Management (Snapshots)
// ...
router.use("/system", systemRoutes); // 🟢 Helper System Routes (Config, etc.)
router.use("/pricing", pricingRoutes); // 💰 Centralized Model Pricing & Cost Calculation API
router.use("/workforce", requireAuth, workforceRoutes); // 🎯 AI workforce Deployment & Protocol Cards API
router.use("/voice", voiceRoutes); // 🎤 Voice Streaming API
router.use("/neural", neuralRoutes); // 🧠 Neural Mind Map API

export default router;
