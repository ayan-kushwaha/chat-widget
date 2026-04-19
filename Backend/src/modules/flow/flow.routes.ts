import { Router } from 'express';
// @ts-ignore
import { requireAuth } from '../shared/middlewares/auth.js';
import { saveFlow, getFlows, getFlowById, deleteFlow } from './flow.controller.js';

const router = Router();

router.use(requireAuth); // Ensure all routes are authenticated

router.post('/save', saveFlow);
router.get('/list', getFlows);
router.get('/:id', getFlowById);
router.delete('/:id', deleteFlow);

export default router;
