import { Router } from 'express';
import {
    createGroup,
    getGroups,
    updateGroup,
    manageMembers,
    deleteGroup
} from '../controllers/group.controller.js';
import { requireAuth } from '@shared/middlewares/auth.js';

const router = Router();

/**
 * Business Group Management Routes
 * Base path: /v1/groups
 */

router.post('/', requireAuth, createGroup);
router.get('/', requireAuth, getGroups);
router.put('/:groupId', requireAuth, updateGroup);
router.put('/:groupId/members', requireAuth, manageMembers);
router.delete('/:groupId', requireAuth, deleteGroup);

export default router;
