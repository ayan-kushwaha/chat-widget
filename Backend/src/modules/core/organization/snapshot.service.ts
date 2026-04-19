import { Feature } from '../../../models/Feature';

/**
 * Snapshot Service
 * Creates a complete, immutable copy of a plan configuration
 * This "freezes" the pricing and features at purchase time
 */

export interface PlanSnapshot {
    plan_name: string;
    price_offer: number; // Formerly price_paid
    price_market: number; // Value before Plan Discount
    currency: string;
    billing_cycle: string;
    timestamp: string;
    order_summary?: any;
    features: any[];
    limits: {
        max_tokens: number;
        max_chats: number;
        max_file_uploads: number;
        max_website_pages: number;
        max_kb_size_mb: number;
        max_bots: number;
        max_team_members: number;
        [key: string]: any;
    };
}

export class SnapshotService {

    /**
     * Internal logic to map a single feature to its snapshot version
     * This is the "Shared Logic" that should match frontend exactly
     */
    static mapFeatureToSnapshot(feature: any, permissions: Record<string, any>) {
        let enabled = true;
        let value: any = undefined;

        // Determine enabled status and value from permissions
        if (feature.type === 'boolean') {
            enabled = permissions[feature.id] === true;
        } else if (feature.type === 'numeric' || feature.type === 'enum') {
            value = permissions[feature.id];
        }

        // Special case fallback
        if (feature.id === 'api_connections' && value === undefined) {
            enabled = false;
        }

        // Build includes array for sub-features (mapping meta and current value)
        const includes = (feature.includes || []).map((sub: any) => {
            const subId = sub.id || sub._id || sub.key || sub.name;
            const subValue = permissions[subId];

            return {
                ...sub,
                id: subId,
                value: subValue !== undefined ? subValue : null
            };
        });

        return {
            id: feature.id,
            name: feature.name || feature.label || feature.id,
            icon: feature.icon,
            color: feature.color,
            status: feature.status,
            category: feature.category,
            description: feature.description,
            enabled: enabled,
            value: value !== undefined ? value : (enabled ? true : null),
            includes: includes
        };
    }

    /**
     * Creates a complete snapshot of a plan (Server-Side Authority)
     */
    static async createPlanSnapshot(data: {
        planName: string;
        priceOffer: number;  // Renamed from pricePaid
        marketPrice: number;
        currency: string;
        billing_cycle: string;
        tokens: number;
        permissions: Record<string, any>;
        orderSummary?: any;
    }): Promise<PlanSnapshot> {
        try {
            // 1. Fetch ALL features from Database (Registry)
            const features = await Feature.find({ status: { $ne: 'inactive' } }).sort({ order: 1 });

            // 2. Map features using shared logic
            const featureSnapshots = features.map(f => this.mapFeatureToSnapshot(f, data.permissions));

            // 3. Create complete snapshot
            const snapshot: PlanSnapshot = {
                plan_name: data.planName,
                price_offer: data.priceOffer,
                price_market: data.marketPrice,
                currency: data.currency || 'INR',
                billing_cycle: data.billing_cycle,
                timestamp: new Date().toISOString(),
                order_summary: data.orderSummary,
                features: featureSnapshots,
                limits: {
                    max_tokens: data.tokens,
                    max_chats: data.permissions.max_chats || -1,
                    max_file_uploads: data.permissions.max_files || 0,
                    max_website_pages: data.permissions.max_website_pages || 0,
                    max_kb_size_mb: data.permissions.brain_capacity_mb || 0,
                    max_bots: -1,
                    max_team_members: data.permissions.max_team_seats || 1,
                    // Dynamic spillover for any other limits in permissions
                    ...Object.keys(data.permissions)
                        .filter(k => k.startsWith('max_') || k.includes('limit') || k.includes('days') || k.startsWith('rollover_') || k === 'brain_capacity_mb')
                        .reduce((acc, k) => ({ ...acc, [k]: data.permissions[k] }), {})
                }
            };

            return snapshot;
        } catch (error: any) {
            console.error('❌ Failed to create plan snapshot:', error);
            throw new Error(`Failed to create plan snapshot: ${error.message}`);
        }
    }
}
