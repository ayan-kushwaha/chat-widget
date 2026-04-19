import { Request, Response } from 'express';
import { Group } from '../models/Group.js';
import mongoose from 'mongoose';

/**
 * Create a new business group/segment
 * POST /v1/groups
 */
export const createGroup = async (req: Request, res: Response) => {
    try {
        const {
            name, description, emoji, organizationId,
            isPrivate, onlyAdminsCanPost, requiresApproval, hideMemberList,
            ephemeralSignals, ephemeralDuration,
            canAiAutoAdd, aiIntent, aiTags
        } = req.body;

        if (!organizationId || !name) {
            return res.status(400).json({ success: false, error: 'Organization ID and Name are required' });
        }

        const newGroup = new Group({
            organizationId: new mongoose.Types.ObjectId(organizationId),
            name,
            description,
            emoji,
            members: [],
            isPrivate,
            onlyAdminsCanPost,
            requiresApproval,
            hideMemberList,
            ephemeralSignals,
            ephemeralDuration,
            canAiAutoAdd,
            aiIntent,
            aiTags: aiTags || []
        });

        await newGroup.save();
        res.status(201).json({ success: true, group: newGroup });
    } catch (err: any) {
        console.error('Error creating group:', err);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

/**
 * Get all groups for an organization
 * GET /v1/groups
 */
export const getGroups = async (req: Request, res: Response) => {
    try {
        const { organizationId } = req.query;

        if (!organizationId) {
            return res.status(400).json({ success: false, error: 'Organization ID is required' });
        }

        const groups = await Group.find({
            organizationId: new mongoose.Types.ObjectId(organizationId as string)
        }).sort({ createdAt: -1 });

        res.json({ success: true, groups });
    } catch (err: any) {
        console.error('Error fetching groups:', err);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

/**
 * Update group metadata
 * PUT /v1/groups/:groupId
 */
export const updateGroup = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.params;
        const { name, description, emoji } = req.body;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ success: false, error: 'Group not found' });

        if (name) group.name = name;
        if (description !== undefined) group.description = description;
        if (emoji) group.emoji = emoji;

        // 🔐 Update Advanced Settings
        if (req.body.isPrivate !== undefined) group.isPrivate = req.body.isPrivate;
        if (req.body.onlyAdminsCanPost !== undefined) group.onlyAdminsCanPost = req.body.onlyAdminsCanPost;
        if (req.body.requiresApproval !== undefined) group.requiresApproval = req.body.requiresApproval;
        if (req.body.hideMemberList !== undefined) group.hideMemberList = req.body.hideMemberList;
        if (req.body.ephemeralSignals !== undefined) group.ephemeralSignals = req.body.ephemeralSignals;
        if (req.body.ephemeralDuration !== undefined) group.ephemeralDuration = req.body.ephemeralDuration;

        // 🤖 AI Intelligence
        if (req.body.canAiAutoAdd !== undefined) group.canAiAutoAdd = req.body.canAiAutoAdd;
        if (req.body.aiIntent !== undefined) group.aiIntent = req.body.aiIntent;
        if (req.body.aiTags !== undefined) group.aiTags = req.body.aiTags;

        // 📂 Archive Logic
        if (req.body.isArchived !== undefined) group.isArchived = req.body.isArchived;

        await group.save();
        res.json({ success: true, group });
    } catch (err: any) {
        console.error('Error updating group:', err);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

/**
 * Add or remove members from a group
 * PUT /v1/groups/:groupId/members
 */
export const manageMembers = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.params;
        const { memberIds, action } = req.body; // action: 'add' | 'remove'

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ success: false, error: 'Group not found' });

        if (action === 'add') {
            const currentMembers = new Set(group.members);
            memberIds.forEach((id: string) => currentMembers.add(id));
            group.members = Array.from(currentMembers);
        } else if (action === 'remove') {
            const currentMembers = new Set(group.members);
            memberIds.forEach((id: string) => currentMembers.delete(id));
            group.members = Array.from(currentMembers);
        }

        await group.save();
        res.json({ success: true, group });
    } catch (err: any) {
        console.error('Error managing members:', err);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

/**
 * Delete a group
 * DELETE /v1/groups/:groupId
 */
export const deleteGroup = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.params;
        const result = await Group.findByIdAndDelete(groupId);

        if (!result) return res.status(404).json({ success: false, error: 'Group not found' });

        res.json({ success: true, message: 'Group deleted successfully' });
    } catch (err: any) {
        console.error('Error deleting group:', err);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};
