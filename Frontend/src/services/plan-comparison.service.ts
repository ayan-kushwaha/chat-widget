/**
 * Plan Comparison Service
 * Compares user's locked snapshot with latest plan to show what changed
 */

interface LimitChange {
    key: string;
    label: string;
    oldValue: number;
    newValue: number;
    increased: boolean;
}

interface RateChange {
    featureName: string;
    componentName: string;
    oldRate: number;
    newRate: number;
    increased: boolean;
}

interface Feature {
    id: string;
    name: string;
    icon: string;
    color: string;
    description: string;
}

interface ComparisonResult {
    priceChange: number;
    priceDelta: string;
    newFeatures: Feature[];
    removedFeatures: Feature[];
    limitChanges: LimitChange[];
    rateChanges: RateChange[];
    hasChanges: boolean;
}

export class PlanComparisonService {

    /**
     * Compare user's current snapshot with latest plan
     */
    static compare(oldSnapshot: any, newPlan: any): ComparisonResult {

        // 1. Price comparison
        const priceChange = newPlan.price - oldSnapshot.price_paid;
        const priceDelta = priceChange > 0
            ? `+₹${priceChange}`
            : priceChange < 0
                ? `-₹${Math.abs(priceChange)}`
                : 'No change';

        // 2. New features (in new plan but not in old)
        const oldFeatureIds = oldSnapshot.features.map((f: any) => f.id);
        const newFeatures = (newPlan.features || [])
            .filter((f: any) => !oldFeatureIds.includes(f.id))
            .map((f: any) => ({
                id: f.id,
                name: f.name,
                icon: f.icon,
                color: f.color,
                description: f.description
            }));

        // 3. Removed features (in old but not in new)
        const newFeatureIds = (newPlan.features || []).map((f: any) => f.id);
        const removedFeatures = oldSnapshot.features
            .filter((f: any) => !newFeatureIds.includes(f.id))
            .map((f: any) => ({
                id: f.id,
                name: f.name,
                icon: f.icon,
                color: f.color,
                description: f.description
            }));

        // 4. Limit changes
        const limitChanges: LimitChange[] = [];
        const limitLabels: Record<string, string> = {
            max_tokens: 'Token Limit',
            max_chats: 'Chat Limit',
            max_file_uploads: 'File Uploads',
            max_website_pages: 'Website Pages',
            max_kb_size_mb: 'Knowledge Base Size',
            max_bots: 'Chat Bots',
            max_team_members: 'Team Members'
        };

        Object.keys(oldSnapshot.limits || {}).forEach(key => {
            const oldValue = oldSnapshot.limits[key];
            const newValue = newPlan.limits?.[key];

            if (newValue !== undefined && oldValue !== newValue) {
                limitChanges.push({
                    key,
                    label: limitLabels[key] || key,
                    oldValue,
                    newValue,
                    increased: newValue > oldValue
                });
            }
        });

        // 5. Rate changes (multiplier changes)
        const rateChanges: RateChange[] = [];
        oldSnapshot.features.forEach((oldFeature: any) => {
            const newFeature = (newPlan.features || []).find((f: any) => f.id === oldFeature.id);
            if (!newFeature) return;

            (oldFeature.includes || []).forEach((oldInc: any) => {
                const newInc = (newFeature.includes || []).find((i: any) => i.name === oldInc.name);
                if (!newInc) return;

                if (oldInc.sellMultiplier !== newInc.sellMultiplier) {
                    rateChanges.push({
                        featureName: oldFeature.name,
                        componentName: oldInc.name,
                        oldRate: oldInc.sellMultiplier,
                        newRate: newInc.sellMultiplier,
                        increased: newInc.sellMultiplier > oldInc.sellMultiplier
                    });
                }
            });
        });

        const hasChanges =
            newFeatures.length > 0 ||
            removedFeatures.length > 0 ||
            limitChanges.length > 0 ||
            rateChanges.length > 0 ||
            priceChange !== 0;

        return {
            priceChange,
            priceDelta,
            newFeatures,
            removedFeatures,
            limitChanges,
            rateChanges,
            hasChanges
        };
    }

    /**
     * Check if user has access to a specific feature
     */
    static hasFeatureAccess(snapshot: any, featureId: string): boolean {
        if (!snapshot?.features) return false;
        return snapshot.features.some((f: any) => f.id === featureId);
    }

    /**
     * Format limit value for display
     */
    static formatLimitValue(key: string, value: number): string {
        if (key === 'max_tokens') {
            return `${(value / 1_000_000).toFixed(1)}M tokens`;
        }
        if (key === 'max_kb_size_mb') {
            return `${value} MB`;
        }
        return value.toLocaleString();
    }
}
