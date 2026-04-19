import { Router } from 'express';
import { getSystemConfig } from './system.controller';
import { fixPlanNames } from './fixPlans.controller';

const router = Router();

// Public route - No auth required as Pricing/Plans are public info
router.get('/config', getSystemConfig);

// Fix plan names in database (admin only - but no auth for now)
router.post('/fix-plan-names', fixPlanNames);

export default router;
