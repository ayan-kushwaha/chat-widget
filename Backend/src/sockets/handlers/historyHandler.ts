import { Server, Socket } from "socket.io";
import mongoose from "mongoose"; // 🟢 Added mongoose import

export const registerHistoryHandlers = (io: Server, socket: Socket) => {
    // 📜 PAGINATION: Load Older Messages
    socket.on("load_more_history", async (data: { orgId: string, before: string }) => {
        const { orgId, before } = data;
        if (!orgId || !before) return;

        try {
            const deviceId = (socket.handshake.auth?.deviceId as string);
            const role = (socket.handshake.auth?.role as string) || 'user';
            const isolatedId = `${deviceId}_${role}`;
            if (!deviceId) return;

            const { User } = await import("../../models/User.js");
            const { Conversation } = await import("../../models/Conversation.js");
            const { Message } = await import("../../models/Message.js");

            const user = await User.findOne({ organizationId: orgId, deviceId });
            if (!user) return;

            const conversation = await Conversation.findOne({ userId: user._id, organizationId: orgId });
            if (!conversation) return;

            // 🎯 We find buckets that might contain messages before this date.
            // For true pagination we'd ideally filter by date string. For now, fetch latest buckets.
            const targetDateObj = new Date(before);
            const targetDateStr = targetDateObj.toISOString().split('T')[0];

            console.log(`📜 [History] Fetching Buckets for Chat: ${conversation._id}, targetDate: ${targetDateStr}`);

            const { DailyChatBucket } = await import("../../models/DailyChatBucket.js");

            // Fetch buckets sorted newest first
            const buckets = await DailyChatBucket.find({ chatSessionId: conversation._id })
                .sort({ date: -1 })
                .limit(10); // Adjust as needed to get enough history

            // 🗃️ Flatten the buckets into a single array of messages
            let allMessages: any[] = [];
            for (const bucket of buckets) {
                for (const turn of bucket.chat_turns) {
                    for (const msg of turn.messages) {
                        // Exclude wiped/deleted
                        if (msg.isWiped) continue;
                        if (msg.wipedFor && msg.wipedFor.includes(isolatedId)) continue;

                        // User side hide check
                        if (role === 'user') {
                            if (msg.wipedForUserSide) continue;
                            if (conversation.userSideHiddenBefore && new Date(msg.createdAt) < new Date(conversation.userSideHiddenBefore)) {
                                continue;
                            }
                        }

                        // Date check (we want messages strictly BEFORE 'before')
                        if (new Date(msg.createdAt) < targetDateObj) {
                            allMessages.push(msg);
                        }
                    }
                }
            }

            // Sort newest first
            allMessages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            // Apply limit
            const messages = allMessages.slice(0, 50);

            if (messages.length > 0) {
                const chronologicalMessages = messages.reverse();

                // ❤️ Reaction ID Logic
                const reactorId = socket.handshake.auth?.userId || socket.id;
                const reactorRole = socket.handshake.auth?.role || 'user';
                const consistentReactorId = (reactorRole === 'user' && socket.handshake.auth?.deviceId)
                    ? socket.handshake.auth.deviceId
                    : reactorId;

                socket.emit("history_segment", {
                    messages: chronologicalMessages.map(m => {
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
                            text: m.content,
                            timestamp: m.createdAt,
                            sender: m.sender,
                            modelUsed: m.metadata?.model,
                            replyTo: m.metadata?.replyTo, // ↩️ Reply context
                            form: (m.type === 'form_submission' || m.metadata?.type === 'form') ? m.metadata?.form : undefined,
                            options: m.metadata?.options,
                            sources: m.metadata?.sources,
                            type: m.type, // 🟢 Preserved Type
                            chatId: conversation._id,
                            metadata: m.metadata, // 🟢 Include Full Metadata
                            reactions: reactionCounts,
                            userReaction: userReaction
                        };
                    })
                });
            } else {
                socket.emit("history_end");
            }
        } catch (err) {
            console.error("❌ Pagination Error:", err);
        }
    });

    // 📅 DATE NAVIGATION: Get Available Dates
    socket.on("get_available_dates", async (data: { orgId: string, chatId?: string }) => {
        const { orgId, chatId } = data;
        if (!orgId) return;

        try {
            const deviceId = (socket.handshake.auth?.deviceId as string);

            let conversationId = chatId;

            if (!conversationId) {
                if (!deviceId) return;

                const { User } = await import("../../models/User.js");
                const { Conversation } = await import("../../models/Conversation.js");

                const user = await User.findOne({ organizationId: orgId, deviceId });
                if (!user) return;

                const conversation = await Conversation.findOne({ userId: user._id, organizationId: orgId });
                if (!conversation) return;
                conversationId = (conversation._id as any);
            }

            const { DailyChatBucket } = await import("../../models/DailyChatBucket.js");

            // Robust check: if no conversationId after all lookups, return empty
            if (!conversationId) return;

            // Simple: just get distinct bucket dates for this conversation
            const activeDates = await DailyChatBucket.distinct('date', {
                chatSessionId: new mongoose.Types.ObjectId(conversationId)
            });

            socket.emit("available_dates", {
                dates: activeDates.sort()
            });

        } catch (err) {
            console.error("❌ Date Fetch Error:", err);
        }
    });

    // 🦘 DATE NAVIGATION: Jump to Date
    socket.on("jump_to_date", async (data: { orgId: string, targetDate: string }) => {
        const { orgId, targetDate } = data;
        if (!orgId || !targetDate) return;

        try {
            const deviceId = (socket.handshake.auth?.deviceId as string);
            const role = (socket.handshake.auth?.role as string) || 'user';
            const isolatedId = `${deviceId}_${role}`;
            if (!deviceId) return;

            const { User } = await import("../../models/User.js");
            const { Conversation } = await import("../../models/Conversation.js");
            const { DailyChatBucket } = await import("../../models/DailyChatBucket.js");

            const user = await User.findOne({ organizationId: orgId, deviceId });
            if (!user) return;

            const conversation = await Conversation.findOne({ userId: user._id, organizationId: orgId });
            if (!conversation) return;

            const targetDateObj = new Date(targetDate);
            const targetDateStr = targetDateObj.toISOString().split('T')[0];

            // Fetch the bucket for this exact date, or later dates
            const buckets = await DailyChatBucket.find({
                chatSessionId: conversation._id,
                date: { $gte: targetDateStr }
            }).sort({ date: 1 }).limit(10);

            // 🗃️ Flatten the buckets
            let allMessages: any[] = [];
            for (const bucket of buckets) {
                for (const turn of bucket.chat_turns) {
                    for (const msg of turn.messages) {
                        if (msg.isWiped) continue;
                        if (msg.wipedFor && msg.wipedFor.includes(isolatedId)) continue;

                        if (role === 'user') {
                            if (msg.wipedForUserSide) continue;
                            if (conversation.userSideHiddenBefore && new Date(msg.createdAt) < new Date(conversation.userSideHiddenBefore)) {
                                continue;
                            }
                        }

                        // We only want messages AFTER the exact target Date time, but generally, 
                        // jumping to a date implies loading messages for that whole day onwards.
                        if (new Date(msg.createdAt) >= targetDateObj) {
                            allMessages.push(msg);
                        }
                    }
                }
            }

            allMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            const messages = allMessages.slice(0, 50);

            if (messages.length > 0) {
                // ❤️ Reaction ID Logic
                const reactorId = socket.handshake.auth?.userId || socket.id;
                const reactorRole = socket.handshake.auth?.role || 'user';
                const consistentReactorId = (reactorRole === 'user' && socket.handshake.auth?.deviceId)
                    ? socket.handshake.auth.deviceId
                    : reactorId;

                socket.emit("chat_history_reset", {
                    messages: messages.map(m => {
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
                            id: m.messageId, // 🆔 Persistent ID
                            role: m.sender === 'user' ? 'user' : 'bot',
                            text: m.content,
                            timestamp: m.createdAt,
                            sender: m.sender,
                            modelUsed: m.metadata?.model,
                            replyTo: m.metadata?.replyTo, // ↩️ Reply context
                            form: (m.type === 'form_submission' || m.metadata?.type === 'form') ? m.metadata?.form : undefined,
                            options: m.metadata?.options,
                            sources: m.metadata?.sources,
                            type: m.type, // 🟢 Preserved Type 
                            metadata: m.metadata, // 🟢 Include Full Metadata
                            reactions: reactionCounts,
                            userReaction: userReaction
                        };
                    }),
                    anchorDate: targetDate
                });
            } else {
                socket.emit("error", { message: "No messages found for this date." });
            }

        } catch (err) {
            console.error("❌ Jump Date Error:", err);
        }
    });

    // 🔍 SEARCH HISTORY: Find messages matching query
    socket.on("search_history", async (data: { orgId: string, chatId: string, query: string }) => {
        const { orgId, chatId, query } = data;
        if (!orgId || !chatId || !query) return;

        try {
            const { DailyChatBucket } = await import("../../models/DailyChatBucket.js");
            const deviceId = (socket.handshake.auth?.deviceId as string);
            const role = (socket.handshake.auth?.role as string) || 'user';
            const isolatedId = `${deviceId}_${role}`;

            console.log(`🔍 [Socket] Searching history in ${chatId} for: "${query}"`);

            const regex = new RegExp(query, 'i'); // Case insensitive

            // Aggregation to unwind the chat_turns and messages arrays to filter matches
            const rawMessages = await DailyChatBucket.aggregate([
                { $match: { chatSessionId: new mongoose.Types.ObjectId(chatId) } },
                { $unwind: "$chat_turns" },
                { $unwind: "$chat_turns.messages" },
                { $replaceRoot: { newRoot: "$chat_turns.messages" } },
                {
                    $match: {
                        content: { $regex: regex },
                        isWiped: { $ne: true },
                        wipedFor: { $ne: isolatedId }
                    }
                },
                { $sort: { createdAt: -1 } },
                { $limit: 50 }
            ]);

            const messages = rawMessages;

            if (messages.length > 0) {
                // ❤️ Reaction ID Logic
                const reactorId = socket.handshake.auth?.userId || socket.id;
                const reactorRole = socket.handshake.auth?.role || 'user';
                const consistentReactorId = (reactorRole === 'user' && socket.handshake.auth?.deviceId)
                    ? socket.handshake.auth.deviceId
                    : reactorId;

                const processedMessages = messages.reverse().map(m => {
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
                        id: m.messageId,
                        role: m.sender === 'user' ? 'user' : 'bot',
                        text: m.content,
                        timestamp: m.createdAt,
                        sender: m.sender,
                        modelUsed: m.metadata?.model,
                        replyTo: m.metadata?.replyTo,
                        form: (m.type === 'form_submission' || m.metadata?.type === 'form') ? m.metadata?.form : undefined,
                        options: m.metadata?.options,
                        sources: m.metadata?.sources,
                        type: m.type,
                        metadata: m.metadata,
                        reactions: reactionCounts,
                        userReaction: userReaction
                    };
                });

                socket.emit("chat_history_reset", {
                    messages: processedMessages,
                    anchorDate: new Date().toISOString() // Just a signal
                });
            } else {
                socket.emit("chat_history_reset", { messages: [], anchorDate: new Date().toISOString() });
            }

        } catch (err) {
            console.error("❌ Search History Error:", err);
        }
    });
};
