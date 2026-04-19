/**
 * Hook to check feature access based on user's subscription snapshot
 * Returns lock status and latest plan for upgrade modal
 */

import { useEffect, useState } from 'react';
import { subscriptionsAPI } from '@/api/subscriptions.api';
import { PlanComparisonService } from '@/services/plan-comparison.service';

interface UseFeatureAccessResult {
    hasAccess: (featureId: string) => boolean;
    isLoading: boolean;
    snapshot: any;
    latestPlans: any[];
    showUpgradeModal: (featureId: string) => {
        feature: any;
        latestPlan: any;
    } | null;
}

export function useFeatureAccess(organizationId: string | undefined): UseFeatureAccessResult {
    const [snapshot, setSnapshot] = useState<any>(null);
    const [latestPlans, setLatestPlans] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!organizationId) return;

        const fetchData = async () => {
            try {
                // 1. Get user's locked subscription snapshot
                const subRes = await subscriptionsAPI.get(organizationId);
                setSnapshot(subRes.data.subscription?.snapshot);

                // 2. Get latest available plans (for comparison)
                // TODO: Replace with actual plans API when ready
                // const plansRes = await plansAPI.getAll();
                // setLatestPlans(plansRes.data);

            } catch (error) {
                console.error('Failed to fetch subscription data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [organizationId]);

    const hasAccess = (featureId: string): boolean => {
        if (!snapshot) return false; // Safe default: no access if no snapshot
        return PlanComparisonService.hasFeatureAccess(snapshot, featureId);
    };

    const showUpgradeModal = (featureId: string) => {
        if (!snapshot || latestPlans.length === 0) return null;

        // Find the feature in latest plans
        let foundFeature: any = null;
        let foundPlan: any = null;

        for (const plan of latestPlans) {
            const feature = plan.features?.find((f: any) => f.id === featureId);
            if (feature) {
                foundFeature = feature;
                foundPlan = plan;
                break;
            }
        }

        if (!foundFeature || !foundPlan) return null;

        return {
            feature: foundFeature,
            latestPlan: foundPlan
        };
    };

    return {
        hasAccess,
        isLoading,
        snapshot,
        latestPlans,
        showUpgradeModal
    };
}
