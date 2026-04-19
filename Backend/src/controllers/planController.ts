import { Request, Response } from 'express';
import { Plan } from '../models/Plan';
import { PLAN_TIERS } from '../utils/permissionCalculator';

export const getPlans = async (req: Request, res: Response) => {
    try {
        // Admin can request all plans by passing ?all=true
        const includeInactive = req.query.all === 'true';

        const filter = includeInactive ? {} : { isActive: true };
        const plans = await Plan.find(filter).sort({ 'price.amount': 1 }).lean();

        // ✅ Helper to calculate name from tokens
        const getPlanNameFromTokens = (tokens: number): string => {
            const tier = PLAN_TIERS.find(t =>
                tokens >= (t.minTokens || 0) && tokens <= (t.maxTokens || Infinity)
            );
            return tier?.name || 'Custom Plan';
        };

        // Enrich with calculated permissions + name for Admin/Billing consistency
        const enrichedPlans = plans.map((p: any) => ({
            ...p,
            name: p.name || getPlanNameFromTokens(p.maxTokens || 0), // ✅ Calculate if missing
            permissions: {
                // Feature Flags
                ...(p.features || []).reduce((acc: any, fId: string) => ({ ...acc, [fId]: true }), {}),

                // Resource Caps (mapped from DB root fields)
                max_websites: p.maxWebsites || 0,
                max_files: p.maxFiles || 0,
                max_forms: p.maxForms || 0,
                max_manual_qa: p.maxManualEntries || 0,
                max_team_seats: p.maxUsers || 1,

                // Master Rules
                rollover_percentage: p.rolloverPercentage || 0,
                rollover_validity_days: p.rolloverValidity || 0,
                data_retention_days: p.retentionPeriod || 14,
                remove_branding: p.canRemoveBranding || false
            }
        }));

        res.json(enrichedPlans);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createPlan = async (req: Request, res: Response) => {
    try {
        // Auto-Generate ID from Name if missing
        if (!req.body.id && req.body.name) {
            req.body.id = req.body.name.toLowerCase().replace(/ /g, '_').replace(/[^\w-]+/g, '');
        }

        // ✅ Set default for visibility
        if (req.body.isActive === undefined) req.body.isActive = true;

        // ✅ Auto-set canRemoveBranding from PLAN_TIERS (Single Source of Truth)
        if (req.body.maxTokens !== undefined) {
            const matchingTier = PLAN_TIERS.find(tier =>
                req.body.maxTokens >= (tier.minTokens || 0) &&
                req.body.maxTokens <= (tier.maxTokens || Infinity)
            );

            if (matchingTier) {
                req.body.canRemoveBranding = matchingTier.permissions?.remove_branding || false;
                console.log(`🏷️ Auto-set canRemoveBranding=${req.body.canRemoveBranding} from PLAN_TIERS tier: ${matchingTier.name}`);
            }
        }

        const plan = new Plan(req.body);
        await plan.save();
        res.status(201).json(plan);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const updatePlan = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // ✅ Auto-set canRemoveBranding from PLAN_TIERS (same as create)
        if (req.body.maxTokens !== undefined) {
            const matchingTier = PLAN_TIERS.find(tier =>
                req.body.maxTokens >= (tier.minTokens || 0) &&
                req.body.maxTokens <= (tier.maxTokens || Infinity)
            );

            if (matchingTier) {
                req.body.canRemoveBranding = matchingTier.permissions?.remove_branding || false;
                console.log(`🏷️ Update: Auto-set canRemoveBranding=${req.body.canRemoveBranding} from tier: ${matchingTier.name}`);
            }
        }

        // Search by 'id' field, not _id
        const plan = await Plan.findOneAndUpdate({ id: id }, req.body, { new: true });
        if (!plan) return res.status(404).json({ message: 'Plan not found' });
        res.json(plan);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const deletePlan = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // Soft delete usually better, but user asked for DELETE
        // We'll hard delete for now to match "delete only" request
        const plan = await Plan.findOneAndDelete({ id: id });
        if (!plan) return res.status(404).json({ message: 'Plan not found' });
        res.json({ message: 'Plan deleted successfully', id });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
