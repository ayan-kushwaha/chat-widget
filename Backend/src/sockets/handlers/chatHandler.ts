import { Server, Socket } from "socket.io";
import mongoose from "mongoose";
import { askQuestionToSite } from "../../modules/tools/chat/chat.service.js";
import axios from "axios";

export const registerChatHandlers = (io: Server, socket: Socket) => {
    // 💬 SEND MESSAGE (Main Entry Point)
    socket.on("send_message", async (data: { id?: string; orgId: string; message: string; history: any[]; context?: any; channel?: string; userName?: string; userId?: string; type?: string; metadata?: any; screen_context?: any }) => {
        const { id, orgId, message, history, context, channel = 'widget', userName = 'Visitor', userId, type = 'text', metadata, screen_context } = data;

        console.log(`💬 Chat Message: [${orgId}] ${message}`);

        try {
            // Check if System Greeting requested
            if (message === "[SYSTEM: INIT_CHAT]") {
                try {
                    const { BotConfig } = await import("../../models/BotConfig.js");
                    const config = await BotConfig.findOne({ orgId });

                    const options = config?.personalityConfig?.smart_options || [];
                    const greeting = config?.personalityConfig?.greeting_message || "Welcome! How can I help you today?";

                    socket.emit("receive_message", {
                        id: `system_greet_${Date.now()}`,
                        answer: greeting,
                        sender: "ai",
                        options: options
                    });
                } catch (e) {
                    socket.emit("receive_message", {
                        id: `system_greet_${Date.now()}`,
                        answer: "Welcome! How can I help you today?",
                        sender: "ai"
                    });
                }
                return;
            }

            // Normal AI Message Flow
            const { formatResponse } = await import("../../utils/responseFormatter.js");
            const { Conversation } = await import("../../models/Conversation.js");
            const { DailyChatBucket } = await import("../../models/DailyChatBucket.js");

            // Utility to format date string as YYYY-MM-DD in local time (or UTC)
            const getTodayDateString = () => {
                const d = new Date();
                return d.toISOString().split('T')[0];
            };

            // 1. Find or create user
            const { User } = await import("../../models/User.js");
            const deviceId = (socket.handshake.auth?.deviceId as string) || socket.id;

            // 🛡️ CAST IDs
            const orgObjectId = new mongoose.Types.ObjectId(orgId);

            let user = await User.findOne({ organizationId: orgObjectId, deviceId });

            if (!user) {
                user = await User.create({
                    organizationId: orgObjectId,
                    userId: deviceId, // Legacy string ID for compatibility
                    name: userName,
                    deviceId: deviceId,
                    shadow_id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
                });
            }

            const persistentUserId = user._id; // 🆔 Use MongoDB ObjectId

            // 1. Find or create session (DO THIS EARLY to get chatId for status)
            let chatSession = await Conversation.findOne({ userId: persistentUserId, organizationId: orgId }) as any;
            const now = new Date();

            if (!chatSession) {
                chatSession = await Conversation.create({
                    organizationId: orgId,
                    userId: persistentUserId,
                    status: 'active',
                    mode: 'ai',
                    last_message_at: now
                });

                // 🔌 CRITICAL: Join the room immediately
                socket.join(chatSession._id.toString());
                socket.data.conversationId = chatSession._id.toString(); // 💾 Persist for disconnect
                console.log(`🔌 [Socket] Room Created & Joined EARLY: ${chatSession._id}`);

                io.to(orgId).emit("chat_started", {
                    chatId: chatSession._id,
                    userName: userName,
                    lastActive: now,
                    summary: "New conversation started...",
                    mode: 'ai'
                });
            } else {
                chatSession.last_message_at = now;

                // 🔄 Resurrection Logic: If chat was archived/resolved or deleted, bring it back!
                if (chatSession.status !== 'active') chatSession.status = 'active';
                if (chatSession.is_deleted_by_business) chatSession.is_deleted_by_business = false;
                if (chatSession.is_deleted_by_user) chatSession.is_deleted_by_user = false;

                await chatSession.save();
                socket.join(chatSession._id.toString());
                socket.data.conversationId = chatSession._id.toString(); // 💾 Persist for disconnect
            }

            const chatId = chatSession._id.toString();

            // 3. Create User Message EARLY (Push to Daily Bucket)
            const todayStr = getTodayDateString();
            const turnId = `turn_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            const userMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

            const userMsgItem = {
                messageId: userMessageId,
                sender: 'user',
                senderName: userName,
                content: message,
                type: type,
                metadata: { ...metadata, client_id: id },
                createdAt: now
            };

            // Using upsert to create the bucket if it doesn't exist for today,
            // or push a new turn if it does.
            await DailyChatBucket.findOneAndUpdate(
                {
                    organizationId: orgObjectId,
                    chatSessionId: chatSession._id,
                    date: todayStr
                },
                {
                    $setOnInsert: {
                        userId: persistentUserId,
                        chattingTo: `customer (${userName})`
                    },
                    $push: {
                        chat_turns: {
                            turnId: turnId,
                            channelSource: channel,
                            messages: [userMsgItem]
                        }
                    },
                    $inc: { total_turns: 1 }
                },
                { upsert: true, new: true }
            );

            // 📢 🆔 ECHO & SYNC BROADCAST
            // Use io.to(chatId) to include the sender, so their frontend can learn the _id.
            io.to(chatId).emit("receive_message", {
                id: id || userMessageId,
                _id: userMessageId, // 🆔 Our custom ID (we don't get immediate Mongo _id for nested item easily)
                answer: message,
                sender: 'user',
                chatId: chatId,
                timestamp: now.toISOString(),
                type: type,
                metadata: { ...metadata, client_id: id }
            });

            // 🟢 REAL-TIME SIDEBAR UPDATE (User Message)
            chatSession.last_message_preview = type === 'image' ? '📷 Image' : (type === 'audio' ? '🎤 Voice Message' : message);
            chatSession.last_message_at = now;
            chatSession.last_message_sender = 'user'; // ✨ Track who sent it
            chatSession.last_message_status = 'delivered'; // ✨ User messages are auto-delivered to dashboard
            // Increment unread count for dashboard agents
            chatSession.unread_count = (chatSession.unread_count || 0) + 1;
            await chatSession.save();

            const payload = {
                ...(chatSession as any).toObject(),
                chatId: String(chatSession._id),
                _id: String(chatSession._id),
                userName: userName || chatSession.userName || 'Visitor', // Ensure name is present
                unread_count: chatSession.unread_count,
                unreadCount: chatSession.unread_count // Double-Key normalization
            };
            io.to(String(orgId)).emit("chat_updated", payload);

            // 🚀 INDEX FOR GLOBAL SEARCH
            try {
                const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:5000';
                const engineUrl = AI_ENGINE_URL.endsWith('/api/v1') ? AI_ENGINE_URL : `${AI_ENGINE_URL}/api/v1`;
                axios.post(`${engineUrl}/chat/index`, {
                    org_id: orgId,
                    chat_id: chatId,
                    message_id: userMessageId,
                    content: message,
                    metadata: { type: type, ...metadata }
                }).catch(err => console.error("⚠️ Indexing User Message Failed:", err.message));
            } catch (e) { }

            // 📢 NOTIFY DASHBOARD OF THINKING
            const emitStatus = (status: string, msg: string) => {
                io.to(orgId).emit("thinking_status", { chatId: chatId, status, message: msg });
                socket.emit("thinking_status", { chatId: chatId, status, message: msg });
            };

            emitStatus("intent", "🧠 Analyzing intent...");

            console.log(`🤖 AI Processing Start for Chat ${chatId}. Mode: ${chatSession.mode}`);

            // 🤖 AI AUTO-RESET CHECK (24h logic)
            if (chatSession.ai_disabled_until && new Date() > new Date(chatSession.ai_disabled_until)) {
                console.log(`🤖 [Auto-Reset] 24h passed. Resuming AI for ${chatId}`);
                chatSession.mode = 'ai';
                chatSession.ai_disabled_until = null;
                await chatSession.save();

                // Notify both sides of the mode reset
                io.to(chatId).emit("conversation_mode_updated", { mode: 'ai' });
                io.to(orgId).emit("chat_updated", { chatId, mode: 'ai' });
            }

            // 🛡️ HUMAN HANDOFF CHECK: Skip AI if mode is 'human' or'handoff'
            if (chatSession.mode === 'human' || chatSession.mode === 'handoff') {
                console.log(`👤 [Handoff] AI Paused for Chat ${chatId} (Mode: ${chatSession.mode}). Forwarding to Agent.`);

                // Notify Agents (Dashboard)
                io.to(orgId).emit("user_message_to_agent", {
                    id: id || userMessageId,
                    chatId: chatId,
                    sender: 'user',
                    answer: message,
                    userName: userName,
                    type: type,
                    metadata: { ...metadata, client_id: id },
                    timestamp: now.toISOString()
                });

                emitStatus("stopped", "stopped");
                return;
            }

            // 🤖 USER-SIDE AI TOGGLE CHECK: Skip AI if user disabled it (widget only)
            if (metadata?.aiDisabledByUser === true) {
                console.log(`🤖 [User Toggle] AI Disabled by user for Chat ${chatId}. Skipping AI response.`);
                emitStatus("stopped", "stopped");
                return; // Don't call AI, don't notify agents - just store the message
            }


            // 2. Call AI Engine (with Streaming Tunnel)
            const replyToMongoId = metadata?.reply_to_mongo_id || metadata?.replyTo?.id || null; // 🧠 Reply Teleportation
            const response = await askQuestionToSite(
                orgId,
                message,
                history,
                context,
                chatId,
                undefined, // selectedSourceId
                (msg, type) => {
                    if (type === 'thinking') {
                        emitStatus("thinking", msg);
                    } else if (type === 'stream') {
                        socket.emit("stream_token", { token: msg, chatId: chatId });
                    }
                },
                user.name,
                screen_context, // 🎯 SKILL 13: forward screen_context to AI
                replyToMongoId  // 🧠 Reply Teleportation: forward to Python AI Engine
            );

            emitStatus("stopped", "stopped");

            console.log(`🤖 AI Result for ${chatId}: ${response.answer?.substring(0, 50)}...`);

            // 3. AI Result already received. Create AI Message.
            // (userMsg was already created above)


            const aiMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            const aiMsgItem = {
                messageId: aiMessageId,
                sender: 'ai',
                senderName: 'Cluaiz AI',
                content: response.answer,
                type: 'text',
                metadata: { model: response.modelUsed },
                createdAt: new Date()
            };

            // Push AI message into the SAME turn created by the user
            await DailyChatBucket.findOneAndUpdate(
                {
                    organizationId: orgObjectId,
                    chatSessionId: chatSession._id,
                    date: todayStr,
                    "chat_turns.turnId": turnId
                },
                {
                    $push: {
                        "chat_turns.$.messages": aiMsgItem
                    }
                }
            );

            chatSession.last_message_at = new Date();
            chatSession.last_message_preview = response.answer.substring(0, 100);
            chatSession.last_message_sender = 'ai'; // ✨ Track AI sender
            chatSession.last_message_status = 'sent'; //  ✨ Initially sent, will update on delivery
            await chatSession.save();

            // 4. Emit responses
            // Map 'widget' -> 'WEB' for standard ChannelType
            const targetChannel = (channel?.toUpperCase() === 'WIDGET' || !channel) ? 'WEB' : channel.toUpperCase() as any;
            const formattedAnswer = formatResponse(response.answer, targetChannel);

            console.log(`📡 [Socket] Emitting receive_message for ${chatId} on channel ${targetChannel}`);

            // Send AI Response
            io.to(chatSession?._id?.toString() || socket.id).emit("receive_message", {
                id: aiMessageId,
                _id: aiMessageId, // 🆔 Send custom ID
                answer: formattedAnswer,
                raw_answer: response.answer,
                sender: "ai",
                modelUsed: response.modelUsed,
                tokensUsed: response.tokensUsed,
                form: response.form,
                formData: response.formData,
                options: response.options,
                ui_action: response.ui_action || null, // 🎯 SKILL 13: Forward ui_action to frontend
                chatId: chatSession?._id,
                timestamp: new Date().toISOString()
            });

            // 🚀 INDEX AI RESPONSE FOR GLOBAL SEARCH
            try {
                const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:5000';
                const engineUrl = AI_ENGINE_URL.endsWith('/api/v1') ? AI_ENGINE_URL : `${AI_ENGINE_URL}/api/v1`;
                axios.post(`${engineUrl}/chat/index`, {
                    org_id: orgId,
                    chat_id: chatId,
                    message_id: aiMessageId,
                    content: response.answer,
                    metadata: { type: 'text', model: response.modelUsed }
                }).catch(err => console.error("⚠️ Indexing AI message failed:", err.message));
            } catch (e) { }

            io.to(String(orgId)).emit("chat_updated", {
                ...(chatSession as any).toObject(),
                chatId: String(chatSession._id),
                _id: String(chatSession._id),
                lastActive: new Date(),
                summary: (message || "").substring(0, 50) + "...",
                userName: userName || chatSession.userName || 'Visitor',
                mode: chatSession.mode,
                last_message_preview: (response.answer || "").substring(0, 100),
                last_message_sender: 'ai',
                last_message_status: 'sent',
                unread_count: chatSession.unread_count || 0,
                unreadCount: chatSession.unread_count || 0 // Double-Key normalization
            });

        } catch (error: any) {
            console.error("❌ Chat Error Detailed:", {
                message: error.message,
                stack: error.stack,
                data: { orgId, userId, message: message?.substring(0, 20) }
            });
            socket.emit("receive_message", {
                id: `error_${Date.now()}`,
                answer: `I'm having trouble thinking right now. (Error: ${error.message})`,
                sender: "system"
            });
        }
    });

    // 📖 MARK AS READ (Sync unread counts)
    socket.on("mark_read", async (data: { orgId: string, chatId: string }) => {
        const { orgId, chatId } = data;
        try {
            const { Conversation } = await import("../../models/Conversation.js");
            const chat = await Conversation.findOneAndUpdate(
                { _id: chatId, organizationId: orgId },
                { $set: { unread_count: 0 } },
                { new: true }
            );

            if (chat) {
                io.to(orgId).emit("chat_updated", {
                    ...chat.toObject(),
                    chatId: String(chat._id),
                    _id: String(chat._id),
                    unread_count: 0,
                    unreadCount: 0 // Double-Key normalization
                });
            }
        } catch (e) {
            console.error("❌ Mark Read Error:", e);
        }
    });

    // ✍️ TYPING INDICATORS
    socket.on("typing_start", (data: { orgId: string, chatId: string }) => {
        socket.to(data.chatId).emit("user_typing", { chatId: data.chatId, isTyping: true });
    });

    socket.on("typing_stop", (data: { orgId: string, chatId: string }) => {
        socket.to(data.chatId).emit("user_typing", { chatId: data.chatId, isTyping: false });
    });

    // ❤️ TOGGLE REACTION (1-to-1 Chat: One Emoji Per Person)
    socket.on("toggle_reaction", async (data: { orgId: string; chatId: string; messageId: string; emoji: string }) => {
        const { orgId, chatId, messageId, emoji } = data;
        const reactorId = socket.handshake.auth?.userId || socket.id;
        const reactorRole = socket.handshake.auth?.role || 'user';
        const consistentReactorId = (reactorRole === 'user' && socket.handshake.auth?.deviceId)
            ? socket.handshake.auth.deviceId
            : reactorId;

        console.log(`❤️ Reaction Toggle (1-to-1): ${emoji} on ${messageId} by ${consistentReactorId}`);

        try {
            const { DailyChatBucket } = await import("../../models/DailyChatBucket.js");

            // Find the specific bucket and extract the exact message object
            const bucket = await DailyChatBucket.findOne(
                {
                    organizationId: orgId,
                    "chat_turns.messages": {
                        $elemMatch: {
                            $or: [{ messageId: messageId }, { "metadata.client_id": messageId }]
                        }
                    }
                }
            );

            if (bucket) {
                // Find the exact message in memory
                let targetMsg: any = null;
                for (const turn of bucket.chat_turns) {
                    const found = turn.messages.find(m => m.messageId === messageId || m.metadata?.client_id === messageId);
                    if (found) { targetMsg = found; break; }
                }

                if (!targetMsg) return;

                // Initialize Reactions object if needed (Mongoose Schema.Types.Mixed)
                if (!targetMsg.reactions) targetMsg.reactions = {};

                // Step 1: Check if they already have THIS emoji
                const currentReactors = targetMsg.reactions[emoji] || [];
                const alreadyHadThisEmoji = currentReactors.includes(consistentReactorId);

                // Step 2: Remove this person from ALL emojis (clean slate)
                Object.keys(targetMsg.reactions).forEach(existingEmoji => {
                    const filtered = targetMsg.reactions[existingEmoji].filter((id: string) => id !== consistentReactorId);
                    if (filtered.length > 0) {
                        targetMsg.reactions[existingEmoji] = filtered;
                    } else {
                        delete targetMsg.reactions[existingEmoji];
                    }
                });

                // Step 3: Add new emoji if needed
                let action: 'added' | 'removed';
                if (!alreadyHadThisEmoji) {
                    const newReactors = targetMsg.reactions[emoji] || [];
                    targetMsg.reactions[emoji] = [...newReactors, consistentReactorId];
                    action = 'added';
                } else {
                    action = 'removed';
                }

                // Save entire bucket (since reactions is Mixed type)
                bucket.markModified('chat_turns');
                await bucket.save();

                // Convert for frontend
                const reactionCounts: Record<string, number> = {};
                Object.keys(targetMsg.reactions).forEach(emo => {
                    reactionCounts[emo] = targetMsg.reactions[emo].length;
                });

                io.to(chatId).emit("message_reaction_updated", {
                    messageId: targetMsg.messageId,
                    clientId: targetMsg.metadata?.client_id,
                    reactions: reactionCounts,
                    triggerId: consistentReactorId,
                    emoji: emoji,
                    action: action
                });

                // 🧠 NEO4J / PYTHON AI ENGINE SYNC: Hebbian Learning Trigger
                try {
                    const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:5000';
                    const engineUrl = AI_ENGINE_URL.endsWith('/api/v1') ? AI_ENGINE_URL : `${AI_ENGINE_URL}/api/v1`;
                    console.log(`🧠 [AI Engine Sync] Proxying Reaction to Neural Graph for ${messageId}`);
                    
                    // We must fire and forget to prevent blocking the socket return
                    axios.post(`${engineUrl}/chat/reaction`, {
                        org_id: orgId,
                        user_id: consistentReactorId,
                        target_mongo_id: targetMsg.messageId || messageId,
                        emoji: emoji
                    }).catch(err => console.warn(`⚠️ Neural Hebbian Update Failed: ${err.message}`));
                } catch (aiErr) {
                    console.error("❌ Failed to contact Neural Engine for Hebbian learning sync:", aiErr);
                }
            }
        } catch (err) {
            console.error("❌ Reaction Error:", err);
        }
    });

    // 🗑️ DELETE MESSAGE (Soft Deletion Sync)
    socket.on("delete_message", async (data: { orgId: string; chatId: string; messageId: string, mode?: 'everyone' | 'me', requesterId?: string }) => {
        let { orgId, chatId, messageId, mode = 'everyone', requesterId } = data;
        const requesterRole = socket.handshake.auth?.role || 'user'; // 🛡️ Identify requester

        console.log(`🗑️ [${mode.toUpperCase()}] Request by ${requesterRole}: [${orgId}] ${messageId} in Chat ${chatId}`);

        try {
            const { DailyChatBucket } = await import("../../models/DailyChatBucket.js");

            // Find bucket and extract exact message reference
            const bucket = await DailyChatBucket.findOne(
                {
                    organizationId: orgId,
                    chatSessionId: chatId,
                    "chat_turns.messages": {
                        $elemMatch: {
                            $or: [{ messageId: messageId }, { "metadata.client_id": messageId }]
                        }
                    }
                }
            );

            if (!bucket) return console.error("❌ Delete Target Not Found in any bucket:", messageId);

            let targetMsg: any = null;
            let turnIndex = -1;
            let msgIndex = -1;

            for (let i = 0; i < bucket.chat_turns.length; i++) {
                const turn = bucket.chat_turns[i];
                for (let j = 0; j < turn.messages.length; j++) {
                    const m = turn.messages[j];
                    if (m.messageId === messageId || m.metadata?.client_id === messageId) {
                        targetMsg = m;
                        turnIndex = i;
                        msgIndex = j;
                        break;
                    }
                }
                if (targetMsg) break;
            }

            if (!targetMsg) return console.error("❌ Delete Target Msg Not Found:", messageId);

            // 🛡️ USER PERMISSION GATEKEEPER
            if (requesterRole === 'user') {
                if (mode === 'everyone') {
                    const isOwnMessage = targetMsg.sender === 'user';
                    const isWithin24h = (Date.now() - new Date(targetMsg.createdAt).getTime()) < (24 * 60 * 60 * 1000);

                    if (!isOwnMessage || !isWithin24h) {
                        console.warn(`⚠️ User tried to delete for everyone but lacks permission. Falling back to ME.`);
                        mode = 'me'; // Force "Delete for Me"
                    }
                }
            }

            if (mode === 'everyone') {
                // 🌍 Delete for Everyone: Update the message to flagged state
                targetMsg.isDeleted = true;
                targetMsg.type = 'text';
                targetMsg.content = "This message was deleted";
                if (!targetMsg.metadata) targetMsg.metadata = {};
                targetMsg.metadata.deletedAt = new Date();

                bucket.markModified(`chat_turns.${turnIndex}.messages.${msgIndex}`);
                await bucket.save();

                // 🔥 PHYSICAL DELETION (MinIO Cleanup)
                if (targetMsg.type === 'image' || targetMsg.metadata?.url) {
                    try {
                        const { deleteFile } = await import("../../modules/shared/services/storage.service.js");
                        const fileUrl = targetMsg.metadata?.url || targetMsg.content;
                        if (fileUrl && (fileUrl.startsWith('http') || fileUrl.includes('/cluaiz-storage/'))) {
                            console.log(`🗑️ [Everyone] Triggering MinIO purge for: ${fileUrl}`);
                            await deleteFile(fileUrl);
                        }
                    } catch (storageErr) {
                        console.error("❌ Physical Delete Failed:", storageErr);
                    }
                }

                // 🧹 VECTOR DELETION (AI Engine Sync)
                try {
                    const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:5000';
                    const engineUrl = AI_ENGINE_URL.endsWith('/api/v1') ? AI_ENGINE_URL : `${AI_ENGINE_URL}/api/v1`;
                    await axios.post(`${engineUrl}/chat/delete`, {
                        orgId: orgId,
                        messageId: messageId
                    });
                    console.log(`🧹 [Vector] Deleted embedding for ${messageId}`);
                } catch (vecErr) {
                    console.error("❌ Vector Delete Failed:", vecErr);
                }

                io.to(chatId).emit("message_updated", {
                    messageId: targetMsg.messageId,
                    mongoId: targetMsg.messageId, // Unified ID
                    isDeleted: true,
                    type: 'text',
                    content: "This message was deleted"
                });
            } else {
                // 👤 Delete for Me: Add requester to restricted list
                if (requesterId) {
                    if (!targetMsg.deletedFor) targetMsg.deletedFor = [];
                    if (!targetMsg.deletedFor.includes(requesterId)) {
                        targetMsg.deletedFor.push(requesterId);
                        bucket.markModified(`chat_turns.${turnIndex}.messages.${msgIndex}`);
                        await bucket.save();
                    }
                }

                // 🧙‍♂️ SMART PURGE: If both the User and an Agent have deleted it for themselves, 
                // it is effectively junk data. Purge it from storage.
                if (targetMsg && (targetMsg.type === 'image' || targetMsg.metadata?.url)) {
                    const rolesPresent = new Set(
                        (targetMsg.deletedFor || [])
                            .map((id: string) => id?.split('_')?.pop())
                            .filter(Boolean) as string[]
                    );
                    if (rolesPresent.has('user') && rolesPresent.has('agent')) {
                        try {
                            const { deleteFile } = await import("../../modules/shared/services/storage.service.js");
                            const fileUrl = targetMsg.metadata?.url || targetMsg.content;
                            if (fileUrl && (fileUrl.startsWith('http') || fileUrl.includes('/cluaiz-storage/'))) {
                                console.log(`🧙‍♂️ [SmartPurge] Hidden for all sides. Purging MinIO: ${fileUrl}`);
                                await deleteFile(fileUrl);
                            }
                        } catch (storageErr) {
                            console.error("❌ Smart Purge Failed:", storageErr);
                        }

                        // 🧹 VECTOR DELETION (AI Engine Sync via Smart Purge)
                        try {
                            const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:5000';
                            const engineUrl = AI_ENGINE_URL.endsWith('/api/v1') ? AI_ENGINE_URL : `${AI_ENGINE_URL}/api/v1`;
                            await axios.post(`${engineUrl}/chat/delete`, {
                                orgId: orgId,
                                messageId: messageId
                            });
                            console.log(`🧹 [Vector] Smart Purge Deleted embedding for ${messageId}`);
                        } catch (vecErr) {
                            console.error("❌ Vector Smart Purge Failed:", vecErr);
                        }
                    }
                }

                // Only sync back to the requester to remove it locally
                socket.emit("message_deleted", { messageId });
            }

        } catch (error) {
            console.error("❌ Delete Error:", error);
        }

        // 🔄 SYNC CONVERSATION PREVIEW (Crucial for Search Accuracy)
        try {
            const { Conversation } = await import("../../models/Conversation.js");
            const { DailyChatBucket } = await import("../../models/DailyChatBucket.js");

            // Find the absolute latest message by looking at the most recent bucket for this chat
            const latestBucket = await DailyChatBucket.findOne({
                organizationId: orgId,
                chatSessionId: chatId
            }).sort({ date: -1 });

            let lastMsg: any = null;
            if (latestBucket && latestBucket.chat_turns.length > 0) {
                const lastTurn = latestBucket.chat_turns[latestBucket.chat_turns.length - 1];
                if (lastTurn.messages.length > 0) {
                    lastMsg = lastTurn.messages[lastTurn.messages.length - 1];
                }
            }

            if (lastMsg) {
                let preview = lastMsg.content;
                // Handle different types or masking
                if (lastMsg.isDeleted && lastMsg.content === "This message was deleted") {
                    preview = "🚫 This message was deleted";
                } else if (lastMsg.type === 'image') {
                    preview = "📷 Image";
                } else if (lastMsg.type === 'audio') {
                    preview = "🎤 Voice Message";
                }

                const updatedConv = await Conversation.findByIdAndUpdate(chatId, {
                    last_message_preview: preview,
                    last_message_at: lastMsg.createdAt,
                    updatedAt: new Date()
                }, { new: true });

                // 🟢 REAL-TIME SYNC: Tell Sidebar to update preview!
                // ⚠️ CRITICAL: Frontend expects `chatId` property to match ID (String format)
                const payload = updatedConv ? {
                    ...(updatedConv as any).toObject(),
                    chatId: (updatedConv as any)._id.toString(),
                    _id: (updatedConv as any)._id.toString(),
                    unread_count: (updatedConv as any).unread_count || 0,
                    unreadCount: (updatedConv as any).unread_count || 0 // Double-Key normalization
                } : null;
                if (payload) {
                    io.to(orgId).emit('chat_updated', payload);
                    console.log(`🔄 [Sync] Updated Conversation & Emitted Event: "${preview}"`);
                }
            } else {
                // Handle case where NO messages exist (rare, matches physically deleted)
                await Conversation.findByIdAndUpdate(chatId, {
                    last_message_preview: "",
                    summary: "Conversation cleared.",
                    updatedAt: new Date()
                });
                console.log(`🔄 [Sync] Conversation cleared (Empty).`);
            }
        } catch (syncErr) {
            console.error("❌ Failed to sync conversation preview:", syncErr);
        }
    });
};
