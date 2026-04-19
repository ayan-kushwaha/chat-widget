import { Request, Response } from 'express';
import { User } from '../models/User';
import { Conversation } from '../models/Conversation';
import { LearningMemory } from '../models/LearningMemory';

/**
 * Get all users with filters
 * GET /api/users
 */
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const {
            organizationId,
            search,
            channel,
            sentiment,
            isLead,
            page = 1,
            limit = 25
        } = req.query;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }

        // Build query
        const query: any = { organizationId };

        if (search) {
            query.$text = { $search: search as string };
        }

        if (channel) {
            query['stats.channels'] = channel;
        }

        if (sentiment) {
            query['stats.averageSentiment'] = sentiment;
        }

        if (isLead === 'true') {
            query['stats.totalLeads'] = { $gt: 0 };
        }

        // Execute query with pagination
        const skip = (Number(page) - 1) * Number(limit);
        const users = await User.find(query)
            .sort({ lastActive: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean();

        const total = await User.countDocuments(query);

        res.status(200).json({
            success: true,
            users,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit))
        });
    } catch (error: any) {
        console.error('❌ Get users error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
};

/**
 * Get user by ID with stats
 * GET /api/users/:userId
 */
export const getUserById = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { organizationId } = req.query;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }

        const user = await User.findOne({
            _id: userId,
            organizationId
        }).lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            user,
            stats: user.stats
        });
    } catch (error: any) {
        console.error('❌ Get user error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
};

/**
 * Get all chats for a user
 * GET /api/users/:userId/chats
 */
export const getUserChats = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const {
            organizationId,
            page = 1,
            limit = 25
        } = req.query;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }

        const skip = (Number(page) - 1) * Number(limit);
        const conversations = await Conversation.find({
            userId,
            organizationId
        })
            .sort({ last_message_at: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean();

        const total = await Conversation.countDocuments({ userId, organizationId });

        res.status(200).json({
            success: true,
            conversations,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit))
        });
    } catch (error: any) {
        console.error('❌ Get user conversations error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
};

/**
 * Update user info
 * PUT /api/users/:userId
 */
export const updateUser = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { organizationId, ...updates } = req.body;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }

        const user = await User.findOneAndUpdate(
            { _id: userId, organizationId },
            { $set: updates },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (error: any) {
        console.error('❌ Update user error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
};

/**
 * Delete user (cascade delete)
 * DELETE /api/users/:userId
 */
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { organizationId } = req.query;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }

        // 1. Delete all conversations for this user
        await Conversation.deleteMany({ userId, organizationId });

        // 2. Update memories that reference this user
        await LearningMemory.updateMany(
            { sourceUserIds: userId },
            { $pull: { sourceUserIds: userId } }
        );

        // 3. Delete user
        const user = await User.findOneAndDelete({
            _id: userId,
            organizationId
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        console.log(`✅ User deleted with cascade: ${userId}`);

        res.status(200).json({
            success: true,
            message: 'User and all related data deleted successfully'
        });
    } catch (error: any) {
        console.error('❌ Delete user error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
};
