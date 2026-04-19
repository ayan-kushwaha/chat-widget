import { Request, Response } from 'express';
import { BotConfig } from '../models/BotConfig';

export const getConfig = async (req: Request, res: Response) => {
    try {
        const { botId } = req.params;
        const orgId = req.headers['x-org-id'] as string || 'default-org'; // Assuming auth middleware populates this or we pass it

        if (!botId) {
            return res.status(400).json({ error: 'Bot ID is required' });
        }

        // FIX: Must filter by orgId too, otherwise we might fetch the wrong config if multiple orgs use 'default_bot'
        const config = await BotConfig.findOne({ botId, orgId });

        if (!config) {
            // Return empty/default config structure if not found, rather than 404, to simplify frontend logic
            return res.status(200).json({
                brandConfig: {},
                homeConfig: {},
                securityConfig: {},
                widgetConfig: {},
                journeyEnabled: true,
                journey: []
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
        // In a real app, orgId should come from the authenticated user's session/token
        const orgId = req.body.orgId || req.headers['x-org-id'] as string || 'default-org';

        const { brandConfig, homeConfig, securityConfig, widgetConfig, journey, journeyEnabled } = req.body;

        console.log("--------------- SAVE CONFIG REQUEST ---------------");
        console.log("Bot ID:", botId);
        console.log("Org ID:", orgId);

        if (!botId) {
            return res.status(400).json({ error: 'Bot ID is required' });
        }

        // Prepare update object - only update fields that are present in the request
        const updateData: any = {};
        if (brandConfig) updateData.brandConfig = brandConfig;
        if (homeConfig) updateData.homeConfig = homeConfig;
        if (securityConfig) updateData.securityConfig = securityConfig;
        if (widgetConfig) updateData.widgetConfig = widgetConfig;

        // FIX: Strict check (allow [], but ignore undefined)
        // Explicitly set the journey array if provided. logic: The frontend sends the FULL array every time.
        if (typeof journey !== 'undefined') {
            updateData.journey = journey;
            console.log("Update Journey: ", Array.isArray(journey) ? `${journey.length} steps` : "Raw value");
        }

        if (typeof journeyEnabled !== 'undefined') updateData.journeyEnabled = journeyEnabled;

        // Use findOneAndUpdate with upsert
        // This is Atomic and safer for Mixed types than find() -> modify -> save()
        const config = await BotConfig.findOneAndUpdate(
            { botId, orgId },
            {
                $set: updateData,
                $setOnInsert: { orgId, botId } // Ensure these are set on creation
            },
            {
                new: true,   // Return the modified document
                upsert: true, // Create if not exists
                runValidators: false, // Strict: false schema, so we skip some validation
                setDefaultsOnInsert: true
            }
        );

        console.log("✅ DB OPERATION COMPLETE via findOneAndUpdate");
        console.log("   - Doc ID:", config?._id);
        console.log("   - Saved Journey Steps:", config?.journey?.length || 0);

        res.status(200).json(config);
    } catch (error) {
        console.error('Error saving bot config:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
