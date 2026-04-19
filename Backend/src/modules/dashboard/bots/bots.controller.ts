import { Request, Response } from 'express';
import { BotConfig } from '../../../models/BotConfig.js';
import axios from 'axios';

export const getConfig = async (req: Request, res: Response) => {
    try {
        const { botId } = req.params;
        // const orgId = req.headers['x-org-id'] as string || 'default-org'; 

        if (!botId) {
            return res.status(400).json({ error: 'Bot ID is required' });
        }

        const config = await BotConfig.findOne({ botId });
        if (!config) {
            // Return empty/default config structure if not found
            return res.status(200).json({
                brandConfig: {},
                homeConfig: {},
                securityConfig: {},
                widgetConfig: {}
            });
        }

        res.status(200).json(config);
    } catch (error) {
        console.error('Error fetching bot config:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const saveConfig = async (req: Request, res: Response) => {
    try {
        const { botId } = req.params;
        const orgId = req.body.orgId || req.headers['x-org-id'] as string || 'default-org';

        const { brandConfig, homeConfig, securityConfig, personalityConfig, widgetConfig, journey, journeyEnabled } = req.body;

        if (!botId) {
            return res.status(400).json({ error: 'Bot ID is required' });
        }

        const updateData: any = {};
        if (brandConfig) updateData.brandConfig = brandConfig;
        if (homeConfig) updateData.homeConfig = homeConfig;
        if (securityConfig) updateData.securityConfig = securityConfig;
        if (personalityConfig) updateData.personalityConfig = personalityConfig;
        if (widgetConfig) updateData.widgetConfig = widgetConfig;

        // FIX: Add missing Journey fields
        if (typeof journey !== 'undefined') updateData.journey = journey;
        if (typeof journeyEnabled !== 'undefined') updateData.journeyEnabled = journeyEnabled;

        const setOnInsert = { orgId };

        const config = await BotConfig.findOneAndUpdate(
            { botId },
            {
                $set: updateData,
                $setOnInsert: setOnInsert
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.status(200).json(config);
    } catch (error) {
        console.error('Error saving bot config:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const onboardAgent = async (req: Request, res: Response) => {
    try {
        const { botId } = req.params;
        const { agentConfig } = req.body;
        const orgId = req.headers['x-org-id'] as string || 'default-org';

        if (!botId) {
            return res.status(400).json({ error: 'Bot ID is required' });
        }

        // Forward to AI Engine
        const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:5000';
        const engineUrl = AI_ENGINE_URL.endsWith('/api/v1') ? AI_ENGINE_URL : `${AI_ENGINE_URL}/api/v1`;

        const response = await axios.post(`${engineUrl}/hiring/ritual`, {
            agent_config: {
                ...agentConfig,
                botId,
                orgId
            }
        });

        res.status(200).json(response.data);
    } catch (error: any) {
        console.error('❌ Error in AI Onboarding Ritual:', error.message);
        res.status(500).json({
            error: 'AI Engine Onboarding Failed',
            details: error.response?.data || error.message
        });
    }
};
