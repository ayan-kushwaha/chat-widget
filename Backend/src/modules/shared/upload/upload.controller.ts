import { Request, Response } from 'express';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import mongoose from 'mongoose';
import { getIO } from '../../../sockets/index.js'; // ✨ Socket for broadcasting (Fixed path)
import { Message } from '../../../models/Message.js'; // ✨ Database Model
import { Conversation } from '../../../models/Conversation.js'; // ✨ Use Conversation instead of ChatSession
import { User } from '../../../models/User.js'; // ✨ For session auto-creation
import { usageService } from '../../../services/usage.service.js';
import { ActivityType } from '../../../models/ActivityLog.js';

// --- MULTER CONFIG ---
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

export const uploadMiddleware = upload.single('file');

// --- UPLOAD IMAGE (with AI option) ---
export const uploadImage = async (req: Request, res: Response) => {
    try {
        const { chatId, orgId, deviceId, sendToAI } = req.body;
        const file = req.file;

        if (!file || !orgId) {
            return res.status(400).json({ error: 'File and orgId required' });
        }

        // --- 🛡️ ROBUST ObjectId VALIDATION ---
        if (!mongoose.Types.ObjectId.isValid(orgId)) {
            console.error(`❌ [Upload] Invalid orgId received: "${orgId}"`);
            return res.status(400).json({ error: 'Invalid organizationId format' });
        }
        const orgObjectId = new mongoose.Types.ObjectId(orgId);

        // 1. Resolve or Create Chat Session (Robust Logic)
        let chatSession = null;
        let finalChatId = chatId;

        // Try finding by provided chatId first (if it's a valid ObjectId)
        if (chatId && mongoose.Types.ObjectId.isValid(chatId)) {
            chatSession = await Conversation.findById(chatId);
        }

        // If not found by ID (or ID was transient), try finding by Org + Device
        if (!chatSession && deviceId) {
            console.log(`🔍 [Upload] Chat not found by ID, searching by deviceId: ${deviceId}`);

            // Find or create user
            let user = await User.findOne({ organizationId: orgObjectId, deviceId });
            if (!user) {
                user = await User.create({
                    organizationId: orgObjectId,
                    deviceId,
                    name: 'Visitor',
                    userId: deviceId, // Legacy field support
                    shadow_id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
                });
            }

            // Find or create conversation
            chatSession = await Conversation.findOne({ userId: user._id, organizationId: orgObjectId });
            if (!chatSession) {
                chatSession = await Conversation.create({
                    organizationId: orgObjectId,
                    userId: user._id,
                    status: 'active',
                    mode: 'ai',
                    last_message_at: new Date()
                });
                console.log(`🆕 [Upload] Created new conversation for device: ${chatSession._id}`);
            }
            finalChatId = (chatSession._id as any).toString();
        }

        if (!chatSession) {
            return res.status(404).json({ error: 'Conversation session not found and deviceId missing' });
        }

        // Forward to Python ai_engine
        const formData = new FormData();
        formData.append('file', file.buffer, file.originalname);
        formData.append('chat_id', finalChatId);
        const assetType = 'image';
        formData.append('asset_type', assetType);
        formData.append('send_to_ai', sendToAI || 'false');

        const response = await axios.post(
            `${process.env.AI_ENGINE_URL}/api/v1/upload`,
            formData,
            {
                headers: formData.getHeaders(),
                maxBodyLength: Infinity,
            }
        );

        console.log(`✅ [Upload] Asset processed and forwarded to AI Engine for Chat: ${finalChatId}`);

        // 💰 Track Usage (Upload involves Network & potentially AI Compute)
        const { resource_metrics } = response.data;
        await usageService.trackActivity(
            orgId,
            sendToAI === 'true' ? ActivityType.IMAGE_GENERATION : ActivityType.BRAIN_UPLOAD, // Using IMAGE_GEN for vision tasks
            file.size, // rawAmount is bytes
            { resource_metrics, filename: file.originalname },
            `Uploaded ${assetType}: ${file.originalname}`
        );

        res.json({
            success: true,
            url: response.data.url,
            chatId: finalChatId, // Return the resolved chatId back to frontend
            sendToAI: sendToAI === 'true',
        });
    } catch (error: any) {
        console.error('❌ [Upload] Image upload failed:', error.message);
        res.status(500).json({ error: 'Upload failed' });
    }
};


// --- UPLOAD FILE (PDF/DOC - Agent only) ---
export const uploadFile = async (req: Request, res: Response) => {
    try {
        const { chatId, orgId } = req.body;
        const file = req.file;

        if (!file || !chatId) {
            return res.status(400).json({ error: 'File and chatId required' });
        }

        const formData = new FormData();
        formData.append('file', file.buffer, file.originalname);
        formData.append('chat_id', chatId);
        const assetType = 'file';
        formData.append('asset_type', assetType);
        formData.append('send_to_ai', 'false');

        const response = await axios.post(
            `${process.env.AI_ENGINE_URL}/api/v1/upload`,
            formData,
            {
                headers: formData.getHeaders(),
                maxBodyLength: Infinity,
            }
        );

        // 💰 Track Usage
        const { resource_metrics } = response.data;
        await usageService.trackActivity(
            orgId,
            ActivityType.BRAIN_UPLOAD,
            file.size,
            { resource_metrics, filename: file.originalname },
            `Uploaded document: ${file.originalname}`
        );

        res.json({
            success: true,
            url: response.data.url,
            sendToAI: false,
        });
    } catch (error: any) {
        console.error('File upload failed:', error.message);
        res.status(500).json({ error: 'Upload failed' });
    }
};

