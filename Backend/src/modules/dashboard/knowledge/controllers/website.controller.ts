import { Request, Response } from 'express';
import { AuthRequest } from "@shared/middlewares/auth.js";
import { Site } from "@modules/dashboard/knowledge/models/Site.js";
import { crawlQueue } from "../../../../jobs/queues.js";
import { usageService } from "../../../../services/usage.service.js";
import { ActivityType } from "../../../../models/ActivityLog.js";

const getEngineUrl = () => {
  let url = process.env.AI_ENGINE_URL || 'http://127.0.0.1:5000';
  return url.includes('localhost') ? url.replace('localhost', '127.0.0.1') : url;
};

export const triggerCrawl = async (req: AuthRequest, res: Response) => {
  try {
    const { siteId } = req.params;
    const orgId = req.user?.orgId;
    const site = await Site.findOne({ _id: siteId, orgId });
    if (!site) return res.status(404).json({ success: false, message: "Site not found" });

    await usageService.checkFreshLimit(orgId.toString(), 'max_training_tokens');

    const pageUrls = site.pages.filter((p: any) => p.isActive !== false).map((p: any) => p.url);
    if (pageUrls.length === 0) return res.status(400).json({ success: false, message: "No active pages to crawl" });

    site.pages.forEach((p: any) => { if (p.isActive !== false) p.status = 'pending'; });
    site.status = 'crawling';
    await site.save();

    let jobsCreated = 0;
    for (const pageUrl of pageUrls) {
      await crawlQueue.add("crawl-page", { orgId: orgId.toString(), siteId, urls: [pageUrl], startUrl: pageUrl }, { removeOnComplete: true });
      jobsCreated++;
    }

    res.json({ success: true, message: `✅ Retraining ${pageUrls.length} active pages (${jobsCreated} jobs created)` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const crawlStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { siteId } = req.params;
    const orgId = req.user?.orgId;
    const site = await Site.findOne({ _id: siteId, orgId });
    if (!site) return res.status(404).json({ success: false, message: "Site not found" });
    res.json({ success: true, status: site.status });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const startCrawl = async (req: Request, res: Response) => {
  res.json({ success: true, message: "Manual crawl start migrated." });
};

export const triggerPageCrawl = async (req: AuthRequest, res: Response) => {
  try {
    const { orgId, siteId, pageId } = req.params;
    const site = await Site.findOne({ _id: siteId, orgId });
    if (!site) return res.status(404).json({ success: false, message: "Site not found" });

    const page = site.pages.find((p: any) => p._id.toString() === pageId);
    if (!page) return res.status(404).json({ success: false, message: "Page not found" });

    (page as any).status = 'pending';
    await site.save();

    await crawlQueue.add("crawl-page", { orgId, siteId, urls: [(page as any).url], startUrl: (page as any).url }, { priority: 1, removeOnComplete: true });

    res.json({ success: true, message: `✅ Page crawl triggered: ${(page as any).url}` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const discoverSite = async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    const { orgId } = (req as any).user || {};
    if (!url) return res.status(400).json({ success: false, message: "URL is required" });

    const response = await fetch(`${getEngineUrl()}/api/v1/knowledge/discover`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, org_id: orgId || "public" })
    });
    if (!response.ok) throw new Error(`Python API Error: ${response.status} ${await response.text()}`);
    const data: any = await response.json();
    res.json({ success: true, urls: data.urls, data: { title: data.title, description: "" } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to discover site: " + error.message });
  }
};

export const autoTagSite = async (req: Request, res: Response) => {
  try {
    const { url, siteId } = req.body;
    const { orgId } = (req as any).user || {};
    let metaData: any = {};

    if (siteId) {
      const metaRes = await fetch(`${getEngineUrl()}/api/v1/knowledge/source-metadata`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, sourceId: siteId, sourceType: 'website' })
      });
      if (!metaRes.ok) throw new Error("Vectorless Site Metadata failed: " + await metaRes.text());
      metaData = await metaRes.json();
    } else {
      if (!url) return res.status(400).json({ success: false, message: "URL or siteId is required" });
      const crawlRes = await fetch(`${getEngineUrl()}/api/v1/knowledge/crawl`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, org_id: orgId || "public" })
      });
      if (!crawlRes.ok) throw new Error("Crawl failed: " + await crawlRes.text());
      const crawlData: any = await crawlRes.json();
      if (!crawlData.content) throw new Error("No content found on page.");
      const metaRes = await fetch(`${getEngineUrl()}/api/v1/knowledge/metadata`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: crawlData.content })
      });
      if (!metaRes.ok) throw new Error("Metadata failed: " + await metaRes.text());
      metaData = await metaRes.json();
    }

    res.json({ success: true, tags: metaData.tags || [], description: metaData.summary || "", title: metaData.title || "", intent: metaData.intent_summary || "" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to generate tags: " + error.message });
  }
};
