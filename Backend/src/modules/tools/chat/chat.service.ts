import dotenv from "dotenv";
dotenv.config();


import axios from "axios";
import { Organization } from "@modules/core/organization/Organization.js";
import { Site } from "@modules/dashboard/knowledge/models/Site.js";
import { KnowledgeDocument } from "@modules/dashboard/knowledge/models/KnowledgeDocument.js";
import { LeadForm } from "@modules/tools/chat/LeadForm.js";
import { jsonrepair } from "jsonrepair";
import { SecurityService } from "./security.service.js";
import { buildPrompt } from "./utils/chat.prompt.js";
import { getLastFormStatus } from "./utils/chat.utils.js";
import { usageService } from "../../../services/usage.service.js";
import { ActivityType } from "../../../models/ActivityLog.js";
import { redis } from "@shared/libs/redis.js";
import { BotConfig } from "../../../models/BotConfig.js";


const USE_MODEL = process.env.USE_MODEL || "auto";

// ... (Legacy Removed)

// ---------------- MAIN CHAT FUNCTION ----------------

export const askQuestionToSite = async (
  orgId: string,
  query: string,
  history: { role: string; content: string }[] = [],
  userContext?: { url: string; title: string; ip?: string; userAgent?: string },
  sessionId?: string,
  selectedSourceId?: string,
  onStatusUpdate?: (status: string, type?: 'thinking' | 'stream') => void,
  userName?: string,
  screen_context?: any, // 🎯 SKILL 13: Live page context from widget
  replyToMongoId?: string | null // 🧠 Reply Teleportation: MongoDB _id of the message being replied to
) => {
  // 0) Fetch Organization & Brain Config (Business Logic)
  const org = await Organization.findById(orgId).select('name brainId users_access usage subscription');

  if (!org) {
    return { answer: "Organization not found.", modelUsed: "system", tokensUsed: 0, confidence: 0 };
  }

  // 🛡️ TOKEN LIMIT CHECK (Quota Shield)
  const usage = org.usage || { tokensUsed: 0, words_limit: 0, rollover_tokens: 0, topup_balance: 0 };
  const totalLimit = (usage.words_limit || 0) + (usage.rollover_tokens || 0) + (usage.topup_balance || 0);

  if ((usage.tokensUsed || 0) >= totalLimit) {
    console.warn(`🚫 [Quota Block] Org ${orgId} reached limit.`);
    return {
      answer: "You have reached your token limit. Please upgrade your plan.",
      modelUsed: "quota-shield",
      tokensUsed: 0,
      confidence: 1
    };
  }

  const BrainModel = (await import("@modules/dashboard/brain/models/Brain.js")).Brain;
  const brain = await BrainModel.findOne({ orgId });
  const botConfig = await BotConfig.findOne({ orgId });
  const redisKey = sessionId ? `flow_step:${sessionId}` : null;
  const currentStepId = redisKey ? await redis.get(redisKey) : null;

  // Construct Payload for Python
  const payload = {
    query: query,
    user_id: sessionId || orgId,
    org_id: orgId,
    selected_source_id: selectedSourceId,
    history: history.map((h, i) => ({
      ...h,
      metadata: i === history.length - 1 ? { step_id: currentStepId } : {}
    })),
    rag_config: {
      active: true,
      org_id: orgId,
      filters: { sourceId: { "$in": [] } } // Filters populated by Python
    },
    config: {
      persona: brain?.personality_config || {},
      behavior: {
        journeyEnabled: botConfig?.journeyEnabled ?? true,
        journey: botConfig?.journey || [],
        memoryPolicy: botConfig?.memoryPolicy || '30_DAY'
      },
      orgName: org?.name,
      userName: userName || 'Guest'
    },
    model_preference: process.env.USE_MODEL || "auto",
    screen_context: screen_context || null, // 🎯 SKILL 13: forward to Python
    reply_to_mongo_id: replyToMongoId || null // 🧠 Reply Teleportation: forward to Python Neural Graph
  };

  const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:5000';
  const engineUrl = AI_ENGINE_URL.endsWith('/api/v1') ? AI_ENGINE_URL : `${AI_ENGINE_URL}/api/v1`;
  console.log(`📡 [Node.js] Calling AI Engine Stream: ${engineUrl}/chat/completions`);

  const startTotal = Date.now();
  let startEngine = 0;

  try {
    // 🚀 NDJSON STREAMING IMPLEMENTATION
    const response = await axios.post(`${engineUrl}/chat/completions`, payload, {
      responseType: 'stream'
    });

    startEngine = Date.now();
    const engineLatency = startEngine - startTotal;
    console.log(`⏱️ [Latency] Phase 1 (Metadata + Routing): ${engineLatency}ms`);

    let isFirstToken = true;
    let startFirstToken = 0;
    let finalResult: any = null;
    let streamBuffer = "";

    await new Promise<void>((resolve, reject) => {
      response.data.on('data', (chunk: Buffer) => {
        if (isFirstToken) {
          startFirstToken = Date.now();
          console.log(`⏱️ [Latency] Phase 2 (Engine -> First Token): ${startFirstToken - startEngine}ms`);
          isFirstToken = false;
        }
        streamBuffer += chunk.toString();
        const lines = streamBuffer.split('\n');
        streamBuffer = lines.pop() || ""; // Keep incomplete line

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            if (data.status === 'thinking' && onStatusUpdate) {
              onStatusUpdate(data.message, 'thinking');
            } else if (data.status === 'stream' && onStatusUpdate) {
              // 🚀 THE TUNNEL: Real-time forwarding
              // console.log("🌊 TUNNEL CHUNK:", data.token); // Debug log (Optional, can be noisy)
              onStatusUpdate(data.token, 'stream');
            } else if (data.status === 'final') {
              console.log("✅ TUNNEL FINAL:", data.response?.substring(0, 50));
              finalResult = data;
            } else if (data.status === 'error') {
              reject(new Error(data.message));
            }
          } catch (e) {
            console.warn("⚠️ Stream chunk parse error:", e);
          }
        }
      });

      response.data.on('end', () => resolve());
      response.data.on('error', (err: any) => reject(err));
    });

    if (!finalResult) {
      throw new Error("Empty response from AI Engine stream");
    }

    console.log(`✅ [Node.js] AI Engine Response Received.`);

    // 🎯 TRACK USAGE
    const usageMetadata = finalResult.usage || {};
    const tokensToLog = usageMetadata.total_tokens || usageMetadata.total || 0;

    if (tokensToLog > 0) {
      await usageService.trackActivity(
        orgId, 
        ActivityType.AI_CHAT, 
        tokensToLog, 
        { 
          ...usageMetadata, 
          resource_metrics: finalResult.resource_metrics // ⚡ Energy Billing
        }
      );
    }

    let answer = finalResult.response || "";
    let options = finalResult.options || [];
    const sources = finalResult.sources || [];
    const modelUsed = finalResult.model_used || "python-auto";

    // Persistence logic
    if (sessionId && finalResult.metadata?.step_id) {
      const rKey = `flow_step:${sessionId}`;
      await redis.set(rKey, finalResult.metadata.step_id);
      await redis.expire(rKey, 86400);
    }

    // Auto-Learning Insights
    if (finalResult.metadata?.new_learning) {
      const { Brain } = await import("@modules/dashboard/brain/models/Brain.js");
      await Brain.updateOne({ orgId }, {
        $push: { insights: { type: 'pattern', question: query, ai_proposed_answer: finalResult.metadata.new_learning, status: 'pending', created_at: new Date() } }
      });
    }

    // Post-processing
    let triggeredForm = null;
    let preFilledData = null;

    // Still supporting Regex-based parsing for backward compatibility 
    // or if the LLM generates them manually inside the text.
    const cleanText = answer.replace(/```json/g, "").replace(/```/g, "");

    // Form Regex (Legacy Support)
    const formRegex = /\[FORM:\s*(\{[\s\S]*?\})\]/i;
    const formMatch = cleanText.match(formRegex);

    if (formMatch) {
      try {
        const content = formMatch[1].trim();
        answer = ""; // Found a form, clear the text
        const repairedJSON = jsonrepair(content);
        const parsed = JSON.parse(repairedJSON);

        let formIdToFetch = parsed.form?.id || parsed.id || parsed.formId;
        if (formIdToFetch) {
          triggeredForm = await LeadForm.findById(formIdToFetch);
        }
        if (parsed.formData || parsed.data) preFilledData = parsed.formData || parsed.data;
      } catch (e: any) { console.error("⚠️ Form Parse Error:", e.message); }
    }

    // Options Regex (Legacy Support - IF NOT ALREADY IN result.options)
    if (options.length === 0) {
      const optionsRegex = /\[OPTIONS:\s*(\[[\s\S]*?\])\]/i;
      const optionsMatch = cleanText.match(optionsRegex);
      if (optionsMatch) {
        try {
          const content = optionsMatch[1].trim();
          options = JSON.parse(jsonrepair(content));
          answer = "";
        } catch (e: any) { console.error("⚠️ Options Parse Error:", e.message); }
      }
    }

    return {
      answer,
      modelUsed,
      tokensUsed: tokensToLog,
      form: triggeredForm,
      formData: preFilledData,
      options,
      sources,
      ui_action: finalResult?.ui_action || null, // 🎯 SKILL 13: Return action to handler
      confidence: 0.9
    };

  } catch (error: any) {
    if (error.response) {
      console.error(`❌ Python Engine Error (${error.response.status}):`, error.response.data);
    } else {
      console.error("❌ Python AI Engine Chat Failed:", error.message);
    }
    return {
      answer: "I'm having trouble connecting to my brain right now. Please try again.",
      modelUsed: "offline",
      tokensUsed: 0,
      confidence: 0,
    };
  }
};
