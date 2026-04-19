import axios from 'axios';
import mongoose from 'mongoose';
import { DailyChatBucket } from '../models/DailyChatBucket.js';

// 🚀 CRITICAL: Must include /api/v1 for the AI Engine
const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://127.0.0.1:5000/api/v1';

export class MemoryService {
    /**
     * Triggers the AI engine to analyze a chat session.
     */
    static async triggerAnalysis(chatId: string, orgId: string) {
        try {
            console.log(`[MemoryService] Analyzing ChatSession: ${chatId} (Org: ${orgId})`);

            // Fetch messages for the session from the DailyChatBucket
            const rawMessages = await DailyChatBucket.aggregate([
                {
                    $match: {
                        chatSessionId: new mongoose.Types.ObjectId(chatId),
                        organizationId: new mongoose.Types.ObjectId(orgId)
                    }
                },
                { $unwind: "$chat_turns" },
                { $unwind: "$chat_turns.messages" },
                { $replaceRoot: { newRoot: "$chat_turns.messages" } },
                { $sort: { createdAt: 1 } }
            ]);

            const messages = rawMessages;

            if (!messages || messages.length === 0) {
                console.log(`[MemoryService] No chat history found for ${chatId}. Skipping.`);
                return;
            }

            const formattedMessages = messages.map(m => ({
                role: m.sender === 'user' ? 'user' : 'model',
                content: m.content
            }));

            const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://127.0.0.1:5000';
            const engineUrl = AI_ENGINE_URL.endsWith('/api/v1') ? AI_ENGINE_URL : `${AI_ENGINE_URL}/api/v1`;

            const response = await axios.post(`${engineUrl}/analysis/analyze_chat`, {
                messages: formattedMessages
            });

            console.log(`[MemoryService] Analysis Success for ${chatId}`);
            return response.data;
        } catch (error: any) {
            console.error(`[MemoryService] Error for ${chatId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Wrapper for worker compatibility
     */
    static async processChatSessionCompletion(chatId: string, orgId: string) {
        return this.triggerAnalysis(chatId, orgId);
    }

    /**
     * Saves or updates a chat session record in the database.
     */
    static async saveChatSession(data: any) {
        try {
            const { ChatSession } = await import('../models/ChatSession.js');
            const session = await ChatSession.findOneAndUpdate(
                { chatId: data.chatId },
                { $set: data },
                { upsert: true, new: true }
            );
            console.log(`[MemoryService] ChatSession Record Created/Updated: ${session._id}`);
            return session;
        } catch (error: any) {
            console.error(`[MemoryService] Failed to save chat session: ${error.message}`);
            throw error;
        }
    }
}

export const memoryService = MemoryService;
