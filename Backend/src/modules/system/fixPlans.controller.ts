import { Request, Response } from 'express';
import { Plan } from '../../models/Plan';
import { PLAN_TIERS } from '../../utils/permissionCalculator';

/**
 * Fix Unknown Plan Names
 * Updates all plans with "Unknown" name to calculated names based on tokens
 */
export const fixPlanNames = async (req: Request, res: Response) => {
    try {
        console.log('🔧 Starting plan name fix...');

        // Find all plans
        const plans = await Plan.find({});
        console.log(`Found ${plans.length} total plans`);

        let updatedCount = 0;

        for (const plan of plans) {
            // Skip if plan already has a valid name
            if (plan.name && plan.name !== 'Unknown' && plan.name !== 'Custom Plan' && plan.name !== '') {
                console.log(`✓ Skipping ${plan.id} - already has name: ${plan.name}`);
                continue;
            }

            // Calculate name from PLAN_TIERS
            const tokens = plan.maxTokens || 0;
            const matchingTier = PLAN_TIERS.find(t =>
                tokens >= (t.minTokens || 0) && tokens <= (t.maxTokens || Infinity)
            );

            if (matchingTier) {
                plan.name = matchingTier.name;
                await plan.save();
                updatedCount++;
                console.log(`✅ Updated ${plan.id}: ${tokens} tokens → ${matchingTier.name}`);
            } else {
                console.log(`⚠️  No match for ${plan.id} with ${tokens} tokens`);
            }
        }

        console.log(`🎉 Fix complete! Updated ${updatedCount} plans`);

        res.json({
            success: true,
            message: `Successfully updated ${updatedCount} plan names`,
            totalPlans: plans.length,
            updatedCount
        });
    } catch (error: any) {
        console.error('❌ Error fixing plan names:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fix plan names',
            error: error.message
        });
    }
};
