import { Response } from 'express';
import { AuthRequest } from "@shared/middlewares/auth.js";
import { KnowledgeDocument } from "@modules/dashboard/knowledge/models/KnowledgeDocument.js";
import { validateKnowledgeInput } from "@modules/shared/utils/validation.js";
import { embedQueue } from "../../../../jobs/queues.js";
import { usageService } from "../../../../services/usage.service.js";
import { ActivityType } from "../../../../models/ActivityLog.js";

const generateAiMetadata = async (text: string, orgId: string, defaultTags: string[] = [], defaultSummary: string = "") => {
  try {
    const axios = (await import("axios")).default;
    const engineUrl = process.env.AI_ENGINE_URL || 'http://127.0.0.1:5000';
    const aiResponse = await axios.post(`${engineUrl}/api/v1/knowledge/metadata`, { text: text.substring(0, 3000) }, { timeout: 30000 });
    const data = aiResponse.data || {};
    const usage = data.usage || { input: 0, output: 0 };
    if (usage.input > 0 || usage.output > 0) {
      await usageService.trackActivity(orgId, ActivityType.AI_CHAT, 1, { input_tokens: usage.input, output_tokens: usage.output, action: 'auto-metadata' });
    }
    return { tags: (data.tags && data.tags.length > 0) ? data.tags : defaultTags, intent_summary: data.intent_summary || defaultSummary || "", summary: data.summary || "" };
  } catch (error: any) {
    console.warn("⚠️ AI metadata generation failed:", error.message);
    return { tags: defaultTags, intent_summary: defaultSummary, summary: "" };
  }
};

export const previewApiSource = async (req: AuthRequest, res: Response) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, message: "URL is required" });
    try {
      const response = await import("axios").then(a => a.default.get(url, { timeout: 5000, headers: { 'Accept': 'application/json' } }));
      const data = response.data;
      if (typeof data !== 'object') return res.status(400).json({ success: false, message: "Response is not valid JSON" });
      let preview = data;
      if (Array.isArray(data)) { preview = data.slice(0, 3); if (data.length > 3) (preview as any).push({ "...": `${data.length - 3} more items` }); }
      return res.json({ success: true, preview, totalSize: JSON.stringify(data).length });
    } catch (e: any) { return res.status(400).json({ success: false, message: `Connection Failed: ${e.message}` }); }
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const addApiSource = async (req: AuthRequest, res: Response) => {
  try {
    const { url, title, description, tags, intent_summary, category, skipTrain, method = 'GET', authType = 'none', headers, bodyTemplate, searchParam, syncMode = 'real-time' } = req.body;
    const { orgId } = req.user!;
    const isDraft = skipTrain === 'true' || skipTrain === true;

    const validation = validateKnowledgeInput({ title, description, intent_summary, tags });
    if (!validation.success) return res.status(400).json({ success: false, message: validation.message });

    await usageService.checkFreshLimit(orgId, 'max_files');
    if (!url) return res.status(400).json({ success: false, message: "API URL is required" });

    let apiData = null, jsonContent = "";
    if (!isDraft) {
      try {
        const fetchConfig: any = { timeout: 10000, method, headers: { 'Accept': 'application/json' } };
        if (headers && Array.isArray(headers)) headers.forEach((h: any) => { if (h.key && h.value) fetchConfig.headers[h.key] = h.value; });
        if (method === 'POST' && bodyTemplate) { try { fetchConfig.data = JSON.parse(bodyTemplate); } catch (e) { fetchConfig.data = bodyTemplate; } }
        const response = await import("axios").then(a => a.default(url, fetchConfig));
        apiData = response.data;
      } catch (fetchError: any) { console.warn(`⚠️ API preview failed: ${fetchError.message}`); }
      if (apiData) jsonContent = typeof apiData === 'object' ? JSON.stringify(apiData, null, 2) : String(apiData);
    }

    let finalTags = tags || [], finalDescription = description || "", finalIntent = intent_summary || description || "";
    if (!isDraft && jsonContent && (!description || !tags || tags.length === 0)) {
      const aiMeta = await generateAiMetadata(jsonContent, orgId, tags, description);
      finalTags = aiMeta.tags; finalDescription = description || aiMeta.summary; finalIntent = aiMeta.intent_summary;
    }

    if (syncMode === 'one-time' && !isDraft) {
      const fileName = url.split('/').pop() || 'api-data.json';
      const finalName = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
      const newDoc = await KnowledgeDocument.create({ orgId, name: finalDescription ? `${finalDescription}.json` : finalName, url, file_path: "api://remote", file_type: "json", size: jsonContent.length, status: 'processing', tags: finalTags, intent_summary: finalIntent, token_count: Math.ceil(jsonContent.length / 4), metadata: { source: 'api-import', originalUrl: url, description: finalDescription, syncMode: 'one-time' }, uploadedAt: new Date() });
      await embedQueue.add("process-document", { orgId, text: jsonContent, title: finalName, fileName: finalName, fileType: "application/json", siteId: null, metadata: { fileId: newDoc._id.toString(), type: 'file', source: 'api' } }, { removeOnComplete: true });
      return res.json({ success: true, message: "✅ API Source saved as JSON file!", document: newDoc, mode: 'one-time' });
    }

    const { ApiSource } = await import("../models/ApiSource.js");
    const headersMap = new Map();
    if (headers && Array.isArray(headers)) headers.forEach((h: any) => { if (h.key && h.value) headersMap.set(h.key, h.value); });

    const apiSource = await ApiSource.create({ orgId, name: title || finalDescription || `API: ${url.split('/').pop()}`, endpoint: url, method: method || 'GET', authType: authType || 'none', authCredentials: { headers: headersMap }, requestConfig: { searchParam: searchParam || 'q', bodyTemplate }, fieldMapping: new Map(), syncMode: syncMode || 'real-time', cacheConfig: { enabled: true, ttlMinutes: 5 }, tags: finalTags, intent_summary: finalIntent, summary: finalDescription, category: category || 'other', isActive: !isDraft });

    return res.json({ success: true, message: isDraft ? "✅ API Source saved as Draft!" : "✅ Real-Time API Source created!", apiSource: { id: apiSource._id, name: apiSource.name, endpoint: apiSource.endpoint, syncMode: apiSource.syncMode, tags: finalTags, intent: finalIntent, isActive: apiSource.isActive }, mode: isDraft ? 'draft' : 'real-time' });
  } catch (err: any) {
    console.error("❌ API Source error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateApiSource = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { url, description, tags, syncMode, method, authType, authCredentials, requestConfig, fieldMapping } = req.body;
    const { orgId } = req.user!;
    if (!id) return res.status(400).json({ success: false, message: "ID is required" });

    const { ApiSource } = await import("../models/ApiSource.js");
    const { encryptCredential } = await import("../../../shared/utils/encryption.js");
    const apiSource = await ApiSource.findOne({ _id: id, orgId });
    if (!apiSource) return res.status(404).json({ success: false, message: "API Source not found" });

    if (url) apiSource.endpoint = url;
    if (description) apiSource.name = description;
    if (tags) apiSource.tags = tags;
    if (syncMode) apiSource.syncMode = syncMode;
    if (method) apiSource.method = method;
    if (authType) apiSource.authType = authType;
    if (requestConfig) apiSource.requestConfig = { ...apiSource.requestConfig, ...requestConfig };
    if (fieldMapping) apiSource.fieldMapping = fieldMapping;

    if (authType && authType !== 'none' && authCredentials) {
      if (authType === 'api-key' && authCredentials.apiKey) apiSource.authCredentials = { apiKey: await encryptCredential(authCredentials.apiKey), headerName: authCredentials.headerName || 'X-API-Key' };
      else if (authType === 'bearer' && authCredentials.token) apiSource.authCredentials = { token: await encryptCredential(authCredentials.token) };
      else if (authType === 'basic') { if (authCredentials.username) apiSource.authCredentials = { username: authCredentials.username }; if (authCredentials.password) apiSource.authCredentials = { ...apiSource.authCredentials, password: await encryptCredential(authCredentials.password) }; }
    }

    apiSource.updatedAt = new Date();
    await apiSource.save();
    res.json({ success: true, message: "✅ API Source updated successfully", apiSource: { id: apiSource._id, name: apiSource.name, endpoint: apiSource.endpoint, syncMode: apiSource.syncMode } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
