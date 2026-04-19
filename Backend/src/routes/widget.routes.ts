import { Router } from 'express';
import { recordHeartbeat, getActiveDeployments, getAllDeployments } from '../controllers/widget.controller';

const router = Router();

/**
 * Widget Heartbeat Routes
 * Base path: /widget
 */

// POST /widget/heartbeat - Receive ping from widget when it loads
router.post('/heartbeat', recordHeartbeat);

// GET /widget/deployments/:orgId - Get active deployments (last 10 minutes)
router.get('/deployments/:orgId', getActiveDeployments);

// GET /widget/deployments/:orgId/all - Get all deployments (including inactive)
router.get('/deployments/:orgId/all', getAllDeployments);

export default router;
