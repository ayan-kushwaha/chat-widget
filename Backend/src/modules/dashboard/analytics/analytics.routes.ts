import { Router } from 'express';
import { collectAnalytics, getStats, getPublicStats, getMemoryAnalytics } from "@modules/dashboard/analytics/analytics.controller.js";

const router = Router();

router.post('/collect', collectAnalytics);
router.get('/stats', getStats);
router.get('/public-stats', getPublicStats);
router.get('/:orgId', getMemoryAnalytics); // Memory Studio Analytics

export default router;
