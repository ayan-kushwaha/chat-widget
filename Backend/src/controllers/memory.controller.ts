import { Request, Response } from 'express';
import { LearningMemory } from '../models/LearningMemory';

/**
 * Get all memories with filters
 * GET /api/memories
 */
export const getAllMemories = async (req: Request, res: Response) => {
    try {
        const {
            organizationId,
            status,
            type,
            isPermanent,
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

        if (status) query.status = status;
        if (type) query.type = type;
        if (isPermanent === 'true') query.isPermanent = true;

        // Execute query
        const skip = (Number(page) - 1) * Number(limit);
        const memories = await LearningMemory.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean();

        const total = await LearningMemory.countDocuments(query);

        res.status(200).json({
            success: true,
            memories,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit))
        });
    } catch (error: any) {
        console.error('❌ Get memories error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
};

/**
 * Get memory by ID
 * GET /api/memories/:id
 */
export const getMemoryById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { organizationId } = req.query;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }

        const memory = await LearningMemory.findOne({
            _id: id,
            organizationId
        }).lean();

        if (!memory) {
            return res.status(404).json({
                success: false,
                error: 'Memory not found'
            });
        }

        res.status(200).json({
            success: true,
            memory
        });
    } catch (error: any) {
        console.error('❌ Get memory error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
};

/**
 * Approve pending memory
 * POST /api/memories/:id/approve
 */
export const approveMemory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { organizationId, approvedBy } = req.body;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }

        const memory = await LearningMemory.findOneAndUpdate(
            { _id: id, organizationId, status: 'pending' },
            {
                $set: {
                    status: 'approved',
                    approvedBy,
                    approvedAt: new Date()
                }
            },
            { new: true }
        );

        if (!memory) {
            return res.status(404).json({
                success: false,
                error: 'Memory not found or already processed'
            });
        }

        console.log(`✅ Memory approved: ${id}`);

        res.status(200).json({
            success: true,
            memory
        });
    } catch (error: any) {
        console.error('❌ Approve memory error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
};

/**
 * Reject pending memory
 * POST /api/memories/:id/reject
 */
export const rejectMemory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { organizationId } = req.body;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }

        const memory = await LearningMemory.findOneAndUpdate(
            { _id: id, organizationId, status: 'pending' },
            { $set: { status: 'rejected' } },
            { new: true }
        );

        if (!memory) {
            return res.status(404).json({
                success: false,
                error: 'Memory not found or already processed'
            });
        }

        console.log(`✅ Memory rejected: ${id}`);

        res.status(200).json({
            success: true,
            memory
        });
    } catch (error: any) {
        console.error('❌ Reject memory error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
};

/**
 * Update memory
 * PUT /api/memories/:id
 */
export const updateMemory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { organizationId, ...updates } = req.body;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }

        const memory = await LearningMemory.findOneAndUpdate(
            { _id: id, organizationId },
            { $set: updates },
            { new: true }
        );

        if (!memory) {
            return res.status(404).json({
                success: false,
                error: 'Memory not found'
            });
        }

        res.status(200).json({
            success: true,
            memory
        });
    } catch (error: any) {
        console.error('❌ Update memory error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
};

/**
 * Merge duplicate memories
 * POST /api/memories/:id/merge
 */
export const mergeMemories = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { organizationId, duplicateIds } = req.body;

        if (!organizationId || !duplicateIds || !Array.isArray(duplicateIds)) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID and duplicate IDs array are required'
            });
        }

        // Mark duplicates as merged
        await LearningMemory.updateMany(
            { _id: { $in: duplicateIds }, organizationId },
            {
                $set: {
                    status: 'merged',
                    duplicateOf: id,
                    isDuplicate: true
                }
            }
        );

        // Update main memory
        const memory = await LearningMemory.findOneAndUpdate(
            { _id: id, organizationId },
            {
                $push: { mergedWith: { $each: duplicateIds } }
            },
            { new: true }
        );

        if (!memory) {
            return res.status(404).json({
                success: false,
                error: 'Memory not found'
            });
        }

        console.log(`✅ Memories merged: ${duplicateIds.length} into ${id}`);

        res.status(200).json({
            success: true,
            memory,
            mergedCount: duplicateIds.length
        });
    } catch (error: any) {
        console.error('❌ Merge memories error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
};

/**
 * Delete memory
 * DELETE /api/memories/:id
 */
export const deleteMemory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { organizationId } = req.query;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }

        const memory = await LearningMemory.findOneAndDelete({
            _id: id,
            organizationId
        });

        if (!memory) {
            return res.status(404).json({
                success: false,
                error: 'Memory not found'
            });
        }

        console.log(`✅ Memory deleted: ${id}`);

        res.status(200).json({
            success: true,
            message: 'Memory deleted successfully'
        });
    } catch (error: any) {
        console.error('❌ Delete memory error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
};
