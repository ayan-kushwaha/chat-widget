import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { Conversation } from '../models/Conversation';
import { User } from '../models/User';
import { Message } from '../models/Message';
import { LearningMemory } from '../models/LearningMemory';
import axios from 'axios';


/**
 * Get all conversations with filters (The Inbox)
 * GET /api/chats
 */
export const getAllChats = async (req: Request, res: Response) => {
    try {
        const {
            organizationId,
            userId,
            status,
            mode,
            assignedTo,
            searchQuery,
            startDate,
            endDate,
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
        const query: any = { organizationId: new mongoose.Types.ObjectId(organizationId as string) };

        // 🚥 Base Filters
        if (mode) query.mode = mode;
        if (assignedTo) query.assignedTo = assignedTo;

        if (userId) query.userId = userId;

        // 📅 DATE RANGE FILTER (Deep Activity Discovery)
        if (startDate || endDate) {
            const orgObjectId = new mongoose.Types.ObjectId(organizationId as string);
            const dateQuery: any = {
                organizationId: orgObjectId,
                isWiped: { $ne: true }
            };

            if (startDate) dateQuery.createdAt = { ...dateQuery.createdAt, $gte: new Date(startDate as string) };
            if (endDate) dateQuery.createdAt = { ...dateQuery.createdAt, $lte: new Date(endDate as string) };

            console.log("🔍 [Discovery] Querying Messages with:", JSON.stringify(dateQuery));

            // 🚀 Pivot: Find conversations with ANY activity in this range using robust Aggregation
            const messageDiscovery = await Message.aggregate([
                { $match: dateQuery },
                { $group: { _id: "$conversationId" } }
            ]);

            console.log("📊 [Discovery] Raw Aggregate Result Count:", messageDiscovery.length);

            const activeConvIds = messageDiscovery.map(m => m._id).filter(Boolean);

            console.log(`🚀 [Discovery] Final Conv IDs found:`, activeConvIds.length);

            // Apply discovered IDs to the main query
            query._id = { $in: activeConvIds };

            // Bypass status filter for historical search
            delete query.status;
        } else if (searchQuery) {
            // Bypass status filter for global searches to find old/resolved/archived matches
            delete query.status;
        } else if (status) {
            // Support 'active,resolved' style comma-separated list
            if (typeof status === 'string' && status.includes(',')) {
                query.status = { $in: status.split(',') };
            } else {
                query.status = status;
            }
        } else if (!searchQuery && !startDate && !endDate) {
            // 🛡️ DEFAULT FALLBACK (Inbox Mode)
            // If no filter is provided, fetch ALL non-archived chats to ensure persistence
            query.status = { $ne: 'archived' };
        }

        // 🛡️ Smart Filter: Hide conversations deleted by Business
        query.is_deleted_by_business = { $ne: true };

        // 🔍 GLOBAL SEARCH LOGIC (Hybrid: Regex + AI Semantic + Deep Content)
        if (searchQuery) {
            const searchStr = searchQuery as string;

            // 1. Search Users (Names, Emails, Phones)
            const matchingUsers = await User.find({
                organizationId: organizationId as any,
                $or: [
                    { name: { $regex: searchStr, $options: 'i' } },
                    { email: { $regex: searchStr, $options: 'i' } },
                    { phone: { $regex: searchStr, $options: 'i' } },
                    { userId: { $regex: searchStr, $options: 'i' } }
                ]
            }).select('_id').lean();
            const userIds = matchingUsers.map(u => u._id);

            // 2. Deep Content Search (Regex on Message model for older messages)
            const matchingMessages = await Message.find({
                organizationId: organizationId as any,
                content: { $regex: searchStr, $options: 'i' }
            }).select('conversationId').limit(100).lean();
            const contentConvIds = matchingMessages.map(m => m.conversationId);

            // 3. Semantic Search via AI Engine
            let semanticChatIds: string[] = [];
            if (searchStr.length > 2) {
                try {
                    const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:5000';
                    const engineUrl = AI_ENGINE_URL.endsWith('/api/v1') ? AI_ENGINE_URL : `${AI_ENGINE_URL}/api/v1`;
                    const aiResp = await axios.post(`${engineUrl}/chat/search`, {
                        query: searchStr,
                        org_id: organizationId,
                        n_results: 50
                    });
                    if (aiResp.data?.status === 'success') {
                        semanticChatIds = aiResp.data.results.map((r: any) => r.chatId).filter(Boolean);
                    }
                } catch (e) {
                    console.error("⚠️ Semantic Search Error:", (e as any).message);
                }
            }

            // 4. Combined Query
            query.$or = [
                { userId: { $in: userIds } },
                { _id: { $in: contentConvIds } },
                { last_message_preview: { $regex: searchStr, $options: 'i' } },
                { ai_generated_title: { $regex: searchStr, $options: 'i' } }
            ];

            if (semanticChatIds.length > 0) {
                query.$or.push({ _id: { $in: semanticChatIds } });
            }
        }

        // Execute query
        const skip = (Number(page) - 1) * Number(limit);
        const conversations = await Conversation.find(query)
            .sort({ is_pinned: -1, last_message_at: -1 }) // ✨ NEW: Pin logic -> last_active
            .skip(skip)
            .limit(Number(limit))
            .lean();

        const total = await Conversation.countDocuments(query);

        // 📊 ATTACH MATCH COUNTS (If searching)
        let enrichedChats = conversations;
        if (searchQuery) {
            const searchStr = searchQuery as string;
            try {
                // Aggregate match counts from Message model
                const matchCounts = await Message.aggregate([
                    {
                        $match: {
                            organizationId: new mongoose.Types.ObjectId(organizationId as string),
                            content: { $regex: searchStr, $options: 'i' },
                            isDeleted: { $ne: true } // 🧼 Exclude deleted messages
                        }
                    },
                    { $group: { _id: "$conversationId", count: { $sum: 1 } } }
                ]);

                const countMap: { [key: string]: number } = {};
                matchCounts.forEach(m => {
                    if (m._id) countMap[m._id.toString()] = m.count;
                });

                enrichedChats = conversations.map(c => ({
                    ...c,
                    matchCount: countMap[c._id.toString()] || 0
                }));
            } catch (aggregationError) {
                console.error("⚠️ Match Count Aggregation Error:", aggregationError);
                // Fallback: continue with enrichedChats = conversations
            }
        }

        res.status(200).json({
            success: true,
            chats: enrichedChats,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit))
        });
    } catch (error: any) {
        console.error('❌ Get chats error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
};

/**
 * Get conversation by ID
 * GET /api/chats/:chatId
 */
export const getChatById = async (req: Request, res: Response) => {
    try {
        const { chatId } = req.params; // This is actually the MongoDB _id of the conversation
        const { organizationId } = req.query;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }

        const conversation = await Conversation.findOne({
            _id: chatId,
            organizationId
        }).lean();

        if (!conversation) {
            return res.status(404).json({
                success: false,
                error: 'Conversation not found'
            });
        }

        res.status(200).json({
            success: true,
            chat: conversation
        });
    } catch (error: any) {
        console.error('❌ Get chat error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
};

/**
 * Update conversation (labels, mode, etc)
 * PUT /api/chats/:chatId
 */
export const updateChat = async (req: Request, res: Response) => {
    try {
        const { chatId } = req.params;
        const { organizationId, ...updates } = req.body;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }

        // Support for atomic operators ($set, $push, $pull, $addToSet, etc.)
        const updateQuery = (updates.hasOwnProperty('$set') || updates.hasOwnProperty('$push') || updates.hasOwnProperty('$pull') || updates.hasOwnProperty('$addToSet'))
            ? updates
            : { $set: updates };

        const conversation = await Conversation.findOneAndUpdate(
            { _id: chatId, organizationId },
            updateQuery,
            { new: true }
        );

        if (!conversation) {
            return res.status(404).json({
                success: false,
                error: 'Conversation not found'
            });
        }

        // 🔥 Real-time broadcast: Emit socket event for label update
        try {
            const socketModule = await import('../sockets/index.js');
            const io = socketModule.getIO();
            if (io && organizationId) {
                io.to(String(organizationId)).emit('conversation_updated', {
                    conversationId: chatId,
                    tags: conversation.tags || [],
                    updatedAt: new Date()
                });
                console.log(`📡 Socket: Emitted conversation_updated for chat ${chatId}`);
            }
        } catch (socketError: any) {
            console.error('⚠️ Socket emission failed (non-critical):', socketError.message);
        }

        res.status(200).json({
            success: true,
            chat: conversation
        });
    } catch (error: any) {
        console.error('❌ Update chat error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
};

/**
 * Delete conversation (Mutual Agreement Logic)
 * DELETE /api/chats/:chatId
 */
export const deleteChat = async (req: Request, res: Response) => {
    try {
        const { chatId } = req.params;
        const { organizationId } = req.query;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }

        const { requestedBy } = req.body; // 'user' | 'business' | 'admin'

        // 1. Fetch Conversation first to check flags
        const conversation = await Conversation.findOne({ _id: chatId, organizationId });

        if (!conversation) {
            return res.status(404).json({ success: false, error: 'Conversation not found' });
        }

        // 2. Set Flags based on Requestor
        let hardDelete = false;

        if (requestedBy === 'user') {
            conversation.is_deleted_by_user = true;
        } else if (requestedBy === 'business') {
            conversation.is_deleted_by_business = true;
        } else if (requestedBy === 'admin') {
            hardDelete = true;
        }

        // 3. CHECK: Mutual Deletion Logic
        if ((conversation.is_deleted_by_user && conversation.is_deleted_by_business) || hardDelete) {
            // 💥 HARD DELETE
            await Conversation.deleteOne({ _id: chatId });

            // Note: We might want to keep messages for a while or wipe them too.
            // For GDPR, we wipe everything linked to this ID if mutual.
            const { Message } = await import("../models/Message");
            await Message.deleteMany({ conversationId: chatId });

            console.log(`💥 Conversation HARD DELETED (Mutual/Admin): ${chatId}`);

            return res.status(200).json({
                success: true,
                message: 'Conversation permanently deleted',
                type: 'HARD_DELETE'
            });

        } else {
            // ⚐ SOFT DELETE
            await conversation.save();
            console.log(`⚐ Conversation Soft Deleted by ${requestedBy}: ${chatId}`);

            return res.status(200).json({
                success: true,
                message: 'Conversation hidden for you',
                type: 'SOFT_DELETE'
            });
        }

    } catch (error: any) {
        console.error('❌ Delete chat error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
};

/**
 * Block conversation as spam
 * POST /api/chats/:chatId/block
 */
export const blockChat = async (req: Request, res: Response) => {
    try {
        const { chatId } = req.params;
        const { organizationId, spamReason } = req.body;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }

        const conversation = await Conversation.findOneAndUpdate(
            { _id: chatId, organizationId },
            {
                $set: {
                    status: 'archived',
                    summary: `Archived as spam: ${spamReason || 'No reason provided'}`
                }
            },
            { new: true }
        );

        if (!conversation) {
            return res.status(404).json({
                success: false,
                error: 'Conversation not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Conversation archived as spam successfully',
            chat: conversation
        });
    } catch (error: any) {
        console.error('❌ Block chat error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
};

/**
 * Toggle Pin status
 * PATCH /api/chats/:chatId/pin
 */
export const togglePin = async (req: Request, res: Response) => {
    try {
        const { chatId } = req.params;
        const { organizationId } = req.query;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }

        const conversation = await Conversation.findOne({ _id: chatId, organizationId });
        if (!conversation) return res.status(404).json({ success: false, error: 'Conversation not found' });

        conversation.is_pinned = !conversation.is_pinned;
        await conversation.save();

        res.status(200).json({
            success: true,
            is_pinned: conversation.is_pinned,
            message: conversation.is_pinned ? 'Conversation pinned' : 'Conversation unpinned'
        });
    } catch (error: any) {
        console.error('❌ Toggle pin error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Mark as Unread
 * PATCH /api/chats/:chatId/unread
 */
export const markUnread = async (req: Request, res: Response) => {
    try {
        const { chatId } = req.params;
        const { organizationId } = req.query;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }

        const conversation = await Conversation.findOneAndUpdate(
            { _id: chatId, organizationId },
            { $set: { unread_count: 1 } }, // Mark as unread (set to 1 to show badge)
            { new: true }
        );

        if (!conversation) return res.status(404).json({ success: false, error: 'Conversation not found' });

        res.status(200).json({
            success: true,
            unread_count: conversation.unread_count,
            message: 'Conversation marked as unread'
        });
    } catch (error: any) {
        console.error('❌ Mark unread error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Get Deletion Statistics for Data Management
 * GET /api/chats/:chatId/deletion-stats
 */
export const getChatDeletionStats = async (req: Request, res: Response) => {
    const { chatId } = req.params;
    const { organizationId, isolatedId } = req.query; // isolatedId = deviceId_role

    try {
        const { DailyChatBucket } = await import("../models/DailyChatBucket.js");

        // Use aggregation to count messages across all buckets for this chat
        const stats = await DailyChatBucket.aggregate([
            { $match: { chatSessionId: new mongoose.Types.ObjectId(chatId) } },
            { $unwind: "$chat_turns" },
            { $unwind: "$chat_turns.messages" },
            { $replaceRoot: { newRoot: "$chat_turns.messages" } },
            {
                $facet: {
                    deletedForEveryone: [
                        { $match: { isDeleted: true } },
                        { $count: "count" }
                    ],
                    deletedForMe: [
                        { $match: { deletedFor: isolatedId } },
                        { $count: "count" }
                    ],
                    labelsToClear: [
                        { $match: { $or: [{ isDeleted: true }, { deletedFor: isolatedId }] } },
                        { $count: "count" }
                    ]
                }
            }
        ]);

        const deletedForEveryone = stats[0]?.deletedForEveryone[0]?.count || 0;
        const deletedForMe = stats[0]?.deletedForMe[0]?.count || 0;
        const totalLabelsToClear = stats[0]?.labelsToClear[0]?.count || 0;

        const { Conversation } = await import("../models/Conversation.js");

        // 🔥 Check universal wipe status via DailyChatBucket
        // We look for ANY message in the most recent bucket that has `isWiped: true`
        const universalWipeCheck = await DailyChatBucket.aggregate([
            { $match: { chatSessionId: new mongoose.Types.ObjectId(chatId) } },
            { $sort: { date: -1 } },
            { $limit: 1 },
            { $unwind: "$chat_turns" },
            { $unwind: "$chat_turns.messages" },
            { $match: { "chat_turns.messages.isWiped": true } },
            { $limit: 1 }
        ]);

        const hasWipe = universalWipeCheck.length > 0;
        const wipedRecord = hasWipe ? universalWipeCheck[0].chat_turns.messages : null;

        // 🔥 Check user-side hide status (Conversation level)
        const conversation = await Conversation.findById(chatId).select('userSideHiddenBefore').lean();

        let wipedAt: Date | null = null;
        let wipedMode: 'me' | 'everyone' | null = null;

        if (hasWipe && wipedRecord) {
            wipedAt = wipedRecord.wipedAt || null;
            wipedMode = 'everyone';
        } else if (conversation?.userSideHiddenBefore) {
            wipedAt = conversation.userSideHiddenBefore;
            wipedMode = 'me';
        }

        res.status(200).json({
            success: true,
            stats: {
                deletedForEveryone,
                deletedForMe,
                labelsToClear: totalLabelsToClear
            },
            // 🔥 Wipe status for dynamic UI
            wipeStatus: {
                wipedAt,
                wipedMode
            }
        });
    } catch (error: any) {
        console.error('❌ Get deletion stats error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Manual hard purge of all deleted labels in a chat
 * POST /api/chats/:chatId/clear-deleted
 */
export const clearChatDeletionLabels = async (req: Request, res: Response) => {
    const { chatId } = req.params;
    const { organizationId, isolatedId } = req.body;

    try {
        const { DailyChatBucket } = await import("../models/DailyChatBucket.js");

        // Hard Purge: Delete records that are already in a "deleted" state visually
        // For nested arrays, pulling specific messages out of the messages array requires arrayFilters
        // Since we are clearing *all* matching messages, we use $pull
        const result = await DailyChatBucket.updateMany(
            { chatSessionId: chatId },
            {
                $pull: {
                    "chat_turns.$[].messages": {
                        $or: [
                            { isDeleted: true }, // Deleted for everyone
                            { deletedFor: isolatedId } // Deleted for me
                        ]
                    }
                }
            }
        );

        res.status(200).json({
            success: true,
            deletedCount: result.modifiedCount, // Shows modified buckets, not exact message count
            message: `Successfully cleared deleted labels.`
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Zero-Trace Wipe of all messages in a chat (Me or Everyone)
 * POST /api/chats/:chatId/wipe
 */
export const wipeChatHistory = async (req: Request, res: Response) => {
    const { chatId } = req.params;
    const { organizationId, isolatedId, mode } = req.body; // mode: 'me' | 'everyone'

    try {
        const { DailyChatBucket } = await import("../models/DailyChatBucket.js");
        const { Conversation } = await import("../models/Conversation.js");

        const updateTime = new Date();

        if (mode === 'me') {
            // Mark for user side: Set userSideHiddenBefore timestamp on Conversation
            // Messages BEFORE this time will be hidden from user, NEW messages will show
            await Conversation.updateOne(
                { _id: chatId },
                { $set: { userSideHiddenBefore: updateTime } }
            );
        } else {
            // Mark for everyone: Set isWiped to true and set wipedAt (24h TTL)
            await DailyChatBucket.updateMany(
                { chatSessionId: chatId },
                {
                    $set: {
                        "chat_turns.$[].messages.$[].isWiped": true,
                        "chat_turns.$[].messages.$[].wipedAt": updateTime
                    }
                }
            );
        }

        // � Emit socket event to the room to notify client to clear/refresh
        const io = req.app.get('socketio');
        if (io) {
            io.to(chatId).emit("chat_wiped", { mode, wipedAt: mode === 'everyone' ? updateTime : undefined });
        }

        // �🔔 Create system message for activity log
        const expiryTime = new Date(updateTime);
        expiryTime.setHours(expiryTime.getHours() + 24);

        const systemMessage = new Message({
            organizationId,
            conversationId: chatId,
            sender: 'system',
            senderName: 'System',
            type: 'system_alert',
            content: mode === 'me'
                ? `🔒 Hidden from User`
                : `🔥 Wiped for Everyone`,
            metadata: {
                action: 'wipe',
                mode,
                wipedAt: mode === 'everyone' ? updateTime : undefined,
                expiresAt: mode === 'everyone' ? expiryTime : undefined,
                user_display_text: mode === 'me'
                    ? `🔒 History Cleared`
                    : `🔥 History Wiped`
            }
        });
        await systemMessage.save();

        res.status(200).json({
            success: true,
            message: mode === 'me'
                ? `Chat history hidden from user side. You can restore anytime.`
                : `Chat history deleted for everyone. You have 24 hours to undo this.`,
            mode,
            systemMessageId: systemMessage._id
        });
    } catch (error: any) {
        console.error('❌ Wipe chat history error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Undo a Zero-Trace Wipe
 * POST /api/chats/:chatId/undo-wipe
 */
export const undoWipeChatHistory = async (req: Request, res: Response) => {
    const { chatId } = req.params;
    const { organizationId, isolatedId, mode } = req.body;

    try {
        const { DailyChatBucket } = await import("../models/DailyChatBucket.js");
        const { Conversation } = await import("../models/Conversation.js");

        if (mode === 'me') {
            // Restore for user side: Clear userSideHiddenBefore timestamp
            await Conversation.updateOne(
                { _id: chatId },
                { $set: { userSideHiddenBefore: null } }
            );
        } else {
            // Restore for everyone: Set isWiped back to false
            await DailyChatBucket.updateMany(
                { chatSessionId: chatId },
                {
                    $set: {
                        "chat_turns.$[].messages.$[].isWiped": false
                    }
                }
            );
        }

        // 🔔 Create system message for restore activity
        const restoreTime = new Date();
        const systemMessage = new Message({
            organizationId,
            conversationId: chatId,
            sender: 'system',
            senderName: 'System',
            type: 'system_alert',
            content: mode === 'me'
                ? `Restored by Admin`
                : `Global Restore`,
            metadata: {
                action: 'restore',
                mode,
                restoredAt: restoreTime,
                user_display_text: `History Restored`
            }
        });
        await systemMessage.save();

        res.status(200).json({
            success: true,
            message: `Wipe undone successfully. History restored for ${mode === 'me' ? 'user side' : 'everyone'}.`,
            systemMessageId: systemMessage._id
        });
    } catch (error: any) {
        console.error('❌ Undo wipe error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Get all unique activity dates for an organization
 * GET /api/chats/active-dates
 */
export const getChatActiveDates = async (req: Request, res: Response) => {
    try {
        const { organizationId, timezone = 'UTC' } = req.query;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }

        const orgObjectId = new mongoose.Types.ObjectId(organizationId as string);

        const { DailyChatBucket } = await import("../models/DailyChatBucket.js");

        // 🚀 Aggregation Pipeline: Group unique dates from DailyChatBucket
        const activeDates = await DailyChatBucket.distinct('date', {
            organizationId: orgObjectId
        });

        // The bucket `date` string is already in YYYY-MM-DD format,
        // so we don't need complex aggregation if we just want the strings.
        const dateList = activeDates.sort();

        res.status(200).json({
            success: true,
            dates: dateList
        });
    } catch (error: any) {
        console.error('❌ Error fetching active dates:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Delete a tag globally from all conversations in an organization
 * DELETE /api/chats/tags/:tagName
 */
export const deleteTagGlobally = async (req: Request, res: Response) => {
    try {
        const { tagName } = req.params;
        const { organizationId } = req.query;

        console.log(`🏷️ Request to delete tag globally: ${tagName} for Org: ${organizationId}`);

        if (!organizationId || !tagName) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID and Tag Name are required'
            });
        }

        // Remove the specific tag from ALL conversations in this organization
        // Aggressive: Remove ANY tag that starts with this name (e.g. "HOT:hot" and "HOT:urgent")
        const tagNameBase = tagName.includes(':') ? tagName.split(':')[0] : tagName;
        const tagRegex = new RegExp(`^${tagNameBase}(:.*)?$`, 'i');

        const result = await Conversation.updateMany(
            { organizationId, tags: { $regex: tagRegex } },
            { $pull: { tags: { $regex: tagRegex } } }
        );

        console.log(`✅ Removed tag ${tagName} from ${result.modifiedCount} conversations`);

        res.status(200).json({
            success: true,
            message: `Removed tag ${tagName} from ${result.modifiedCount} conversations`,
            modifiedCount: result.modifiedCount
        });
    } catch (error: any) {
        console.error('❌ Delete tag error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
};

/**
 * Toggle pin status for a conversation
 * PATCH /api/chats/:chatId/pin
 */
export const togglePinChat = async (req: Request, res: Response) => {
    try {
        const { chatId } = req.params;
        const { organizationId } = req.query;

        if (!organizationId || !chatId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID and Chat ID are required'
            });
        }

        // Find the conversation
        const conversation = await Conversation.findOne({
            _id: chatId,
            organizationId
        });

        if (!conversation) {
            return res.status(404).json({
                success: false,
                error: 'Conversation not found'
            });
        }

        // Toggle the pin status
        conversation.is_pinned = !conversation.is_pinned;
        await conversation.save();

        console.log(`📌 Toggled pin for chat ${chatId}: ${conversation.is_pinned}`);

        res.status(200).json({
            success: true,
            is_pinned: conversation.is_pinned
        });
    } catch (error: any) {
        console.error('❌ Toggle pin error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
};

/**
 * Toggle favourite status for a conversation
 * PATCH /api/chats/:chatId/favourite
 */
export const toggleFavouriteChat = async (req: Request, res: Response) => {
    try {
        const { chatId } = req.params;
        const { organizationId } = req.query;

        if (!organizationId || !chatId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID and Chat ID are required'
            });
        }

        // Find the conversation
        const conversation = await Conversation.findOne({
            _id: chatId,
            organizationId
        });

        if (!conversation) {
            return res.status(404).json({
                success: false,
                error: 'Conversation not found'
            });
        }

        // Toggle the favourite status
        conversation.is_favourite = !conversation.is_favourite;
        await conversation.save();

        console.log(`❤️ Toggled favourite for chat ${chatId}: ${conversation.is_favourite}`);

        res.status(200).json({
            success: true,
            is_favourite: conversation.is_favourite
        });
    } catch (error: any) {
        console.error('❌ Toggle favourite error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
};
