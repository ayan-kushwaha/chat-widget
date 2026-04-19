import { Organization } from '../modules/core/organization/Organization.js';

/**
 * 🔄 SUBSCRIPTION STATUS AUTO-UPDATE UTILITY
 * 
 * Automatically calculates and updates subscription status based on:
 * 1. Time-based expiry (expires_at)
 * 2. Token exhaustion (tokensUsed >= token_capacity)
 * 3. No plan exists (null)
 * 
 * Status Types:
 * - 'active': Valid plan with available tokens
 * - 'expired': Plan time has ended
 * - 'paused': All tokens exhausted (auto-pause)
 * - null: No subscription exists
 */
export async function updateSubscriptionStatus(
    organization: any
): Promise<'active' | 'expired' | 'paused' | null> {
    try {
        // 1. Check if subscription exists
        if (!organization.subscription || !organization.subscription.plan_id) {
            // No subscription → set to null
            if (organization.subscription) {
                organization.subscription.status = null as any;
                await organization.save();
            }
            return null;
        }

        const sub = organization.subscription;
        const now = new Date();
        let newStatus: 'active' | 'expired' | 'paused' = 'active';

        // 2. Check Time-Based Expiry
        if (sub.expires_at && now > new Date(sub.expires_at)) {
            newStatus = 'expired';
            console.log(`⏰ Subscription expired for org ${organization._id}`);
        }
        // 3. Check Token Exhaustion (Paused)
        else if (sub.token_capacity) {
            const tokensUsed = organization.usage?.tokensUsed || 0;
            const capacity = sub.token_capacity;

            if (tokensUsed >= capacity) {
                newStatus = 'paused';
                console.log(`⏸️ Subscription paused (tokens exhausted) for org ${organization._id}: ${tokensUsed}/${capacity}`);
            }
        }

        // 4. Update status if changed
        if (sub.status !== newStatus) {
            console.log(`🔄 Updating subscription status: ${sub.status} → ${newStatus}`);
            sub.status = newStatus;
            await organization.save();
        }

        return newStatus;

    } catch (error: any) {
        console.error('Error updating subscription status:', error.message);
        throw error;
    }
}

/**
 * 🛡️ VALIDATION HELPER: Check if subscription is usable
 * Throws specific error if subscription is invalid
 */
export async function validateSubscriptionStatus(
    organization: any
): Promise<void> {
    const status = await updateSubscriptionStatus(organization);

    if (status === null) {
        throw new Error('No active subscription. Please subscribe to a plan.');
    }

    if (status === 'expired') {
        throw new Error('Subscription has expired. Please renew to continue.');
    }

    if (status === 'paused') {
        throw new Error('Token limit reached. Your subscription is paused. Please upgrade or top-up.');
    }

    // Status is 'active' - all good!
}
