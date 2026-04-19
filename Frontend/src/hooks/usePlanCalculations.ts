import { useMemo } from 'react';
import { getPlanTheme } from '@/utils/planThemes';
import { calculatePermissions } from '@/utils/permissionCalculator'; // Import Shared Utility
import { calculatePrice } from '@/lib/priceUtils';

// ----------------------------------------------------------------------
// ✅ REFACTORED: CENTRALIZED LOGIC
// ----------------------------------------------------------------------

export interface PlanCalculationProps {
    plan?: any;
    tokenLimit: number; // Slider Value
    costMultiplier?: number; // From useGeo
    manualPrice?: number | null; // Override
    planTiers: any[] | undefined; // Passed but only for names if needed
    tierDefinitions?: any[]; // REQUIRED: For Permissions & Logic
    features: any | undefined;
}

export function usePlanCalculations({
    plan,
    tokenLimit,
    manualPrice,
    costMultiplier,
    planTiers,
    tierDefinitions,
    features
}: PlanCalculationProps) {

    const isFree = plan?.id?.includes('free') || plan?.name?.toLowerCase().includes('free');

    // ✅ PERMISSIONS & PLAN NAME - Calculated using Shared Utility + API Data
    const permissions = useMemo(() => {
        // Prefer tierDefinitions if available (Full Data), fallback to planTiers (Partial)
        const sourceData = tierDefinitions || planTiers;

        if (!sourceData || sourceData.length === 0) {
            return {
                planName: 'Loading...',
                planId: 'loading',
                permissions: {}
            };
        }

        return calculatePermissions(tokenLimit, sourceData, 12000000); // 12M Max
    }, [tokenLimit, planTiers, tierDefinitions]);

    const calculatedPlanName = permissions.planName;

    // ✅ QUOTA FEATURES - Derived dynamically from Features Registry (passed as prop)
    const quotaFeatures = useMemo(() => {
        if (!features) return [];

        return Object.values(features)
            .filter((f: any) => f.type === 'numeric')
            .map((f: any) => ({
                ...f,
                value: (permissions.permissions as any)[f.id] || 0
            }));
    }, [features, permissions]);

    const allQuotaFeatures = quotaFeatures;

    // ✅ PRICE - Fully Dynamic based on Tokens (Centralized)
    const loading = !isFree && (!costMultiplier || costMultiplier <= 0) && manualPrice === undefined;

    const finalPrice = useMemo(() => {
        if (loading) return 0; // Return 0 but 'loading' flag will be true
        if (isFree) return 0;
        if (manualPrice !== undefined && manualPrice !== null) return manualPrice;

        return calculatePrice(tokenLimit, costMultiplier);
    }, [isFree, loading, tokenLimit, manualPrice, costMultiplier]);

    // Theme
    const theme = useMemo(() => {
        return getPlanTheme(calculatedPlanName, finalPrice);
    }, [calculatedPlanName, finalPrice]);

    return {
        planName: calculatedPlanName,
        isFree,
        loading, // 🚀 Expose Loading State
        permissions,
        quotaFeatures,
        allQuotaFeatures,
        finalPrice,
        theme,
        // Helper to check specific permission
        hasPermission: (id: string) => (permissions.permissions as Record<string, any>)[id] === true
    };
}
