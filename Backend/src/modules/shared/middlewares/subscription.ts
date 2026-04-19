import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import { Organization } from "../../core/organization/Organization";

/**
 * Subscription Middleware (Lazy Expiration Check)
 * This ensures that even if the cron hasn't run, the user is blocked
 * immediately if their plan has expired.
 */
export const checkSubscriptionStatus = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const orgId = req.headers['x-org-id'] || req.user?.organizationId;

        if (!orgId) {
            return next();
        }

        const org = await Organization.findById(orgId);
        if (!org) {
            return next();
        }

        // 🛡️ RECHECK EXPIRATION (Lazy Check)
        const now = new Date();

        // 1. Plan Expiration
        if (
            org.subscription?.status === 'active' &&
            org.subscription?.expires_at &&
            org.subscription.expires_at < now
        ) {
            console.log(`⏳ [Lazy Check] Expiring plan for Org: ${orgId}`);

            // Sync DB immediately
            org.subscription.status = 'expired' as any;
            await org.save();

            return res.status(403).json({
                success: false,
                message: "Your subscription has expired. Please renew to continue using premium features.",
                code: "SUBSCRIPTION_EXPIRED"
            });
        }

        // 2. Rollover Token Expiration (Phase 22 - FIX)
        if (
            org.usage?.rollover_tokens &&
            org.usage?.rollover_expires_at &&
            org.usage.rollover_expires_at < now
        ) {
            console.log(`🧹 [Lazy Check] Clearing expired rollover tokens for Org: ${orgId}`);
            org.usage.rollover_tokens = 0;
            org.usage.rollover_expires_at = null as any;
            await org.save();
            // We don't block the request here, just clear the tokens
        }

        // Block if already marked as expired
        if (org.subscription?.status === 'expired') {
            return res.status(403).json({
                success: false,
                message: "Subscription expired. Please upgrade your plan.",
                code: "SUBSCRIPTION_EXPIRED"
            });
        }

        next();
    } catch (error) {
        console.error("❌ Subscription Check Error:", error);
        next(); // Don't block if DB check fails (non-critical)
    }
};
