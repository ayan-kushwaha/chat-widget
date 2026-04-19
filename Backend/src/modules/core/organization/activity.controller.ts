import { Request, Response } from 'express';
import { ActivityLog, ActivityType } from '../../../models/ActivityLog.js';
import { Organization } from './Organization.js';
import mongoose from 'mongoose';

/**
 * Get Activity Logs for an Organization
 * GET /api/organizations/activity
 */
export const getActivityLogs = async (req: Request, res: Response) => {
    try {
        const orgId = req.headers['x-org-id'] || (req as any).user?.orgId;

        console.log('📊 Activity logs request:', { orgId, headers: req.headers });

        if (!orgId) {
            console.log('❌ No org ID provided');
            return res.status(400).json({ success: false, message: "Organization ID required" });
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const typeFilter = req.query.type as string;

        // ✅ Convert to ObjectId for MongoDB query
        const query: any = { organizationId: new mongoose.Types.ObjectId(orgId as string) };

        console.log('🔍 Fetching daily logs:', query);

        // Fetch daily bucket logs, sorted by date (most recent first)
        const dailyLogs = await ActivityLog.find(query)
            .sort({ date: -1 })
            .limit(50); // Fetch enough days to get requested entries

        console.log('📦 Daily logs found:', dailyLogs.length);

        // Flatten history from nested activities map
        const flattenedLogs: any[] = [];
        for (const dayLog of dailyLogs) {
            console.log('🔄 Processing dayLog:', { date: dayLog.date, activitiesType: typeof dayLog.activities });

            // Convert Map to object for iteration
            let activitiesObj: any = {};

            if (dayLog.activities instanceof Map) {
                console.log('ℹ️ Detected Mongoose Map, converting...');
                activitiesObj = Object.fromEntries(dayLog.activities);
            } else if (typeof (dayLog.activities as any).toObject === 'function') {
                console.log('ℹ️ Using .toObject()...');
                activitiesObj = (dayLog.activities as any).toObject();
            } else {
                console.log('ℹ️ Using raw object...');
                activitiesObj = dayLog.activities;
            }

            console.log('🗂️ Activities object keys:', Object.keys(activitiesObj));

            for (const [activityType, activityData] of Object.entries(activitiesObj as any)) {
                console.log(`📋 Processing activity type: ${activityType}`, {
                    hasHistory: !!(activityData as any).history,
                    historyLength: (activityData as any).history?.length
                });

                // Filter by type if specified
                if (typeFilter && activityType !== typeFilter) continue;

                // Extract each entry from history
                const data = activityData as any;
                if (!data.history || !Array.isArray(data.history)) {
                    console.log(`⚠️ Skipping ${activityType} - no valid history array`);
                    continue;
                }

                for (const entry of data.history) {
                    const timestamp = new Date(entry.t * 1000);
                    // FIXED: UI Display Logic (Prioritize 'd' field for custom split logs)
                    const details = entry.d ? entry.d : getActivityDescription(activityType as ActivityType, entry.r);

                    // 🔍 Search Filter (Text match)
                    if (req.query.search) {
                        const search = (req.query.search as string).toLowerCase();
                        if (!details.toLowerCase().includes(search) && !activityType.toLowerCase().includes(search)) {
                            continue;
                        }
                    }

                    // 📅 Date Filter
                    if (req.query.startDate) {
                        if (timestamp < new Date(req.query.startDate as string)) continue;
                    }
                    if (req.query.endDate) {
                        const end = new Date(req.query.endDate as string);
                        end.setHours(23, 59, 59, 999); // End of day
                        if (timestamp > end) continue;
                    }

                    flattenedLogs.push({
                        _id: entry._id,
                        type: activityType,
                        tokensBurned: entry.b,
                        rawAmount: entry.r,
                        multiplier: entry.m,
                        input_multiplier: entry.im,
                        output_multiplier: entry.om,
                        details: details,
                        metadata: {
                            input_tokens: entry.i,
                            output_tokens: entry.o,
                            total_tokens: entry.r,
                            energy_metrics: entry.em, // ⚡ RAW: cpu_secs, net_mb, density
                            energy_tokens: entry.er   // ⚡ CALC: tokens specifically for energy
                        },
                        timestamp: timestamp, // Convert Unix to Date
                        date: dayLog.date
                    });
                }
            }
        }

        // Calculate Aggregated Stats from all fetched logs (respecting date query)
        // We calculate this from the flattened logs to be most accurate to the current view filters
        // OR we can calculate from the Daily Totals for 'Type' based accuracy over the period.
        // Let's use the Daily Totals for performance and "General Usage by Type" accuracy.

        const usageStats: Record<string, number> = {};
        const totalBurned = 0;

        for (const dayLog of dailyLogs) {
            // Convert Map to object
            let activitiesObj: any = {};
            if (dayLog.activities instanceof Map) {
                activitiesObj = Object.fromEntries(dayLog.activities);
            } else if (typeof (dayLog.activities as any).toObject === 'function') {
                activitiesObj = (dayLog.activities as any).toObject();
            } else {
                activitiesObj = dayLog.activities;
            }

            for (const [type, data] of Object.entries(activitiesObj as any)) {
                // If type filter is active, only count that type
                if (typeFilter && type !== typeFilter) continue;

                // Sum up totals
                usageStats[type] = (usageStats[type] || 0) + ((data as any).total || 0);
            }
        }

        console.log('✅ Flattened logs:', flattenedLogs.length);

        // Sort by timestamp (most recent first) and paginate
        flattenedLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        const paginatedLogs = flattenedLogs.slice((page - 1) * limit, page * limit);

        res.json({
            success: true,
            logs: paginatedLogs,
            stats: usageStats, // ✅ Send Stats to Frontend
            pagination: {
                total: flattenedLogs.length,
                page,
                limit,
                pages: Math.ceil(flattenedLogs.length / limit)
            }
        });

    } catch (error: any) {
        console.error("❌ Error fetching activity logs:", error.message);
        console.error("Stack:", error.stack);
        res.status(500).json({ success: false, message: "Failed to fetch activity logs" });
    }
};

/**
 * Export Activity Logs as CSV
 * GET /api/organizations/activity/export
 */
export const exportActivityLogs = async (req: Request, res: Response) => {
    try {
        const orgId = req.headers['x-org-id'] || (req as any).user?.orgId;

        if (!orgId) {
            return res.status(400).json({ success: false, message: "Organization ID required" });
        }

        const dailyLogs = await ActivityLog.find({ organizationId: orgId }).sort({ date: -1 });

        // Generate CSV Content - flatten nested activities
        let csv = "Timestamp,Type,Tokens Burned,Amount,Multiplier,Details\n";
        for (const dayLog of dailyLogs) {
            const activitiesObj = dayLog.activities.toObject ? dayLog.activities.toObject() : dayLog.activities;

            for (const [activityType, activityData] of Object.entries(activitiesObj as any)) {
                const data = activityData as any;
                for (const entry of data.history) {
                    const timestamp = new Date(entry.t * 1000).toISOString();
                    const details = getActivityDescription(activityType as ActivityType, entry.r);
                    csv += `${timestamp},${activityType},${entry.b},${entry.r},${entry.m}, "${details}"\n`;
                }
            }
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename = cluaiz - activity - audit - ${orgId}.csv`);
        res.status(200).send(csv);

    } catch (error: any) {
        console.error("❌ Error exporting activity logs:", error.message);
        res.status(500).json({ success: false, message: "Failed to export audit" });
    }
};

/**
 * Helper: Generate human-readable description from activity type and amount
 */
function getActivityDescription(type: ActivityType, amount: number): string {
    switch (type) {
        case ActivityType.AI_CHAT: return `AI Conversation Processing(${amount} tokens)`;
        case ActivityType.STORAGE_RENT: return `Daily Storage Rent for extra data(${amount} MB)`;
        case ActivityType.BRAIN_CRAWL: return `Web Content Training(${amount} tokens)`;
        case ActivityType.BRAIN_UPLOAD: return `File Upload Processing(${amount} tokens)`;
        case ActivityType.MANUAL_TRAINING: return `Manual Knowledge Training(${amount} tokens)`;
        case ActivityType.HUMAN_HANDOFF: return `Human Agent Handoff Session`;
        default: return `AI System Activity - ${type} `;
    }
}
