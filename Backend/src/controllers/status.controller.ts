import { Request, Response } from 'express';
import { BusinessStatus } from '../models/BusinessStatus.js';
import mongoose from 'mongoose';

/**
 * 📝 POST STATUS (Enhanced with Scheduling & Styling)
 * POST /api/status
 */
export const postStatus = async (req: Request, res: Response) => {
    try {
        const { organizationId, type, content, caption, styling, startTime, endTime, music, musicVolume } = req.body || {};

        if (!organizationId || !content || !endTime) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: organizationId, content, endTime'
            });
        }

        const newStatus = await BusinessStatus.create({
            organizationId,
            type: type || 'text',
            content,
            caption: caption || "",
            styling: styling || {},
            startTime: startTime ? new Date(startTime) : new Date(),
            endTime: new Date(endTime),
            music,
            musicVolume
        });

        res.status(201).json({
            success: true,
            status: newStatus,
            message: 'Status posted successfully.'
        });
    } catch (error: any) {
        console.error('❌ Post status error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * 📖 GET ACTIVE STATUSES (Scheduled Filtering)
 * GET /api/status?organizationId=xxx
 * Returns only statuses within their active time window
 */
export const getStatuses = async (req: Request, res: Response) => {
    try {
        const { organizationId } = req.query;

        if (!organizationId) {
            return res.status(400).json({ success: false, error: 'Organization ID is required' });
        }

        const now = new Date();
        const statuses = await BusinessStatus.find({
            organizationId,
            startTime: { $lte: now },
            endTime: { $gte: now }
        })
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            statuses
        });
    } catch (error: any) {
        console.error('❌ Get statuses error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * 👁️ TRACK VIEW
 * POST /api/status/:statusId/view
 */
export const viewStatus = async (req: Request, res: Response) => {
    try {
        const { statusId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId is required' });
        }

        const status = await BusinessStatus.findById(statusId);
        if (!status) {
            return res.status(404).json({ success: false, error: 'Status not found' });
        }

        if (!status.views.includes(new mongoose.Types.ObjectId(userId))) {
            status.views.push(new mongoose.Types.ObjectId(userId));
            await status.save();
        }

        res.status(200).json({ success: true, message: 'View recorded' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * 🗑️ DELETE STATUS
 * DELETE /api/status/:statusId
 */
export const deleteStatus = async (req: Request, res: Response) => {
    try {
        const { statusId } = req.params;
        const { organizationId } = req.query;

        await BusinessStatus.deleteOne({ _id: statusId, organizationId });

        res.status(200).json({ success: true, message: 'Status deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
