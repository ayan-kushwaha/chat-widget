
import { Request, Response } from 'express';
import { AuthRequest } from "@shared/middlewares/auth.js";
import { Brain } from "@modules/dashboard/brain/models/Brain.js";
import { Site } from "@modules/dashboard/knowledge/models/Site.js";
import { KnowledgeDocument } from "@modules/dashboard/knowledge/models/KnowledgeDocument.js";
import { Organization } from "@modules/core/organization/Organization.js";
import { validateKnowledgeInput } from "@modules/shared/utils/validation.js";
import { embedQueue, crawlQueue } from "../../../jobs/queues.js";
import { usageService } from "../../../services/usage.service.js";
import { ActivityType } from "../../../models/ActivityLog.js";
import { scheduleCrawl } from "../../../jobs/scheduler.js";
import TurndownService from "turndown";

const turndownService = new TurndownService({ headingStyle: 'atx' });

// Helper to get Brain (Decoupled Architecture)
export const getOrCreateBrain = async (orgId: string) => {
  let brain = await Brain.findOne({ orgId });
  if (!brain) {
    // Auto-Create if missing (Self-Healing)
    brain = await Brain.create({ orgId, personality_config: {}, policy_core: {} });
  }
  return brain;
};

// --- API STUBS (Legacy) ---

export const getKnowledgeBase = async (req: Request, res: Response) => {
  try { res.json({ success: true, message: "Migrated to AI Engine." }); } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const learnUrl = async (req: Request, res: Response) => {
  try { res.json({ success: true, message: "Please use Site Manager for URL learning." }); } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const learnFile = async (req: Request, res: Response) => {
  try { res.json({ success: true, message: "Use the File Upload API which triggers the Worker." }); } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const askQuestion = async (req: Request, res: Response) => {
  try { res.json({ success: true, answer: "Chat API migrated. Please use /api/v1/chat or /api/v1/ai/chat." }); } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const deleteKnowledge = async (req: Request, res: Response) => {
  res.status(410).json({ success: false, message: "Endpoint deprecated. Use deleteKnowledgeSource." });
};

// --- API Routes Stubs ---

export const triggerCrawl = async (req: AuthRequest, res: Response) => {
  try {
    const { siteId } = req.params;
    const orgId = req.user?.orgId;

    const site = await Site.findOne({ _id: siteId, orgId });
    if (!site) return res.status(404).json({ success: false, message: "Site not found" });

    // 🛡️ Limit Check: Knowledge Storage (Tokens)
    await usageService.checkFreshLimit(orgId.toString(), 'max_training_tokens');

    // 🔥 FIX: Only get ACTIVE pages
    const pageUrls = site.pages
      .filter((p: any) => p.isActive !== false)
      .map((p: any) => p.url);

    if (pageUrls.length === 0) {
      return res.status(400).json({ success: false, message: "No active pages to crawl" });
    }

    // Set ACTIVE pages to 'pending' status
    site.pages.forEach((p: any) => {
      if (p.isActive !== false) {
        p.status = 'pending';
      }
    });
    site.status = 'crawling';
    await site.save();

    // 🔥 CRITICAL FIX: Create INDIVIDUAL crawl job for each page
    let jobsCreated = 0;
    for (const pageUrl of pageUrls) {
      await crawlQueue.add(
        "crawl-page",
        {
          orgId: orgId.toString(),
          siteId: siteId,
          urls: [pageUrl],
          startUrl: pageUrl
        },
        { removeOnComplete: true }
      );
      jobsCreated++;
    }

    console.log(`🔄 [Retrain] Created ${jobsCreated} crawl jobs for ${site.domain}`);

    // Track Activity (Brain Crawl) - MOVED TO WORKER (Token Based Billing)
    /*
    try {
      if (jobsCreated > 0) {
        await usageService.trackActivity(
          orgId.toString(),
          ActivityType.BRAIN_CRAWL,
          jobsCreated,
          { siteId, url: site.domain }
        );
      }
    } catch (e) { console.error("Tracking Failed", e); }
    */

    res.json({ success: true, message: `✅ Retraining ${pageUrls.length} active pages (${jobsCreated} jobs created)` });
  } catch (err: any) {
    console.error("❌ Trigger Crawl error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const crawlStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { siteId } = req.params;
    const orgId = req.user?.orgId;

    const site = await Site.findOne({ _id: siteId, orgId });
    if (!site) return res.status(404).json({ success: false, message: "Site not found" });

    res.json({ success: true, status: site.status, message: site.status === 'crawling' ? "Crawling in progress..." : "Idle" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const startCrawl = async (req: Request, res: Response) => {
  res.json({ success: true, message: "Manual crawl start migrated." });
};

export const handleChat = async (req: Request, res: Response) => {
  res.json({ success: true, message: "Use /api/v1/ai/chat" });
};

export const analyzeSession = async (req: Request, res: Response) => {
  res.json({ success: true, message: "Session analysis migrated." });
};

// --- Real Implementations ---

export const getBrainOverview = async (req: AuthRequest, res: Response) => {
  try {
    const { orgId } = req.params;
    // 1. Fetch Real Data from Models
    const sites = await Site.find({ orgId, status: { $ne: 'deleted' } }).sort({ createdAt: -1 });
    const docs = await KnowledgeDocument.find({ orgId, status: { $ne: 'deleted' } }).sort({ uploadedAt: -1 });
    const brain = await Brain.findOne({ orgId });

    // Fetch Manual Documents (Custom Text)
    const { ManualDocument } = await import("./models/ManualDocument.js");
    const customText = await ManualDocument.find({ orgId, status: { $ne: 'deleted' } }).sort({ createdAt: -1 });

    // Fetch API Sources
    const { ApiSource } = await import("./models/ApiSource.js");
    const apiSources = await ApiSource.find({ orgId, isActive: true }).sort({ createdAt: -1 });

    // 2. Calculate Stats
    const totalSources = sites.length + docs.length + customText.length + apiSources.length;

    // Calculate total tokens (Robust Aggregation)
    const siteTokens = sites.reduce((acc, s: any) => acc + (s.token_count || 0), 0);
    const docTokens = docs.reduce((acc, d: any) => acc + (d.token_count || 0), 0);

    // 🔥 Improved Text Token logic: Scan custom_text properly
    const textTokens = customText.reduce((acc: number, t: any) => {
      // If entry is active but has no tokens, use content-based fallback for the overview
      const tokens = t.token_count || Math.ceil((t.content?.length || 0) / 4);
      return acc + tokens;
    }, 0);

    const totalTokens = siteTokens + docTokens + textTokens;

    // Fetch Org for IQ Calculation & Plan Limits
    const org = await Organization.findById(orgId);
    if (!org) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }

    // Count Pages across all sites
    const totalPages = sites.reduce((acc, site: any) => acc + (site.pages?.length || 0), 0);

    // 3. BRAIN IQ LOGIC (Dynamic Calculation) 🧠
    let iqLevel = "Beginner";
    let brainTitle = "Junior Assistant";
    let brainProgress = 0;

    if (totalTokens < 50000) {
      iqLevel = "Beginner";
      brainTitle = "Trainee AI";
      brainProgress = (totalTokens / 50000) * 100;
    } else if (totalTokens < 150000) {
      iqLevel = "Intermediate";
      brainTitle = "Advanced Assistant";
      brainProgress = ((totalTokens - 50000) / 100000) * 100;
    } else {
      iqLevel = "Expert";
      brainTitle = "Master Intelligence";
      brainProgress = 100;
    }

    const capabilities = [];
    if (docs.length >= 5 || docTokens > 50000) capabilities.push("Policy & Documentation Guru");
    else if (docs.length > 0) capabilities.push("Document Handler");
    if (apiSources.length > 0) capabilities.push("Real-time Operations");
    if (sites.length > 0) capabilities.push("Brand Voice Expert");
    if (capabilities.length === 0) capabilities.push("Learning...");

    // 🔥 GET PLAN LIMITS
    const { getPlanLimits } = await import("../../../config/plans.config.js");
    const defaultLimits = getPlanLimits('free');

    const planLimits = {
      max_websites: org.subscription?.snapshot?.limits?.max_websites || defaultLimits.max_websites,
      max_website_pages: org.subscription?.snapshot?.limits?.max_website_pages || 5,
      max_file_uploads: org.subscription?.snapshot?.limits?.max_file_uploads || defaultLimits.max_files,
      max_manual_qa: org.subscription?.snapshot?.limits?.max_manual_qa || 5,
    };

    // 🔥 CALCULATE PLAN USAGE
    const planUsage = {
      websites: {
        current: sites.length,
        limit: planLimits.max_websites,
        percentage: Math.round((sites.length / planLimits.max_websites) * 100),
        exceeded: sites.length > planLimits.max_websites ? sites.length - planLimits.max_websites : 0,
        available: Math.max(0, planLimits.max_websites - sites.length)
      },
      pages: {
        current: totalPages,
        limit: planLimits.max_website_pages,
        percentage: Math.round((totalPages / planLimits.max_website_pages) * 100),
        exceeded: totalPages > planLimits.max_website_pages ? totalPages - planLimits.max_website_pages : 0,
        available: Math.max(0, planLimits.max_website_pages - totalPages)
      },
      files: {
        current: docs.length,
        limit: planLimits.max_file_uploads,
        percentage: Math.round((docs.length / planLimits.max_file_uploads) * 100),
        exceeded: docs.length > planLimits.max_file_uploads ? docs.length - planLimits.max_file_uploads : 0,
        available: Math.max(0, planLimits.max_file_uploads - docs.length)
      },
      manual: {
        current: customText.length,
        limit: planLimits.max_manual_qa,
        percentage: Math.round((customText.length / planLimits.max_manual_qa) * 100),
        exceeded: customText.length > planLimits.max_manual_qa ? customText.length - planLimits.max_manual_qa : 0,
        available: Math.max(0, planLimits.max_manual_qa - customText.length)
      },
      overall: Math.min(100, Math.round(
        ((sites.length / planLimits.max_websites) * 100 +
          (totalPages / planLimits.max_website_pages) * 100 +
          (docs.length / planLimits.max_file_uploads) * 100 +
          (customText.length / planLimits.max_manual_qa) * 100) / 4
      ))
    };

    // 4. Construct Response
    res.json({
      success: true,
      stats: {
        totalSources,
        wordsUsed: totalTokens,
        wordsLimit: org.subscription?.token_capacity || 200000,
        lastSynced: new Date(),
        totalConversations: 0,
        iq: {
          level: iqLevel,
          title: brainTitle,
          progress: Math.round(brainProgress),
          capabilities
        }
      },
      planUsage,
      knowledge_strategy: org.knowledge_strategy,
      sources: {
        websites: sites.map((s: any) => ({
          id: s._id,
          domain: s.domain,
          pagesCount: s.pages?.length || 0,
          status: s.status,
          last_crawled: s.updatedAt,
          token_count: s.token_count || 0,
          chunk_count: s.chunk_count || 0,
          tags: s.tags || [],
          description: s.description || "",
          intent_summary: s.intent_summary || "",
          raw_url: s.pages?.[0]?.raw_url || null,
          screenshot_url: s.pages?.[0]?.screenshot_url || null,
          pages: s.pages || []
        })),
        documents: docs.map((d: any) => ({
          id: d._id,
          name: d.name,
          type: d.file_type || 'document',
          status: d.status,
          size: d.size,
          token_count: d.token_count || 0,
          chunk_count: d.chunk_count || 0,
          createdAt: d.uploadedAt,
          url: d.url,
          tags: d.tags || [],
          intent_summary: d.intent_summary || "",
          description: d.summary || d.description || "", // 🔥 Fix: Strict Description
          source: d.metadata?.source
        })),
        api: apiSources.map((a: any) => ({
          id: a._id,
          name: a.name,
          endpoint: a.endpoint,
          method: a.method,
          syncMode: a.syncMode,
          status: a.isActive ? 'active' : 'inactive',
          lastSynced: a.lastSynced,
          createdAt: a.createdAt,
          tags: a.tags || [],
          intent_summary: a.intent_summary || "",
          description: a.summary || "", // 🔥 Fix: Strict Description
          source: 'api'
        })),
        custom_text: customText.map((t: any) => ({
          id: t._id,
          title: t.title,
          content: t.content,
          preview: t.content?.substring(0, 300) + (t.content?.length > 300 ? "..." : ""),
          status: t.status || (t.isActive ? 'active' : 'inactive'),
          priority: t.priority,
          chunk_count: t.chunk_count || 0,
          token_count: t.token_count || 0,
          intent_summary: t.intent_summary || "",
          description: t.description || "", // 🔥 Fix: Strict Description
          tags: t.tags || [],
          createdAt: t.createdAt,
          type: 'manual'
        }))
      },
      overview: {
        totalDocs: docs.length,
        totalVectors: totalTokens,
        // 🔥 GLOBAL TRENDS (Ticker Data)
        trends: brain?.knowledge_profile?.topics
          ?.sort((a: any, b: any) => b.score - a.score) // Sort by Popularity
          ?.slice(0, 20) // Top 20 Only
          ?.map((t: any) => ({
            tag: t.name,
            score: t.score,
            type: t.category
          })) || []
      }
    });
  } catch (error: any) {
    console.error("Brain Overview Error:", error);
    res.status(500).json({ success: false, message: "Failed to load brain overview: " + error.message, stack: error.stack });
  }
};

// 🗑️ Delete Knowledge Source (File, Website, Text)
export const deleteKnowledgeSource = async (req: AuthRequest, res: Response) => {
  try {
    const { orgId, type, sourceId } = req.params;

    if (type === 'file') {
      const doc = await KnowledgeDocument.findOne({ _id: sourceId, orgId }); // Clean delete needed path first
      if (!doc) return res.status(404).json({ success: false, message: "Document not found" });

      // Track storage reduction (both category and system)
      if (doc.size) {
        const { updateStorageBreakdown, updateSystemStorage } = await import("./storage.helper.js");
        const fileSizeMB = doc.size / (1024 * 1024);
        await updateStorageBreakdown(orgId, 'documents', fileSizeMB, 'subtract');
        await updateSystemStorage(orgId, 'minio', fileSizeMB, 'subtract');
      }

      // 1. Delete from MinIO
      if (doc.url && (doc.url.startsWith('http') || doc.url.startsWith('s3'))) {
        try {
          const { deleteFile } = await import("../../shared/services/storage.service.js");
          await deleteFile(doc.url);
        } catch (minioErr) {
          console.error("MinIO cleanup error (ignored):", minioErr);
        }
      }

      // 🔥 REVERSE VOTING SYSTEM (Clean Deletion)
      // Decrement tag scores before deleting
      if (doc.tags && Array.isArray(doc.tags) && doc.tags.length > 0) {
        try {
          const brain = await Brain.findOne({ orgId });
          if (brain) {
            for (const tag of doc.tags) {
              // Decrement score by 1
              const result = await Brain.updateOne(
                { orgId, "knowledge_profile.topics.name": tag },
                { $inc: { "knowledge_profile.topics.$.score": -1 } }
              );

              // If updated (tag existed), check if score is now <= 0 and remove
              if (result.modifiedCount > 0) {
                await Brain.updateOne(
                  { orgId },
                  { $pull: { "knowledge_profile.topics": { score: { $lte: 0 } } } }
                );
              }
            }
            console.log(`🗳️ [Delete] Reverse-voted tags: ${doc.tags.join(', ')}`);
          }
        } catch (voteErr) {
          console.error("❌ Reverse voting failed (non-critical):", voteErr);
        }
      }

      // 🔥 VECTOR DB CLEANUP (Prevent Ghost Data)
      // Delete embeddings from Vector Database
      try {
        const axios = (await import('axios')).default;
        const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://127.0.0.1:5000';

        // Use chunk_ids if available, otherwise filter by source_id
        const chunkIds = (doc as any).chunk_ids || [];

        if (chunkIds.length > 0) {
          // Delete by specific IDs
          await axios.delete(`${AI_ENGINE_URL}/api/v1/knowledge/vectors`, {
            data: { orgId, ids: chunkIds }
          });
          console.log(`🧹 [Delete] Cleaned ${chunkIds.length} vectors from Vector DB`);
        } else {
          // Fallback: Delete by source_id metadata filter
          await axios.delete(`${AI_ENGINE_URL}/api/v1/knowledge/vectors`, {
            data: { orgId, filter: { source_id: sourceId } }
          });
          console.log(`🧹 [Delete] Cleaned vectors by source_id: ${sourceId}`);
        }
      } catch (vectorErr: any) {
        console.error("❌ Vector cleanup failed (non-critical):", vectorErr.message);
      }

      // 2. Delete from MongoDB
      await KnowledgeDocument.deleteOne({ _id: sourceId, orgId });

      return res.json({ success: true, message: "✅ File & Storage deleted" });
    }

    if (type === 'website') {
      const site = await Site.findOneAndDelete({ _id: sourceId, orgId });
      if (!site) return res.status(404).json({ success: false, message: "Site not found" });

      // 🧠 NEURAL CLEANUP: Delete Consolidated Page Index
      try {
        const { PageIndex } = await import("./models/PageIndex.js");
        await PageIndex.deleteOne({ sourceId });
        console.log(`🧹 [Delete] Cleaned Consolidated Site Index for: ${sourceId}`);
      } catch (e) { console.error("Neural Index cleanup failed:", e); }

      // Cancel any scheduled crawls
      try {
        const { cancelScheduledCrawl } = await import("../../../jobs/scheduler.js");
        await cancelScheduledCrawl(sourceId);
      } catch (e) { console.warn("Failed to cancel schedule:", e); }

      // 🔥 VECTOR DB CLEANUP: Delete all vectors for this site
      try {
        const axios = (await import('axios')).default;
        const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://127.0.0.1:5000';
        await axios.delete(`${AI_ENGINE_URL}/api/v1/knowledge/vectors`, {
          data: { orgId, filter: { siteId: sourceId } }
        });
        console.log(`🧹 [Delete] Cleaned all vectors for site: ${sourceId}`);
      } catch (vectorErr: any) {
        console.error("❌ Website Vector cleanup failed:", vectorErr.message);
      }

      return res.json({ success: true, message: "✅ Website & Neural Index deleted" });
    }

    if (type === 'text' || type === 'manual') {
      const { ManualDocument } = await import("./models/ManualDocument.js");
      const deleted = await ManualDocument.findOneAndDelete({ _id: sourceId, orgId });
      if (!deleted) return res.status(404).json({ success: false, message: "Entry not found" });

      // 🔥 VECTOR DB CLEANUP: Delete vectors for this manual entry
      try {
        const axios = (await import('axios')).default;
        const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://127.0.0.1:5000';
        await axios.delete(`${AI_ENGINE_URL}/api/v1/knowledge/vectors`, {
          data: { orgId, filter: { source_id: sourceId } }
        });
      } catch (vectorErr: any) {
        console.error("❌ Text Vector cleanup failed:", vectorErr.message);
      }

      return res.json({ success: true, message: "✅ Text entry deleted" });
    }

    // 4. API Sources
    if (type === 'api') {
      const { ApiSource } = await import("./models/ApiSource.js");
      const deleted = await ApiSource.findOneAndDelete({ _id: sourceId, orgId });
      if (!deleted) return res.status(404).json({ success: false, message: "API Source not found" });
      return res.json({ success: true, message: "✅ API Source deleted" });
    }

    return res.status(400).json({ success: false, message: "Invalid source type" });

  } catch (err: any) {
    console.error("❌ Delete error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const toggleKnowledgeSource = async (req: AuthRequest, res: Response) => {
  try {
    const { orgId, type, sourceId } = req.params;

    if (type === 'text' || type === 'manual') {
      const { ManualDocument } = await import("./models/ManualDocument.js");
      const entry = await ManualDocument.findOne({ _id: sourceId, orgId });
      if (!entry) return res.status(404).json({ success: false, message: "Entry not found" });

      entry.isActive = !entry.isActive;
      await entry.save();
      return res.json({ success: true, message: `✅ Entry ${entry.isActive ? 'activated' : 'deactivated'}`, isActive: entry.isActive });
    }

    // For websites/API we can add similar toggle if needed
    res.json({ success: true, message: "Toggle currently supported for Manual Docs only." });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🔄 Unified Source Metadata Update
export const updateSourceMetadata = async (req: AuthRequest, res: Response) => {
  try {
    const { orgId, type, sourceId } = req.params;
    const { title, name, label, header, description, tags, intent_summary, priority, content, url, method, authType, headers, bodyTemplate, searchParam, contextHints, category, skipTrain } = req.body;

    const fs = await import('fs');
    console.log(`📝 [UpdateSource] Org: ${orgId}, Type: ${type}, Source: ${sourceId}`);
    console.log(`📦 [Payload]:`, JSON.stringify(req.body, null, 2));

    // 🔥 DEBUG LOGGER
    try {
      fs.appendFileSync('debug_payload.txt', `\n[${new Date().toISOString()}] PATCH /source/${type}/${sourceId}\n${JSON.stringify(req.body, null, 2)}\n`);
    } catch (e) { }


    const finalTitle = title || name || label || header;

    // 🛡️ Input Validation
    const validation = validateKnowledgeInput({ title: finalTitle, description, intent_summary, tags, content });
    if (!validation.success) {
      return res.status(400).json({ success: validation.success, message: validation.message });
    }

    if (type === 'website') {
      const site = await Site.findOne({ _id: sourceId, orgId });
      if (!site) return res.status(404).json({ success: false, message: "Site not found" });

      if (description) site.description = description;
      if (intent_summary !== undefined) site.intent_summary = intent_summary;
      if (tags) site.tags = tags;

      await site.save();
    }
    else if (type === 'file') {
      const doc = await KnowledgeDocument.findOne({ _id: sourceId, orgId }) as any;
      if (!doc) return res.status(404).json({ success: false, message: "Document not found" });

      // Handle File Replacement 📂
      if (req.file) {
        console.log(`🔄 [File Replacement] New file uploaded for doc: ${sourceId}`);
        const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
        const filename = `${Date.now()}-${req.file.originalname}`;

        const s3 = new S3Client({
          region: 'us-east-1',
          endpoint: process.env.MINIO_ENDPOINT || 'http://127.0.0.1:9000',
          credentials: {
            accessKeyId: process.env.MINIO_ROOT_USER || 'admin',
            secretAccessKey: process.env.MINIO_ROOT_PASSWORD || 'password123'
          },
          forcePathStyle: true
        });

        const BUCKET = 'cluaiz-storage';

        await s3.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: filename,
          Body: req.file.buffer,
          ContentType: req.file.mimetype
        }));

        const fileUrl = `${process.env.MINIO_ENDPOINT || 'http://127.0.0.1:9000'}/${BUCKET}/${filename}`;

        doc.url = fileUrl;
        doc.file_path = filename;
        doc.type = req.file.mimetype;
        doc.status = 'training';
      }

      if (finalTitle) doc.name = finalTitle;
      if (description) doc.summary = description;
      if (intent_summary !== undefined) doc.intent_summary = intent_summary;
      if (tags) {
        doc.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      }

      await doc.save();

      // If file was replaced or explicit refresh, trigger re-train
      if (req.file) {
        const { embedQueue } = await import("../../../jobs/queues.js");
        await embedQueue.add("process-document", {
          orgId,
          fileName: doc.name,
          filePath: doc.url,
          metadata: {
            fileId: doc._id.toString(),
            type: 'file',
            isRefresh: true
          }
        }, { removeOnComplete: true });
      }
    }
    else if (type === 'api') {
      const { ApiSource } = await import("./models/ApiSource.js");
      const apiSource = await ApiSource.findOne({ _id: sourceId, orgId });
      if (!apiSource) return res.status(404).json({ success: false, message: "API Source not found" });

      if (url) apiSource.endpoint = url;
      if (finalTitle) apiSource.name = finalTitle;
      if (description) apiSource.summary = description;
      if (method) apiSource.method = method as any;
      if (authType) apiSource.authType = authType;

      // Nested Attributes Fix 🛠️
      if (headers) {
        if (!apiSource.authCredentials) apiSource.authCredentials = {} as any;
        (apiSource.authCredentials as any).headers = headers;
      }
      if (bodyTemplate) {
        if (!apiSource.requestConfig) apiSource.requestConfig = {} as any;
        apiSource.requestConfig.bodyTemplate = bodyTemplate;
      }
      if (searchParam) {
        if (!apiSource.requestConfig) apiSource.requestConfig = {} as any;
        apiSource.requestConfig.searchParam = searchParam;
      }

      if (category) apiSource.category = category;
      if (tags) apiSource.tags = tags;
      if (intent_summary !== undefined) apiSource.intent_summary = intent_summary;

      await apiSource.save();
    }
    else if (type === 'text' || type === 'manual') {
      const brain = await Brain.findOne({ orgId });
      if (!brain || !brain.knowledge_base) return res.status(404).json({ success: false, message: "Brain knowledge base not found" });

      const customTextArray = brain.knowledge_base.custom_text as any[];
      const entryIndex = customTextArray.findIndex((e: any) => e._id.toString() === sourceId);

      if (entryIndex === -1) return res.status(404).json({ success: false, message: "Entry not found" });

      const entry = customTextArray[entryIndex];
      const newTitle = title || req.body.name || req.body.label || req.body.header;

      // 🔥 ULTIMATE FIX: MongoDB Raw Atomic Updates (Bypasses Mongoose Tracking Bugs)
      const updateFields: any = {};
      if (newTitle) { updateFields[`knowledge_base.custom_text.${entryIndex}.title`] = newTitle; entry.title = newTitle; }
      if (content) { updateFields[`knowledge_base.custom_text.${entryIndex}.content`] = content; entry.content = content; }
      if (description) { updateFields[`knowledge_base.custom_text.${entryIndex}.description`] = description; entry.description = description; }
      if (tags) { updateFields[`knowledge_base.custom_text.${entryIndex}.tags`] = tags; entry.tags = tags; }
      if (intent_summary !== undefined) { updateFields[`knowledge_base.custom_text.${entryIndex}.intent_summary`] = intent_summary; entry.intent_summary = intent_summary; }
      if (priority) { updateFields[`knowledge_base.custom_text.${entryIndex}.priority`] = priority; entry.priority = priority; }

      const actualSkipTrain = skipTrain === 'true' || skipTrain === true;
      if (!actualSkipTrain) {
        updateFields[`knowledge_base.custom_text.${entryIndex}.status`] = 'training';
        entry.status = 'training';
      } else if (entry.status === 'training' || !entry.status) {
        updateFields[`knowledge_base.custom_text.${entryIndex}.status`] = 'active';
        entry.status = 'active';
      }

      updateFields[`knowledge_base.custom_text.${entryIndex}.last_updated`] = new Date();

      // Execute MongoDB atomic update
      await Brain.updateOne({ orgId }, { $set: updateFields });

      // 🧠 AI/Qdrant: Convert to Markdown ONLY for embeddings
      if (!actualSkipTrain) {
        const { embedQueue } = await import("../../../jobs/queues.js");
        const markdownForAI = turndownService.turndown(entry.content || "");

        await embedQueue.add("process-document", {
          orgId,
          text: markdownForAI, // AI layer sees Markdown
          title: entry.title,
          metadata: {
            fileId: entry._id.toString(),
            type: 'manual',
            isRefresh: true
          }
        }, { removeOnComplete: true });
      }
    }
    else {
      return res.status(400).json({ success: false, message: "Invalid source type for update" });
    }

    res.json({ success: true, message: "✅ Metadata updated successfully" });
  } catch (error: any) {
    console.error("❌ Update Meta Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPersonalityConfig = async (req: Request, res: Response) => {
  res.json({ success: true, config: {} });
};

export const updatePersonalityConfig = async (req: Request, res: Response) => {
  res.json({ success: true, message: "Personality config updated." });
};

export const discoverSite = async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    const { orgId } = (req as any).user || {}; // Optional if auth required

    if (!url) return res.status(400).json({ success: false, message: "URL is required" });

    // Call Python AI Engine
    // FIX: Force IPv4 127.0.0.1 to avoid Windows Node.js IPv6 resolution issues
    let engineUrl = process.env.AI_ENGINE_URL || 'http://127.0.0.1:5000';
    if (engineUrl.includes('localhost')) {
      engineUrl = engineUrl.replace('localhost', '127.0.0.1');
    }

    const response = await fetch(`${engineUrl}/api/v1/knowledge/discover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, org_id: orgId || "public" })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Python API Error: ${response.status} ${errText}`);
    }

    const data: any = await response.json();

    res.json({
      success: true,
      urls: data.urls,
      data: {
        title: data.title,
        description: "" // Description comes from auto-tag (metadata) step
      }
    });

  } catch (error: any) {
    console.error("❌ Discovery Failed:", error.response?.data || error.message);
    res.status(500).json({ success: false, message: "Failed to discover site: " + error.message });
  }
};

export const autoTagSite = async (req: Request, res: Response) => {
  try {
    const { url, siteId } = req.body;
    const { orgId } = (req as any).user || {};

    // FIX: Force IPv4 127.0.0.1
    let engineUrl = process.env.AI_ENGINE_URL || 'http://127.0.0.1:5000';
    if (engineUrl.includes('localhost')) {
      engineUrl = engineUrl.replace('localhost', '127.0.0.1');
    }

    let metaData: any = {};

    if (siteId) {
      // 🌟 VECTORLESS METADATA ROUTE: Use compiled page indexes
      const metaRes = await fetch(`${engineUrl}/api/v1/knowledge/source-metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, sourceId: siteId, sourceType: 'website' })
      });

      if (!metaRes.ok) throw new Error("Vectorless Site Metadata failed: " + await metaRes.text());
      metaData = await metaRes.json();
    } else {
      if (!url) return res.status(400).json({ success: false, message: "URL or siteId is required" });

      // 1. Crawl to get text (Python)
      const crawlRes = await fetch(`${engineUrl}/api/v1/knowledge/crawl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, org_id: orgId || "public" })
      });

      if (!crawlRes.ok) throw new Error("Crawl failed: " + await crawlRes.text());

      const crawlData: any = await crawlRes.json();
      const text = crawlData.content;

      if (!text) throw new Error("No content found on page.");

      // 2. Generate Metadata (Python)
      const metaRes = await fetch(`${engineUrl}/api/v1/knowledge/metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!metaRes.ok) throw new Error("Metadata failed: " + await metaRes.text());
      metaData = await metaRes.json();
    }

    res.json({
      success: true,
      tags: metaData.tags || [],
      description: metaData.summary || "",
      title: metaData.title || "",
      intent: metaData.intent_summary || ""
    });

    // Track Activity
    try {
      const usage = metaData.usage || { input: 0, output: 0 };
      if (usage.input > 0 || usage.output > 0) {
        await usageService.trackActivity(
          orgId,
          ActivityType.AI_CHAT,
          1,
          { input_tokens: usage.input, output_tokens: usage.output, url: url || siteId, action: 'auto-tag' }
        );
        console.log(`🔥 [Auto-Tag] Burned ${usage.input} In / ${usage.output} Out Tokens`);
      }
    } catch (e) { console.error("Tracking Failed", e); }

  } catch (error: any) {
    console.error("❌ Auto-Tag Failed:", error.message);
    res.status(500).json({ success: false, message: "Failed to generate tags: " + error.message });
  }
};

/**
 * 🔥 [Skill 15] Hybrid Auto-Fill Metadata
 * Generates Title, Description, Intent, and Tags for ANY content (Text or API Schema)
 */
export const autoFillMetadata = async (req: AuthRequest, res: Response) => {
  try {
    const { content, type, sourceId } = req.body;
    const { orgId } = req.user!;

    // FIX: Force IPv4 127.0.0.1
    let engineUrl = process.env.AI_ENGINE_URL || 'http://127.0.0.1:5000';
    if (engineUrl.includes('localhost')) {
      engineUrl = engineUrl.replace('localhost', '127.0.0.1');
    }

    let metaData: any = {};

    if (sourceId) {
      // 🌟 VECTORLESS METADATA ROUTE: Use compiled page indexes
      const metaRes = await fetch(`${engineUrl}/api/v1/knowledge/source-metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, sourceId, sourceType: type === 'knowledge-doc' ? 'file' : type })
      });

      if (!metaRes.ok) throw new Error("Vectorless Metadata generation failed on AI Engine");
      metaData = await metaRes.json();
    } else {
      // Fallback: Naive generation prior to index build
      if (!content) return res.status(400).json({ success: false, message: "Content or sourceId is required" });

      // Prepare text for AI Engine
      let textToAnalyze = "";
      if (typeof content === 'string') {
        textToAnalyze = content;
      } else {
        // For API or complex objects
        textToAnalyze = JSON.stringify(content, null, 2);
      }

      // Call Metadata Engine
      const metaRes = await fetch(`${engineUrl}/api/v1/knowledge/metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToAnalyze })
      });

      if (!metaRes.ok) throw new Error("Metadata generation failed on AI Engine");
      metaData = await metaRes.json();
    }

    res.json({
      success: true,
      data: {
        title: metaData.title || "", // LLM might suggest a title
        description: metaData.summary || "",
        intent: metaData.intent_summary || "",
        tags: metaData.tags || []
      }
    });

    // Track usage
    try {
      const usage = metaData.usage || { input: 0, output: 0 };
      await usageService.trackActivity(
        orgId,
        ActivityType.AI_CHAT,
        1,
        { input_tokens: usage.input, output_tokens: usage.output, type, action: 'auto-fill' }
      );
    } catch (e) { console.error("Tracking Failed", e); }

  } catch (error: any) {
    console.error("❌ Auto-Fill Failed:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const downloadFile = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { orgId } = req.user!;

    const doc = await KnowledgeDocument.findOne({ _id: id, orgId });
    if (!doc) return res.status(404).json({ success: false, message: "Document not found" });

    if (!doc.url) return res.status(400).json({ success: false, message: "Document has no URL" });

    // Stream from MinIO (Proxy) to avoid CORS and force download
    const axios = (await import("axios")).default;
    const response = await axios({
      url: doc.url,
      method: 'GET',
      responseType: 'stream'
    });

    // Set Headers for Download
    res.setHeader('Content-Disposition', `attachment; filename="${doc.name}"`);
    res.setHeader('Content-Type', doc.file_type || 'application/octet-stream');

    // Pipe stream
    response.data.pipe(res);

  } catch (err: any) {
    console.error("❌ Download error:", err.message);
    res.status(500).json({ success: false, message: "Download failed" });
  }
};

export const refreshKnowledgeSource = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🔄 [Refresh] Request received:', { params: req.params, user: req.user });

    const { type, sourceId } = req.params;
    const { orgId } = req.user!; // Get from authenticated user

    console.log('🔄 [Refresh] Processing:', { type, sourceId, orgId });

    // 🛡️ Check subscription status before refresh
    try {
      await usageService.checkFreshLimit(orgId, 'max_training_tokens');
      console.log('✅ [Refresh] Subscription check passed');
    } catch (limitError: any) {
      console.error('❌ [Refresh] Subscription check failed:', limitError.message);
      return res.status(403).json({ success: false, message: limitError.message });
    }

    if (type === 'file') {
      // Refresh File
      const doc = await KnowledgeDocument.findOne({ _id: sourceId, orgId });
      if (!doc) {
        console.error('❌ [Refresh] Document not found:', sourceId);
        return res.status(404).json({ success: false, message: "Document not found" });
      }

      console.log('📄 [Refresh] Found document:', doc.name);

      // Update status to processing
      doc.status = 'processing';
      await doc.save();

      // 🔥 Trigger IMMEDIATE reprocessing (HIGH PRIORITY)
      const job = await embedQueue.add("process-document", {
        orgId,
        filePath: doc.url, // Use url field (file_path doesn't exist in schema)
        fileName: doc.name,
        fileType: doc.file_type,
        siteId: null,
        metadata: {
          fileId: doc._id.toString(),
          type: 'file',
          storage: doc.url?.includes('minio') ? 'minio' : 'local',
          isRefresh: true // Mark as refresh for priority
        }
      }, {
        priority: 1, // HIGH PRIORITY - Process immediately
        removeOnComplete: true
      });

      console.log(`✅ [Refresh] File queued with HIGH priority: ${doc.name}, Job ID: ${job.id}`);

      return res.json({
        success: true,
        message: "✅ File refresh scheduled with high priority",
        document: doc
      });
    }

    if (type === 'text') {
      // Refresh Manual Text Entry
      const { ManualDocument } = await import("./models/ManualDocument.js");
      const entry = await ManualDocument.findOne({ _id: sourceId, orgId });

      if (!entry) {
        console.error('❌ [Refresh] Specific text entry not found:', sourceId);
        return res.status(404).json({ success: false, message: "Text entry not found" });
      }

      console.log('📝 [Refresh] Found text entry:', entry.title);

      // 🔥 Set status to training so UI shows it's processing
      entry.status = 'training';
      await entry.save();

      // Trigger reprocessing
      await embedQueue.add("process-document", {
        orgId,
        text: entry.content,
        title: entry.title,
        metadata: {
          fileId: entry._id.toString(),
          type: 'manual',
          isRefresh: true
        }
      }, {
        priority: 1, // HIGH PRIORITY
        removeOnComplete: true
      });

      console.log(`✅ [Refresh] Text entry queued: ${entry.title}`);

      return res.json({
        success: true,
        message: "✅ Text entry refresh scheduled",
        entry
      });
    }

    if (type === 'website') {
      // Refresh Website/Page
      const site = await Site.findOne({ _id: sourceId, orgId });
      if (!site) {
        console.error('❌ [Refresh] Website not found:', sourceId);
        return res.status(404).json({ success: false, message: "Website not found" });
      }

      console.log('🌐 [Refresh] Found website:', site.domain);

      // Set all ACTIVE pages to 'pending' status
      let activePagesCount = 0;
      site.pages.forEach((p: any) => {
        if (p.isActive !== false) {
          p.status = 'pending';
          activePagesCount++;
        }
      });
      site.status = 'crawling';
      await site.save();

      // 🔥 Trigger IMMEDIATE recrawl for ALL active pages (HIGH PRIORITY)
      const pageUrls = site.pages
        .filter((p: any) => p.isActive !== false)
        .map((p: any) => p.url);

      let jobsCreated = 0;
      for (const pageUrl of pageUrls) {
        await crawlQueue.add(
          "crawl-page",
          {
            orgId: orgId.toString(),
            siteId: sourceId,
            urls: [pageUrl],
            startUrl: pageUrl
          },
          {
            priority: 1, // HIGH PRIORITY - Process immediately
            removeOnComplete: true
          }
        );
        jobsCreated++;
      }

      console.log(`✅ [Refresh] Website queued with HIGH priority: ${site.domain}, ${jobsCreated} jobs created`);

      return res.json({
        success: true,
        message: `✅ Website refresh scheduled with high priority (${jobsCreated} pages)`,
        site
      });
    }

    console.error('❌ [Refresh] Invalid source type:', type);
    return res.status(400).json({ success: false, message: "Invalid source type for refresh" });

  } catch (err: any) {
    console.error("❌ [Refresh] Unexpected error:", err);
    console.error("❌ [Refresh] Stack trace:", err.stack);
    res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

export const getChatHistory = async (req: Request, res: Response) => {
  res.json({ success: true, history: [] });
};

export const getBrainAnalytics = async (req: Request, res: Response) => {
  res.json({ success: true, analytics: {} });
};

// --- RESTORED PERSISTENCE LOGIC ---

// 📤 Upload Document (File)
export const uploadDocument = async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file;
    const { orgId } = req.user!;
    const { title, description, intent_summary, tags, skipTrain } = req.body;

    const parsedTags = tags ? JSON.parse(tags) : [];
    const isDraft = skipTrain === 'true' || skipTrain === true;

    // 🛡️ Limit Check: Files
    await usageService.checkFreshLimit(orgId, 'max_files');
    // 🛡️ Limit Check: Storage Capacity
    await usageService.checkFreshLimit(orgId, 'max_training_tokens');

    if (!file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // 🔥 FIX: Filename Encoding (Hindi/Unicode Support)
    // Multer often interprets non-ASCII chars as latin1. We fix this by converting back to utf8.
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');

    // 1. Upload to MinIO (Deep Research Storage)
    const { uploadFile } = await import("../../shared/services/storage.service.js"); // Dynamic import (Corrected Path)
    const minioUrl = await uploadFile(file);
    console.log(`✅ [Upload] File stored in MinIO: ${minioUrl}`);

    // 2. Create KnowledgeDocument Entry
    const newDoc = await KnowledgeDocument.create({
      orgId,
      name: title || file.originalname,
      url: minioUrl,         // Use MinIO URL
      file_path: minioUrl,   // Use MinIO URL
      file_type: file.mimetype,
      size: file.size,
      status: isDraft ? 'draft' : 'processing',
      tags: parsedTags,
      summary: description,
      intent_summary: intent_summary,
      uploadedAt: new Date(),
      metadata: {
        source: 'minio-upload',
        bucket: 'cluaiz-storage'
      }
    });

    // 3. Track Storage Usage (both category and system)
    const { updateStorageBreakdown, updateSystemStorage } = await import("./storage.helper.js");
    const fileSizeMB = file.size / (1024 * 1024); // Convert bytes to MB
    await updateStorageBreakdown(orgId, 'documents', fileSizeMB, 'add');
    await updateSystemStorage(orgId, 'minio', fileSizeMB, 'add'); // Track MinIO storage

    // 4. Trigger Embed Worker (Pass MinIO URL)
    if (!isDraft) {
      await embedQueue.add("process-document", {
        orgId,
        filePath: minioUrl,
        fileName: file.originalname,
        fileType: file.mimetype,
        siteId: null,
        metadata: {
          fileId: newDoc._id.toString(),
          type: 'file',
          storage: 'minio'
        }
      }, { removeOnComplete: true });
      console.log(`✅ [KnowledgeController] File Queued (Job ID pending). Processing offloaded to Worker.`);
    } else {
      console.log(`✅ [KnowledgeController] File saved as Draft. Skipping embedding to save tokens.`);
    }

    // 5. Update Status
    if (!isDraft) {
      newDoc.status = 'processing';
      await newDoc.save();
    }

    // 🛑 NO TOKEN CALCULATION HERE.
    // User Request: "Don't put load on Node.js locally. Let Python/Worker handle it."
    // Token Usage will be updated by the Embed Worker asynchronously.

    res.json({
      success: true,
      message: 'File processing started',
      data: newDoc
    });
  } catch (error: any) {
    console.error('Error in uploadDocument:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};

// 🔍 Preview API Source
export const previewApiSource = async (req: AuthRequest, res: Response) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, message: "URL is required" });

    // Fetch with timeout
    try {
      const response = await import("axios").then(a => a.default.get(url, {
        timeout: 5000,
        headers: { 'Accept': 'application/json' }
      }));

      const data = response.data;
      if (typeof data !== 'object') {
        return res.status(400).json({ success: false, message: "Response is not valid JSON" });
      }

      // Create a preview snippet (max 3 items if array, or full object if small)
      let preview = data;
      if (Array.isArray(data)) {
        preview = data.slice(0, 3);
        if (data.length > 3) (preview as any).push({ "...": `${data.length - 3} more items` });
      }

      return res.json({ success: true, preview, totalSize: JSON.stringify(data).length });

    } catch (e: any) {
      return res.status(400).json({ success: false, message: `Connection Failed: ${e.message}` });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🧠 Helper: Generate AI Metadata & Burn Tokens
const generateAiMetadata = async (text: string, orgId: string, defaultTags: string[] = [], defaultSummary: string = "") => {
  try {
    const axios = (await import("axios")).default;
    const engineUrl = process.env.AI_ENGINE_URL || 'http://127.0.0.1:5000';

    // Call AI Engine
    const aiResponse = await axios.post(
      `${engineUrl}/api/v1/knowledge/metadata`,
      { text: text.substring(0, 3000) },
      { timeout: 30000 }
    );

    const data = aiResponse.data || {};
    const usage = data.usage || { input: 0, output: 0 };

    // 🔥 BURN TOKENS (Precise)
    if (usage.input > 0 || usage.output > 0) {
      await usageService.trackActivity(
        orgId,
        ActivityType.AI_CHAT, // Use helper generic or specific type? BRAIN_CRAWL fits better logically but AI_CHAT has input/output mapping
        1, // Count is 1
        {
          input_tokens: usage.input,
          output_tokens: usage.output,
          action: 'auto-metadata'
        }
      );
      console.log(`🔥 [Auto-Meta] Burned ${usage.input} In / ${usage.output} Out Tokens`);
    }

    return {
      tags: (data.tags && data.tags.length > 0) ? data.tags : defaultTags,
      intent_summary: data.intent_summary || defaultSummary || "",
      summary: data.summary || ""
    };

  } catch (error: any) {
    console.warn("⚠️ AI metadata generation failed:", error.message);
    return { tags: defaultTags, intent_summary: defaultSummary, summary: "" };
  }
};

// 🌐 Add API Source (JSON) - Supports One-Time & Real-Time
export const addApiSource = async (req: AuthRequest, res: Response) => {
  try {
    const {
      url, title, description, tags, intent_summary, category, skipTrain,
      method = 'GET', authType = 'none', headers, bodyTemplate, searchParam,
      syncMode = 'real-time'
    } = req.body;

    const { orgId } = req.user!;
    const isDraft = skipTrain === 'true' || skipTrain === true;

    // 🛡️ Input Validation
    const validation = validateKnowledgeInput({ title, description, intent_summary, tags });
    if (!validation.success) {
      return res.status(400).json({ success: validation.success, message: validation.message });
    }

    // 🛡️ Limit Check: Files
    await usageService.checkFreshLimit(orgId, 'max_files');

    if (!url) {
      return res.status(400).json({ success: false, message: "API URL is required" });
    }

    console.log(`🌐 [API Source] Mode: ${syncMode}, URL: ${url}`);

    // 1. Validate API Endpoint (If not draft)
    let apiData = null;
    let jsonContent = "";

    if (!isDraft) {
      try {
        const fetchConfig: any = {
          timeout: 10000,
          method: method,
          headers: { 'Accept': 'application/json' }
        };

        // Parse user-provided headers array into an object
        if (headers && Array.isArray(headers)) {
          headers.forEach((h: any) => {
            if (h.key && h.value) fetchConfig.headers[h.key] = h.value;
          });
        }

        if (method === 'POST' && bodyTemplate) {
          try {
            fetchConfig.data = JSON.parse(bodyTemplate);
          } catch (e) {
            // If it's a dynamic template string (ejs, etc.), just send as is for preview
            fetchConfig.data = bodyTemplate;
          }
        }

        const response = await import("axios").then(a => a.default(url, fetchConfig));
        apiData = response.data;
      } catch (fetchError: any) {
        console.warn(`⚠️ [API Source] Failed to preview API: ${fetchError.message}. Proceeding anyway since it's an API config validation.`);
        // Allow it even if preview fails (Some APIs require dynamic user params)
        //  return res.status(400).json({ success: false, message: `Failed to fetch API: ${fetchError.message}` });
      }

      if (apiData) {
        jsonContent = typeof apiData === 'object' ? JSON.stringify(apiData, null, 2) : String(apiData);
      }
    }

    // 🧠 AUTO-METADATA (If missing & Not draft with data)
    let finalTags = tags || [];
    let finalDescription = description || "";
    let finalIntent = intent_summary || description || "";

    if (!isDraft && jsonContent && (!description || !tags || tags.length === 0)) {
      console.log("🧠 [API Source] Auto-generating metadata...");
      const aiMeta = await generateAiMetadata(jsonContent, orgId, tags, description);
      finalTags = aiMeta.tags;
      finalDescription = description || aiMeta.summary; // Keep user desc if provided
      finalIntent = aiMeta.intent_summary;
    }

    // 3. Branch based on syncMode
    if (syncMode === 'one-time' && !isDraft) {
      // ONE-TIME: Save as static JSON file
      const fileName = url.split('/').pop() || 'api-data.json';
      const finalName = fileName.endsWith('.json') ? fileName : `${fileName}.json`;

      const EMBEDDING_TOKEN_COST = Math.ceil(jsonContent.length / 4);

      const newDoc = await KnowledgeDocument.create({
        orgId,
        name: finalDescription ? `${finalDescription}.json` : finalName,
        url: url,
        file_path: "api://remote",
        file_type: "json",
        size: jsonContent.length,
        status: 'processing',
        tags: finalTags,
        intent_summary: finalIntent,
        token_count: EMBEDDING_TOKEN_COST,
        metadata: { source: 'api-import', originalUrl: url, description: finalDescription, syncMode: 'one-time' },
        uploadedAt: new Date()
      });

      await embedQueue.add("process-document", {
        orgId,
        text: jsonContent,
        title: finalName,
        fileName: finalName,
        fileType: "application/json",
        siteId: null,
        metadata: {
          fileId: newDoc._id.toString(),
          type: 'file',
          source: 'api',
        }
      }, { removeOnComplete: true });

      return res.json({
        success: true,
        message: "✅ API Source saved as JSON file!",
        document: newDoc,
        mode: 'one-time'
      });
    }

    // REAL-TIME or Draft: Create ApiSource configuration
    const { ApiSource } = await import("./models/ApiSource.js");

    // Convert array headers to Map for MongoDB schema
    const headersMap = new Map();
    if (headers && Array.isArray(headers)) {
      headers.forEach((h: any) => {
        if (h.key && h.value) headersMap.set(h.key, h.value);
      });
    }

    const apiSource = await ApiSource.create({
      orgId,
      name: title || finalDescription || `API: ${url.split('/').pop()}`,
      endpoint: url,
      method: method || 'GET',
      authType: authType || 'none',
      authCredentials: { headers: headersMap },
      requestConfig: {
        searchParam: searchParam || 'q',
        bodyTemplate: bodyTemplate
      },
      fieldMapping: new Map(),
      syncMode: syncMode || 'real-time',
      cacheConfig: { enabled: true, ttlMinutes: 5 },
      tags: finalTags,
      intent_summary: finalIntent,
      summary: finalDescription,
      category: category || 'other',
      isActive: !isDraft  // 🔥 Draft = isActive: false
    });

    return res.json({
      success: true,
      message: isDraft ? "✅ API Source saved as Draft!" : "✅ Real-Time API Source created! Configure field mapping in settings.",
      apiSource: {
        id: apiSource._id,
        name: apiSource.name,
        endpoint: apiSource.endpoint,
        syncMode: apiSource.syncMode,
        tags: finalTags,
        intent: finalIntent,
        isActive: apiSource.isActive
      },
      mode: isDraft ? 'draft' : 'real-time'
    });

  } catch (err: any) {
    console.error("❌ API Source error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🚀 Train Now - Promote a Draft to Active (Triggers Embedding/Crawling)
export const trainNow = async (req: AuthRequest, res: Response) => {
  try {
    const { type, sourceId } = req.params;
    const { orgId } = req.user!;

    await usageService.checkFreshLimit(orgId, 'max_training_tokens');

    console.log(`🚀 [TrainNow] Promoting ${type}/${sourceId} from Draft to Active`);

    if (type === 'file') {
      const doc = await KnowledgeDocument.findOne({ _id: sourceId, orgId });
      if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
      if (doc.status !== 'draft') return res.status(400).json({ success: false, message: "Source is not in draft state" });

      doc.status = 'processing';
      await doc.save();

      await embedQueue.add("process-document", {
        orgId,
        filePath: doc.url,
        fileName: doc.name,
        fileType: doc.file_type,
        siteId: null,
        metadata: { fileId: doc._id.toString(), type: 'file', storage: 'minio' }
      }, { priority: 1, removeOnComplete: true });

      return res.json({ success: true, message: "✅ File training started!", document: doc });
    }

    else if (type === 'text') {
      const brain = await Brain.findOne({ orgId });
      if (!brain?.knowledge_base?.custom_text) return res.status(404).json({ success: false, message: "Brain not found" });

      const entry = brain.knowledge_base.custom_text.id(sourceId) as any;
      if (!entry) return res.status(404).json({ success: false, message: "Entry not found" });
      if (entry.status !== 'draft') return res.status(400).json({ success: false, message: "Entry is not in draft state" });

      entry.status = 'training';
      entry.isActive = true;
      await brain.save();

      // Convert stored HTML to Markdown for AI
      const markdownForAI = turndownService.turndown(entry.content || "");

      await embedQueue.add("process-document", {
        orgId,
        text: markdownForAI,
        title: entry.title,
        metadata: { fileId: entry._id.toString(), type: 'manual' }
      }, { priority: 1, removeOnComplete: true });

      return res.json({ success: true, message: "✅ Manual entry training started!", entry });
    }

    else if (type === 'website') {
      const site = await Site.findOne({ _id: sourceId, orgId });
      if (!site) return res.status(404).json({ success: false, message: "Site not found" });
      if (site.status !== 'draft') return res.status(400).json({ success: false, message: "Site is not in draft state" });

      site.pages.forEach((p: any) => { p.status = 'pending'; });
      site.status = 'crawling';
      await site.save();

      await scheduleCrawl(site._id.toString(), site.crawl_schedule);
      await crawlQueue.add("crawl-site", {
        orgId,
        siteId: site._id.toString(),
        startUrl: site.domain
      }, { priority: 1, removeOnComplete: true });

      return res.json({ success: true, message: "✅ Website crawl started!", site });
    }

    else if (type === 'api') {
      const { ApiSource } = await import("./models/ApiSource.js");
      const apiSource = await ApiSource.findOne({ _id: sourceId, orgId });
      if (!apiSource) return res.status(404).json({ success: false, message: "API Source not found" });

      // API Sources don't embed — they simply activate
      apiSource.isActive = true;
      await apiSource.save();

      return res.json({ success: true, message: "✅ API Source is now active!", apiSource });
    }

    return res.status(400).json({ success: false, message: `Invalid type: ${type}` });

  } catch (err: any) {
    console.error("❌ [TrainNow] Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🔄 Update API Source
export const updateApiSource = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { url, description, tags, syncMode, method, authType, authCredentials, requestConfig, fieldMapping } = req.body;
    const { orgId } = req.user!;

    if (!id) return res.status(400).json({ success: false, message: "ID is required" });

    // Dynamic import to avoid circular dep issues
    const { ApiSource } = await import("./models/ApiSource.js");
    const { encryptCredential } = await import("../../shared/utils/encryption.js");

    const apiSource = await ApiSource.findOne({ _id: id, orgId });
    if (!apiSource) return res.status(404).json({ success: false, message: "API Source not found" });

    // Update basic fields
    if (url) apiSource.endpoint = url;
    if (description) apiSource.name = description;
    if (tags) apiSource.tags = tags;
    if (syncMode) apiSource.syncMode = syncMode;

    // Update Advanced Config
    if (method) apiSource.method = method;
    if (authType) apiSource.authType = authType;
    if (requestConfig) apiSource.requestConfig = { ...apiSource.requestConfig, ...requestConfig };
    if (fieldMapping) apiSource.fieldMapping = fieldMapping; // Mongoose Map handling

    // Handle Auth Credentials Update
    if (authType && authType !== 'none' && authCredentials) {
      // Only update if credentials provided
      if (authType === 'api-key') {
        if (authCredentials.apiKey) apiSource.authCredentials = { apiKey: await encryptCredential(authCredentials.apiKey), headerName: authCredentials.headerName || 'X-API-Key' };
      } else if (authType === 'bearer') {
        if (authCredentials.token) apiSource.authCredentials = { token: await encryptCredential(authCredentials.token) };
      } else if (authType === 'basic') {
        if (authCredentials.username) apiSource.authCredentials = { username: authCredentials.username }; // Username plain
        if (authCredentials.password) apiSource.authCredentials = { ...apiSource.authCredentials, password: await encryptCredential(authCredentials.password) };
      }
    }

    apiSource.updatedAt = new Date();
    await apiSource.save();

    res.json({
      success: true,
      message: "✅ API Source updated successfully",
      apiSource: {
        id: apiSource._id,
        name: apiSource.name,
        endpoint: apiSource.endpoint,
        syncMode: apiSource.syncMode
      }
    });

  } catch (err: any) {
    console.error("❌ Update API Source error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


// ✍️ Add Manual Knowledge (Text)
export const addManualKnowledge = async (req: AuthRequest, res: Response) => {
  try {
    const { title, name, label, header, content, tags, intent_summary, priority, skipTrain, description } = req.body;
    console.log(`✍️ [AddManual] Payload:`, JSON.stringify(req.body, null, 2));

    const finalTitle = title || name || label || header;
    const { orgId } = req.user!;
    const isDraft = skipTrain === 'true' || skipTrain === true;

    if (!finalTitle || !content) {
      return res.status(400).json({ success: false, message: "Title and Content are required" });
    }

    // 🛡️ Input Validation
    const validation = validateKnowledgeInput({ title: finalTitle, content, tags, intent_summary });
    if (!validation.success) {
      return res.status(400).json({ success: validation.success, message: validation.message });
    }

    // 🛡️ Limit Check: Manual QA
    await usageService.checkFreshLimit(orgId, 'max_manual_qa');

    const { ManualDocument } = await import("./models/ManualDocument.js");

    const manualEntry = await ManualDocument.create({
      orgId,
      title: finalTitle,
      description: description || "",
      content: content,
      tags: tags || [],
      intent_summary: intent_summary || "",
      priority: priority || "high",
      isActive: !isDraft,
      status: isDraft ? 'draft' : 'training',
      last_updated: new Date()
    });

    // 2. Trigger Embed Worker
    if (!isDraft) {
      const markdownForAI = turndownService.turndown(content);
      await embedQueue.add("process-document", {
        orgId,
        text: markdownForAI, // AI layer sees Markdown
        title: finalTitle,
        metadata: {
          fileId: manualEntry._id.toString(),
          type: 'manual'
        }
      }, { removeOnComplete: true });
    } else {
      console.log(`✅ [KnowledgeController] Manual Entry saved as Draft. Skipping embedding.`);
    }

    res.json({
      success: true,
      message: isDraft ? "✅ Manual entry saved as draft" : "✅ Manual entry added and queued",
      entry: manualEntry
    });

    // Track Activity (Manual Training)
    if (!isDraft) {
      try {
        // Estimate tokens: ~1 token per 4 characters
        const estimatedTokens = Math.ceil(content.length / 4);

        await usageService.trackActivity(
          orgId,
          ActivityType.MANUAL_TRAINING,
          estimatedTokens,
          { entryId: newEntry._id, title, contentLength: content.length }
        );
      } catch (e) { console.error("Tracking Failed", e); }
    }

  } catch (err: any) {
    console.error("❌ Manual Entry error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateManualKnowledge = async (req: AuthRequest, res: Response) => {
  try {
    const { orgId, sourceId } = req.params;
    const { title, name, label, header, content, tags, intent_summary, priority } = req.body;
    console.log(` [UpdateManual] Source: ${sourceId}, Payload:`, JSON.stringify(req.body, null, 2));

    const finalTitle = title || name || label || header;
    console.log(`📝 [UpdateManual] Org: ${orgId}, Source: ${sourceId}`);

    // 🛡️ Input Validation
    const validation = validateKnowledgeInput({ title: finalTitle, content, tags, intent_summary });
    if (!validation.success) {
      return res.status(400).json({ success: validation.success, message: validation.message });
    }

    const { ManualDocument } = await import("./models/ManualDocument.js");
    const manualEntry = await ManualDocument.findOne({ _id: sourceId, orgId });

    if (!manualEntry) {
      console.warn(`❌ [UpdateManual] Entry NOT found: ${sourceId}`);
      return res.status(404).json({ success: false, message: "Entry not found" });
    }

    if (finalTitle) manualEntry.title = finalTitle;
    if (content) manualEntry.content = content;
    if (tags) manualEntry.tags = tags;
    if (intent_summary !== undefined) manualEntry.intent_summary = intent_summary;
    if (priority) manualEntry.priority = priority;

    manualEntry.status = 'training';
    manualEntry.last_updated = new Date();
    await manualEntry.save();

    // Trigger re-embedding
    const markdownForAI = turndownService.turndown(manualEntry.content || "");
    await embedQueue.add("process-document", {
      orgId,
      text: markdownForAI, // AI layer sees Markdown
      title: manualEntry.title,
      metadata: {
        fileId: manualEntry._id.toString(),
        type: 'manual',
        isRefresh: true
      }
    }, { removeOnComplete: true });

    res.json({ success: true, message: "Manual knowledge updated", entry: manualEntry });
  } catch (err: any) {
    console.error("❌ Update Manual error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


// 🕷️ Trigger Page Crawl
export const triggerPageCrawl = async (req: AuthRequest, res: Response) => {
  try {
    const { siteId, pageId } = req.params;
    const { orgId } = req.user!;

    const site = await Site.findOne({ _id: siteId, orgId });
    if (!site) return res.status(404).json({ success: false, message: "Site not found" });

    const page = site.pages.id(pageId);
    if (!page) return res.status(404).json({ success: false, message: "Page not found" });

    // 1. Update Status
    page.status = 'pending';
    await site.save();

    // 2. Trigger Crawl Worker
    await crawlQueue.add("crawl-page", {
      orgId,
      siteId,
      urls: [page.url], // Single URL
      startUrl: page.url
    }, { removeOnComplete: true });

    res.json({ success: true, message: `✅ Crawl triggered for ${page.url}`, page });

  } catch (err: any) {
    console.error("❌ Trigger Crawl error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🔍 Get Single Source Detail (Unified)
export const getSourceDetail = async (req: AuthRequest, res: Response) => {
  try {
    const { type, sourceId } = req.params;
    const { orgId } = req.user!;
    const { PageIndex } = require('./models/PageIndex'); // Lazy load to avoid circular deps if any

    let data: any = null;
    let pageIndexes: any[] = [];

    switch (type) {
      case 'website':
        data = await Site.findOne({ _id: sourceId, orgId }).lean();
        if (data) {
          pageIndexes = await PageIndex.find({ sourceId, orgId }).lean();
        }
        break;
      case 'file':
        data = await KnowledgeDocument.findOne({ _id: sourceId, orgId }).lean();
        if (data) {
          pageIndexes = await PageIndex.find({ sourceId, orgId }).lean();
        }
        break;
      case 'api':
        const { ApiSource } = require('./models/ApiSource');
        data = await ApiSource.findOne({ _id: sourceId, orgId }).lean();
        if (data) {
          pageIndexes = await PageIndex.find({ sourceId, orgId }).lean();
        }
        break;
      case 'text':
      case 'manual':
        const { ManualDocument } = require('./models/ManualDocument.js');
        data = await ManualDocument.findOne({ orgId, _id: sourceId }).lean();
        // Manual Docs store their page_index inline on the document itself
        break;
      default:
        return res.status(400).json({ success: false, message: "Invalid source type" });
    }

    if (!data) return res.status(404).json({ success: false, message: "Source not found" });

    res.json({
      success: true,
      data,
      type,
      pageIndexes // 🔥 Returns the separate scalable YAML trees
    });

  } catch (err: any) {
    console.error("❌ Get Source Detail error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
