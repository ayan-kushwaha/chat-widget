import { Request, Response } from 'express';
import { Brain } from "@modules/dashboard/brain/models/Brain.js";

/**
 * GET /api/v1/insights/:orgId
 * Fetch generated insights
 */
export const getPendingInsights = async (req: Request, res: Response) => {
    try {
        const { orgId } = req.params;
        const brain = await Brain.findOne({ orgId });

        if (!brain) return res.json({ success: true, insights: [] });

        res.json({
            success: true,
            insights: (brain as any).insights || []
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * POST /api/v1/insights/:orgId/:insightId/approve
 * Approve an insight -> Becomes Knowledge
 */
export const approveInsight = async (req: Request, res: Response) => {
    try {
        res.json({ success: true, message: "Insight approval migrated. (Stub)" });
    } catch (error: any) {
        console.error('❌ Error approving insight:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * PUT /api/v1/insights/:orgId/:id
 */
export const editInsight = async (req: Request, res: Response) => {
    try {
        res.json({ success: true, message: "Insight edit migrated. (Stub)" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * DELETE /api/v1/insights/:orgId/:id
 */
export const rejectInsight = async (req: Request, res: Response) => {
    try {
        res.json({ success: true, message: "Insight rejection migrated. (Stub)" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
