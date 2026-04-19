import { Worker } from "bullmq";
import { redisConnection, redis } from "@shared/libs/redis.js";
import { connectDB } from "@shared/libs/mongo.js";
import { Organization } from "@modules/core/organization/Organization.js";
import { ActivityLog } from "@modules/dashboard/timeline/ActivityLog.js";
import { Lead } from "@modules/tools/chat/Lead.js";
import axios from "axios";

export const summarizeQueueName = "summarize-queue";

console.log("📝 Summarize Worker Started...");


async function runWorker() {
    await connectDB();

    new Worker(
        summarizeQueueName,
        async (job) => {
            const { socketId, orgId } = job.data;
            console.log(`📊 Processing summary for Socket: ${socketId} (Org: ${orgId})`);

            try {
                // 1. Fetch Chat History from Redis
                const redisKey = `chat_history:${socketId}`;
                const rawHistory = await redis.lrange(redisKey, 0, -1);

                if (!rawHistory || rawHistory.length === 0) {
                    console.log("⚠️ No chat history found.");
                    return;
                }

                const history = rawHistory.map(msg => JSON.parse(msg));
                console.log(`📜 Found ${history.length} messages in session.`);

                // 2. Use AI Engine to Analyze Chat (Migrated from Gemini SDK to Python Engine)
                let analysis: any = null;

                try {
                    const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:5000';
                    const engineUrl = AI_ENGINE_URL.endsWith('/api/v1') ? AI_ENGINE_URL : `${AI_ENGINE_URL}/api/v1`;
                    console.log(`🤖 Requesting Summary from Python Engine: ${engineUrl}/automations/summarize`);

                    const res = await axios.post(`${engineUrl}/automations/summarize`, {
                        history: history
                    });

                    if (res.data) {
                        analysis = res.data;
                        console.log("✅ Chat Analysis from Python:", analysis);
                    }
                } catch (err: any) {
                    console.error("❌ Python Summarize Failed:", err.message);
                }

                // 3. Save to ActivityLog
                if (analysis) {
                    await ActivityLog.create({
                        org_id: orgId,
                        type: 'chat_summary',
                        content: analysis.summary || "Chat session completed.",
                        metadata: {
                            sentiment: analysis.sentiment || 'neutral',
                            topic: analysis.intent || 'General',
                            gap_detected: (analysis.knowledge_gaps?.length || 0) > 0,
                            lead_potential: analysis.lead_potential || 0,
                            user_context: {
                                session_id: socketId,
                                duration_seconds: history.length * 30 // Rough estimate
                            }
                        }
                    });
                    console.log("💾 Saved to ActivityLog.");
                }

                // 4. Extract & Save Lead if contact info found
                if (analysis?.contact_info && (analysis.contact_info.email || analysis.contact_info.phone)) {
                    await Lead.create({
                        siteId: orgId, // Using orgId as siteId for now (adjust based on your schema)
                        visitorId: socketId,
                        name: analysis.contact_info.name || "Anonymous",
                        email: analysis.contact_info.email || undefined,
                        phone: analysis.contact_info.phone || undefined,
                        summary: analysis.summary || "",
                        intent: analysis.intent || "Unknown",
                        chatTranscript: history.map((msg: any) => ({
                            role: msg.role === 'user' ? 'user' : 'model',
                            content: msg.content,
                            timestamp: new Date(msg.timestamp)
                        }))
                    });
                    console.log("🎯 Lead captured!");
                }

                // 5. Auto-Learning: Store Knowledge Gaps as LearningMemory
                if (analysis?.knowledge_gaps && analysis.knowledge_gaps.length > 0) {
                    const { LearningMemory } = await import("../models/LearningMemory.js");

                    for (const gap of analysis.knowledge_gaps) {
                        try {
                            await LearningMemory.create({
                                organizationId: orgId,
                                type: 'gap',
                                category: 'Content Gap',
                                title: gap.length > 50 ? gap.substring(0, 50) + "..." : gap,
                                content: gap,
                                confidence: 0.8,
                                source: 'chat_analysis',
                                sourceChatIds: [], // We don't have the Chat Object ID here yet, might need to create Chat first or link differently
                                sourceUserIds: [],
                                status: 'pending',
                                generatedAt: new Date()
                            });
                        } catch (e) {
                            console.error("Failed to save learning gap:", gap, e);
                        }
                    }
                    console.log(`🧠 Stored ${analysis.knowledge_gaps.length} knowledge gaps into LearningMemory.`);
                }

                // 6. Cleanup Redis
                await redis.del(redisKey);
                console.log(`✅ Chat session ${socketId} summarized and cleaned up.`);

            } catch (err: any) {
                console.error(`❌ Summarize Worker Error: ${err.message}`);
            }
        },
        {
            connection: redisConnection,
            concurrency: 2
        }
    );
}

runWorker();
