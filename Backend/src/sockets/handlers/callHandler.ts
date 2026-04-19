import { Server, Socket } from "socket.io";

export const registerCallHandlers = (io: Server, socket: Socket) => {
    // 📞 HD CALLING SIGNALING RELAY
    const relaySignal = (event: string, data: any) => {
        const { targetId, orgId } = data;

        if (targetId) {
            io.to(targetId).emit(event, data);
        } else if (orgId) {
            socket.to(orgId).emit(event, data);
        }
    };

    socket.on('call:offer', async (data) => {
        relaySignal('call:offer', data);

        try {
            const { pushService } = await import("../../services/push.service.js");
            const { targetId, orgId, fromName } = data;

            const pushPayload = {
                type: 'incoming_call',
                callerName: fromName || 'Unknown User',
                callerId: socket.id,
                url: data.url || '/'
            };

            if (orgId) {
                await (pushService as any).notifyOrg(orgId, pushPayload);
            }
        } catch (err) {
            console.error("❌ Signaling: Push Notification Failed", err);
        }
    });

    socket.on('call:answer', (data) => relaySignal('call:answer', data));
    socket.on('call:ice-candidate', (data) => relaySignal('call:ice-candidate', data));
    socket.on('call:ended', (data) => relaySignal('call:ended', data));
    socket.on('call:answered_elsewhere', (data) => relaySignal('call:answered_elsewhere', data));

    // 📝 PERSISTENT CALL LOGGING (Server-Side)
    socket.on('call:log', async (data: { orgId: string, duration: number, status: 'answered' | 'missed' | 'declined', callerName: string, type: 'incoming' | 'outgoing', role?: string }) => {
        const { orgId, duration, status, callerName, type, role } = data;
        if (!orgId) return;

        try {
            const { Message } = await import("../../models/Message.js");
            const { Conversation } = await import("../../models/Conversation.js");
            const { ActivityLog } = await import("@modules/dashboard/timeline/ActivityLog.js");

            // resolve persistent user
            const { User } = await import("../../models/User.js");
            // Assuming socket.id or a handshake auth is used to identify the user, similar to chatHandler.
            // For now, we rely on the client sending the correct orgId, and we try to find the active conversation.

            // We need a stable user ID. In callHandler we might not have the full auth context setup as easily as chatHandler 
            // unless we duplicate the logic or expect it in `data`. 
            // For robustness, let's try to find the conversation first.

            let userId = socket.handshake.auth?.userId || socket.id; // Fallback

            // Try to find an active conversation for this socket/user to append the log to
            // This is a simplification. Ideally `call:log` should carry the conversationId if known.
            // If not, we find the most recent active conversation for this Org + Socket/User.

            // For safer logic, let's assume the client might send conversationId, or we look it up.
            // Since we don't have conversationId in the signature yet, let's look up by socket.id (guest) or User.

            // ... (Logic to find conversation would go here. For now, let's just create the Message if we can find a context)

            // ⚠️ CRITICAL: We need a conversationId to save a Message. 
            // If we can't find one, we can't save a chat message effectively.
            // Let's rely on `chatHandler`'s `persistentUserId` logic if possible, OR
            // Expect the client to pass `conversationId` if they have it. 
            // IF NOT, we skip Message creation and only do ActivityLog? NO, user wants it in chat.

            // IMPROVEMENT: Client should pass conversationId. 
            // But if we want to be bulletproof:
            // valid conversation lookup:

            // NOTE: We will trust the client to send the call log, but we need to ensure we attach it to the right conversation.
            // Let's search for the most recent conversation for this socket's user.

            // Simulating user lookup (simplified from chatHandler)
            const deviceId = (socket.handshake.auth?.deviceId as string) || `legacy_ip_${socket.handshake.address}`;
            const user = await User.findOne({ organizationId: orgId, deviceId });
            const persistentUserId = user ? (user._id as any).toString() : socket.id;

            const conversation = await Conversation.findOne({ userId: persistentUserId, organizationId: orgId });

            if (conversation) {
                // 1. Create Message
                // 🟢 CORRECT SENDER LOGIC: Trust 'role' if provided, else infer from type (legacy)
                const sender = role ? role : (type === 'incoming' ? 'agent' : 'user');

                const newMsg = await Message.create({
                    organizationId: orgId,
                    conversationId: conversation._id,
                    sender: sender,
                    senderName: callerName || 'Voice Call',
                    type: 'call_log',
                    content: status === 'answered' ? `Call ended (${duration}s)` : `Call ${status}`,
                    metadata: {
                        call_status: status,
                        duration: duration,
                        callerName: callerName,
                        startTime: new Date(Date.now() - (duration * 1000)).toISOString()
                    },
                    createdAt: new Date()
                });

                // 2. Emit to Room
                io.to((conversation._id as any).toString()).emit("receive_message", {
                    id: (newMsg._id as any).toString(),
                    sender: newMsg.sender,
                    type: 'call_log',
                    content: newMsg.content,
                    metadata: newMsg.metadata,
                    chatId: (conversation._id as any).toString(),
                    timestamp: newMsg.createdAt.toISOString()
                });

                // 3. Update Conversation Preview
                conversation.last_message_at = new Date();
                conversation.last_message_preview = `📞 ${status === 'missed' ? 'Missed Call' : 'Voice Call'}`;
                await conversation.save();

                // 4. Update Dashboard List
                io.to(orgId).emit("chat_updated", {
                    chatId: conversation._id,
                    lastActive: conversation.last_message_at,
                    summary: conversation.last_message_preview,
                    unreadCount: conversation.unread_count
                });
            }

            // 5. Activity Log (Dashboard Stats)
            await ActivityLog.create({
                org_id: orgId,
                type: 'voice_call',
                context: {
                    user_id: persistentUserId,
                    platform: 'web',
                    session_id: socket.id
                },
                data: {
                    user_msg: null,
                    bot_msg: `Voice Call: ${status} (${duration}s)`
                }
            });

        } catch (err) {
            console.error("❌ Call Logging Failed:", err);
        }
    });
};
