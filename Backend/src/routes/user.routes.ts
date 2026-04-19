import { Router } from 'express';
import {
    getAllUsers,
    getUserById,
    getUserChats,
    updateUser,
    deleteUser
} from '../controllers/user.controller.js';

const router = Router();

/**
 * User Management Routes
 * Base path: /api/users
 */

// GET /api/users - Get all users with filters
router.get('/', getAllUsers);

// GET /api/users/:userId - Get user profile with stats
router.get('/:userId', getUserById);

// GET /api/users/:userId/chats - Get all chats for a user
router.get('/:userId/chats', getUserChats);

// PUT /api/users/:userId - Update user info
router.put('/:userId', updateUser);

// DELETE /api/users/:userId - Delete user (cascade)
router.delete('/:userId', deleteUser);

export default router;
