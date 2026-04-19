import cron from 'node-cron';
import { redis } from "@shared/libs/redis";
import { AnalyticsModel } from "@modules/dashboard/analytics/Analytics.js";

export const startAnalyticsAggregator = () => {
    // Run every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        console.log('🔄 Running Analytics Aggregator...');

        try {
            // Pop all items from the list
            // In a real high-scale app, we'd pop a batch (e.g. 1000)
            // For now, we'll fetch all using lrange and then del, or just loop pop
            // Using a transaction (multi) to read and clear is safer

            const events = await redis.lrange('analytics_queue', 0, -1);
            if (events.length === 0) return;

            await redis.del('analytics_queue');

            const parsedEvents = events.map(e => {
                const parsed = JSON.parse(e);
                return {
                    type: parsed.type,
                    data: parsed.data,
                    timestamp: new Date(parsed.timestamp || Date.now())
                };
            });

            console.log(`📊 Aggregated ${parsedEvents.length} events.`);

            // Save to MongoDB (Bulk Write)
            await AnalyticsModel.insertMany(parsedEvents);

        } catch (error) {
            console.error('❌ Analytics Aggregator Failed:', error);
        }
    });
};
