import { Server, Socket } from "socket.io";
import mongoose from "mongoose";

export const registerAgentHandlers = (io: Server, socket: Socket) => {
    // ✍️ AGENT TYPING INDICATORS
    socket.on("agent_typing_start", (data: { orgId: string, chatId: string }) => {
        io.to(data.chatId).emit("agent_typing", { chatId: data.chatId, isTyping: true });
    });

    socket.on("agent_typing_stop", (data: { orgId: string, chatId: string }) => {
        io.to(data.chatId).emit("agent_typing", { chatId: data.chatId, isTyping: false });
    });

    // 👮‍♂️ AGENT HANDOFF: Human Takes Over
    socket.on("agent_join", async (data: { orgId: string; chatId: string; agentId: string }) => {
        const { orgId, chatId, agentId } = data;
        console.log(`👮‍♂️ Agent ${agentId} joining chat ${chatId}`);

        try {
            const { Conversation } = await import("../../models/Conversation.js");

            // Atomic Switch: AI -> Human
            const chat = await Conversation.findOneAndUpdate(
                { _id: chatId, organizationId: orgId },
                {
                    mode: 'human',
                    assignedTo: agentId,
                    status: 'active'
                },
                { new: true }
            );

            if (chat) {
                // Notify User
                io.to(chatId).emit("agent_joined", {
                    agentId,
                    name: "Support Agent"
                });

                // Notify Dashboard
                io.to(orgId).emit("chat_mode_updated", {
                    chatId,
                    mode: 'human',
                    assignedTo: agentId
                });
            }
        } catch (e) {
            console.error("Agent Join Error", e);
        }
    });

    // 👮‍♂️ AGENT MESSAGE (Human -> User)
    socket.on("agent_message", async (data: { id?: string; orgId: string; chatId: string; message: string; agentId: string; type?: string; metadata?: any; replyTo?: any }) => {
        const { id, orgId, chatId, message, agentId, type = 'text', metadata = {}, replyTo } = data;
        console.log(`📨 AGENT MESSAGE RECEIVED: ChatId: ${chatId}, Msg: ${message}, Type: ${type}`);

        const roomName = chatId.toString();
        const roomMembers = Array.from(io.sockets.adapter.rooms.get(roomName) || []);
        console.log(`📡 BROADCASTING to Room: ${roomName}, Members: ${roomMembers.length}`);

        io.to(roomName).emit("receive_message", {
            id: id || `agent_msg_${Date.now()}`, // 🆔 Fixed Unique ID
            answer: message,
            sender: "agent",
            agentId: agentId,
            chatId: chatId,
            type: type, // 🟢 Forward Asset Type
            metadata: metadata, // 💾 Forward Asset Metadata (URL etc)
            timestamp: new Date().toISOString(),
            replyTo: replyTo // ↩️ Add Reply Context
        });

        io.to(chatId).emit("thinking_status", { message: "stopped", status: "stopped" });

        try {
            const { ActivityLog } = await import("../../modules/dashboard/timeline/ActivityLog.js");
            const { Conversation } = await import("../../models/Conversation.js");
            const { Message } = await import("../../models/Message.js");

            await Message.create({
                organizationId: orgId,
                conversationId: chatId,
                sender: 'agent',
                senderName: 'Support Agent',
                content: message,
                type: type, // 🟢 Use Dynamic Type
                metadata: { ...metadata, replyTo } // 💾 Include Metadata (URL etc)
            });

            const chat = await Conversation.findOneAndUpdate(
                { _id: chatId, organizationId: orgId },
                {
                    $set: {
                        last_message_at: new Date(),
                        last_message_preview: message.substring(0, 100),
                        last_message_sender: 'agent', // ✨ Track agent sender
                        last_message_status: 'sent', // ✨ Initially sent, will update on delivery
                        unread_count: 0,
                        mode: 'human'
                    }
                },
                { new: true }
            );

            if (!chat) return;

            // 🟢 REAL-TIME SIDEBAR SYNC (Agent Message)
            // ⚠️ CRITICAL: Stringify IDs to prevent comparison drift in frontend
            const payload = {
                ...(chat as any).toObject(),
                chatId: String(chat._id),
                _id: String(chat._id),
                userName: (chat as any).userName || 'Visitor', // Fallback
                unread_count: 0,
                unreadCount: 0 // Double-Key normalization
            };

            console.log(`🔄 [AGENT] Emitting chat_updated to room: ${String(orgId)}`, {
                id: payload.chatId,
                preview: payload.last_message_preview
            });

            io.to(String(orgId)).emit("chat_updated", payload);

            const { User } = await import("../../models/User.js");
            const targetUser = await User.findOne({ organizationId: orgId, _id: (chat as any).userId });

            await ActivityLog.create({
                org_id: orgId,
                type: 'conversation',
                context: {
                    user_id: targetUser?._id || (chat as any).userId,
                    platform: 'web',  // ✅ Valid enum value
                    session_id: chatId
                },
                data: {
                    user_msg: null,
                    bot_msg: message
                }
            });

        } catch (e) {
            console.error("❌ Agent Message Error:", e);
        }
    });

    // 🔄 SWITCH MODE (AI <-> HUMAN)
    socket.on("set_conversation_mode", async (data: { orgId: string; chatId: string; mode: 'ai' | 'human' }) => {
        const { orgId, chatId, mode } = data;
        console.log(`🔄 Mode Switch Request: [${orgId}] ${chatId} -> ${mode}`);

        try {
            const { Conversation } = await import("../../models/Conversation.js");

            // If switched to 'human', set the 24h reset timer
            const aiDisabledUntil = mode === 'human' ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null;

            await Conversation.updateOne(
                { _id: chatId, organizationId: orgId },
                { $set: { mode, ai_disabled_until: aiDisabledUntil } }
            );

            io.to(orgId).emit("chat_updated", {
                chatId: chatId.toString(),
                _id: chatId.toString(),
                mode
            });
            io.to(chatId).emit("conversation_mode_updated", { mode, ai_disabled_until: aiDisabledUntil });
            console.log(`✅ Mode Switched to ${mode} for Chat: ${chatId}`);
        } catch (e) {
            console.error("❌ Mode Switch Error:", e);
        }
    });

    // 🔄 WIDGET AI TOGGLE (User Side) - Sync to Dashboard
    socket.on("toggle_ai_mode", async (data: { chatId: string; mode: 'ai' | 'human'; source: 'user' }) => {
        const { chatId, mode } = data;
        console.log(`🤖 [Widget Toggle] User changed AI to: ${mode} for Chat: ${chatId}`);

        try {
            // Just broadcast to dashboard - don't update database mode
            // (mode field is for admin handoff, this is just UI sync)
            io.to(chatId).emit("conversation_mode_updated", { mode });
            console.log(`✅ Widget AI toggle synced to dashboard`);
        } catch (e) {
            console.error("❌ Widget AI Toggle Error:", e);
        }
    });

    // 🚨 REQUEST HUMAN (Smart Handoff)
    socket.on("request_human", async (data: { orgId: string, chatId: string }) => {
        const { orgId, chatId } = data;
        try {
            const { Conversation } = await import("../../models/Conversation.js");
            await Conversation.findOneAndUpdate(
                { _id: chatId, organizationId: orgId },
                { status: 'active', mode: 'handoff', assignedTo: null }
            );

            io.to(orgId).emit("new_handoff_request", {
                chatId: chatId,
                user: "Visitor Needs Help!",
                message: "User requested human agent.",
                timestamp: new Date()
            });

            setTimeout(async () => {
                const currentChat = await Conversation.findOne({ _id: chatId, organizationId: orgId }) as any;
                if (currentChat && currentChat.mode === 'handoff') {
                    const fallbackMsg = "Sorry, all our agents are currently busy. 😓\nI have noted your request.\nPlease share your **Email** or **Phone Number**, and a senior agent will contact you shortly.";

                    socket.emit("receive_message", {
                        id: `system_fallback_handoff_${Date.now()}`,
                        answer: fallbackMsg,
                        sender: 'system'
                    });

                    socket.to(chatId).emit("receive_message", {
                        id: `system_fallback_handoff_sync_${Date.now()}`,
                        answer: fallbackMsg,
                        sender: 'system'
                    });

                    currentChat.status = 'active';
                    currentChat.mode = 'ai';
                    await currentChat.save();

                    io.to(orgId).emit("chat_updated", {
                        chatId: chatId.toString(),
                        _id: chatId.toString(),
                        mode: 'ai',
                        summary: "Missed Call - Lead Capture Mode"
                    });
                }
            }, 60000);
        } catch (e) {
            console.error("Request Human Error", e);
        }
    });
};
