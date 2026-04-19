import { Router } from 'express';
import {
    getPendingInsights,
    approveInsight,
    editInsight,
    rejectInsight
} from "@modules/dashboard/insights/insight.controller.js";

const router = Router();

// GET /api/v1/insights/:orgId - Get all pending insights
router.get('/:orgId', getPendingInsights);

// POST /api/v1/insights/:orgId/approve - Approve an insight
router.post('/:orgId/approve', approveInsight);

// PUT /api/v1/insights/:orgId/:id - Edit an insight
router.put('/:orgId/:id', editInsight);

// DELETE /api/v1/insights/:orgId/:id - Reject an insight
router.delete('/:orgId/:id', rejectInsight);

export default router;
