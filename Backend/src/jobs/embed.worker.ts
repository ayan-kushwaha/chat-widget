import dotenv from 'dotenv';
dotenv.config();

console.log("🔥🔥🔥 EMBED WORKER FILE LOADED - VERIFYING EXECUTION 🔥🔥🔥");

import { Worker } from "bullmq";
import { redisConnection } from "../modules/shared/libs/redis.js";
import { connectDB } from "../modules/shared/libs/mongo.js";
import { embedQueue } from "./queues.js";
import { generateChunks } from "@shared/utils/chunker";
import { KnowledgeDocument } from "@modules/dashboard/knowledge/models/KnowledgeDocument.js";
import { Organization } from "../modules/core/organization/Organization.js";
import { Site } from "../modules/dashboard/knowledge/models/Site.js";
import axios from "axios";
import { extractTextFromPDF } from "../modules/shared/utils/pdfReader.js";

import { usageService } from "../services/usage.service.js";
import { ActivityType } from "../models/ActivityLog.js";

import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto'; // 🔥 Added for Chunk Hashing
import { io as ioClient } from "socket.io-client";  // 🔥 Socket.io for real-time updates

// 🔥 Initialize Socket.io client for broadcasting updates
let socket: any = null;
try {
  socket = ioClient(process.env.BACKEND_URL || "http://localhost:4000", {
    transports: ['websocket'],
    reconnection: true
  });
  socket.on('connect', () => console.log('✅ [EmbedWorker] Socket.io connected'));
  socket.on('disconnect', () => console.log('⚠️ [EmbedWorker] Socket.io disconnected'));
} catch (e) {
  console.warn('⚠️ [EmbedWorker] Socket.io connection failed, proceeding without real-time updates');
}

// Helper to emit status updates
const emitStatus = (orgId: string, sourceType: string, sourceId: string, status: string, data?: any) => {
  if (!socket?.connected) return;
  try {
    socket.emit('knowledge_status_update', {
      orgId,
      sourceType,
      sourceId,
      status,
      timestamp: new Date(),
      ...data
    });
    console.log(`📡 [Socket] Emitted status: ${status} for ${sourceType}/${sourceId}`);
  } catch (e) {
    console.error('❌ [Socket] Emit failed:', e);
  }
};

const CHUNK_SIZE = Number(process.env.CHUNK_SIZE_CHARS) || 4000;
const OVERLAP = Number(process.env.CHUNK_OVERLAP_CHARS) || 200;
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_CHAT_MODEL || "qwen3.5vl:4b";


// Helper to get URL dynamically
const getAiEngineUrl = () => process.env.AI_ENGINE_URL || 'http://127.0.0.1:5000';


async function generateMetadata(text: string) {
  try {
    // Call Python AI Engine for Metadata with timeout
    const res = await axios.post(`${getAiEngineUrl()}/api/v1/knowledge/metadata`, { text }, { timeout: 30000 });
    return {
      summary: res.data.summary || "",
      tags: res.data.tags || [],
      intent_summary: res.data.intent_summary || "No specific intent identified.",
      usage: res.data.usage || { input: 0, output: 0 }
    };
  } catch (e: any) {
    console.error("Metadata generation failed (AI Engine):", e.message);
    return {
      summary: "Summary unavailable",
      tags: [],
      intent_summary: "No intent summary available.",
      usage: { input: 0, output: 0 }
    };
  }
}

console.log("👷 Embed Worker Started (MongoDB Only)...");

process.on('uncaughtException', (err) => {
  console.error('💀 Uncaught Exception in Embed Worker:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💀 Unhandled Rejection at:', promise, 'reason:', reason);
});

connectDB();

export const embedWorker = new Worker(embedQueue.name, async (job) => {
  const { orgId, text, title, metadata, filePath, fileName, fileType, siteId: topSiteId, url: topUrl } = job.data;
  const siteId = topSiteId || metadata?.siteId;
  const url = topUrl || metadata?.url;
  const sourceType = metadata?.type || 'website';

  // Choose ID for status reporting
  let sourceId = siteId || metadata?.fileId || url || 'manual';
  console.log(`🚀 [EmbedWorker] Processing ${sourceType} | Org: ${orgId} | ID: ${sourceId} | URL: ${url || 'N/A'}`);

  try {
    // 1. Pre-processing: Content Check
    let extractedText = text || "";
    let exactTokenCount = 0;
    let sourceTitle = title || fileName || 'Untitled';

    // Immediate Status Update
    if (siteId) {
      try {
        const tempUrl = url.replace(/\/$/, "");
        const urlsToMatch = [tempUrl, tempUrl + "/"];
        await Site.updateOne({ "_id": siteId, "pages.url": { $in: urlsToMatch } }, { $set: { "pages.$.status": "embedding", "pages.$.last_crawled": new Date(), "pages.$.title": sourceTitle } });
      } catch (e) { console.error("Status update error:", e); }
    }

    // Download/Extract Text Logic
    let localFilePath = filePath;
    let isTempFile = false;

    if (filePath && (filePath.startsWith('http') || filePath.startsWith('s3'))) {
      const tempPath = path.join(os.tmpdir(), `cluaiz-embed-${Date.now()}-${fileName}`);
      const writer = fs.createWriteStream(tempPath);
      const response = await axios({ url: filePath, method: 'GET', responseType: 'stream' });
      response.data.pipe(writer);
      await new Promise<void>((resolve, reject) => { writer.on('finish', () => resolve()); writer.on('error', reject); });
      localFilePath = tempPath;
      isTempFile = true;
    }

    if (!extractedText && localFilePath) {
      const FormData = (await import("form-data")).default;
      const form = new FormData();
      form.append('file', fs.createReadStream(localFilePath), fileName);
      const aiRes = await axios.post(`${getAiEngineUrl()}/api/v1/docs/parse-document`, form, { headers: { ...form.getHeaders() }, timeout: 60000 });
      if (aiRes.data && aiRes.data.chunks) {
        extractedText = aiRes.data.chunks.join("\n\n");
        exactTokenCount = aiRes.data.token_count || 0;
        if (aiRes.data.ai_tags) (job.data as any).ai_tags = aiRes.data.ai_tags;
      }
    }

    if (isTempFile && localFilePath) { try { fs.unlinkSync(localFilePath); } catch (e) { } }

    if (!extractedText || extractedText.length < 10) throw new Error("Content too short");
    if (exactTokenCount === 0) exactTokenCount = Math.ceil(extractedText.length / 4);
    await job.updateProgress({ percent: 10, message: "Analyzing content..." });
    const chunks = generateChunks(extractedText, { chunkSize: CHUNK_SIZE, overlap: OVERLAP });

    // 🧠 SMART METADATA: Only generate if missing (preserves user edits)
    let meta: any = null;

    // ---------------------------------------------------------
    // 🧠 INCREMENTAL SYNC (SMART DIFF) LOGIC
    // ---------------------------------------------------------

    // 1. Generate Hashes for New Chunks
    const validChunks = chunks.filter(c => c.length >= 10);
    if (validChunks.length === 0) throw new Error("No valid chunks to embed");

    const newChunkData = validChunks.map(chunkText => ({
      text: chunkText,
      hash: crypto.createHash('md5').update(chunkText).digest('hex')
    }));

    // 2. Fetch Old Hashes from DB
    let oldHashes: string[] = [];
    let oldIds: string[] = [];
    let dbDoc: any = null;
    let brain: any = null;

    if (sourceType === 'website' && siteId) {
      const site = await Site.findById(siteId);
      if (site) {
        const normUrl = url.replace(/\/$/, "");
        const page = site.pages.find((p: any) => p.url.replace(/\/$/, "") === normUrl);
        if (page) {
          oldHashes = page.chunk_hashes || [];
          oldIds = page.chunk_ids || [];
        }
        dbDoc = site;
      }
    } else if (sourceType === 'file' && sourceId) {
      const doc = await KnowledgeDocument.findOne({ _id: sourceId, orgId });
      if (doc) {
        oldHashes = doc.chunk_hashes || [];
        oldIds = doc.chunk_ids || [];
        dbDoc = doc;
      }
    } else if (sourceType === 'manual' || sourceType === 'text_input') {
      const { ManualDocument } = await import("../modules/dashboard/knowledge/models/ManualDocument.js");
      const entry = await ManualDocument.findOne({ orgId, _id: sourceId });
      if (entry) {
        oldHashes = entry.chunk_hashes || [];
        oldIds = entry.chunk_ids || [];
        dbDoc = entry;
      }
    }

    // 🧠 METADATA FETCH/GENERATE logic shifted here to have dbDoc context
    // User Rule: NEVER regenerate title/tags if ANY of them already exist.
    const hasMetadata = dbDoc && (
      dbDoc.description || 
      dbDoc.summary || 
      dbDoc.intent_summary || 
      (dbDoc.tags && dbDoc.tags.length > 0)
    );

    if (hasMetadata) {
      console.log(`✨ [EmbedWorker] Using EXISTING metadata for ${sourceId} (Skipping AI Generation)`);
      if (sourceType === 'website') {
        meta = { summary: dbDoc.description, tags: dbDoc.tags, intent_summary: dbDoc.intent_summary, usage: { input: 0, output: 0 } };
      } else if (sourceType === 'file') {
        meta = { summary: dbDoc.summary, tags: dbDoc.tags, intent_summary: dbDoc.intent_summary, usage: { input: 0, output: 0 } };
      } else if (sourceType === 'manual') {
        meta = { summary: dbDoc.description || "", tags: dbDoc.tags || [], intent_summary: dbDoc.intent_summary || "", usage: { input: 0, output: 0 } };
      }
    } else {
      console.log(`⏳ [EmbedWorker] Metadata missing. Will generate HIGH-QUALITY metadata using Neo4j chunk summaries AFTER embedding.`);
      meta = { summary: "", tags: [], intent_summary: "", usage: { input: 0, output: 0 } };
    }
    const needsMetadata = !hasMetadata;

    // 3. Compare (Diff)
    const newHashesKeys = new Set(newChunkData.map(c => c.hash));
    const oldHashesKeys = new Set(oldHashes);

    // Filter chunks that actually need embedding (New or Modified)
    const chunksToEmbed = newChunkData.filter(c => !oldHashesKeys.has(c.hash));

    // Find stale chunk IDs to delete
    const hashesToDelete = oldHashes.filter(h => !newHashesKeys.has(h));
    const staleIds = hashesToDelete.map(h => {
      const idx = oldHashes.indexOf(h);
      return idx !== -1 ? oldIds[idx] : null;
    }).filter(id => id !== null) as string[];

    const matchedCount = newChunkData.length - chunksToEmbed.length;
    console.log(`🧠 [Smart Diff] Total: ${newChunkData.length} | Matched: ${matchedCount} (Skipping) | New: ${chunksToEmbed.length} | Stale: ${staleIds.length}`);

    // If perfectly matched, skip embedding entirely
    let chunkIds: string[] = [];
    if (chunksToEmbed.length === 0 && staleIds.length === 0) {
      console.log(`✅ [Smart Diff] Content unchanged. No tokens burned.`);
      chunkIds = oldIds; // Keep existing
    } else {
      // 🔥 MULTI-PAYLOAD PREP: Delete stale vectors if any
      if (staleIds.length > 0) {
        console.log(`🗑️ Deleting ${staleIds.length} stale vectors...`);
        try {
          // Call AI vector deletion endpoint (assumes it exists or ignore for now)
          await axios.post(`${getAiEngineUrl()}/api/v1/knowledge/vectors/delete`, { orgId, ids: staleIds }, { timeout: 30000 });
        } catch (e: any) {
          console.warn(`⚠️ Failed to delete stale vectors: ${e.message}`);
        }
      }

      // 🔥 BATCH EMBEDDING ONLY MODIFIED CHUNKS
      if (chunksToEmbed.length > 0) {
        emitStatus(orgId, sourceType, sourceId, 'embedding', { progress: 50, message: `Generating embeddings for ${chunksToEmbed.length} modified chunks...` });

        const batchResponse = await axios.post(`${getAiEngineUrl()}/api/v1/knowledge/embed/batch`, {
          orgId,
          sourceId,
          sourceType,
          url,
          tags: meta.tags || (job.data as any).ai_tags || [],
          chunks: chunksToEmbed.map(c => ({ text: c.text, metadata: { ...meta, hash: c.hash, page: 1 } }))
        }, { timeout: 300000 });

        if (!batchResponse.data || !batchResponse.data.ids) throw new Error("Embedding failed: No IDs returned");

        // Reconstruct final ID list: Keep matched old IDs, append new IDs
        const newReturnedIds = batchResponse.data.ids;
        let finalIds: string[] = [];
        let newIdx = 0;

        // Map new array back to maintain order matching newChunkData
        for (const chunk of newChunkData) {
          if (oldHashesKeys.has(chunk.hash)) {
            // It was matched, find old ID
            const oldIdx = oldHashes.indexOf(chunk.hash);
            finalIds.push(oldIds[oldIdx]);
          } else {
            // It was newly embedded
            finalIds.push(newReturnedIds[newIdx]);
            newIdx++;
          }
        }
        chunkIds = finalIds;

      } else {
        // Only deletions happened
        chunkIds = oldIds.filter((id, idx) => !hashesToDelete.includes(oldHashes[idx]));
      }
    }

    // 🧠 HIGH-QUALITY METADATA GENERATION (Post-Embedding)
    if (needsMetadata) {
      console.log(`🤖 [EmbedWorker] Fetching High-Quality Metadata from Neo4j Chunk Summaries for ${sourceId}`);
      try {
        const metaRes = await axios.post(`${getAiEngineUrl()}/api/v1/knowledge/source-metadata`, {
          orgId,
          sourceId,
          sourceType: sourceType === 'website' ? 'website' : (sourceType === 'file' ? 'file' : 'manual')
        }, { timeout: 60000 });
        
        if (metaRes.data && metaRes.data.title) {
          meta = metaRes.data;
          console.log(`✅ [EmbedWorker] High-Quality Metadata Generated: ${meta.title}`);
          // Replace generic titles with the high-quality AI generated title
          if (sourceTitle === 'Untitled' || sourceTitle === fileName || !sourceTitle) {
            sourceTitle = meta.title;
          }
        }
      } catch (e: any) {
        console.warn(`⚠️ [EmbedWorker] High-Quality Metadata generation failed: ${e.response?.data?.detail || e.message}. Using basic fallback.`);
      }
    }

    // 🏆 FULL DOCUMENT TOKEN SIZE (Accurate for UI display)
    const metaTextLength = (sourceTitle || "").length + 
                           (meta?.summary || "").length + 
                           (meta?.intent_summary || "").length + 
                           (meta?.tags || []).join(" ").length;
    
    exactTokenCount = Math.ceil(((extractedText?.length || 0) + metaTextLength) / 4);

    // 🎯 TOKEN BILLING LOGIC (Only burn for New Chunks)
    let billedTokens = 0;
    let infraTokens = 0;
    let aiTokens = 0;

    // Check if this is an API source with fixed cost
    if (metadata?.fixedTokenCost) {
      // 💵 API BILLING: Fixed cost per call
      billedTokens = metadata.fixedTokenCost;
      infraTokens = billedTokens; // Assume fixed APi fetches are infra
      console.log(`💵 [API Billing] Using fixed cost: ${billedTokens} tokens`);
    } else {
      // 🎯 TRUE VALUE FORMULA: Embedding Tokens (of NEW chunks only) + Generation Tokens (Input+Output)
      const generationTokens = (meta.usage?.input || 0) + (meta.usage?.output || 0);

      // Estimate tokens for only the embedded chunks (roughly 4 chars per token)
      const embeddedTextLength = chunksToEmbed.reduce((acc, c) => acc + c.text.length, 0);
      const exactNewTokenCount = Math.ceil(embeddedTextLength / 4);

      // Fallback estimate if usage missing
      const metaEstimate = generationTokens > 0 ? generationTokens : Math.ceil(((meta.intent_summary || "") + (meta.tags || []).join(" ")).length / 4);
      const titleTokens = Math.ceil(sourceTitle.length / 4);

      infraTokens = exactNewTokenCount; // Vector/Processing cost
      aiTokens = metaEstimate + titleTokens; // Model generation cost
      billedTokens = infraTokens + aiTokens;

      // 🔥 DETAILED LOGGING FOR DEBUGGING
      console.log(`📊 [True Value Breakdown]`);
      console.log(`   📝 Title: "${sourceTitle}" = ${titleTokens} tokens`);
      console.log(`   📄 Content (New Embeddings Only): ${exactNewTokenCount} tokens`);
      console.log(`   🧠 AI Generation: ${meta.usage?.input || 0} In + ${meta.usage?.output || 0} Out = ${generationTokens} tokens`);
      console.log(`   💰 TOTAL SAVED: ${matchedCount} chunks matched (Proportional tokens saved)`);
      console.log(`   💰 TOTAL BILLED: ${billedTokens} tokens (AI: ${aiTokens}, Infra: ${infraTokens})`);
    }

    // 4. Update MongoDB
    let finalStatus = 'synced';
    const finalHashes = newChunkData.map(c => c.hash);
    if (sourceType === 'website' && siteId) {
      // 🔥 ATOMIC UPDATE to prevent race conditions with AI Engine's page_index
      const site = await Site.findById(siteId);
      const isMainPage = site && (url === site.domain || url === site.pages?.[0]?.url || url.replace(/\/$/, "") === site.domain.replace(/\/$/, ""));

      await Site.updateOne(
        { _id: siteId, "pages.url": url.replace(/\/$/, "") },
        {
          $set: {
            "pages.$.status": 'trained',
            "pages.$.token_count": exactTokenCount,
            "pages.$.chunk_count": newChunkData.length,
            "pages.$.chunk_ids": chunkIds,
            "pages.$.chunk_hashes": finalHashes,
            "pages.$.title": sourceTitle,
            "status": 'active',
            "updatedAt": new Date(),
            // 🔥 Sync top-level metadata if this is the main portal page OR if top-level is currently empty
            ...((isMainPage || !site?.description) ? {
              "description": meta.summary,
              "intent_summary": meta.intent_summary,
              "tags": meta.tags,
              "token_count": exactTokenCount,
              "chunk_count": newChunkData.length
            } : {})
          }
        }
      );
    } else if (sourceType === 'file' && sourceId) {
      // 🔥 ATOMIC UPDATE for Files
      await KnowledgeDocument.updateOne(
        { _id: sourceId, orgId },
        {
          $set: {
            status: 'ready',
            token_count: exactTokenCount,
            chunk_count: newChunkData.length,
            chunk_ids: chunkIds,
            chunk_hashes: finalHashes,
            intent_summary: meta.intent_summary,
            summary: meta.summary,
            tags: meta.tags,
            updatedAt: new Date()
          }
        }
      );
      //  Emit status: File ready
      emitStatus(orgId, 'file', sourceId, 'ready', { token_count: billedTokens, intent_summary: meta.intent_summary });
    } else if (sourceType === 'manual' || sourceType === 'text_input') {
      const { ManualDocument } = await import("../modules/dashboard/knowledge/models/ManualDocument.js");
      await ManualDocument.updateOne(
        { orgId, _id: sourceId },
        {
          $set: {
            status: 'active',
            token_count: exactTokenCount,
            chunk_count: newChunkData.length,
            chunk_ids: chunkIds,
            chunk_hashes: finalHashes, //  Save hashes
            intent_summary: meta.intent_summary,
            description: meta.summary,
            tags: meta.tags,
            last_updated: new Date()
          }
        }
      );
      //  Emit status: Manual training complete
      emitStatus(orgId, 'manual', sourceId, 'active', { token_count: billedTokens, intent_summary: meta.intent_summary });
    }

    // Billing
    const billDetails = { fileId: sourceId, fileName: sourceTitle, type: sourceType };
    const shortDesc = `${sourceType === 'website' ? 'Web Crawl' : 'File Sync'}: ${sourceTitle.length > 20 ? sourceTitle.substring(0, 20) + '...' : sourceTitle}`;

    if (infraTokens > 0) {
      await usageService.trackActivity(orgId, ActivityType.INFRASTRUCTURE, infraTokens, billDetails, shortDesc);
    }
    if (aiTokens > 0) {
      await usageService.trackActivity(orgId, ActivityType.AI_MODEL, aiTokens, billDetails, shortDesc);
    }
    // Also log the overall crawl action if needed, though INFRA and AI cover the token burn.
    await usageService.trackActivity(orgId, sourceType === 'website' ? ActivityType.BRAIN_CRAWL : ActivityType.MANUAL_TRAINING, 0, billDetails, shortDesc);

    return { success: true, tokens: billedTokens, chunks: newChunkData.length, pageUrl: url };

  } catch (err: any) {
    console.error(`❌ [EmbedWorker] Critical Failure for ${sourceId}:`, err.message);
    try {
      if (sourceType === 'website' && siteId) await Site.updateOne({ "_id": siteId, "pages.url": url }, { $set: { "pages.$.status": "failed", "pages.$.error_message": err.message } });
      else if (sourceType === 'file' && sourceId) await KnowledgeDocument.updateOne({ _id: sourceId }, { $set: { status: 'failed' } });
      else if (sourceType === 'manual' || sourceType === 'text_input') {
        const { ManualDocument } = await import("../modules/dashboard/knowledge/models/ManualDocument.js");
        await ManualDocument.updateOne(
          { orgId, _id: sourceId },
          { $set: { status: "failed" } }
        );
      }
    } catch (dbErr) { }
    throw err;
  }
}, {
  connection: redisConnection,
  concurrency: 3, // 🔥 Higher throughput
  lockDuration: 300000,
  lockRenewTime: 30000,
  removeOnComplete: { count: 50 },
  removeOnFail: { count: 100 }
});