import { Router } from 'express';
import {
    getStatuses,
    postStatus,
    deleteStatus,
    viewStatus
} from '../controllers/status.controller.js';

const router = Router();

/**
 * Weekly Status Routes
 * Base path: /api/status
 */

router.get('/', getStatuses);
router.post('/', postStatus);
router.post('/:statusId/view', viewStatus);
router.delete('/:statusId', deleteStatus);

export default router;
