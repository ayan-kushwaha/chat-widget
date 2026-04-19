import cron from 'node-cron';
import { Organization } from '../modules/core/organization/Organization';
import { ActivityLog } from '../modules/dashboard/timeline/ActivityLog';
import { Message } from '../models/Message';
import { LearningMemory } from '../models/LearningMemory';

/**
 * Data Retention Service
 * Automatically prunes old logs, messages, and learning memories based on organization-level retention policies.
 */
export function startRetentionCron() {
    // Run every day at 1:00 AM
    cron.schedule('0 1 * * *', async () => {
        console.log('⏳ [Retention Cron] Checking for data to prune...');

        try {
            // Fetch organizations with their retention settings
            const orgs = await Organization.find({}, '_id limits.data_retention_days').lean();

            for (const org of orgs as any) {
                const retentionDays = org.limits?.data_retention_days || 14;
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

                // 1. Prune Activity Logs
                const logResult = await ActivityLog.deleteMany({
                    org_id: org._id,
                    timestamp: { $lt: cutoffDate }
                });

                // 2. Prune Chat History (Individual Messages)
                // Note: Keep starred messages
                const msgResult = await Message.deleteMany({
                    organizationId: org._id,
                    createdAt: { $lt: cutoffDate },
                    is_starred: { $ne: true }
                });

                // 3. Prune Learning Memory
                const learningResult = await LearningMemory.deleteMany({
                    organizationId: org._id,
                    createdAt: { $lt: cutoffDate },
                    isPermanent: { $ne: true } // Don't delete permanent memories
                });

                if (logResult.deletedCount > 0 || msgResult.deletedCount > 0 || learningResult.deletedCount > 0) {
                    console.log(`🧹 [Retention Cron] Org ${org._id}: Deleted ${logResult.deletedCount} logs, ${msgResult.deletedCount} messages, and ${learningResult.deletedCount} memories (Retention: ${retentionDays} days).`);
                }
            }

            console.log('✅ [Retention Cron] Batch pruning complete.');
        } catch (error) {
            console.error('❌ [Retention Cron] Pruning process failed:', error);
        }
    });

    console.log('✅ Data Retention cron job registered (runs daily at 1:00 AM)');
}
