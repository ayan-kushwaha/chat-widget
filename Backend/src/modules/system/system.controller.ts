import { Request, Response } from 'express';
import { FEATURES_REGISTRY } from '../../config/features.config';
import { MAX_TOKEN_LIMIT, PLAN_TIERS } from '../../utils/permissionCalculator';
import { Plan } from '../../models/Plan';
import { Feature } from '../../models/Feature';
import { MODEL_MASTER_CONFIG, calculateTokensToBurn } from '../../config/model_pricing.config.js';

/**
 * Get Global System Configuration
 * Serves as the Single Source of Truth for Frontend
 */
export const getSystemConfig = async (req: Request, res: Response) => {
    try {
        // Fetch ALL Plans from DB (Active & Inactive) so Admin can manage them
        // Frontend will filter for Marketing Page
        const dbPlans = await Plan.find({})
            .sort({ sortingOrder: 1, maxTokens: 1 })
            .lean();

        console.log(`📦 Found ${dbPlans.length} plans in database`);

        // ✅ Helper to get plan name from PLAN_TIERS based on tokens
        const getPlanNameFromTokens = (tokens: number): string => {
            // Find tier where tokens fall in range [minTokens, maxTokens]
            const tier = PLAN_TIERS.find(t =>
                tokens >= (t.minTokens || 0) && tokens <= (t.maxTokens || Infinity)
            );
            const name = tier?.name || 'Custom Plan';
            console.log(`💡 Calculating: ${tokens} tokens → "${name}"`);
            return name;
        };

        let dynamicPlanTiers;

        // FALLBACK: If database is empty, use hardcoded PLAN_TIERS
        if (dbPlans.length === 0) {
            console.warn('⚠️ No plans in database! Using fallback PLAN_TIERS');
            dynamicPlanTiers = PLAN_TIERS;
        } else {
            // Map DB Plans to Frontend "PlanTier" Structure
            dynamicPlanTiers = dbPlans.map((p: any) => {
                // Find Matching Static Tier (Code Source of Truth)
                const staticTier = PLAN_TIERS.find(t =>
                    (p.maxTokens || 0) >= t.minTokens && (p.maxTokens || 0) <= (t.maxTokens || Infinity)
                );

                const calculatedName = p.name || staticTier?.name || 'Custom Plan';
                console.log(`📋 Plan: db.name="${p.name}", maxTokens=${p.maxTokens}, final="${calculatedName}"`);

                // ✅ MINIMAL planTiers - Only essential plan data from DB
                // Everything else (permissions, ranges) comes from tierDefinitions
                return {
                    id: p.id,
                    name: (p.name && !p.name.includes('Loading') && !p.name.includes('Undefined')) ? p.name : (staticTier?.name || 'Custom Plan'),
                    maxTokens: p.maxTokens || 0, // ✅ ACTUAL tokens from admin-created plan
                    isActive: p.isActive,
                    // ✅ RESTORED: Permissions needed for Pricing Card UI
                    permissions: p.permissions
                }
            });
        }

        // ✅ Filter: Only ACTIVE plans (ignore isPublic)
        const activePlans = dynamicPlanTiers.filter((p: any) => p.isActive === true);
        console.log(`🔓 Sending ${activePlans.length} active plans (${dynamicPlanTiers.length} total)`);

        // ✅ Fetch Active Features from DB (Source of Truth for Rich Metadata)
        // Includes: sub-features, burn rates, detailed content (not in FEATURES_REGISTRY)
        const dbFeatures = await Feature.find({ status: 'active' }).sort({ order: 1 }).lean();
        const features = dbFeatures.length > 0 ? dbFeatures : FEATURES_REGISTRY;
        console.log(`✨ Sending ${dbFeatures.length > 0 ? dbFeatures.length + ' DB' : 'Registry'} features`);

        // ✅ Dynamic Versioning (Smart Caching)
        // Check latest Plan update to force cache invalidation on Frontend
        const lastPlan = await Plan.findOne({}, { updatedAt: 1 }).sort({ updatedAt: -1 }).lean();
        const timestamp = lastPlan && (lastPlan as any).updatedAt ? new Date((lastPlan as any).updatedAt).getTime() : Date.now();
        const configVersion = `v_${timestamp}`;

        res.status(200).json({
            success: true,
            data: {
                features: features,
                planTiers: activePlans,
                tierDefinitions: PLAN_TIERS, // ✅ Expose Raw Ranges for Slider Logic
                maxTokenLimit: MAX_TOKEN_LIMIT,
                version: configVersion,
                // 💰 Unified Billing Config added here
                billing: {
                    models: MODEL_MASTER_CONFIG
                }
            }
        });
    } catch (error) {
        console.error('System Config Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load system configuration'
        });
    }
};
