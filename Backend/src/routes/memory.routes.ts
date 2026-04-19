import { Router } from 'express';
import {
    getAllMemories,
    getMemoryById,
    approveMemory,
    rejectMemory,
    updateMemory,
    mergeMemories,
    deleteMemory
} from '../controllers/memory.controller.js';

const router = Router();

/**
 * Learning Memory Routes
 * Base path: /api/memories
 */

// GET /api/memories - Get all memories with filters
router.get('/', getAllMemories);

// GET /api/memories/:id - Get memory details
router.get('/:id', getMemoryById);

// POST /api/memories/:id/approve - Approve pending memory
router.post('/:id/approve', approveMemory);

// POST /api/memories/:id/reject - Reject pending memory
router.post('/:id/reject', rejectMemory);

// PUT /api/memories/:id - Update memory content/expiry
router.put('/:id', updateMemory);

// POST /api/memories/:id/merge - Merge duplicate memories
router.post('/:id/merge', mergeMemories);

// DELETE /api/memories/:id - Delete memory
router.delete('/:id', deleteMemory);

export default router;
