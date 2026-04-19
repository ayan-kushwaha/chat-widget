import { useOrg } from '@/context/OrgContext';
import { calculatePermissions } from '@/utils/permissionCalculator';
import { useSystemConfig } from './useSystemConfig';

type LimitKey = 'teamMembers' | 'chatbots' | 'monthlyTokens' | 'websitePages' | 'fileUploads' | 'leadForms' | 'automationFlows';
type FeatureKey = 'removeBranding' | 'whatsappIntegration' | 'visionAI' | 'competitorSpy' | 'trendScout' | 'contentGenerator';

interface PlanLimitResult {
    canUse: boolean;
    limit: number;
    currentUsage: number;
    isUnlimited: boolean;
    remaining: number;
    plan: string;
}

interface FeatureAvailability {
    available: boolean;
    plan: string;
    upgradeRequired: boolean;
}

export const usePlanLimits = () => {
    const { activeOrg } = useOrg();
    const { config } = useSystemConfig();
    const planTiers = config?.planTiers || [];

    // Get current plan limits (Client-Side Optimistic Calc)
    // In future, this should ideally come from the useOrg context directly if the backend returns fully resolved limits.
    const limits = calculatePermissions(0, planTiers); // Default to 0/Free if token balance unknown. 
    // TODO: Pass actual token balance from Context when available.

    /**
     * Check if a limit-based feature can be used
     * @param limitKey - The limit to check (e.g., 'max_chatbots', 'max_team_seats')
     * @param currentUsage - Current usage count (optional, defaults to 0)
     */
    const checkLimit = (limitKey: string, currentUsage: number = 0): PlanLimitResult => {
        // Map old keys to new keys if necessary, or assume consumer passes new snake_case keys
        // MAPPING: teamMembers -> max_team_seats, etc.
        const keyMap: Record<string, string> = {
            'teamMembers': 'max_team_seats',
            'chatbots': 'max_chatbots',
            'monthlyTokens': 'monthly_tokens', // Not a hard limit in new model usually, but checkable
            'websitePages': 'max_website_pages',
            'fileUploads': 'max_files',
            'leadForms': 'max_forms',
            'automationFlows': 'max_flows' // Assuming this exists or defaults to 0
        };

        const actualKey = keyMap[limitKey] || limitKey;
        const limit = limits.permissions[actualKey] ?? 0;

        // -1 or very high number implies unlimited
        const unlimited = limit === -1 || limit >= 999999999;
        const canUse = unlimited || (currentUsage < limit);
        const remaining = unlimited ? 9999 : Math.max(0, limit - currentUsage);

        return {
            canUse,
            limit,
            currentUsage,
            isUnlimited: unlimited,
            remaining,
            plan: limits.planName,
        };
    };

    /**
     * Check if a feature flag is available
     * @param featureKey - The feature to check (e.g., 'vision_ai', 'whatsapp_integration')
     */
    const checkFeature = (featureKey: string): FeatureAvailability => {
        // Map old camelCase to snake_case if needed
        const keyMap: Record<string, string> = {
            'removeBranding': 'remove_branding',
            'whatsappIntegration': 'whatsapp_integration',
            'visionAI': 'vision_ai',
            'competitorSpy': 'competitor_spy',
            'trendScout': 'trend_scout',
            'contentGenerator': 'content_generator'
        };

        const actualKey = keyMap[featureKey] || featureKey;
        const available = !!limits.permissions[actualKey];

        return {
            available,
            plan: limits.planName,
            upgradeRequired: !available,
        };
    };

    /**
     * Get upgrade message for a feature
     */
    const getUpgradeMessage = (limitKey?: string, featureKey?: string): string => {
        if (limitKey) {
            const result = checkLimit(limitKey);
            return `Your ${limits.planName} plan is limited to ${result.limit} ${limitKey}. Upgrade to add more.`;
        }
        if (featureKey) {
            return `${featureKey} is not available on ${limits.planName} plan. Upgrade to unlock this feature.`;
        }
        return `Upgrade your plan to access more features.`;
    };

    /**
     * Check if user can add team member
     */
    const canAddTeamMember = (currentTeamSize: number): PlanLimitResult => {
        return checkLimit('teamMembers', currentTeamSize);
    };

    /**
     * Check if user can create chatbot
     */
    const canCreateChatbot = (currentChatbots: number): PlanLimitResult => {
        return checkLimit('chatbots', currentChatbots);
    };

    /**
     * Check if user can upload file
     */
    const canUploadFile = (currentFiles: number): PlanLimitResult => {
        return checkLimit('fileUploads', currentFiles);
    };

    /**
     * Check if user can create automation flow
     */
    const canCreateFlow = (currentFlows: number): PlanLimitResult => {
        return checkLimit('automationFlows', currentFlows);
    };

    /**
     * Check if user can create lead form
     */
    const canCreateLeadForm = (currentForms: number): PlanLimitResult => {
        return checkLimit('leadForms', currentForms);
    };

    /**
     * Check tokens usage
     */
    const checkTokens = (usedTokens: number): PlanLimitResult => {
        return checkLimit('monthlyTokens', usedTokens);
    };

    return {
        // Current plan info
        currentPlan: limits, // Use limits object as plan surrogate for now
        planName: limits.planName,
        planId: limits.planId,

        // Generic checkers
        checkLimit,
        checkFeature,
        getUpgradeMessage,

        // Specific feature checkers
        canAddTeamMember,
        canCreateChatbot,
        canUploadFile,
        canCreateFlow,
        canCreateLeadForm,
        checkTokens,

        // Feature availability
        hasRemoveBranding: !!limits.permissions['remove_branding'],
        hasWhatsApp: !!limits.permissions['whatsapp_integration'],
        hasVisionAI: !!limits.permissions['vision_ai'],
        hasCompetitorSpy: !!limits.permissions['competitor_spy'],
        hasTrendScout: !!limits.permissions['trend_scout'],
        hasContentGenerator: !!limits.permissions['content_generator'],
    };
};
