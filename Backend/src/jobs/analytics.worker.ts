import dotenv from 'dotenv';
dotenv.config();

import { Worker } from 'bullmq';
import { redisConnection } from "@shared/libs/redis.js";
import { connectDB } from "@shared/libs/mongo.js";
import { analyticsQueue } from './queues.js';
import { AnalyticsRaw } from "@modules/dashboard/analytics/AnalyticsRaw.js";
import { AnalyticsSummary } from "@modules/dashboard/analytics/AnalyticsSummary.js";

console.log('📊 [AnalyticsWorker] Initializing...');

connectDB();

const analyticsWorker = new Worker(
    analyticsQueue.name,
    async (job) => {
        try {
            const data = job.data;

            // 1. Save Raw Event (for detailed logs & auditing)
            const timestamp = data.timestamp ? new Date(data.timestamp) : new Date();

            const rawEvent = new AnalyticsRaw({
                ...data,
                timestamp
            });
            await rawEvent.save();

            // 2. Real-time Aggregation
            const date = new Date(timestamp);
            date.setHours(0, 0, 0, 0); // Normalize to midnight
            const currentHour = timestamp.getHours();

            // Check if summary exists
            let summary = await AnalyticsSummary.findOne({ websiteId: data.websiteId, date: date });

            if (!summary) {
                // Create new summary
                summary = new AnalyticsSummary({
                    websiteId: data.websiteId,
                    date: date,
                    hourlyStats: Array.from({ length: 24 }, (_, i) => ({ hour: i, visitors: 0, pageViews: 0 })),
                    hourlyChatStats: Array.from({ length: 24 }, (_, i) => ({ hour: i, chats: 0, messages: 0 })),
                    totalPageViews: 1,
                    totalSessions: data.isNewSession ? 1 : 0,
                    totalChats: data.eventType === 'chat_start' ? 1 : 0,
                    totalMessages: data.eventType === 'message_sent' ? 1 : 0
                });

                // Set initial hour stats
                summary.hourlyStats[currentHour].pageViews = 1;
                if (data.isNewSession) summary.hourlyStats[currentHour].visitors = 1;

                if (data.eventType === 'chat_start') summary.hourlyChatStats[currentHour].chats = 1;
                if (data.eventType === 'message_sent') summary.hourlyChatStats[currentHour].messages = 1;

                await summary.save();
            } else {
                // Update existing summary
                const hourUpdate: any = {};

                // Always increment page view for general events (or specific logic)
                // Assuming 'page_view' event type for page views
                if (data.eventType === 'page_view') {
                    hourUpdate[`hourlyStats.${currentHour}.pageViews`] = 1;
                }

                if (data.isNewSession) {
                    hourUpdate[`hourlyStats.${currentHour}.visitors`] = 1;
                }

                if (data.eventType === 'chat_start') {
                    hourUpdate[`hourlyChatStats.${currentHour}.chats`] = 1;
                }
                if (data.eventType === 'message_sent') {
                    hourUpdate[`hourlyChatStats.${currentHour}.messages`] = 1;
                }

                const incUpdate: any = {
                    ...hourUpdate
                };

                if (data.eventType === 'page_view') incUpdate.totalPageViews = 1;
                if (data.isNewSession) incUpdate.totalSessions = 1;
                if (data.eventType === 'chat_start') incUpdate.totalChats = 1;
                if (data.eventType === 'message_sent') incUpdate.totalMessages = 1;

                await AnalyticsSummary.updateOne(
                    { _id: summary._id },
                    { $inc: incUpdate }
                );
            }

        } catch (error: any) {
            console.error(`💀 [AnalyticsWorker] Job ${job.id} failed:`, error.message);
            throw error;
        }
    },
    {
        connection: redisConnection,
        concurrency: 5,
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 1000 }
    }
);

analyticsWorker.on('completed', (job) => {
    // console.log(`📊 [Analytics] Event processed`); 
});
analyticsWorker.on('failed', (job, err) => {
    console.log(`💀 [Analytics] Job ${job?.id} failed — ${err.message}`);
});

console.log('👷 [AnalyticsWorker] Listening to analytics-queue...');
