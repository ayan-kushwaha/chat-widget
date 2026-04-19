import { Router, Request, Response } from 'express';
import { MODEL_MASTER_CONFIG, calculateTokensToBurn, getAvailableModels } from '../config/model_pricing.config.js';

const router = Router();

/**
 * GET /api/pricing/models
 * Returns all available AI models with pricing
 */
router.get('/models', (req: Request, res: Response) => {
    try {
        res.json({
            success: true,
            data: {
                models: getAvailableModels()
            }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/pricing/model/:modelKey
 * Returns specific model pricing details
 */
router.get('/model/:modelKey', (req: Request, res: Response) => {
    try {
        const { modelKey } = req.params;
        const model = MODEL_MASTER_CONFIG[modelKey];

        if (!model) {
            return res.status(404).json({
                success: false,
                error: `Model '${modelKey}' not found`
            });
        }

        res.json({
            success: true,
            data: {
                key: modelKey,
                ...model
            }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/pricing/calculate
 * Calculate training cost estimate
 * Body: { model_key, input_tokens, task_key }
 */
router.post('/calculate', (req: Request, res: Response) => {
    try {
        const { model_key, input_tokens, task_key = 'CORE_CHAT' } = req.body;

        if (!model_key || !input_tokens) {
            return res.status(400).json({
                success: false,
                error: 'model_key and input_tokens are required'
            });
        }

        const tokensToBurn = calculateTokensToBurn(
            model_key, 
            input_tokens, 
            2000 // Estimate 2k output
        );

        res.json({
            success: true,
            data: {
                model_key,
                model_name: MODEL_MASTER_CONFIG[model_key]?.name || 'Unknown',
                input_tokens,
                estimated_output_tokens: 2000,
                tokens_to_burn: tokensToBurn
            }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/pricing/analyze
 * Detailed breakdown for Billing Calculator
 */
router.post('/analyze', (req: Request, res: Response) => {
    try {
        const { model_key, input_tokens = 0, output_tokens = 0 } = req.body;

        const model = MODEL_MASTER_CONFIG[model_key];
        if (!model) {
            return res.status(404).json({ success: false, error: 'Model not found' });
        }

        // 1. Base Cost (What Google charges us, in tokens)
        const baseInputBurn = (input_tokens / 1_000_000) * model.base_input_rate;
        const baseOutputBurn = (output_tokens / 1_000_000) * model.base_output_rate;
        const totalBaseBurn = (baseInputBurn + baseOutputBurn);

        // 2. Sell Cost (What we charge the user)
        const sellInputBurn = (input_tokens / 1_000_000) * (model.base_input_rate * model.margin);
        const sellOutputBurn = (output_tokens / 1_000_000) * (model.base_output_rate * model.margin);
        const totalSellBurnRaw = (sellInputBurn + sellOutputBurn);
        const totalSellBurn = Math.max(1, Math.round(totalSellBurnRaw));

        // 3. Profit Calculation
        const profitTokens = totalSellBurn - totalBaseBurn;
        const marginPercent = ((totalSellBurn - totalBaseBurn) / totalSellBurn) * 100;

        res.json({
            success: true,
            data: {
                model_name: model.name,
                tier: model.tier,
                usage: { input_tokens, output_tokens },
                breakdown: {
                    base_cost_tokens: parseFloat(totalBaseBurn.toFixed(4)),
                    sell_price_tokens: totalSellBurn,
                    profit_tokens: parseFloat(profitTokens.toFixed(4)),
                    profit_percentage: isNaN(marginPercent) ? '0%' : parseFloat(marginPercent.toFixed(2)) + '%'
                }
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
