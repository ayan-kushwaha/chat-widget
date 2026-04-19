import { Server, Socket } from "socket.io";
import mongoose from "mongoose";

export const registerIdentityHandlers = (io: Server, socket: Socket) => {
    // Join Room (Org ID)
    socket.on("join_room", async (room_id: string) => {
        if (room_id) {
            socket.join(room_id);
            if (!socket.data.orgId) {
                socket.data.orgId = room_id;
                console.log(`👤 [Socket] User ${socket.id} linked to Org: ${room_id}`);
            }

            try {
                const deviceId = (socket.handshake.auth?.deviceId as string);
                const { User } = await import("../../models/User.js");
                const user = await User.findOne({ organizationId: room_id, deviceId }) as any;
                if (user) {
                    const userRoom = user._id.toString();
                    socket.join(userRoom);
                    console.log(`🏠 [Socket] User ${socket.id} joined Personal Room: ${userRoom}`);
                }
            } catch (e) {
                // Fail silently
            }

            // 🔄 AUTO-HYDRATION: Fetch Chat History
            try {
                const deviceId = (socket.handshake.auth?.deviceId as string);
                const role = (socket.handshake.auth?.role as string) || 'user';
                const isolatedId = `${deviceId}_${role}`; // 🛡️ Role-Specific Exclusion
                if (!deviceId) return;

                const { User } = await import("../../models/User.js");
                const { Conversation } = await import("../../models/Conversation.js");
                const { Message } = await import("../../models/Message.js");

                const user = await User.findOne({ organizationId: room_id, deviceId });
                if (!user) return;

                const conversation = await Conversation.findOne({ userId: user._id, organizationId: room_id }) as any;
                if (!conversation) return;

                socket.join(conversation._id.toString());
                console.log(`🔌 Widget Auto-Joined Chat Room via Hydration: ${conversation._id}`);

                // 🎯 Build dynamic filter
                const baseFilter: any = {
                    conversationId: conversation._id,
                    isWiped: { $ne: true },               // 🌪️ Zero-Trace Wipe Exclusion
                    wipedFor: { $ne: isolatedId }         // 👤 Zero-Trace per user
                };

                // For widget (user role): 
                if (role === 'user') {
                    // 1. Backward compatibility: Hide if old flag is set
                    // 2. Hide if created BEFORE userSideHiddenBefore
                    const hideConditions: any[] = [{ wipedForUserSide: { $ne: true } }];

                    if (conversation.userSideHiddenBefore) {
                        hideConditions.push({ createdAt: { $gte: conversation.userSideHiddenBefore } });
                    }

                    baseFilter.$and = hideConditions;
                }

                const messages = await Message.find(baseFilter)
                    .sort({ createdAt: -1 })
                    .limit(50);

                if (messages.length > 0) {
                    const chronologicalMessages = messages.reverse();

                    // Identify the current user for "userReaction" highlighting
                    const reactorId = socket.handshake.auth?.userId || socket.id;
                    const reactorRole = socket.handshake.auth?.role || 'user';
                    const consistentReactorId = (reactorRole === 'user' && socket.handshake.auth?.deviceId)
                        ? socket.handshake.auth.deviceId
                        : reactorId;

                    socket.emit("chat_history", {
                        messages: chronologicalMessages.map((m: any) => {
                            const isHiddenForMe = m.deletedFor?.includes(isolatedId);

                            // ❤️ Convert Reactions Map -> Counts
                            const reactionCounts: Record<string, number> = {};
                            let userReaction: string | undefined = undefined;

                            if (m.reactions && m.reactions instanceof Map) {
                                m.reactions.forEach((users: string[], emo: string) => {
                                    reactionCounts[emo] = users.length;
                                    if (users.includes(consistentReactorId)) {
                                        userReaction = emo;
                                    }
                                });
                            }

                            return {
                                id: m._id, // 🆔 Persistent ID
                                role: m.sender === 'user' ? 'user' : 'bot',
                                text: isHiddenForMe ? "This message was deleted" : m.content,
                                timestamp: m.createdAt,
                                sender: m.sender,
                                modelUsed: m.metadata?.model,
                                replyTo: m.metadata?.replyTo, // ↩️ Reply context from meta
                                form: (m.type === 'form_submission' || m.metadata?.type === 'form') ? m.metadata?.form : undefined,
                                options: m.metadata?.options,
                                sources: m.metadata?.sources,
                                type: isHiddenForMe ? 'text' : m.type, // 🟢 Mask type if hidden
                                chatId: conversation._id,
                                isDeleted: m.isDeleted || isHiddenForMe, // 🧼 Soft Delete Flag
                                metadata: isHiddenForMe ? { ...m.metadata, url: null } : m.metadata, // 🛡️ Hide media
                                reactions: reactionCounts, // ❤️ ADDED
                                userReaction: userReaction // ❤️ ADDED
                            };
                        })
                    });
                }
            } catch (err) {
                console.error("❌ History Fetch Error:", err);
            }
        }
    });

    socket.on("join_chat", (chatId: string) => {
        if (chatId) {
            const roomName = chatId.toString();
            socket.join(roomName);
            console.log(`🔌 [Socket] User ${socket.id} joined CHAT room: ${roomName}`);
        }
    });

    // 🔗 IDENTITY MERGE
    socket.on("user_identify", async (data: { orgId: string; email?: string; phone?: string; name?: string; deviceId: string }) => {
        const { orgId, email, phone, name, deviceId } = data;
        if (!email && !phone) return;

        try {
            const { User } = await import("../../models/User.js");

            const realUser: any = await User.findOne({
                organizationId: orgId,
                $or: [{ email: email }, { phone: phone }]
            });

            const guestUser: any = await User.findOne({
                organizationId: orgId,
                deviceId: deviceId
            });

            if (realUser && guestUser && realUser.userId !== guestUser.userId) {
                const { Conversation } = await import("../../models/Conversation.js");
                const sourceConv = await Conversation.findOne({ userId: guestUser._id, organizationId: orgId });
                const targetConv = await Conversation.findOne({ userId: realUser._id, organizationId: orgId });

                if (sourceConv && targetConv) {
                    const { Message } = await import("../../models/Message.js");
                    await Message.updateMany({ conversationId: sourceConv._id }, { conversationId: targetConv._id });
                    await Conversation.deleteOne({ _id: sourceConv._id });
                } else if (sourceConv && !targetConv) {
                    sourceConv.userId = realUser._id;
                    await sourceConv.save();
                }

                if (!realUser.identities.includes(deviceId)) {
                    realUser.identities.push(deviceId);
                }
                if (name && !realUser.name.includes("Visitor")) realUser.name = name;
                if (phone && !realUser.phone) realUser.phone = phone;
                if (!realUser.deviceId) realUser.deviceId = deviceId;

                await realUser.save();
                guestUser.deviceId = `merged_${guestUser.deviceId}`;
                await guestUser.save();

                socket.emit("identity_updated", { newUserId: realUser._id, mergeType: 'guest_to_real' });
                socket.join(realUser._id.toString());
            } else if (guestUser) {
                if (email) guestUser.email = email;
                if (phone) guestUser.phone = phone;
                if (name) guestUser.name = name;
                await guestUser.save();
                socket.emit("identity_updated", { newUserId: guestUser._id, mergeType: 'update' });
            }
        } catch (err) {
            console.error("❌ Identity Merge Error:", err);
        }
    });

    // Handle AI notes
    socket.on('save_ai_note', async (data: { orgId: string; content: string }) => {
        const { orgId, content } = data;
        try {
            const { LearningMemory } = await import("../../models/LearningMemory.js");
            await LearningMemory.create({
                organizationId: orgId,
                type: 'fact',
                category: 'manual_note',
                title: content.substring(0, 30) + (content.length > 30 ? '...' : ''),
                content: content,
                confidence: 1,
                source: 'manual',
                generatedAt: new Date(),
                status: 'approved'
            });
        } catch (err) {
            console.error("❌ Failed to save AI Note:", err);
        }
    });
};
