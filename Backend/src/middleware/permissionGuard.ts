// Permission Guard Middleware
// Protects routes based on user permissions

import { Request, Response, NextFunction } from 'express';
import { hasPermission, checkQuota } from '../utils/permissionCalculator';

// Extend Express Request type to include permissions
declare global {
    namespace Express {
        interface Request {
            permissions?: Record<string, any>;
            quota?: {
                allowed: boolean;
                limit: number;
                remaining: number;
            };
        }
    }
}

/**
 * Middleware: Require a boolean permission
 * Usage: router.post('/endpoint', requirePermission('remove_branding'), handler)
 */
export function requirePermission(featureId: string) {
    return (req: Request, res: Response, next: NextFunction) => {
        // Get permissions from request (set by auth middleware)
        const permissions = req.permissions || {};

        if (!hasPermission(permissions as any, featureId)) {
            return res.status(403).json({
                success: false,
                error: 'Permission denied',
                message: `Your plan doesn't include the '${featureId}' feature. Please upgrade your plan.`,
                requiredFeature: featureId,
                upgradeUrl: '/pricing'
            });
        }

        next();
    };
}

/**
 * Middleware: Require quota availability
 * Usage: router.post('/website', requireQuota('max_websites', getCurrentCount), handler)
 */
export function requireQuota(
    featureId: string,
    getCurrentUsage: (req: Request) => Promise<number>
) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const permissions = req.permissions || {};

        try {
            const currentUsage = await getCurrentUsage(req);
            const quota = checkQuota(permissions as any, featureId, currentUsage);

            if (!quota.allowed) {
                return res.status(403).json({
                    success: false,
                    error: 'Quota exceeded',
                    message: `You've reached your limit of ${quota.limit} for '${featureId}'. Please upgrade your plan.`,
                    quota: {
                        feature: featureId,
                        limit: quota.limit,
                        current: currentUsage,
                        remaining: 0
                    },
                    upgradeUrl: '/pricing'
                });
            }

            // Attach quota info to request for controller use
            req.quota = quota;
            next();
        } catch (error) {
            console.error('Error checking quota:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to check quota',
                message: 'An error occurred while checking your usage limits.'
            });
        }
    };
}

/**
 * Helper: Get feature value from permissions
 */
export function getFeatureValue(permissions: Record<string, any>, featureId: string): any {
    return permissions[featureId];
}
