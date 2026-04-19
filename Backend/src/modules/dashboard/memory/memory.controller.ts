import { Request, Response } from 'express';
import { ActivityLog } from "@modules/dashboard/timeline/ActivityLog.js";

/**
 * GET /api/v1/memory/:orgId/short-term
 * Fetch recent activity logs (short-term memory)
 */
export const getShortTermMemory = async (req: Request, res: Response) => {
    try {
        const { orgId } = req.params;
        const { limit = 50, skip = 0 } = req.query;

        const logs = await ActivityLog.find({ org_id: orgId })
            .sort({ created_at: -1 })
            .limit(Number(limit))
            .skip(Number(skip));

        const total = await ActivityLog.countDocuments({ org_id: orgId });

        res.json({
            success: true,
            logs,
            total,
            page: Math.floor(Number(skip) / Number(limit)) + 1,
            pages: Math.ceil(total / Number(limit))
        });
    } catch (error: any) {
        console.error('❌ Error fetching short-term memory:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * GET /api/v1/memory/:orgId/long-term
 * Fetch experience-based knowledge vectors (long-term memory)
 */
/**
 * GET /api/v1/memory/:orgId/long-term
 * Fetch experience-based knowledge vectors (long-term memory)
 */
export const getLongTermMemory = async (req: Request, res: Response) => {
    try {
        // Migrated to AI Engine (ChromaDB)
        // Todo: Implement Proxy to Python /v1/knowledge/list
        res.json({
            success: true,
            memories: [],
            total: 0,
            message: "Long-term memory storage migrated to AI Engine. Please use AI Studio."
        });
    } catch (error: any) {
        console.error('❌ Error fetching long-term memory:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * POST /api/v1/memory/:orgId/search
 * Search memories using keyword or semantic search
 */
export const searchMemories = async (req: Request, res: Response) => {
    try {
        // Migrated to AI Engine
        res.json({
            success: true,
            results: [],
            total: 0,
            message: "Memory search migrated to AI Engine."
        });
    } catch (error: any) {
        console.error('❌ Error searching memories:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * DELETE /api/v1/memory/:orgId/:id
 * Delete a memory (soft delete by setting is_active = false)
 */
export const deleteMemory = async (req: Request, res: Response) => {
    try {
        // Delegated to AI Engine
        res.json({
            success: true,
            message: 'Memory deletion migrated to AI Engine.'
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * PUT /api/v1/memory/:orgId/:id
 * Edit a memory's content
 */
export const editMemory = async (req: Request, res: Response) => {
    try {
        res.json({
            success: true,
            message: 'Memory editing migrated to AI Engine.'
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}


/**
     * POST /api/v1/memory/:orgId/trigger-learning
     * Manually trigger learning/analysis for past sessions (e.g. if skipped)
     */
export const triggerLearning = async (req: Request, res: Response) => {
    try {
        const { orgId } = req.params;
        const { dateFrom, dateTo, force = false } = req.body;

        // 1. Find Sessions in Range
        // Find distinct session_ids where type is 'conversation'
        const query: any = {
            org_id: orgId,
            type: 'conversation',
            timestamp: {}
        };

        if (dateFrom) query.timestamp.$gte = new Date(dateFrom);
        if (dateTo) query.timestamp.$lte = new Date(dateTo);
        // If no dates, default to last 24h
        if (!dateFrom && !dateTo) {
            query.timestamp.$gte = new Date(Date.now() - 24 * 60 * 60 * 1000);
        }

        const distinctSessions = await ActivityLog.distinct('context.session_id', query);
        console.log(`🔄 Trigger Learning: Found ${distinctSessions.length} sessions to check.`);

        let triggeredCount = 0;
        const { redis } = await import("@shared/libs/redis.js");
        const { summarizeQueue } = await import("../../../jobs/queues.js");

        for (const sessionId of distinctSessions) {
            // Check if summary already exists
            if (!force) {
                const existingSummary = await ActivityLog.findOne({
                    org_id: orgId,
                    type: 'chat_summary',
                    'context.session_id': sessionId // Fix context path
                });
                if (existingSummary) {
                    continue; // Skip if already summarized
                }
            }

            // Reconstruct History
            const logs = await ActivityLog.find({
                org_id: orgId,
                type: 'conversation',
                'context.session_id': sessionId
            }).sort({ timestamp: 1 });

            if (logs.length === 0) continue;

            const history = logs.map(log => ({
                role: log.data?.user_msg ? 'user' : 'model',
                content: log.data?.user_msg || log.data?.bot_msg || "",
                timestamp: log.timestamp ? log.timestamp.getTime() : Date.now()
            }));

            // Re-hydrate Redis
            const redisKey = `chat_history:${sessionId}`;
            await redis.del(redisKey); // Clear any debris
            for (const msg of history) {
                await redis.rpush(redisKey, JSON.stringify(msg));
            }
            await redis.expire(redisKey, 600); // 10 mins TTL

            // Trigger Job
            await summarizeQueue.add("summarize-chat", {
                socketId: sessionId,
                orgId
            }, { removeOnComplete: true });

            triggeredCount++;
        }

        res.json({
            success: true,
            message: `Triggered learning analysis for ${triggeredCount} sessions.`,
            sessions: distinctSessions.length,
            triggered: triggeredCount
        });

    } catch (error: any) {
        console.error('❌ Error triggering learning:', error);
        res.status(500).json({ error: error.message });
    }
};
