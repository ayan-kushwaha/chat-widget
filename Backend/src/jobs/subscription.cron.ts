import cron from 'node-cron';
import { Organization } from '../modules/core/organization/Organization';

/**
 * Subscription Expiration Service
 * Automatically marks organizations as 'expired' when their plan duration ends.
 */
export function startSubscriptionCron() {
    // Run every day at midnight (00:00)
    cron.schedule('0 0 * * *', async () => {
        console.log('⏳ [Subscription Cron] Checking for expired plans...');

        try {
            const now = new Date();

            // Find organizations that are 'active' but their expiry date has passed
            const result = await Organization.updateMany(
                {
                    'subscription.status': 'active',
                    'subscription.expires_at': { $lt: now }
                },
                {
                    $set: { 'subscription.status': 'expired' }
                }
            );

            if (result.modifiedCount > 0) {
                console.log(`✅ [Subscription Cron] Successfully expired ${result.modifiedCount} plans.`);
            }

            // 🛡️ 2. Clear expired rollover balances (Phase 22)
            const rolloverResult = await Organization.updateMany(
                {
                    'usage.rollover_expires_at': { $lt: now },
                    'usage.rollover_tokens': { $gt: 0 }
                },
                {
                    $set: {
                        'usage.rollover_tokens': 0,
                        'usage.rollover_expires_at': null
                    }
                }
            );

            if (rolloverResult.modifiedCount > 0) {
                console.log(`🧹 [Subscription Cron] Cleared expired rollover balance for ${rolloverResult.modifiedCount} organizations.`);
            }
        } catch (error) {
            console.error('❌ [Subscription Cron] Failed to process expirations:', error);
        }
    });

    console.log('✅ Subscription Expiration cron job registered (runs daily at midnight)');
}
