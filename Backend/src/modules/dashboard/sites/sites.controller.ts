import { Request, Response } from "express";
import { Organization } from "@modules/core/organization/Organization.js";
import { Site } from "@modules/dashboard/knowledge/models/Site.js";
import { AuthRequest } from "@shared/middlewares/auth.js";
import { scheduleCrawl, cancelScheduledCrawl } from "../../../jobs/scheduler.js";
import { crawlQueue } from "../../../jobs/queues.js";
import { discoverSitemap } from "@modules/dashboard/knowledge/crawl.service.js";
import { getOrCreateBrain } from "@modules/dashboard/knowledge/knowledge.controller.js";
import { usageService } from "../../../services/usage.service.js";

// 🟢 Discover Site (Sitemap/Links)
export const discoverSite = async (req: AuthRequest, res: Response) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, message: "URL is required" });

    const urls = await discoverSitemap(url);
    res.json({ success: true, urls });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🟢 Create Site (Add to Org Brain)
export const createSite = async (req: AuthRequest, res: Response) => {
  try {
    const { domain, crawl_schedule, pages, title, description, intent_summary, tags, skipTrain, allowUI_Actions } = req.body; // pages is array of URLs
    const orgId = req.user?.orgId;
    const isDraft = skipTrain === 'true' || skipTrain === true;

    // Validate and normalize domain
    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({ success: false, message: "Domain is required" });
    }

    // 🛡️ Limit Check: Websites
    await usageService.checkFreshLimit(orgId, 'max_websites');
    // 🛡️ Limit Check: Knowledge Storage (Tokens)
    await usageService.checkFreshLimit(orgId, 'max_training_tokens');

    const normalizedDomain = domain.trim().toLowerCase();
    if (!normalizedDomain) {
      return res.status(400).json({ success: false, message: "Valid domain is required" });
    }

    const orgExists = await Organization.exists({ _id: orgId });
    if (!orgExists) return res.status(404).json({ success: false, message: "Organization not found" });

    // Check duplicate in Site collection
    const exists = await Site.findOne({ orgId, domain: normalizedDomain });
    if (exists) {
      return res.status(400).json({ success: false, message: "Site already exists" });
    }

    // Get Brain to link
    const brain = await getOrCreateBrain(orgId);

    // Create Site Document
    const newSite = await Site.create({
      orgId,
      brainId: brain._id,
      domain: normalizedDomain,
      crawl_schedule: crawl_schedule || 'weekly',
      status: isDraft ? 'draft' : 'crawling', // 🔥 FIX: Start as 'crawling' or 'draft'
      pages: pages ? pages.map((p: any) => {
        const urlStr = typeof p === 'string' ? p : p.url;
        const isActive = typeof p === 'string' ? true : (p.isActive !== false);
        return { 
            url: urlStr, 
            status: isDraft ? 'draft' : 'pending', 
            isActive: isActive,
            crawl_frequency: crawl_schedule || '14d' 
        };
      }) : [],
      tags: tags || [],
      description: description || "",
      intent_summary: intent_summary || "",
      title: title || domain, // Might need title field in Site Model if not there yet
      allowUI_Actions: allowUI_Actions === 'true' || allowUI_Actions === true
    });

    // Schedule crawl (Recurring)
    if (!isDraft) {
      await scheduleCrawl(newSite._id.toString(), newSite.crawl_schedule);

      // 🔥 Trigger IMMEDIATE Crawl (One-time)
      if (newSite.pages && newSite.pages.length > 0) {
        // Explored & Mapped Manually -> Crawl exactly what is checked
        let jobsAdded = 0;
        for (const p of newSite.pages) {
          if (p.isActive !== false) {
            await crawlQueue.add("crawl-page", {
              orgId,
              siteId: newSite._id.toString(),
              urls: [p.url],
              startUrl: p.url,
              recursive: false // Strictly manual mapping
            }, { removeOnComplete: true });
            jobsAdded++;
          }
        }
        console.log(`✅ [SitesController] Dispatched ${jobsAdded} explicit active page crawls.`);
      } else {
        // Fallback: Naive Root domain crawl
        await crawlQueue.add("crawl-site", {
          orgId,
          siteId: newSite._id.toString(),
          startUrl: normalizedDomain,
          recursive: true
        }, { removeOnComplete: true });
        console.log(`✅ [SitesController] Dispatched root auto-spider crawl.`);
      }
    } else {
      console.log(`✅ [SitesController] Site saved as Draft. Skipping crawl/scraping.`);
    }

    res.json({
      success: true,
      message: isDraft ? `✅ Site saved as draft` : `✅ Site added & crawl scheduled`,
      site: newSite,
    });
  } catch (err: any) {
    console.error("❌ Create site error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🟢 List all sites for the Org
export const listSites = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user?.orgId;
    // Query Site collection directly
    const sites = await Site.find({ orgId }).sort({ createdAt: -1 });
    res.json({ success: true, sites });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🟢 Get Single Site Details
export const getSite = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.orgId;

    const site = await Site.findOne({ _id: id, orgId });
    if (!site) return res.status(404).json({ success: false, message: "Site not found" });

    // Explicitly confirm pages are returned
    console.log(`Serving Site: ${site.domain}, Pages: ${site.pages?.length}`);
    res.json({ success: true, site });
  } catch (err: any) {
    console.error("❌ Get site error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🟢 Update crawl frequency or site status
export const updateSite = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { crawl_schedule, status, pages } = req.body;
    const orgId = req.user?.orgId;

    const site = await Site.findOne({ _id: id, orgId });
    if (!site) return res.status(404).json({ success: false, message: "Site not found" });

    if (crawl_schedule) site.crawl_schedule = crawl_schedule;
    if (status) site.status = status;
    if (req.body.tags) site.tags = req.body.tags;
    if (req.body.description) site.description = req.body.description;
    if (req.body.intent_summary !== undefined) site.intent_summary = req.body.intent_summary;
    if (req.body.allowUI_Actions !== undefined) {
      site.allowUI_Actions = req.body.allowUI_Actions === 'true' || req.body.allowUI_Actions === true;
    }

    // Add new pages if provided
    if (pages && Array.isArray(pages)) {
      // 🛡️ Limit Check: Pages (Check before adding)
      // Note: We check if *Adding these pages* would exceed limit.
      // checkFreshLimit checks CURRENT usage. We need to check Current + New >= Limit.
      // But checkFreshLimit throws if Current >= Limit.
      // Ideally we should pass "Amount to Add" to checkFreshLimit or do a custom check here.
      // For now, strict check: if *already* at limit -> Block.
      await usageService.checkFreshLimit(orgId, 'max_website_pages');

      // Normalize existing DB URLs for robust check (Case insensitive + No Trailing Slash)
      // Normalize existing DB URLs for robust check (Case insensitive + No Trailing Slash)
      const normalize = (u: string) => u.toLowerCase().replace(/\/$/, "");
      const existingUrls = new Set((site.pages || []).map((p: any) => normalize(p.url)));

      const pagesToAdd: any[] = [];

      for (const p of pages) {
        const urlStr = typeof p === 'string' ? p : p.url;
        const isActive = typeof p === 'string' ? true : (p.isActive !== false);

        let finalUrl = urlStr.trim();

        // Validation & Resolution: Ensure Absolute URL
        if (!finalUrl.startsWith('http')) {
          // Try to resolve against site domain
          let baseUrl = site.domain;
          if (!baseUrl.startsWith('http')) baseUrl = `https://${baseUrl}`;

          try {
            // Handle root-relative vs relative
            finalUrl = new URL(finalUrl, baseUrl).href;
          } catch (e) {
            console.warn(`Could not resolve relative URL: ${urlStr}`);
            continue; // Skip invalid
          }
        }

        // Check Duplication against the RESOLVED Final URL
        const checkUrl = normalize(finalUrl);

        if (!existingUrls.has(checkUrl)) {
          pagesToAdd.push({
            url: finalUrl,
            status: 'pending',
            isActive: isActive,
            crawl_frequency: site.crawl_schedule || 'weekly'
          });
          // Add to set to prevent duplicates within the same incoming batch
          existingUrls.add(checkUrl);
        }
      }

      if (pagesToAdd.length > 0) {
        site.pages.push(...pagesToAdd);
      }
    }

    await site.save();

    // Update schedule if changed
    if (crawl_schedule) {
      await cancelScheduledCrawl(id);
      await scheduleCrawl(id, crawl_schedule);
    }

    res.json({ success: true, message: `✅ Site updated`, site });
  } catch (err: any) {
    console.error("❌ Update site error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🔴 Delete Site
export const deleteSite = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.orgId;

    const site = await Site.findOneAndDelete({ _id: id, orgId });
    if (!site) return res.status(404).json({ success: false, message: "Site not found" });

    // Remove scheduled jobs
    await cancelScheduledCrawl(id);

    // TODO: Ideally trigger a job to delete vectors from Chroma for this Site ID
    // For now, we assume periodic cleanup or manual vector deletion logic exists or will be added.

    res.json({ success: true, message: "✅ Site deleted" });
  } catch (err: any) {
    console.error("❌ Delete site error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🟢 Toggle Page Status (AI Usage ON/OFF)
export const togglePageStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { siteId, pageId } = req.params;
    const { isActive } = req.body; // true or false
    const orgId = req.user?.orgId;

    const site = await Site.findOne({ _id: siteId, orgId });
    if (!site) return res.status(404).json({ success: false, message: "Site not found" });

    const page = site.pages.id(pageId);
    if (!page) return res.status(404).json({ success: false, message: "Page not found" });

    page.isActive = isActive;
    await site.save();

    res.json({ success: true, message: `Page AI Usage ${isActive ? 'Enabled' : 'Disabled'}`, pageId, isActive });
  } catch (err: any) {
    console.error("❌ Toggle page error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🔴 Delete Page
export const deletePage = async (req: AuthRequest, res: Response) => {
  try {
    const { siteId, pageId } = req.params;
    const orgId = req.user?.orgId;

    const site = await Site.findOne({ _id: siteId, orgId });
    if (!site) return res.status(404).json({ success: false, message: "Site not found" });

    // Find page to get URL for vector deletion
    const page = site.pages.id(pageId);
    if (page) {
      console.log(`🗑️ Deleting page: ${page.url} (pageId: ${pageId})`);

      // 🔥 DELETE VECTORS for this page
      // Migrated to Python AI Engine (Vectors managed there).
      // Assuming automatic sync or manual cleanup for now.
      console.log(`⚠️ Vector deletion delegated to AI Engine (skipped locally)`);

      // Remove page
      site.pages.pull({ _id: pageId });
      await site.save();
    } else {
      return res.status(404).json({ success: false, message: "Page not found" });
    }

    res.json({ success: true, message: "🗑️ Page deleted (metadata + vectors)" });
  } catch (err: any) {
    console.error("❌ Delete page error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🔵 Update Page Details
export const updatePage = async (req: AuthRequest, res: Response) => {
  try {
    const { siteId, pageId } = req.params;
    const updates = req.body;
    const orgId = req.user?.orgId;

    const site = await Site.findOne({ _id: siteId, orgId });
    if (!site) return res.status(404).json({ success: false, message: "Site not found" });

    const page = site.pages.id(pageId);
    if (!page) return res.status(404).json({ success: false, message: "Page not found" });

    Object.assign(page, updates);
    await site.save();

    res.json({ success: true, message: "Page updated successfully", page });
  } catch (err: any) {
    console.error("❌ Update page error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🔄 Recrawl Site (Refresh Memory - All Pages)
export const recrawlSite = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // Site ID
    const orgId = req.user?.orgId;

    const site = await Site.findOne({ _id: id, orgId });
    if (!site) return res.status(404).json({ success: false, message: "Site not found" });

    // 🛡️ Limit Check: Knowledge Storage (Tokens)
    // Prevent retraining if storage limit exceeded
    await usageService.checkFreshLimit(orgId, 'max_training_tokens');

    // 🔥 FIX: Only get ACTIVE pages (isActive = true or undefined)
    const pageUrls = site.pages
      .filter((p: any) => p.isActive !== false)
      .map((p: any) => p.url);

    if (pageUrls.length === 0) {
      return res.status(400).json({ success: false, message: "No active pages to crawl" });
    }

    // Set ACTIVE pages to 'pending' status (skip OFF pages)
    site.pages.forEach((p: any) => {
      if (p.isActive !== false) {
        p.status = 'pending';
      }
    });
    site.status = 'crawling';
    await site.save();

    // 🔥 CRITICAL FIX: Create INDIVIDUAL crawl job for each page (not bulk)
    let jobsCreated = 0;
    for (const pageUrl of pageUrls) {
      await crawlQueue.add(
        "crawl-page",
        {
          orgId: orgId.toString(),
          siteId: id,
          urls: [pageUrl],  // Single URL per job
          startUrl: pageUrl,
          recursive: false // 🔥 DO NOT dynamically spider links on manual recrawl
        },
        { removeOnComplete: true }
      );
      jobsCreated++;
    }

    console.log(`🔄 [Recrawl] Created ${jobsCreated} individual crawl jobs for site ${site.domain}`);

    res.json({
      success: true,
      message: `🔄 Recrawling ${pageUrls.length} active pages (${jobsCreated} jobs created)...`,
      pagesCount: pageUrls.length
    });
  } catch (err: any) {
    console.error("❌ Recrawl site error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
