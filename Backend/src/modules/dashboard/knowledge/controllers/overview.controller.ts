import { Request, Response } from 'express';
import { AuthRequest } from "@shared/middlewares/auth.js";
import { Brain } from "@modules/dashboard/brain/models/Brain.js";
import { Site } from "@modules/dashboard/knowledge/models/Site.js";
import { KnowledgeDocument } from "@modules/dashboard/knowledge/models/KnowledgeDocument.js";
import { Organization } from "@modules/core/organization/Organization.js";
import { usageService } from "../../../../services/usage.service.js";
import { ActivityType } from "../../../../models/ActivityLog.js";

export const getBrainOverview = async (req: AuthRequest, res: Response) => {
  try {
    const { orgId } = req.params;
    const sites = await Site.find({ orgId, status: { $ne: 'deleted' } }).sort({ createdAt: -1 });
    const docs = await KnowledgeDocument.find({ orgId, status: { $ne: 'deleted' } }).sort({ uploadedAt: -1 });
    const brain = await Brain.findOne({ orgId });

    const { ManualDocument } = await import("../models/ManualDocument.js");
    const customText = await ManualDocument.find({ orgId, status: { $ne: 'deleted' } }).sort({ createdAt: -1 });

    const { ApiSource } = await import("../models/ApiSource.js");
    const apiSources = await ApiSource.find({ orgId }).sort({ createdAt: -1 });

    const docTokens = docs.reduce((sum: number, d: any) => sum + (d.token_count || 0), 0);
    const siteTokens = sites.reduce((sum: number, s: any) => sum + (s.token_count || 0), 0);
    const textTokens = customText.reduce((sum: number, t: any) => sum + (t.token_count || 0), 0);
    const apiTokens = apiSources.reduce((sum: number, a: any) => sum + (a.token_count || 0), 0);
    const totalTokens = docTokens + siteTokens + textTokens + apiTokens;
    const totalSources = docs.length + sites.length + customText.length + apiSources.length;
    const totalPages = sites.reduce((acc: number, site: any) => acc + (site.pages?.length || 0), 0);

    let iqLevel = "Beginner", brainTitle = "Trainee AI", brainProgress = 0;
    if (totalTokens < 50000) { iqLevel = "Beginner"; brainTitle = "Trainee AI"; brainProgress = (totalTokens / 50000) * 100; }
    else if (totalTokens < 150000) { iqLevel = "Intermediate"; brainTitle = "Advanced Assistant"; brainProgress = ((totalTokens - 50000) / 100000) * 100; }
    else { iqLevel = "Expert"; brainTitle = "Master Intelligence"; brainProgress = 100; }

    const capabilities: string[] = [];
    if (docs.length >= 5 || docTokens > 50000) capabilities.push("Policy & Documentation Guru");
    else if (docs.length > 0) capabilities.push("Document Handler");
    if (apiSources.length > 0) capabilities.push("Real-time Operations");
    if (sites.length > 0) capabilities.push("Brand Voice Expert");
    if (capabilities.length === 0) capabilities.push("Learning...");

    const { getPlanLimits } = await import("../../../../config/plans.config.js");
    const defaultLimits = getPlanLimits('free');
    const org = await Organization.findById(orgId);
    if (!org) return res.status(404).json({ success: false, message: "Organization not found" });

    const planLimits = {
      max_websites: org.subscription?.snapshot?.limits?.max_websites || defaultLimits.max_websites,
      max_website_pages: org.subscription?.snapshot?.limits?.max_website_pages || 5,
      max_file_uploads: org.subscription?.snapshot?.limits?.max_file_uploads || defaultLimits.max_files,
      max_manual_qa: org.subscription?.snapshot?.limits?.max_manual_qa || 5,
    };

    const planUsage = {
      websites: { current: sites.length, limit: planLimits.max_websites, percentage: Math.round((sites.length / planLimits.max_websites) * 100), exceeded: Math.max(0, sites.length - planLimits.max_websites), available: Math.max(0, planLimits.max_websites - sites.length) },
      pages: { current: totalPages, limit: planLimits.max_website_pages, percentage: Math.round((totalPages / planLimits.max_website_pages) * 100), exceeded: Math.max(0, totalPages - planLimits.max_website_pages), available: Math.max(0, planLimits.max_website_pages - totalPages) },
      files: { current: docs.length, limit: planLimits.max_file_uploads, percentage: Math.round((docs.length / planLimits.max_file_uploads) * 100), exceeded: Math.max(0, docs.length - planLimits.max_file_uploads), available: Math.max(0, planLimits.max_file_uploads - docs.length) },
      manual: { current: customText.length, limit: planLimits.max_manual_qa, percentage: Math.round((customText.length / planLimits.max_manual_qa) * 100), exceeded: Math.max(0, customText.length - planLimits.max_manual_qa), available: Math.max(0, planLimits.max_manual_qa - customText.length) },
      overall: Math.min(100, Math.round(((sites.length / planLimits.max_websites) * 100 + (totalPages / planLimits.max_website_pages) * 100 + (docs.length / planLimits.max_file_uploads) * 100 + (customText.length / planLimits.max_manual_qa) * 100) / 4))
    };

    res.json({
      success: true,
      stats: { totalSources, wordsUsed: totalTokens, wordsLimit: org.subscription?.token_capacity || 200000, lastSynced: new Date(), totalConversations: 0, iq: { level: iqLevel, title: brainTitle, progress: Math.round(brainProgress), capabilities } },
      planUsage,
      knowledge_strategy: org.knowledge_strategy,
      sources: {
        websites: sites.map((s: any) => ({ id: s._id, domain: s.domain, pagesCount: s.pages?.length || 0, status: s.status, last_crawled: s.updatedAt, token_count: s.token_count || 0, chunk_count: s.chunk_count || 0, tags: s.tags || [], description: s.description || "", intent_summary: s.intent_summary || "", raw_url: s.pages?.[0]?.raw_url || null, screenshot_url: s.pages?.[0]?.screenshot_url || null, pages: s.pages || [] })),
        documents: docs.map((d: any) => ({ id: d._id, name: d.name, type: d.file_type || 'document', status: d.status, size: d.size, token_count: d.token_count || 0, chunk_count: d.chunk_count || 0, createdAt: d.uploadedAt, url: d.url, tags: d.tags || [], intent_summary: d.intent_summary || "", description: d.summary || d.description || "", source: d.metadata?.source })),
        api: apiSources.map((a: any) => ({ id: a._id, name: a.name, endpoint: a.endpoint, method: a.method, syncMode: a.syncMode, status: a.isActive ? 'active' : 'inactive', lastSynced: a.lastSynced, createdAt: a.createdAt, tags: a.tags || [], intent_summary: a.intent_summary || "", description: a.summary || "", source: 'api' })),
        custom_text: customText.map((t: any) => ({ id: t._id, title: t.title, content: t.content, preview: t.content?.substring(0, 300) + (t.content?.length > 300 ? "..." : ""), status: t.status || (t.isActive ? 'active' : 'inactive'), priority: t.priority, chunk_count: t.chunk_count || 0, token_count: t.token_count || 0, intent_summary: t.intent_summary || "", description: t.description || "", tags: t.tags || [], createdAt: t.createdAt, type: 'manual' }))
      },
      overview: { totalDocs: docs.length, totalVectors: totalTokens, trends: brain?.knowledge_profile?.topics?.sort((a: any, b: any) => b.score - a.score)?.slice(0, 20)?.map((t: any) => ({ tag: t.name, score: t.score, type: t.category })) || [] }
    });
  } catch (error: any) {
    console.error("Brain Overview Error:", error);
    res.status(500).json({ success: false, message: "Failed to load brain overview: " + error.message });
  }
};

export const getBrainAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { orgId } = req.params;
    res.json({ success: true, orgId, message: "Analytics coming soon" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getChatHistory = async (req: AuthRequest, res: Response) => {
  try {
    res.json({ success: true, history: [] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
