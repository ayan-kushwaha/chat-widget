import { Request, Response } from 'express';
import { Organization } from './Organization';
import { SnapshotService } from './snapshot.service';

/**
 * Subscription Controller
 * Handles plan subscriptions with snapshot creation
 */

export const createSubscription = async (req: Request, res: Response) => {
    try {
        const { organizationId, planData } = req.body;

        // Validate input
        if (!organizationId || !planData) {
            return res.status(400).json({
                message: 'organizationId and planData are required'
            });
        }

        // 1. Create complete plan snapshot
        const snapshot = await SnapshotService.createPlanSnapshot({
            planName: planData.plan_id || 'starter',
            priceOffer: planData.price_offer || planData.price || 0,  // Final price after discounts
            marketPrice: planData.price_market || (planData.price * 1.5) || 0,  // Market value
            currency: planData.currency || 'INR',
            billing_cycle: planData.billing_cycle || 'monthly',
            tokens: planData.tokens || 0,
            permissions: planData.permissions || {},
            orderSummary: planData.order_summary
        });

        // 2. Calculate expiration date (30 days for monthly, 365 for yearly)
        const daysToAdd = planData.billing_cycle === 'yearly' ? 365 : 30;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + daysToAdd);

        // 3. Update organization with subscription snapshot
        const organization = await Organization.findByIdAndUpdate(
            organizationId,
            {
                $set: {
                    plan: planData.plan_id || 'starter',  // Keep for backward compatibility
                    planStartDate: new Date(),
                    planEndDate: expiresAt,

                    // 🔒 LOCKED subscription configuration
                    subscription: {
                        plan_id: planData.plan_id,
                        subscribed_at: new Date(),
                        expires_at: expiresAt,
                        status: 'active',
                        snapshot: snapshot
                    },

                    // Update usage limits from snapshot
                    'usage.words_limit': snapshot.limits.max_tokens,
                    'usage.lastResetDate': new Date()
                }
            },
            { new: true }
        );

        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        const orgDoc = (organization as any).toObject();
        res.status(201).json({
            message: 'Subscription created successfully with locked rates',
            subscription: (orgDoc as any).subscription,
            expires_at: expiresAt
        });

    } catch (error: any) {
        console.error('Create subscription error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const getSubscription = async (req: Request, res: Response) => {
    try {
        const { organizationId } = req.params;

        const organization = await Organization.findById(organizationId);
        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        // Return locked subscription data (with proper type casting)
        const orgDoc = (organization as any).toObject();
        res.json({
            subscription: (orgDoc as any).subscription || null,
            usage: (orgDoc as any).usage
        });

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getRenewalPreview = async (req: Request, res: Response) => {
    try {
        const { organizationId } = req.params;
        const { newPlanData } = req.body;

        const organization = await Organization.findById(organizationId);
        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        const orgDoc = (organization as any).toObject();
        const oldSnapshot = (orgDoc as any).subscription?.snapshot;
        if (!oldSnapshot) {
            return res.status(400).json({
                message: 'No active subscription found'
            });
        }

        // Compare old vs new (Simple manual comparison as comparePlans was removed)
        const comparison = {}; // To be implemented if needed or removed

        res.json({
            current_plan: {
                name: oldSnapshot.plan_name,
                price: oldSnapshot.price_paid,
                expires_at: (orgDoc as any).subscription?.expires_at
            },
            new_plan: {
                name: newPlanData.name,
                price: newPlanData.price
            },
            changes: comparison
        });

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const renewSubscription = async (req: Request, res: Response) => {
    try {
        const { organizationId } = req.params;
        const { planData, confirmed } = req.body;

        if (!confirmed) {
            return res.status(400).json({
                message: 'User confirmation required for renewal'
            });
        }

        // Create freshSnapshot with NEW rates
        const newSnapshot = await SnapshotService.createPlanSnapshot({
            planName: planData.plan_id || 'starter',
            priceOffer: planData.price_offer || planData.price || 0,  // Final price after discounts
            marketPrice: planData.price_market || (planData.price * 1.5) || 0,  // Market value
            currency: planData.currency || 'INR',
            billing_cycle: planData.billing_cycle || 'monthly',
            tokens: planData.tokens || 0,
            permissions: planData.permissions || {},
            orderSummary: planData.order_summary
        });

        // Calculate new expiration
        const daysToAdd = planData.billing_cycle === 'yearly' ? 365 : 30;
        const newExpiresAt = new Date();
        newExpiresAt.setDate(newExpiresAt.getDate() + daysToAdd);

        // 🔄 ROLLOVER LOGIC (Phase 21 & 22) - Carry forward unused tokens
        let rollover_tokens = 0;
        let rolloverExpiryDate: Date | null = null;

        const currentOrg = await Organization.findById(organizationId);
        if (currentOrg && currentOrg.subscription?.snapshot) {
            const snapshot = currentOrg.subscription.snapshot as any;
            const currentPerms = snapshot.permissions;
            const rolloverPct = currentPerms?.rollover_percentage || 0;
            const validityDays = currentPerms?.rollover_validity_days || 0;
            const prevExpiry = currentOrg.subscription.expires_at;

            if (rolloverPct > 0) {
                // 🛡️ CHECK GRACE PERIOD (Phase 22)
                let isWithinGrace = true;
                if (prevExpiry) {
                    const graceWindow = new Date(prevExpiry);
                    graceWindow.setDate(graceWindow.getDate() + validityDays);
                    if (new Date() > graceWindow) isWithinGrace = false;
                }

                if (isWithinGrace) {
                    const totalLimit = (currentOrg.usage?.words_limit || 0);
                    const used = (currentOrg.usage?.tokensUsed || 0);
                    const unused = Math.max(0, totalLimit - used);

                    // 🟢 CORRECTED LOGIC: Min(Unused, 20% of Limit)
                    // Instead of (Unused * 20%), we take Unused BUT capped at 20% of Limit
                    const maxRollover = Math.floor(totalLimit * (rolloverPct / 100));
                    rollover_tokens = Math.min(unused, maxRollover);

                    if (rollover_tokens > 0 && validityDays > 0) {
                        const exp = new Date();
                        exp.setDate(exp.getDate() + validityDays);
                        rolloverExpiryDate = exp;
                    }
                }
            }
        }

        // Update subscription with NEW snapshot
        const organization = await Organization.findByIdAndUpdate(
            organizationId,
            {
                $set: {
                    planStartDate: new Date(),
                    planEndDate: newExpiresAt,
                    'subscription.subscribed_at': new Date(),
                    'subscription.expires_at': newExpiresAt,
                    'subscription.status': 'active',
                    'subscription.snapshot': newSnapshot,  // 🔄 NEW rates applied

                    // 🟢 Token Breakdown (Sync with Org Controller)
                    'subscription.token_capacity': (newSnapshot.limits?.max_tokens || 0) + rollover_tokens + (currentOrg?.usage?.topup_balance || 0),
                    'subscription.tokens_plan': newSnapshot.limits?.max_tokens || 0,
                    'subscription.tokens_rollover': rollover_tokens,
                    'subscription.tokens_topup': currentOrg?.usage?.topup_balance || 0,

                    'usage.tokensUsed': 0, // Reset usage
                    'usage.words_used': 0,
                    'usage.words_limit': newSnapshot.limits?.max_tokens || 0,
                    'usage.rollover_tokens': rollover_tokens,
                    'usage.rollover_expires_at': rolloverExpiryDate,
                    'usage.last_rollover_count': rollover_tokens,
                    'usage.lastResetDate': new Date()
                }
            },
            { new: true }
        );

        const orgDoc = (organization as any)?.toObject();
        res.json({
            message: 'Subscription renewed with updated rates',
            subscription: (orgDoc as any)?.subscription
        });

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
