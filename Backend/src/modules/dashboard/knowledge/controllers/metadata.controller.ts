import { Response } from 'express';
import { AuthRequest } from "@shared/middlewares/auth.js";
import { Brain } from "@modules/dashboard/brain/models/Brain.js";
import { Site } from "@modules/dashboard/knowledge/models/Site.js";
import { KnowledgeDocument } from "@modules/dashboard/knowledge/models/KnowledgeDocument.js";
import { validateKnowledgeInput } from "@modules/shared/utils/validation.js";
import { embedQueue, crawlQueue } from "../../../../jobs/queues.js";
import { usageService } from "../../../../services/usage.service.js";
import { scheduleCrawl } from "../../../../jobs/scheduler.js";
import { ActivityType } from "../../../../models/ActivityLog.js";
import TurndownService from "turndown";
const turndownService = new TurndownService({ headingStyle: 'atx' });

const getEngineUrl = () => {
  let url = process.env.AI_ENGINE_URL || 'http://127.0.0.1:5000';
  return url.includes('localhost') ? url.replace('localhost', '127.0.0.1') : url;
};

// ✅ updateSourceMetadata — with findIndex BUG FIX
export const updateSourceMetadata = async (req: AuthRequest, res: Response) => {
  try {
    const { orgId, type, sourceId } = req.params;
    const { title, name, label, header, description, tags, intent_summary, priority, content, url, method, authType, headers, bodyTemplate, searchParam, contextHints, category, skipTrain } = req.body;

    console.log(`📝 [UpdateSource] Org: ${orgId}, Type: ${type}, Source: ${sourceId}`);

    const finalTitle = title || name || label || header;

    const validation = validateKnowledgeInput({ title: finalTitle, description, intent_summary, tags, content });
    if (!validation.success) return res.status(400).json({ success: false, message: validation.message });

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

      if (req.file) {
        const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
        const filename = `${Date.now()}-${req.file.originalname}`;
        const s3 = new S3Client({ region: 'us-east-1', endpoint: process.env.MINIO_ENDPOINT || 'http://127.0.0.1:9000', credentials: { accessKeyId: process.env.MINIO_ROOT_USER || 'admin', secretAccessKey: process.env.MINIO_ROOT_PASSWORD || 'password123' }, forcePathStyle: true });
        const BUCKET = 'cluaiz-storage';
        await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: filename, Body: req.file.buffer, ContentType: req.file.mimetype }));
        const fileUrl = `${process.env.MINIO_ENDPOINT || 'http://127.0.0.1:9000'}/${BUCKET}/${filename}`;
        doc.url = fileUrl; doc.file_path = filename; doc.type = req.file.mimetype; doc.status = 'training';
      }

      if (finalTitle) doc.name = finalTitle;
      if (description) doc.summary = description;
      if (intent_summary !== undefined) doc.intent_summary = intent_summary;
      if (tags) doc.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      await doc.save();

      if (req.file) {
        await embedQueue.add("process-document", { orgId, fileName: doc.name, filePath: doc.url, metadata: { fileId: doc._id.toString(), type: 'file', isRefresh: true } }, { removeOnComplete: true });
      }
    }

    else if (type === 'api') {
      const { ApiSource } = await import("../models/ApiSource.js");
      const apiSource = await ApiSource.findOne({ _id: sourceId, orgId });
      if (!apiSource) return res.status(404).json({ success: false, message: "API Source not found" });
      if (url) apiSource.endpoint = url;
      if (finalTitle) apiSource.name = finalTitle;
      if (description) apiSource.summary = description;
      if (method) apiSource.method = method as any;
      if (authType) apiSource.authType = authType;
      if (headers) { if (!apiSource.authCredentials) apiSource.authCredentials = {} as any; (apiSource.authCredentials as any).headers = headers; }
      if (bodyTemplate) { if (!apiSource.requestConfig) apiSource.requestConfig = {} as any; apiSource.requestConfig.bodyTemplate = bodyTemplate; }
      if (searchParam) { if (!apiSource.requestConfig) apiSource.requestConfig = {} as any; apiSource.requestConfig.searchParam = searchParam; }
      if (category) apiSource.category = category;
      if (tags) apiSource.tags = tags;
      if (intent_summary !== undefined) apiSource.intent_summary = intent_summary;
      await apiSource.save();
    }

    // ✅ BUG FIX: type === 'text' now uses ManualDocument (NOT brain.knowledge_base.custom_text.findIndex)
    else if (type === 'text' || type === 'manual') {
      const { ManualDocument } = await import("../models/ManualDocument.js");

      // 1. Try ManualDocument first (current architecture)
      let entry: any = await ManualDocument.findOne({ _id: sourceId, orgId });

      // 2. Fallback: legacy brain.knowledge_base.custom_text (for old data)
      if (!entry) {
        const brain = await Brain.findOne({ orgId });
        const arr: any[] = (brain?.knowledge_base as any)?.custom_text as any[] ?? [];
        const idx = arr.findIndex((e: any) => e._id?.toString() === sourceId);
        if (idx === -1) return res.status(404).json({ success: false, message: "Entry not found in ManualDocument or Brain" });
        // Migrate: update in brain still (old data path)
        const updateFields: any = {};
        if (finalTitle) updateFields[`knowledge_base.custom_text.${idx}.title`] = finalTitle;
        if (content) updateFields[`knowledge_base.custom_text.${idx}.content`] = content;
        if (description) updateFields[`knowledge_base.custom_text.${idx}.description`] = description;
        if (tags) updateFields[`knowledge_base.custom_text.${idx}.tags`] = tags;
        if (intent_summary !== undefined) updateFields[`knowledge_base.custom_text.${idx}.intent_summary`] = intent_summary;
        updateFields[`knowledge_base.custom_text.${idx}.last_updated`] = new Date();
        await Brain.updateOne({ orgId }, { $set: updateFields });
        return res.json({ success: true, message: "✅ Legacy entry updated" });
      }

      // New ManualDocument path
      const contentChanged = content && content !== entry.content;

      const newTitle = finalTitle;
      if (newTitle) entry.title = newTitle;
      if (content) entry.content = content;
      if (description) entry.description = description;
      if (tags) entry.tags = tags;
      if (intent_summary !== undefined) entry.intent_summary = intent_summary;
      if (priority) entry.priority = priority;

      // User strict directive: NEVER auto-train on Save/Update. Only the Train UI button will do it.
      // If content changed, we downgrade status to 'draft' so the user can manually train it via the SourceCard.
      if (contentChanged) {
        entry.status = 'draft';
      }
      
      await entry.save();
      return res.json({ success: true, message: "✅ Content saved. Use 'Train AI' on the card to index." });
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

// 🗑️ Delete Source
export const deleteKnowledgeSource = async (req: AuthRequest, res: Response) => {
  try {
    const { orgId, type, sourceId } = req.params;

    if (type === 'file') {
      const doc = await KnowledgeDocument.findOne({ _id: sourceId, orgId });
      if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
      if (doc.size) { const { updateStorageBreakdown, updateSystemStorage } = await import("../storage.helper.js"); const fileSizeMB = doc.size / (1024 * 1024); await updateStorageBreakdown(orgId, 'documents', fileSizeMB, 'subtract'); await updateSystemStorage(orgId, 'minio', fileSizeMB, 'subtract'); }
      if (doc.url && (doc.url.startsWith('http') || doc.url.startsWith('s3'))) { try { const { deleteFile } = await import("../../../shared/services/storage.service.js"); await deleteFile(doc.url); } catch (e) { } }
      try { const axios = (await import('axios')).default; await axios.delete(`${process.env.AI_ENGINE_URL || 'http://127.0.0.1:5000'}/api/v1/knowledge/vectors`, { data: { orgId, filter: { source_id: sourceId } } }); } catch (e: any) { console.error("❌ Vector cleanup failed:", e.message); }
      await KnowledgeDocument.deleteOne({ _id: sourceId, orgId });
      return res.json({ success: true, message: "✅ File & Storage deleted" });
    }

    if (type === 'website') {
      const site = await Site.findOneAndDelete({ _id: sourceId, orgId });
      if (!site) return res.status(404).json({ success: false, message: "Site not found" });
      try { const { PageIndex } = await import("../models/PageIndex.js"); await PageIndex.deleteOne({ sourceId }); } catch (e) { }
      try { const { cancelScheduledCrawl } = await import("../../../../jobs/scheduler.js"); await cancelScheduledCrawl(sourceId); } catch (e) { }
      try { const axios = (await import('axios')).default; await axios.delete(`${process.env.AI_ENGINE_URL || 'http://127.0.0.1:5000'}/api/v1/knowledge/vectors`, { data: { orgId, filter: { siteId: sourceId } } }); } catch (e: any) { }
      return res.json({ success: true, message: "✅ Website & Neural Index deleted" });
    }

    if (type === 'text' || type === 'manual') {
      const { ManualDocument } = await import("../models/ManualDocument.js");
      const deleted = await ManualDocument.findOneAndDelete({ _id: sourceId, orgId });
      if (!deleted) return res.status(404).json({ success: false, message: "Entry not found" });
      try { const axios = (await import('axios')).default; await axios.delete(`${process.env.AI_ENGINE_URL || 'http://127.0.0.1:5000'}/api/v1/knowledge/vectors`, { data: { orgId, filter: { source_id: sourceId } } }); } catch (e: any) { }
      return res.json({ success: true, message: "✅ Text entry deleted" });
    }

    if (type === 'api') {
      const { ApiSource } = await import("../models/ApiSource.js");
      const deleted = await ApiSource.findOneAndDelete({ _id: sourceId, orgId });
      if (!deleted) return res.status(404).json({ success: false, message: "API Source not found" });
      return res.json({ success: true, message: "✅ API Source deleted" });
    }

    return res.status(400).json({ success: false, message: "Invalid source type" });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

// Toggle
export const toggleKnowledgeSource = async (req: AuthRequest, res: Response) => {
  try {
    const { orgId, type, sourceId } = req.params;
    if (type === 'text' || type === 'manual') {
      const { ManualDocument } = await import("../models/ManualDocument.js");
      const entry = await ManualDocument.findOne({ _id: sourceId, orgId });
      if (!entry) return res.status(404).json({ success: false, message: "Entry not found" });
      entry.isActive = !entry.isActive;
      await entry.save();
      return res.json({ success: true, message: `✅ Entry ${entry.isActive ? 'activated' : 'deactivated'}`, isActive: entry.isActive });
    }
    res.json({ success: true, message: "Toggle supported for Manual Docs only." });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

// Refresh
export const refreshKnowledgeSource = async (req: AuthRequest, res: Response) => {
  try {
    const { type, sourceId } = req.params;
    const { orgId } = req.user!;

    try { await usageService.checkFreshLimit(orgId, 'max_training_tokens'); } catch (limitError: any) { return res.status(403).json({ success: false, message: limitError.message }); }

    if (type === 'file') {
      const doc = await KnowledgeDocument.findOne({ _id: sourceId, orgId });
      if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
      doc.status = 'processing'; await doc.save();
      await embedQueue.add("process-document", { orgId, filePath: doc.url, fileName: doc.name, fileType: doc.file_type, siteId: null, metadata: { fileId: doc._id.toString(), type: 'file', storage: doc.url?.includes('minio') ? 'minio' : 'local', isRefresh: true } }, { priority: 1, removeOnComplete: true });
      return res.json({ success: true, message: "✅ File refresh scheduled", document: doc });
    }

    if (type === 'text') {
      const { ManualDocument } = await import("../models/ManualDocument.js");
      const entry = await ManualDocument.findOne({ _id: sourceId, orgId });
      if (!entry) return res.status(404).json({ success: false, message: "Text entry not found" });
      entry.status = 'training'; await entry.save();
      await embedQueue.add("process-document", { orgId, text: entry.content, title: entry.title, metadata: { fileId: entry._id.toString(), type: 'manual', isRefresh: true } }, { priority: 1, removeOnComplete: true });
      return res.json({ success: true, message: "✅ Text entry refresh scheduled", entry });
    }

    if (type === 'website') {
      const site = await Site.findOne({ _id: sourceId, orgId });
      if (!site) return res.status(404).json({ success: false, message: "Website not found" });
      site.pages.forEach((p: any) => { if (p.isActive !== false) p.status = 'pending'; });
      site.status = 'crawling'; await site.save();
      const pageUrls = site.pages.filter((p: any) => p.isActive !== false).map((p: any) => p.url);
      for (const pageUrl of pageUrls) await crawlQueue.add("crawl-page", { orgId: orgId.toString(), siteId: sourceId, urls: [pageUrl], startUrl: pageUrl }, { priority: 1, removeOnComplete: true });
      return res.json({ success: true, message: `✅ Website refresh scheduled (${pageUrls.length} pages)`, site });
    }

    return res.status(400).json({ success: false, message: "Invalid source type for refresh" });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

// AutoFill
export const autoFillMetadata = async (req: AuthRequest, res: Response) => {
  try {
    const { content, type, sourceId } = req.body;
    const { orgId } = req.user!;
    let metaData: any = {};

    if (sourceId) {
      const metaRes = await fetch(`${getEngineUrl()}/api/v1/knowledge/source-metadata`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orgId, sourceId, sourceType: type === 'knowledge-doc' ? 'file' : type }) });
      if (!metaRes.ok) throw new Error("Vectorless Metadata generation failed on AI Engine");
      metaData = await metaRes.json();
    } else {
      if (!content) return res.status(400).json({ success: false, message: "Content or sourceId is required" });
      const textToAnalyze = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
      const metaRes = await fetch(`${getEngineUrl()}/api/v1/knowledge/metadata`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: textToAnalyze }) });
      if (!metaRes.ok) throw new Error("Metadata generation failed on AI Engine");
      metaData = await metaRes.json();
    }

    res.json({ success: true, data: { title: metaData.title || "", description: metaData.summary || "", intent: metaData.intent_summary || "", tags: metaData.tags || [] } });
    try { const usage = metaData.usage || { input: 0, output: 0 }; await usageService.trackActivity(orgId, ActivityType.AI_CHAT, 1, { input_tokens: usage.input, output_tokens: usage.output, type, action: 'auto-fill' }); } catch (e) { }
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
};

// Train Now
export const trainNow = async (req: AuthRequest, res: Response) => {
  try {
    const { type, sourceId } = req.params;
    const { orgId } = req.user!;
    await usageService.checkFreshLimit(orgId, 'max_training_tokens');

    if (type === 'file') {
      const doc = await KnowledgeDocument.findOne({ _id: sourceId, orgId });
      if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
      if (doc.status !== 'draft') return res.status(400).json({ success: false, message: "Source is not in draft state" });
      doc.status = 'processing'; await doc.save();
      await embedQueue.add("process-document", { orgId, filePath: doc.url, fileName: doc.name, fileType: doc.file_type, siteId: null, metadata: { fileId: doc._id.toString(), type: 'file', storage: 'minio' } }, { priority: 1, removeOnComplete: true });
      return res.json({ success: true, message: "✅ File training started!", document: doc });
    }

    if (type === 'text' || type === 'manual') {
      const { ManualDocument } = await import("../models/ManualDocument.js");
      const entry = await ManualDocument.findOne({ _id: sourceId, orgId });
      if (!entry) return res.status(404).json({ success: false, message: "Entry not found" });
      if ((entry as any).status !== 'draft') return res.status(400).json({ success: false, message: "Entry is not in draft state" });
      (entry as any).status = 'training'; (entry as any).isActive = true;
      await entry.save();
      await embedQueue.add("process-document", { orgId, text: entry.content, title: entry.title, metadata: { fileId: entry._id.toString(), type: 'manual' } }, { priority: 1, removeOnComplete: true });
      return res.json({ success: true, message: "✅ Manual entry training started!", entry });
    }

    if (type === 'website') {
      const site = await Site.findOne({ _id: sourceId, orgId });
      if (!site) return res.status(404).json({ success: false, message: "Site not found" });
      if (site.status !== 'draft') return res.status(400).json({ success: false, message: "Site is not in draft state" });
      site.pages.forEach((p: any) => { p.status = 'pending'; }); site.status = 'crawling'; await site.save();
      await scheduleCrawl(site._id.toString(), site.crawl_schedule);
      await crawlQueue.add("crawl-site", { orgId, siteId: site._id.toString(), startUrl: site.domain }, { priority: 1, removeOnComplete: true });
      return res.json({ success: true, message: "✅ Website crawl started!", site });
    }

    if (type === 'api') {
      const { ApiSource } = await import("../models/ApiSource.js");
      const apiSource = await ApiSource.findOne({ _id: sourceId, orgId });
      if (!apiSource) return res.status(404).json({ success: false, message: "API Source not found" });
      apiSource.isActive = true; await apiSource.save();
      return res.json({ success: true, message: "✅ API Source is now active!", apiSource });
    }

    return res.status(400).json({ success: false, message: `Invalid type: ${type}` });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

// Get Source Detail
export const getSourceDetail = async (req: AuthRequest, res: Response) => {
  try {
    const { type, sourceId } = req.params;
    const { orgId } = req.user!;
    const { PageIndex } = await import("../models/PageIndex.js");
    let data: any = null, pageIndexes: any[] = [];

    if (type === 'website') { data = await Site.findOne({ _id: sourceId, orgId }).lean(); if (data) pageIndexes = await PageIndex.find({ sourceId, orgId }).lean(); }
    else if (type === 'file') { data = await KnowledgeDocument.findOne({ _id: sourceId, orgId }).lean(); if (data) pageIndexes = await PageIndex.find({ sourceId, orgId }).lean(); }
    else if (type === 'api') { const { ApiSource } = await import("../models/ApiSource.js"); data = await ApiSource.findOne({ _id: sourceId, orgId }).lean(); if (data) pageIndexes = await PageIndex.find({ sourceId, orgId }).lean(); }
    else if (type === 'text' || type === 'manual') { const { ManualDocument } = await import("../models/ManualDocument.js"); data = await ManualDocument.findOne({ orgId, _id: sourceId }).lean(); }
    else return res.status(400).json({ success: false, message: "Invalid source type" });

    if (!data) return res.status(404).json({ success: false, message: "Source not found" });
    res.json({ success: true, data, type, pageIndexes });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

// handle chat/analyze stubs
export const handleChat = async (req: any, res: Response) => res.json({ success: true, message: "Use /api/v1/ai/chat" });
export const analyzeSession = async (req: any, res: Response) => res.json({ success: true, message: "Session analysis migrated." });



