import { Request, Response } from 'express';
import { WidgetDeployment } from '../models/WidgetDeployment';

/**
 * Record heartbeat from widget
 * POST /widget/heartbeat
 */
export const recordHeartbeat = async (req: Request, res: Response) => {
    try {
        const { orgId, url, hostname, timestamp, userAgent } = req.body;

        // Validation
        if (!orgId || !url) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: orgId and url are required'
            });
        }

        // Upsert deployment record (update if exists, create if not)
        const deployment = await WidgetDeployment.findOneAndUpdate(
            { orgId, url }, // Find by orgId + url combination
            {
                orgId,
                url,
                hostname: hostname || new URL(url).hostname,
                lastSeen: timestamp ? new Date(timestamp) : new Date(),
                userAgent: userAgent || req.headers['user-agent'],
                status: 'active'
            },
            {
                upsert: true, // Create if doesn't exist
                new: true,    // Return updated document
                setDefaultsOnInsert: true
            }
        );

        console.log(`✅ Heartbeat recorded: ${hostname} (${orgId})`);

        res.status(200).json({
            success: true,
            message: 'Heartbeat recorded successfully',
            deployment: {
                url: deployment.url,
                hostname: deployment.hostname,
                lastSeen: deployment.lastSeen
            }
        });
    } catch (error: any) {
        console.error('❌ Heartbeat error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
};

/**
 * Get all active deployments for an organization
 * GET /widget/deployments/:orgId
 */
export const getActiveDeployments = async (req: Request, res: Response) => {
    try {
        const { orgId } = req.params;

        if (!orgId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }

        // Get deployments active in last 10 minutes
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

        const deployments = await WidgetDeployment.find({
            orgId,
            lastSeen: { $gte: tenMinutesAgo },
            status: 'active'
        })
            .sort({ lastSeen: -1 }) // Most recent first
            .select('url hostname lastSeen userAgent createdAt')
            .lean();

        console.log(`📊 Found ${deployments.length} active deployments for org: ${orgId}`);

        res.status(200).json({
            success: true,
            deployments,
            count: deployments.length,
            threshold: '10 minutes'
        });
    } catch (error: any) {
        console.error('❌ Get deployments error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
};

/**
 * Get all deployments (including inactive) for an organization
 * GET /widget/deployments/:orgId/all
 */
export const getAllDeployments = async (req: Request, res: Response) => {
    try {
        const { orgId } = req.params;

        if (!orgId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }

        const deployments = await WidgetDeployment.find({ orgId })
            .sort({ lastSeen: -1 })
            .select('url hostname lastSeen status createdAt')
            .lean();

        res.status(200).json({
            success: true,
            deployments,
            count: deployments.length
        });
    } catch (error: any) {
        console.error('❌ Get all deployments error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
};
