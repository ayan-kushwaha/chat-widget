// Permission Calculator Utility (Dynamic - API Driven)
// Calculates user permissions based on token balance using injected config

// Note: No hardcoded PLAN_TIERS or FEATURES_REGISTRY here anymore.
// Data must be passed from 'useSystemConfig' hook.

export interface PlanTier {
    id: string;
    name: string;
    minTokens: number;
    maxTokens?: number;
    pricing?: {
        inr: number;
        usd: number;
        interval: string;
    };
    isActive?: boolean;
    isPublic?: boolean;
    permissions: Record<string, any>;
}

interface FeatureDefinition {
    id: string;
    type: 'boolean' | 'numeric' | 'enum';
    label: string;
    description: string;
    category: string;
    defaultValue: any;
    unit?: string;
    options?: string[];
    icon?: string;
    burn_rate?: string;
}

export interface UserPermissions {
    planName: string;
    planId: string;
    generatedAt: Date;
    tokenBalance: number;
    permissions: Record<string, any>;
}

// Shared Constants (Can be fetched from API too, but fine to keep consistent fallback)
export const MAX_TOKEN_LIMIT_FALLBACK = 12000000;

// Helper to find tier from Dynamic List
function getTierByTokens(tokens: number, planTiers: any[]): PlanTier {
    if (!planTiers || planTiers.length === 0) return { id: 'unknown', name: 'Unknown', minTokens: 0, permissions: {} }; // Safe fallback

    return planTiers.find(t =>
        tokens >= t.minTokens && (!t.maxTokens || tokens <= t.maxTokens)
    ) ?? planTiers[0] ?? { id: 'unknown', name: 'Unknown', minTokens: 0, permissions: {} };
}

/**
 * Calculate user permissions based on token balance AND Provided Plan Config
 */
export function calculatePermissions(tokens: number, planTiers: any[], maxTokensLimit: number = MAX_TOKEN_LIMIT_FALLBACK): UserPermissions {

    // Ensure tokens don't exceed global max
    const safeTokens = Math.min(tokens, maxTokensLimit);

    // Find the highest tier that matches the token count
    const tier = getTierByTokens(safeTokens, planTiers);

    return {
        planName: tier.name,
        planId: tier.id,
        generatedAt: new Date(),
        tokenBalance: tokens,
        permissions: { ...tier.permissions }
    };
}

/**
 * Check if user has a specific boolean permission
 */
export function hasPermission(
    userPermissions: UserPermissions,
    featureId: string,
    featuresRegistry: Record<string, FeatureDefinition>
): boolean {
    const feature = featuresRegistry[featureId];
    if (!feature) return false;

    const value = userPermissions.permissions[featureId];

    if (feature.type === 'boolean') {
        return value === true;
    }

    return value !== undefined && value !== null;
}

/**
 * Check if user can perform action based on quota
 */
export function checkQuota(
    userPermissions: UserPermissions,
    featureId: string,
    currentUsage: number
): { allowed: boolean; limit: number; remaining: number } {
    const limit = userPermissions.permissions[featureId] || 0;
    const remaining = Math.max(0, limit - currentUsage);

    return {
        allowed: currentUsage < limit,
        limit,
        remaining
    };
}

/**
 * Get feature value for display
 */
export function getFeatureValue(
    userPermissions: UserPermissions,
    featureId: string,
    featuresRegistry: Record<string, FeatureDefinition>
): any {
    return userPermissions.permissions[featureId] ?? featuresRegistry[featureId]?.defaultValue;
}

/**
 * Get all numeric (quota) features with their values
 */
export function getQuotaFeatures(userPermissions: UserPermissions, featuresRegistry: Record<string, FeatureDefinition>) {
    if (!featuresRegistry) return [];
    return Object.entries(featuresRegistry)
        .filter(([_, feature]) => feature.type === 'numeric')
        .map(([id, feature]) => ({
            ...feature,
            value: userPermissions.permissions[id] || feature.defaultValue
        }));
}

/**
 * Get all boolean features with their values
 */
export function getBooleanFeatures(userPermissions: UserPermissions, featuresRegistry: Record<string, FeatureDefinition>) {
    if (!featuresRegistry) return [];
    return Object.entries(featuresRegistry)
        .filter(([_, feature]) => feature.type === 'boolean')
        .map(([id, feature]) => ({
            ...feature,
            enabled: userPermissions.permissions[id] || feature.defaultValue
        }));
}



