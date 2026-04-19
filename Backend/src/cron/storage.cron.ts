import cron from 'node-cron';
import { Organization } from '../modules/core/organization/Organization.js';
import { usageService } from '../services/usage.service.js';
import { ActivityType } from '../models/ActivityLog.js';
import { STORAGE_RENT_CONFIG } from '../config/billing.config.js';

export const startStorageBillingJob = () => {
    // Run every day at midnight (00:00)
    cron.schedule('0 0 * * *', async () => {
        console.log('🗳️ Running Daily Storage Billing Job (BMW Transparency)...');

        try {
            const orgs = await Organization.find({
                is_deleted: false,
                'subscription.status': 'active'
            });

            for (const orgDoc of orgs) {
                try {
                    const org = orgDoc as any;
                    const orgId = org._id.toString();

                    // Get limits from locked snapshot or fallback
                    const limits = org.subscription?.snapshot?.limits || {};
                    const brainLimitMB = limits.brain_capacity_mb || 40; // Fallback to 40MB

                    // 2. Check Consumption from Live Usage
                    const totalUsedMB = org.usage?.storage_by_system?.total_mb || 0;

                    if (totalUsedMB > brainLimitMB) {
                        const extraMB = totalUsedMB - brainLimitMB;
                        const tokensToDeduct = Math.ceil(extraMB * STORAGE_RENT_CONFIG.RATE_PER_MB_PER_DAY);

                        if (tokensToDeduct > 0) {
                            console.log(`💸 [BMW Rent] Deducting ${tokensToDeduct} tokens from Org ${org.name} for ${extraMB.toFixed(2)}MB extra storage.`);

                            // Centralized tracking (Updates tank AND logs activity)
                            await usageService.trackActivity(
                                orgId,
                                ActivityType.STORAGE_RENT,
                                extraMB, // rawAmount is MB
                                { totalUsedMB, limitMB: brainLimitMB, tokensDeducted: tokensToDeduct },
                                `Daily Storage Rent for ${extraMB.toFixed(2)}MB extra data`
                            );
                        }
                    }
                } catch (err) {
                    console.error(`❌ Failed to process storage bill for Org:`, err);
                }
            }
            console.log(`✅ Daily Storage Billing Completed for ${orgs.length} organizations.`);

        } catch (error) {
            console.error('❌ Storage Billing Cron Failed:', error);
        }
    });
};
