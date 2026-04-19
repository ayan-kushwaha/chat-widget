// Permission Calculator Utility
// Calculates user permissions based on token balance
// Ported to Backend for Security & Snapshotting

import { FEATURES_REGISTRY, FeatureType } from '../config/features.config.js';

// Logic duplicated from Backend/src/utils/permissionCalculator.ts to ensure client-side parity without config dependency
interface PlanTier {
    id: string;
    name: string;
    minTokens: number;
    maxTokens?: number;
    permissions: Record<string, any>;
}

export const PLAN_TIERS: PlanTier[] = [
    {
        id: 'free',
        name: 'Free Trial',
        minTokens: 0,
        maxTokens: 299999, // 250k
        permissions: {
            max_websites: 1,
            max_website_pages: 5,
            max_files: 2,
            max_manual_qa: 5,
            max_forms: 1,
            remove_branding: false,
            auto_learning_frequency: 'weekly',
            max_team_seats: 1,
            brain_capacity_mb: 30,
            data_retention_days: 15,
            rollover_percentage: 0,
            rollover_validity_days: 0
        }
    },
    {
        id: 'starter',
        name: 'Starter',
        minTokens: 300000,
        maxTokens: 499999, // 500k
        permissions: {
            max_websites: 1,
            max_website_pages: 15,
            max_files: 10,
            max_manual_qa: 20,
            max_forms: 2,
            remove_branding: false,
            auto_learning_frequency: 'alternate_days',
            max_team_seats: 2,
            brain_capacity_mb: 40,
            data_retention_days: 31,
            rollover_percentage: 20,
            rollover_validity_days: 7
        }
    },
    {
        id: 'basic',
        name: 'Basic',
        minTokens: 500000,
        maxTokens: 999999, // 1M
        permissions: {
            max_websites: 2,
            max_website_pages: 30,
            max_files: 25,
            max_manual_qa: 40,
            max_forms: 3,
            remove_branding: true,
            auto_learning_frequency: 'alternate_days',
            max_team_seats: 3,
            brain_capacity_mb: 70,
            data_retention_days: 31,
            rollover_percentage: 20,
            rollover_validity_days: 7
        }
    },
    { // NEW TIER
        id: 'standard',
        name: 'Standard',
        minTokens: 1000000,
        maxTokens: 1999999, // 2M
        permissions: {
            max_websites: 2,
            max_website_pages: 40,
            max_files: 40,
            max_manual_qa: 60,
            max_forms: 4,
            remove_branding: true,
            auto_learning_frequency: 'daily',
            max_team_seats: 5,
            brain_capacity_mb: 100,
            data_retention_days: 45,
            rollover_percentage: 20,
            rollover_validity_days: 10
        }
    },
    {
        id: 'pro',
        name: 'Pro',
        minTokens: 2000000,
        maxTokens: 2999999, // 3M
        permissions: {
            max_websites: 3,
            max_website_pages: 60,
            max_files: 50,
            max_manual_qa: 80,
            max_forms: 5,
            remove_branding: true,
            auto_learning_frequency: 'daily',
            max_team_seats: 8,
            brain_capacity_mb: 130,
            data_retention_days: 46,
            rollover_percentage: 25,
            rollover_validity_days: 10
        }
    },
    { // NEW TIER
        id: 'advanced',
        name: 'Advanced',
        minTokens: 3000000,
        maxTokens: 3999999, // 4M
        permissions: {
            max_websites: 3,
            max_website_pages: 80,
            max_files: 65,
            max_manual_qa: 90,
            max_forms: 6,
            remove_branding: true,
            auto_learning_frequency: 'daily',
            max_team_seats: 10,
            brain_capacity_mb: 160,
            data_retention_days: 50,
            rollover_percentage: 25,
            rollover_validity_days: 10
        }
    },
    {
        id: 'business',
        name: 'Business',
        minTokens: 4000000,
        maxTokens: 5999999, // 6M
        permissions: {
            max_websites: 4,
            max_website_pages: 100,
            max_files: 80,
            max_manual_qa: 100,
            max_forms: 8,
            remove_branding: true,
            auto_learning_frequency: 'daily',
            max_team_seats: 15,
            brain_capacity_mb: 200,
            data_retention_days: 61,
            rollover_percentage: 25,
            rollover_validity_days: 10
        }
    },
    { // NEW TIER
        id: 'premium',
        name: 'Premium',
        minTokens: 6000000,
        maxTokens: 7999999, // 8M
        permissions: {
            max_websites: 4,
            max_website_pages: 120,
            max_files: 100,
            max_manual_qa: 120,
            max_forms: 10,
            remove_branding: true,
            auto_learning_frequency: 'daily',
            max_team_seats: 20,
            brain_capacity_mb: 250,
            data_retention_days: 75,
            rollover_percentage: 30,
            rollover_validity_days: 14
        }
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        minTokens: 8000000,
        maxTokens: 9999999, // 10M
        permissions: {
            max_websites: 5,
            max_website_pages: 150,
            max_files: 125,
            max_manual_qa: 150,
            max_forms: 15,
            remove_branding: true,
            auto_learning_frequency: 'daily',
            max_team_seats: 25,
            brain_capacity_mb: 275,
            data_retention_days: 91,
            rollover_percentage: 30,
            rollover_validity_days: 14
        }
    },
    {
        id: 'ultimate',
        name: 'Ultimate',
        minTokens: 10000000,
        maxTokens: 12000000,
        permissions: {
            max_websites: 6,
            max_website_pages: 200,
            max_files: 150,
            max_manual_qa: 180,
            max_forms: 20,
            remove_branding: true,
            auto_learning_frequency: 'daily',
            max_team_seats: 30,
            brain_capacity_mb: 300,
            data_retention_days: 91,
            rollover_percentage: 30,
            rollover_validity_days: 14
        }
    }
];

function getTierByTokens(tokens: number): PlanTier {
    return PLAN_TIERS.find(t =>
        tokens >= t.minTokens && (!t.maxTokens || tokens <= t.maxTokens)
    ) || PLAN_TIERS[0];
}

export interface UserPermissions {
    planName: string;
    planId: string;
    generatedAt: Date;
    tokenBalance: number;
    permissions: Record<string, any>;
}

// Shared Constants
export const MAX_TOKEN_LIMIT = 12000000; // 10 Million Tokens

/**
 * Calculate user permissions based on token balance
 */
export function calculatePermissions(tokens: number): UserPermissions {

    // Ensure tokens don't exceed global max
    const safeTokens = Math.min(tokens, MAX_TOKEN_LIMIT);

    // Find the highest tier that matches the token count
    const tier = getTierByTokens(safeTokens);

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
    featureId: string
): boolean {
    const feature = FEATURES_REGISTRY[featureId];
    if (!feature) return false;

    const value = userPermissions.permissions[featureId];

    if (feature.type === FeatureType.BOOLEAN) {
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
    featureId: string
): any {
    return userPermissions.permissions[featureId] ?? FEATURES_REGISTRY[featureId]?.defaultValue;
}

/**
 * Get all numeric (quota) features with their values
 */
export function getQuotaFeatures(userPermissions: UserPermissions) {
    return Object.entries(FEATURES_REGISTRY)
        .filter(([_, feature]) => feature.type === FeatureType.NUMERIC)
        .map(([id, feature]) => ({
            ...feature,
            value: userPermissions.permissions[id] || feature.defaultValue
        }));
}

/**
 * Get all boolean features with their values
 */
export function getBooleanFeatures(userPermissions: UserPermissions) {
    return Object.entries(FEATURES_REGISTRY)
        .filter(([_, feature]) => feature.type === FeatureType.BOOLEAN)
        .map(([id, feature]) => ({
            ...feature,
            enabled: userPermissions.permissions[id] || feature.defaultValue
        }));
}
