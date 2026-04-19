import { Router } from "express";
import { createSite, listSites, updateSite, deleteSite, togglePageStatus, getSite, discoverSite, deletePage, updatePage } from "@modules/dashboard/sites/sites.controller.js";
import { triggerPageCrawl } from "@modules/dashboard/knowledge/knowledge.controller.js";
import { requireAuth } from "@shared/middlewares/auth.js";

const router = Router();

router.post("/discover", requireAuth, discoverSite);
router.post("/", requireAuth, createSite);
router.get("/", requireAuth, listSites);
router.get("/:id", requireAuth, getSite); // New Route
router.put("/:id", requireAuth, updateSite);
router.delete("/:id", requireAuth, deleteSite);

// Page level
// Page level
router.put("/:siteId/pages/:pageId/toggle", requireAuth, togglePageStatus);
router.put("/:siteId/pages/:pageId", requireAuth, updatePage);
router.delete("/:siteId/pages/:pageId", requireAuth, deletePage);
router.post("/:siteId/pages/:pageId/crawl", requireAuth, triggerPageCrawl);

export default router;