import { Router } from 'express';
import {
    getShortTermMemory,
    getLongTermMemory,
    searchMemories,
    deleteMemory,
    editMemory,
    triggerLearning
} from "@modules/dashboard/memory/memory.controller.js";

const router = Router();

// GET /api/v1/memory/:orgId/short-term - Get short-term memory (activity logs)
router.get('/:orgId/short-term', getShortTermMemory);

// GET /api/v1/memory/:orgId/long-term - Get long-term memory (knowledge vectors)
router.get('/:orgId/long-term', getLongTermMemory);

// POST /api/v1/memory/:orgId/search - Search memories
router.post('/:orgId/search', searchMemories);

// DELETE /api/v1/memory/:orgId/:id - Delete a memory
router.delete('/:orgId/:id', deleteMemory);

// PUT /api/v1/memory/:orgId/:id - Edit a memory
router.put('/:orgId/:id', editMemory);

// POST /api/v1/memory/:orgId/trigger-learning - Manual Trigger
router.post('/:orgId/trigger-learning', triggerLearning);

export default router;
