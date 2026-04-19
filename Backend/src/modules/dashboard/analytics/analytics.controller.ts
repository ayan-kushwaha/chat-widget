import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AnalyticsSummary } from './AnalyticsSummary.js';
import { getPlanLimits } from '../../../config/plans.config.js';
import { Brain } from '../../dashboard/brain/models/Brain.js';

export const getMemoryAnalytics = async (req: Request, res: Response) => {
    try {
        const { orgId } = req.params;
        const stats = {
            total_memories: 0,
            sources: { files: 0, websites: 0, conversations: 0 },
            learning_rate: []
        };
        res.json({ success: true, analytics: stats });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const collectAnalytics = async (req: Request, res: Response) => {
    res.json({ success: true, message: "Analytics collection stub." });
};

export const getStats = async (req: Request, res: Response) => {
    res.json({ success: true, stats: {} });
};

export const getPublicStats = async (req: Request, res: Response) => {
    const { orgId } = req.query;

    if (!orgId) {
        return res.status(400).json({ success: false, message: "Missing orgId" });
    }

    try {
        const { DailyChatBucket } = await import("../../../models/DailyChatBucket.js");
        const { Conversation } = await import("../../../models/Conversation.js");

        // 📊 Basic Stats
        const totalChats = await Conversation.countDocuments({ organizationId: orgId });

        // Count total messages by summing the size of the messages arrays in chat_turns
        const messageStats = await DailyChatBucket.aggregate([
            { $match: { organizationId: new mongoose.Types.ObjectId(orgId as string) } },
            { $unwind: "$chat_turns" },
            { $group: { _id: null, total: { $sum: { $size: "$chat_turns.messages" } } } }
        ]);
        const totalMessages = messageStats[0]?.total || 0;

        // 📞 Call Stats (Today)
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const callStats = await DailyChatBucket.aggregate([
            {
                $match: {
                    organizationId: new mongoose.Types.ObjectId(orgId as string),
                    date: { $gte: startOfDay.toISOString().split('T')[0] }
                }
            },
            { $unwind: "$chat_turns" },
            { $unwind: "$chat_turns.messages" },
            { $replaceRoot: { newRoot: "$chat_turns.messages" } },
            {
                $match: {
                    type: 'call_log',
                    createdAt: { $gte: startOfDay }
                }
            },
            {
                $group: {
                    _id: "$metadata.call_status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const callsToday = callStats.reduce((acc: number, curr: any) => acc + curr.count, 0);
        const missedCalls = callStats.find((s: any) => s._id === 'missed' || s._id === 'declined')?.count || 0;

        res.json({
            success: true,
            stats: {
                users: 0,
                messages: 0,
                totalChats,
                totalMessages,
                callsToday,
                missedCalls,
                chatTrend: []
            }
        });
    } catch (err: any) {
        console.error("Stats Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};
