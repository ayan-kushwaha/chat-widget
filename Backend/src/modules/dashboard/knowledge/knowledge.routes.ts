// knowledge.routes.ts — Clean routing layer. All logic lives in controllers/
import { Router } from "express";
import { requireAuth } from "@shared/middlewares/auth.js";
import multer from "multer";

// ─── Controller Imports ───────────────────────────────────────────────────────
import { getBrainOverview, getBrainAnalytics, getChatHistory } from "./controllers/overview.controller.js";
import { addManualKnowledge, updateManualKnowledge, getPersonalityConfig, updatePersonalityConfig } from "./controllers/manual.controller.js";
import { uploadDocument, downloadFile } from "./controllers/file.controller.js";
import { triggerCrawl, crawlStatus, startCrawl, triggerPageCrawl, discoverSite, autoTagSite } from "./controllers/website.controller.js";
import { addApiSource, previewApiSource, updateApiSource } from "./controllers/api.controller.js";
import {
  updateSourceMetadata, deleteKnowledgeSource, toggleKnowledgeSource,
  refreshKnowledgeSource, autoFillMetadata, trainNow, getSourceDetail,
  handleChat, analyzeSession
} from "./controllers/metadata.controller.js";

// ─── Multer ───────────────────────────────────────────────────────────────────
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

const router = Router();
console.log("🧠 [KnowledgeRoutes] Initializing...");

// ─── Manual Text ──────────────────────────────────────────────────────────────
router.post("/:orgId/manual-text", requireAuth, addManualKnowledge);
router.put("/:orgId/manual-text/:sourceId", requireAuth, updateManualKnowledge);

// ─── Chat / Analyze (Stubs) ───────────────────────────────────────────────────
router.post("/:siteId/chat", requireAuth, handleChat);
router.post("/:siteId/analyze", requireAuth, analyzeSession);

// ─── Crawl ────────────────────────────────────────────────────────────────────
router.post("/:siteId/crawl", requireAuth, triggerCrawl);
router.get("/:siteId/status", requireAuth, crawlStatus);
router.post("/:id/manual", requireAuth, startCrawl);

// ─── Discovery & Metadata ─────────────────────────────────────────────────────
router.post("/discover", requireAuth, discoverSite);
router.post("/auto-tag", requireAuth, autoTagSite);
router.post("/auto-fill-metadata", requireAuth, autoFillMetadata);

// ─── Brain Overview ───────────────────────────────────────────────────────────
router.get("/:orgId/overview", requireAuth, getBrainOverview);

// ─── Source CRUD (Unified) ────────────────────────────────────────────────────
router.delete("/:orgId/source/:type/:sourceId", requireAuth, deleteKnowledgeSource);
router.patch("/:orgId/source/:type/:sourceId/toggle", requireAuth, toggleKnowledgeSource);
router.patch("/:orgId/source/:type/:sourceId", requireAuth, upload.single("file"), updateSourceMetadata);
router.post("/:orgId/source/:type/:sourceId/refresh", requireAuth, refreshKnowledgeSource);
router.post("/:orgId/source/:type/:sourceId/train", requireAuth, trainNow);
router.get("/:orgId/source/:type/:sourceId", requireAuth, getSourceDetail);

// ─── Page Crawl ───────────────────────────────────────────────────────────────
router.post("/:orgId/source/website/:siteId/page/:pageId/crawl", requireAuth, triggerPageCrawl);

// ─── File Upload ──────────────────────────────────────────────────────────────
router.post("/:orgId/upload", requireAuth, upload.single("file"), uploadDocument);

// ─── API Sources ──────────────────────────────────────────────────────────────
router.post("/:orgId/api-source/preview", requireAuth, previewApiSource);
router.post("/:orgId/api-source", requireAuth, addApiSource);
router.patch("/:orgId/api-source/:id", requireAuth, updateApiSource);

// ─── Personality ──────────────────────────────────────────────────────────────
router.get("/:orgId/personality", requireAuth, getPersonalityConfig);
router.put("/:orgId/personality", requireAuth, updatePersonalityConfig);

// ─── File Download ────────────────────────────────────────────────────────────
router.get("/download/:fileId", requireAuth, downloadFile);

// ─── History & Analytics ──────────────────────────────────────────────────────
router.get("/:orgId/history", requireAuth, getChatHistory);
router.get("/:orgId/analytics", requireAuth, getBrainAnalytics);

export default router;
