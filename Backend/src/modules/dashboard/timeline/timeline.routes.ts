import { Router } from 'express';
import { getTimeline, deleteTimelineEntry } from "@modules/dashboard/timeline/timeline.controller.js";

const router = Router();

// GET /api/v1/timeline (Handle missing orgId)
router.get('/', (req, res) => res.json({ success: true, timeline: [] }));

// GET /api/v1/timeline/:orgId?type=daily|weekly|all
router.get('/:orgId', getTimeline);

// DELETE /api/v1/timeline/:orgId/:id
router.delete('/:orgId/:id', deleteTimelineEntry);

export default router;
