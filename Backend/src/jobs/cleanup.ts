import cron from 'node-cron';
import { ActivityLog } from "@modules/dashboard/timeline/ActivityLog.js";

/**
 * Data Cleanup Service
 * Removes old activity logs based on TTL rules to prevent database bloat
 * 
 * Note: MongoDB TTL index on activity_logs handles automatic deletion,
 * but this provides manual cleanup + monitoring
 */
export function startDataCleanup() {
    // Run every day at 3:00 AM (low traffic time)
    cron.schedule('0 3 * * *', async () => {
        console.log('🗑️ [Data Cleanup] Starting cleanup job...');

        try {
            const result = await performCleanup();
            console.log(`✅ [Data Cleanup] Completed. Removed ${result.deletedCount} old records`);
        } catch (error) {
            console.error('❌ [Data Cleanup] Failed:', error);
        }
    });

    console.log('✅ Data Cleanup cron job registered (runs daily at 3 AM)');
}

async function performCleanup() {
    // Delete activity_logs older than 30 days (except daily_digest which should stay longer)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await ActivityLog.deleteMany({
        type: { $ne: 'daily_digest' }, // Don't delete daily digests
        created_at: { $lt: thirtyDaysAgo }
    });

    console.log(`🗑️ [Data Cleanup] Deleted ${result.deletedCount} chat summaries older than 30 days`);

    // Optional: Clean up very old daily digests (older than 60 days)
    // Since weekly reports are created, we can safely remove old daily digests
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const digestResult = await ActivityLog.deleteMany({
        type: 'daily_digest',
        'metadata.processed': true, // Only delete if it was used in weekly rollup
        created_at: { $lt: sixtyDaysAgo }
    });

    console.log(`🗑️ [Data Cleanup] Deleted ${digestResult.deletedCount} processed daily digests older than 60 days`);

    // --- 🧹 PHASE 4: MESSAGE DELETION PURGE (90 DAYS) ---
    // Remove labels like "You deleted this message" after 90 days of storage.
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { DailyChatBucket } = await import("../models/DailyChatBucket.js");
    const labelResult = await DailyChatBucket.updateMany(
        {},
        {
            $pull: {
                "chat_turns.$[].messages": {
                    $or: [
                        { isDeleted: true },
                        { deletedFor: { $exists: true, $not: { $size: 0 } } }
                    ],
                    updatedAt: { $lt: ninetyDaysAgo }
                }
            }
        }
    );

    console.log(`🗑️ [Data Cleanup] Purged ${labelResult.modifiedCount} deleted labels older than 90 days`);

    // --- 🌪️ PHASE 5: ZERO-TRACE WIPE HARD PURGE (24 HOURS) ---
    // Physically destroy data that has been hidden for more than 24 hours.
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    // Find and kill universal wipes
    const { deleteFile } = await import("../modules/shared/services/storage.service.js");

    // 1. Find buckets with wiped messages needing hard purge
    const bucketsWithWiped = await DailyChatBucket.aggregate([
        { $unwind: "$chat_turns" },
        { $unwind: "$chat_turns.messages" },
        {
            $match: {
                "chat_turns.messages.isWiped": true,
                "chat_turns.messages.wipedAt": { $lt: oneDayAgo }
            }
        },
        { $replaceRoot: { newRoot: "$chat_turns.messages" } }
    ]);

    let wipeCount = 0;
    if (bucketsWithWiped.length > 0) {
        for (const msg of bucketsWithWiped) {
            // Kill storage if image/file
            if (msg.type === 'image' || msg.metadata?.url) {
                const url = msg.metadata?.url || msg.content;
                if (url && (url.startsWith('http') || url.includes('/cluaiz-storage/'))) {
                    await deleteFile(url).catch(() => { });
                }
            }
        }

        // 2. Hard purge the messages from the arrays
        const delRes = await DailyChatBucket.updateMany(
            {},
            {
                $pull: {
                    "chat_turns.$[].messages": {
                        isWiped: true,
                        wipedAt: { $lt: oneDayAgo }
                    }
                }
            }
        );
        wipeCount = bucketsWithWiped.length; // Approximate count of actual messages deleted
    }

    console.log(`🌪️ [Zero-Trace] Hard-purged ${wipeCount} universal wipe records.`);

    // NOTE: User-side wipe (wipedForUserSide) is NOT deleted automatically.
    // It only HIDES messages from users - Admin can still see them.
    // No TTL for user-side hide - it's permanent until restored.

    return {
        deletedCount: result.deletedCount + digestResult.deletedCount + (labelResult.modifiedCount || 0) + wipeCount
    };
}
