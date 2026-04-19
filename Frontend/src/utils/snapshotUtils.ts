/**
 * Snapshot Utility (Shared Logic)
 * Matches Backend logic to ensure consistent data generation
 */

export interface PlanSnapshot {
    plan_name: string;
    price_paid: number;
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

/**
 * Internal logic to map a single feature to its snapshot version
 * This MUST match backend SnapshotService.mapFeatureToSnapshot exactly
 */
export const mapFeatureToSnapshot = (feature: any, permissions: Record<string, any>) => {
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
};

/**
 * Generates a complete snapshot (Frontend Version for UI Preview)
 */
export const generateSnapshot = (data: {
    planName: string;
    pricePaid: number;
    currency: string;
    billing_cycle: string;
    tokens: number;
    permissions: Record<string, any>;
    featuresRegistry: Record<string, any> | any[];
    orderSummary?: any;
}): PlanSnapshot => {

    // 1. Get features list (array)
    const features = Array.isArray(data.featuresRegistry)
        ? data.featuresRegistry
        : Object.values(data.featuresRegistry);

    // 2. Map features using shared logic
    const featureSnapshots = features.map(f => mapFeatureToSnapshot(f, data.permissions));

    // 3. Create complete snapshot
    const snapshot: PlanSnapshot = {
        plan_name: data.planName,
        price_paid: data.pricePaid,
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
                .filter(k => k.startsWith('max_') || k.includes('limit') || k.includes('days'))
                .reduce((acc, k) => ({ ...acc, [k]: data.permissions[k] }), {})
        }
    };

    return snapshot;
};
