import { useEffect, useRef, useState, useCallback, useContext } from 'react';
import { io, Socket } from 'socket.io-client';
import { OrganizationContext } from './useOrganization';
import { DeviceService } from '@/services/device.service';
import { playSmartNotification } from '@/utils/notification';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/v1', '') || 'http://localhost:4000';

export interface Message {
    id?: string | number; // 🆔 Client-side tracking ID
    _id?: string;        // 💾 Mongo ID
    originalId?: string; // 🔍 Client-side original ID after DB hydration
    role: 'user' | 'bot';
    text: string;
    modelUsed?: string;
    form?: any;
    formData?: any;
    options?: { id: string; label: string }[];
    sdui?: any;
    workflowTrigger?: { industry: string; intent: string; };
    sources?: any[];
    tokensUsed?: number;
    metadata?: any;
    reactions?: Record<string, number>; // ❤️ Added
    userReaction?: string; // ❤️ Added
    replyTo?: { // ↩️ Explicit Reply context
        id: string | number;
        sender: string;
        content: string;
    };
    chatId?: string;
    sender?: string;
    timestamp?: string;
    type?: string; // 🟢 Preserved Type (e.g. call_log)
    content?: string;   // 📝 Alternate content field
    createdAt: string;  // 📅 ISO date for sorting/deduplication
    isDeleted?: boolean; // 🧼 Soft Deletion Flag
    deletedFor?: string[]; // 👤 Private deletion list
}

// Update signature to accept clientRole and optional chatId
export const useSocket = (orgId: string | null, clientRole: 'user' | 'agent' = 'user', chatId?: string) => {
    const socketRef = useRef<Socket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [messagesVersion, setMessagesVersion] = useState(0); // 🔥 FORCE UPDATE TRIGGER
    const [isConnected, setIsConnected] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [thinkingMessage, setThinkingMessage] = useState<string>("");
    // 🧠 THINKING STEPS: Accumulated step list for ThinkingPanel UI
    const [thinkingSteps, setThinkingSteps] = useState<Array<{ id: string; message: string; status: 'live' | 'done'; data?: Record<string, unknown> }>>([]);
    const [thinkingElapsedMs, setThinkingElapsedMs] = useState(0);
    const thinkingStartRef = useRef<number | null>(null);
    const thinkingTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [typingChatId, setTypingChatId] = useState<string | null>(null);
    const [availableDates, setAvailableDates] = useState<string[]>([]);
    const [statuses, setStatuses] = useState<any[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null); // 🆔 Track current chat
    const [initialMode, setInitialMode] = useState<'ai' | 'human'>('ai'); // 🟢 Track initial mode
    const [aiDisabledUntil, setAiDisabledUntil] = useState<string | null>(null); // 🤖 Track AI reset timer
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const orgContext = useContext(OrganizationContext);
    const updateTokens = orgContext?.updateTokens;

    // 🔍 SEARCH HISTORY FUNCTION
    const searchChatHistory = useCallback((query: string, chatId?: string) => {
        const socket = socketRef.current;
        const targetChatId = chatId || activeChatId;
        if (!socket || !orgId || !targetChatId) return;

        console.log(`🔍 [Socket] Requesting search for "${query}" in ${targetChatId}`);
        socket.emit("search_history", { orgId, chatId: targetChatId, query });
    }, [orgId, activeChatId]);

    // 🔥 CRITICAL DEBUG: Track messages state changes IN THE HOOK
    // useEffect(() => {
    //     const lastMsg = messages[messages.length - 1];
    //     // console.log('🪝 [useSocket HOOK] Messages state changed! Total:', messages.length, 'Last reactions:', lastMsg?.reactions);
    // }, [messages]);

    useEffect(() => {
        if (!orgId) return;

        const deviceId = DeviceService.getDeviceId(); // 🆔 Stable ID for user lookup

        const socket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            auth: { deviceId, role: clientRole } // 🛡️ Role context for isolated filtering
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            // console.log('✅ Socket Connected:', socket.id);
            setIsConnected(true);
            socket.emit('join_room', orgId);
            socket.emit('get_available_dates', { orgId, chatId });
            socket.emit('get_active_statuses', { orgId });

            // 🆔 Sync unique identity for this session
            socket.emit('sync_identity', { deviceId, orgId });
        });

        socket.on('disconnect', () => {
            // console.log('❌ Socket Disconnected');
            setIsConnected(false);
        });

        socket.on('chat_history', (data: { messages: Message[], mode?: 'ai' | 'human', ai_disabled_until?: string | null }) => {
            // 🔍 DEBUG: Log message structure for images (Commented out for clean console)
            // const imageMessages = data.messages.filter(m => m.type === 'image');

            setMessages(data.messages);
            if (data.mode) setInitialMode(data.mode);
            if (data.ai_disabled_until) setAiDisabledUntil(data.ai_disabled_until);

            // 🟢 FIX: Set Active Chat ID (Triggering auto-join via useEffect below)
            if (data.messages.length > 0 && data.messages[0].chatId) {
                // console.log("🔌 Setting Active Chat ID from History:", data.messages[0].chatId);
                setActiveChatId(data.messages[0].chatId);
            }
        });

        socket.on('history_segment', (data: { messages: Message[] }) => {
            console.log('📜 History Segment Loaded:', data.messages.length);
            setMessages(prev => [...data.messages, ...prev]);
            setIsLoadingHistory(false);
        });

        socket.on('history_end', () => {
            setHasMoreHistory(false);
            setIsLoadingHistory(false);
        });

        socket.on('available_dates', (data: { dates: string[] }) => setAvailableDates(data.dates));
        socket.on('active_statuses', (data: { statuses: any[] }) => setStatuses(data.statuses));

        // 👁️ Real-time Status View Update
        socket.on('status_view_updated', (data: { statusId: string, views: number }) => {
            console.log("👁️ Status View Updated:", data);
            setStatuses(prev => prev.map(s => s.id === data.statusId ? { ...s, views: data.views } : s));
        });

        socket.on('chat_history_reset', (data: { messages: Message[], anchorDate: string }) => {
            setMessages(data.messages);
            setIsLoadingHistory(false);
            setHasMoreHistory(true);
        });

        socket.on('error', (err: { message: string }) => console.error('Socket Error:', err.message));


        // 🧠 THINKING STATUS (Granular Updates)
        socket.on('thinking_status', (data: { message: string, status?: string, step?: string, data?: Record<string, unknown> }) => {
            if (data.status === 'stopped' || data.message === 'stopped') {
                setIsThinking(false);
                setThinkingMessage("");
                // Don't clear steps — let them persist for "Thought for Xs" display
                if (thinkingTimerRef.current) clearInterval(thinkingTimerRef.current);
                if (thinkingStartRef.current) {
                    setThinkingElapsedMs(Date.now() - thinkingStartRef.current);
                }
            } else {
                setThinkingMessage(data.message);
                setIsThinking(true);

                // ⏱️ Start timer if first event
                if (!thinkingStartRef.current) {
                    thinkingStartRef.current = Date.now();
                    thinkingTimerRef.current = setInterval(() => {
                        setThinkingElapsedMs(Date.now() - thinkingStartRef.current!);
                    }, 100);
                }

                // 📝 Accumulate step if it has a step ID
                if (data.step) {
                    setThinkingSteps(prev => {
                        // Mark previous live step as done
                        const updated = prev.map(s => s.status === 'live' ? { ...s, status: 'done' as const } : s);
                        // Add new step if not already present
                        const exists = updated.find(s => s.id === data.step);
                        if (exists) return updated.map(s => s.id === data.step ? { ...s, status: 'live' as const, message: data.message } : s);
                        return [...updated, { id: data.step!, message: data.message, status: 'live' as const, data: data.data }];
                    });
                }
            }
        });

        // 🟢 Remove 'Thinking' indicator as soon as streaming starts
        socket.on('ai_stream_chunk', () => {
            setIsThinking(false);
            setThinkingMessage("");
            // Mark all remaining live steps as done
            setThinkingSteps(prev => prev.map(s => s.status === 'live' ? { ...s, status: 'done' as const } : s));
            if (thinkingTimerRef.current) clearInterval(thinkingTimerRef.current);
            if (thinkingStartRef.current) setThinkingElapsedMs(Date.now() - thinkingStartRef.current);
        });

        socket.on('receive_message', (data: any) => {
            console.log('📨 [Socket] Message Received:', data.answer?.substring(0, 30), 'ID:', data.id);
            setIsThinking(false);
            setThinkingMessage("");
            setIsTyping(false);
            // Reset thinking state for next request
            setThinkingSteps([]);
            thinkingStartRef.current = null;
            if (thinkingTimerRef.current) clearInterval(thinkingTimerRef.current);
            thinkingTimerRef.current = null;

            setMessages((prev) => {
                const incomingContent = data.answer || data.message || data.text;
                const incomingTime = new Date(data.timestamp || Date.now()).getTime();

                // 🔍 FIND MATCH (by MongoID, ClientID, or Content Heuristic)
                const existingIndex = prev.findIndex(m =>
                    (data._id && m._id === data._id) ||
                    (data.id && m.id === data.id) ||
                    (data.metadata?.client_id && m.id === data.metadata.client_id) ||
                    (m.content === incomingContent && Math.abs(new Date(String(m.createdAt)).getTime() - incomingTime) < 3000)
                );

                if (existingIndex !== -1) {
                    console.log('♻️ [Socket] Hydrating existing message:', data._id || data.id);
                    const updated = [...prev];
                    updated[existingIndex] = {
                        ...updated[existingIndex],
                        _id: data._id || updated[existingIndex]._id,
                        id: data.id || updated[existingIndex].id,
                        reactions: data.reactions || updated[existingIndex].reactions,
                        userReaction: data.userReaction || updated[existingIndex].userReaction,
                        metadata: { ...updated[existingIndex].metadata, ...data.metadata }
                    };
                    return updated;
                }

                // 🛑 DEDUPLICATION: Ignore Echoes from self (only if we don't have an ID mismatch)
                if (data.sender === clientRole && !data.id) {
                    console.log('♻️ [Socket] Ignoring legacy echo from self');
                    return prev;
                }

                return [
                    ...prev,
                    {
                        id: data.id || Date.now(),
                        _id: data._id, // 🆔 Preserve Mongo ID for reactions/context menu
                        role: (data.sender === 'user' || data.role === 'user') ? 'user' : 'bot',
                        text: data.answer || data.message || data.text,
                        modelUsed: data.modelUsed,
                        form: data.form,
                        formData: data.formData,
                        options: data.options,
                        workflowTrigger: data.workflowTrigger,
                        sources: data.sources,
                        tokensUsed: data.tokensUsed,
                        chatId: data.chatId,
                        sender: data.sender,
                        replyTo: data.replyTo || data.metadata?.replyTo, // ↩️ Catch reply metadata
                        metadata: data.metadata, // 💾 Pass ALL metadata (including client_id)
                        timestamp: data.timestamp || new Date().toISOString(),
                        createdAt: data.timestamp || new Date().toISOString(),
                        type: data.type, // 🟢 Pass Type (Critical for Call Logs)
                        reactions: data.reactions, // ❤️ Hydrate Reactions
                        userReaction: data.userReaction // ❤️ Hydrate My Status
                    }
                ];
            });

            // 🔔 Smart Notification Logic: Notify if message is NOT from self
            const isFromSelf = data.sender === clientRole || data.role === clientRole;

            if (!isFromSelf) {
                console.log(`🔔 [Socket] Triggering Notice for ${clientRole} from ${data.sender || data.role}`);
                playSmartNotification();

                if (typeof window !== 'undefined' && window.parent) {
                    const previewText = data.answer || data.message || data.text || "New message";
                    window.parent.postMessage({
                        type: 'CLUAIZ_NEW_MESSAGE',
                        count: 1,
                        text: previewText,
                        sender: data.sender || data.role
                    }, '*');
                }
            }

            if (data.chatId) setActiveChatId(data.chatId);
        });


        socket.on('chat_wiped', (data: { mode: 'me' | 'everyone', wipedAt?: string }) => {
            console.log('🌪️ [Socket] Chat Wiped:', data.mode);
            if (data.mode === 'me') {
                // For 'me' mode: Hide everything from UI immediately
                setMessages([]);
            } else if (data.mode === 'everyone') {
                // For 'everyone' mode: Optional - maybe show a system alert if not already there
                // Usually handled by the system message being received
            }
        });

        // 🔄 Real-time Mode Sync (AI <-> Human)
        socket.on('mode_updated', (data: { chatId: string, mode: 'ai' | 'human', ai_disabled_until?: string | null }) => {
            console.log('🔄 [Socket] Conversation Mode Updated:', data.mode);
            setInitialMode(data.mode);
            if (data.ai_disabled_until !== undefined) setAiDisabledUntil(data.ai_disabled_until);
        });

        // 🔄 NEW: User-side mode sync
        socket.on('conversation_mode_updated', (data: { mode: 'ai' | 'human', ai_disabled_until?: string | null }) => {
            console.log('🔄 [Socket] User Mode Updated:', data.mode);
            setInitialMode(data.mode);
            if (data.ai_disabled_until !== undefined) setAiDisabledUntil(data.ai_disabled_until);
        });

        // 🗑️ Handle global data purge event (from DataManagementModal)
        const handleForcePurge = () => {
            console.log('🗑️ [Local] Force Purge Triggered');
            setMessages([]);
        };
        window.addEventListener('chat-data-purged' as any, handleForcePurge);

        // 👮‍♂️ AGENT-SIDE: Listen for new user messages across the org
        socket.on('user_message_to_agent', (data: any) => {
            console.log('📨 New User Message (to Agent):', data);
            if (data.id) {
                setMessages(prev => {
                    // 🕵️‍♂️ Robust Deduplication: Check Mongo ID, Client ID, or Match Content within 2s
                    const isDuplicate = prev.some(m =>
                        (m._id && m._id === data._id) || // Official DB ID
                        (m.id && m.id === data.id) ||     // Shared Client ID
                        (m.originalId && m.originalId === data.id) || // Stored Client ID from DB
                        // Fallback: Same content from same sender within 3 seconds (increased window for reliability)
                        (m.text === data.answer && m.sender === data.sender && Math.abs(new Date(m.timestamp || 0).getTime() - new Date().getTime()) < 3000)
                    );
                    if (isDuplicate) return prev;

                    playSmartNotification();

                    return [...prev, {
                        id: data.id,
                        _id: data._id,
                        role: data.sender === 'user' ? 'user' : 'bot', // 🟢 Fix: Use 'bot' instead of 'ai' to match interface
                        sender: data.sender,
                        text: data.answer,
                        content: data.answer,
                        type: data.type || 'text',
                        metadata: data.metadata,
                        replyTo: data.replyTo || data.metadata?.replyTo,
                        timestamp: data.timestamp || new Date().toISOString(),
                        createdAt: data.timestamp || new Date().toISOString()
                    }];
                });
            }

            if (data.chatId) setActiveChatId(data.chatId);
        });

        // ✍️ TYPING INDICATORS
        socket.on('user_typing', (data: { chatId: string, isTyping: boolean }) => {
            if (clientRole === 'agent') {
                setTypingChatId(data.isTyping ? data.chatId : null);
                setIsTyping(data.isTyping);

                if (data.isTyping) {
                    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                    typingTimeoutRef.current = setTimeout(() => {
                        setIsTyping(false);
                        setTypingChatId(null);
                    }, 5000); // 5 sec auto-hide
                }
            }
        });

        socket.on('agent_typing', (data: { chatId: string, isTyping: boolean }) => {
            if (clientRole === 'user') {
                setIsTyping(data.isTyping);

                if (data.isTyping) {
                    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                    typingTimeoutRef.current = setTimeout(() => {
                        setIsTyping(false);
                    }, 5000); // 5 sec auto-hide
                }
            }
        });

        // 🗑️ REAL-TIME DELETION SYNC
        socket.on('message_updated', (data: { messageId: string, mongoId?: string, isDeleted: boolean, content: string, type?: string }) => {
            console.log('🔄 [Socket] Message Updated (Soft Delete):', data.messageId);
            setMessages(prev => prev.map(m =>
                (m.id === data.messageId || m._id === data.messageId || (data.mongoId && m._id === data.mongoId))
                    ? { ...m, isDeleted: data.isDeleted, content: data.content, text: data.content, type: data.type || m.type }
                    : m
            ));
        });

        socket.on('message_deleted', (data: { messageId: string, mongoId?: string }) => {
            console.log('🗑️ [Socket] Message Hidden (Delete for Me):', data.messageId);
            setMessages(prev => prev.map(m =>
                (m.id === data.messageId || m._id === data.messageId || (data.mongoId && m._id === data.mongoId))
                    ? { ...m, isDeleted: true, text: "This message was deleted", type: 'text' }
                    : m
            ));
        });

        // 🌪️ ZERO-TRACE WIPE REFRESH
        const handlePurgeEvent = () => {
            console.log("🌪️ [Zero-Trace] Data purged event received. Clearing local state.");
            setMessages([]);
            // Re-fetch history to see the "wiped" state (which will be empty if just nuked)
            socket.emit('get_available_dates', { orgId });
            // Note: History is usually auto-reloaded by the socket reconnect or join_room 
            // but we can manually trigger a join_room to be sure if we want fresh history.
            socket.emit('join_room', orgId);
        };

        window.addEventListener('chat-data-purged', handlePurgeEvent);

        return () => {
            socket.disconnect();
            window.removeEventListener('chat-data-purged', handlePurgeEvent);
        };
    }, [orgId]); // 🧼 REMOVED: updateTokens (Prevent reconnection loop during streaming)

    const sendMessage = useCallback((text: string, context?: { url: string; title: string }, payload?: any, role: 'user' | 'agent' = 'user', targetChatId?: string) => {
        if (!socketRef.current || !orgId) return;

        const actualChatId = targetChatId || activeChatId;
        const tempId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Optimistic Update (Only if it's not a hidden event)
        if (!payload?.hidden) {
            setMessages((prev) => [...prev, {
                id: tempId,
                role: role === 'agent' ? 'bot' : 'user', // 🟢 Fix: Use 'bot' for agent/ai alignment
                sender: role,
                text,
                content: text,
                type: payload?.type || 'text',
                metadata: payload?.metadata,
                replyTo: payload?.metadata?.replyTo,
                timestamp: new Date().toISOString(),
                createdAt: new Date().toISOString()
            }]);
        }
        setIsThinking(role === 'user');

        // 👮‍♂️ AGENT MESSAGE PROTOCOL (Always priority if role is explicitly agent)
        if (role === 'agent' && actualChatId) {
            socketRef.current.emit('agent_message', {
                id: tempId,
                orgId,
                chatId: actualChatId,
                message: text,
                agentId: 'dashboard-agent',
                type: payload?.type,
                metadata: payload?.metadata,
                replyTo: payload?.metadata?.replyTo
            });
        } else if (role === 'user') {
            // 👤 USER MESSAGE PROTOCOL
            const history = messages.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text
            }));

            socketRef.current.emit('send_message', {
                id: tempId,
                orgId,
                chatId: actualChatId,
                message: text,
                type: payload?.type,
                context,
                history,
                metadata: payload?.metadata || {},
                selectedSourceId: payload?.selectedSourceId
            });
        }
    }, [orgId, messages, activeChatId]);

    // 🔗 IDENTITY MERGE FUNCTION
    const identifyUser = useCallback((userData: { email?: string; phone?: string; name?: string }) => {
        if (!socketRef.current || !orgId) return;

        const deviceId = DeviceService.getDeviceId();

        socketRef.current.emit("user_identify", {
            orgId,
            deviceId,
            ...userData
        });
    }, [orgId]);

    // ✍️ EMIT TYPING STATUS
    const setTypingStatus = useCallback((isTyping: boolean, chatId?: string) => {
        if (!socketRef.current || !orgId) return;

        const event = clientRole === 'agent' ? 'agent_typing_start' : 'user_typing_start';
        const stopEvent = clientRole === 'agent' ? 'agent_typing_stop' : 'user_typing_stop';

        socketRef.current.emit(isTyping ? event : stopEvent, {
            orgId,
            chatId: chatId || activeChatId || socketRef.current.id
        });
    }, [orgId, clientRole, activeChatId]);

    // Listen for Identity Updates
    useEffect(() => {
        const socket = socketRef.current;
        if (!socket) return;

        socket.on("identity_updated", (data) => {
            console.log("🔗 Identity Merged/Updated:", data);
            // Optional: Force a refresh or simply know that backend is synced.
            // If we really want to be "Solid", we assume backend handles the room join.
            // But re-fetching history might be needed if we merged OLD chats.
        });

        return () => {
            socket.off("identity_updated");
        }
    }, [isConnected]); // Re-bind if connection changes

    // 📜 PAGINATION STATE
    const [hasMoreHistory, setHasMoreHistory] = useState(true);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Note: We need to inject listeners into the MAIN useEffect or a secondary one
    // But since `socket` is created inside useEffect, we should modify the main useEffect.

    // Instead of rewriting the whole file, I will just append the listeners inside the existing useEffect 
    // via a separate 'useEffect' that depends on 'socketRef.current' or just rely on the main one if accessible.

    // BETTER APPROACH: Export a function to load more
    const loadMoreHistory = useCallback(() => {
        const socket = socketRef.current;
        if (!socket || !orgId || !hasMoreHistory || isLoadingHistory || messages.length === 0) return;

        const oldestMessage = messages[0];
        // Timestamps might be strings from JSON, ensure handling
        const before = oldestMessage.metadata?.timestamp || (oldestMessage as any).createdAt || (oldestMessage as any).timestamp;

        console.log("📜 Loading more history before:", before);
        setIsLoadingHistory(true);
        socket.emit("load_more_history", { orgId, before });
    }, [orgId, hasMoreHistory, isLoadingHistory, messages]);

    // 🦘 JUMP TO DATE FUNCTION
    const jumpToDate = useCallback((targetDate: Date) => {
        const socket = socketRef.current;
        if (!socket || !orgId) return;

        setIsLoadingHistory(true);
        // ISO String for safety
        socket.emit("jump_to_date", { orgId, targetDate: targetDate.toISOString() });
    }, [orgId]);

    const markStatusViewed = useCallback((statusId: string) => {
        const socket = socketRef.current;
        if (!socket || !orgId) return;
        socket.emit("view_status", { statusId, orgId });
    }, [orgId]);

    // 🗑️ DELETE MESSAGE FUNCTION
    const deleteMessage = useCallback((messageId: string, mode: 'everyone' | 'me' = 'everyone', chatId?: string) => {
        const socket = socketRef.current;
        if (!socket || !orgId) return;

        const baseId = DeviceService.getDeviceId();
        const requesterId = `${baseId}_${clientRole}`; // 🛡️ Role Isolation: Prevent session bleeding

        console.log(`🗑️ Emitting delete_message [${mode}]:`, { messageId, chatId: chatId || activeChatId, requesterId });
        socket.emit('delete_message', {
            orgId,
            chatId: chatId || activeChatId,
            messageId,
            mode,
            requesterId
        });
    }, [orgId, activeChatId, clientRole]);

    // 🤖 TOGGLE AI MODE FUNCTION
    const toggleAiMode = useCallback((enabled: boolean) => {
        const socket = socketRef.current;
        if (!socket || !orgId || !activeChatId) return;

        const newMode = enabled ? 'ai' : 'human';
        console.log(`🤖 Toggling AI Mode to: ${newMode}`);

        socket.emit('set_conversation_mode', {
            orgId,
            chatId: activeChatId,
            mode: newMode
        });
    }, [orgId, activeChatId]);

    // ❤️ TOGGLE REACTION FUNCTION
    const toggleReaction = useCallback((messageId: string, emoji: string, chatId?: string) => {
        const socket = socketRef.current;
        const targetChatId = chatId || activeChatId;

        console.log(`❤️ [toggleReaction] Triggered. Msg: ${messageId}, Emoji: ${emoji}, Chat: ${targetChatId}, Org: ${orgId}`);

        if (!socket || !orgId || !targetChatId) {
            console.error('❌ [toggleReaction] Missing socket, orgId, or chatId', { socket: !!socket, orgId, targetChatId });
            return;
        }

        socket.emit('toggle_reaction', {
            orgId,
            chatId: targetChatId,
            messageId,
            emoji
        });

        // ⚡ Optimistic Update
        // ⚡ Optimistic Update
        setMessages(prev => {
            console.log(`⚡ [Optimistic] Searching for ${messageId} in ${prev.length} messages`);
            const newMessages = prev.map(m => {
                if (m.id === messageId || m._id === messageId) {
                    console.log(`⚡ [Optimistic] FOUND msg: ${m.id}. Current Reactions:`, m.reactions);
                    // Force new object reference for reactions
                    const currentReactions = JSON.parse(JSON.stringify(m.reactions || {}));
                    const currentCount = currentReactions[emoji] || 0;
                    const hasReacted = m.userReaction === emoji;

                    // Toggle logic local
                    if (hasReacted) {
                        currentReactions[emoji] = Math.max(0, currentCount - 1);
                        if (currentReactions[emoji] === 0) delete currentReactions[emoji];
                        return { ...m, reactions: currentReactions, userReaction: undefined };
                    } else {
                        currentReactions[emoji] = currentCount + 1;
                        console.log(`⚡ [Optimistic] UPDATED Reactions:`, currentReactions);
                        return { ...m, reactions: currentReactions, userReaction: emoji };
                    }
                }
                return m;
            });
            return [...newMessages]; // 🟢 FORCE NEW ARRAY REFERENCE
        });
    }, [orgId, activeChatId]);

    // ❤️ LISTEN FOR REACTIONS (Refined)
    useEffect(() => {
        const socket = socketRef.current;
        if (!socket) return;

        const myDeviceId = DeviceService.getDeviceId();

        const handleReactionUpdate = (data: { messageId: string, clientId?: string, reactions: Record<string, number>, triggerId: string, emoji: string, action: 'added' | 'removed' }) => {
            console.log('🚨 [NEW CODE v2.0] Reaction Update Handler Running!', new Date().toLocaleTimeString());
            console.log('❤️ [Socket] Reaction Updated:', data);

            setMessages(prev => {
                // 🔍 DEBUG: Log all message IDs to trace matching issue
                console.log('🔍 [Debug] Searching for messageId:', data.messageId);
                console.log('🔍 [Debug] clientId:', data.clientId);
                console.log('🔍 [Debug] Total messages in state:', prev.length);

                // Log first few message IDs for comparison
                prev.slice(0, 5).forEach(m => {
                    console.log(`🔍 [Debug] Message: id=${m.id}, _id=${m._id}, metadata.client_id=${m.metadata?.client_id}`);
                });

                let foundMatch = false;
                const newMessages = prev.map(m => {
                    const isTarget = m.id === data.messageId ||
                        m._id === data.messageId ||
                        (data.clientId && m.metadata?.client_id === data.clientId) ||
                        (data.clientId && m.id === data.clientId);

                    if (isTarget) {
                        foundMatch = true;
                        console.log(`✅ [Debug] MATCH FOUND! Message ID: ${m.id}, _id: ${m._id}`);

                        const isMe = data.triggerId === myDeviceId || data.triggerId === socket.id;

                        let newUserReaction = m.userReaction;
                        if (isMe) {
                            newUserReaction = data.action === 'added' ? data.emoji : undefined;
                        }

                        // Force new object reference
                        const updated = {
                            ...m,
                            reactions: JSON.parse(JSON.stringify(data.reactions)), // Deep clone to force update
                            userReaction: newUserReaction,
                        };

                        console.log(`✅ [Debug] Updated message reactions:`, updated.reactions);
                        console.log('✅ [Debug] Full updated message:', JSON.stringify({ id: updated.id, _id: updated._id, reactions: updated.reactions, userReaction: updated.userReaction }));
                        console.log(`✅ [Debug] Returning updated message with timestamp:`, new Date().toLocaleTimeString());
                        return updated;
                    }
                    return m;
                });

                if (!foundMatch) {
                    console.error('❌ [Debug] NO MATCH FOUND! Reaction update failed for messageId:', data.messageId);
                }

                console.log('🎯 [Debug] Returning NEW array with length:', newMessages.length);
                return [...newMessages]; // 🟢 FORCE NEW ARRAY REFERENCE
            });

            // 🔥 CRITICAL: Increment version to FORCE widget re-render
            setMessagesVersion(prev => {
                const newVersion = prev + 1;
                console.log('🔥 [FORCE UPDATE] messagesVersion incremented to:', newVersion);
                return newVersion;
            });

            // 🔥 CRITICAL: Check if setMessages completed
            console.log('🔥 [CRITICAL] setMessages CALL COMPLETED at:', new Date().toLocaleTimeString());
        };

        socket.on('message_reaction_updated', handleReactionUpdate);

        return () => {
            socket.off('message_reaction_updated', handleReactionUpdate);
        };
    }, [isConnected, clientRole]);

    // 🔌 AUTO-JOIN CHAT ROOM (Critical for Real-time Events)
    useEffect(() => {
        const socket = socketRef.current;
        if (socket && activeChatId && isConnected) {
            console.log(`🔌 [Effect] Enforcing Join Chat Room: ${activeChatId}`);
            socket.emit('join_chat', activeChatId);
        }
    }, [activeChatId, isConnected]);

    // 📅 SYNC AVAILABLE DATES: Re-fetch when chatId changes
    useEffect(() => {
        const socket = socketRef.current;
        if (socket && isConnected && orgId) {
            const targetChatId = chatId || activeChatId;
            if (targetChatId) {
                console.log(`📅 [Socket] Fetching available dates for: ${targetChatId}`);
                socket.emit('get_available_dates', { orgId, chatId: targetChatId });
            }
        }
    }, [chatId, activeChatId, isConnected, orgId]);

    return {
        messages,
        messagesVersion, // 🔥 FORCE UPDATE TRACKER
        sendMessage,
        identifyUser,
        isConnected,
        isThinking,
        thinkingMessage,
        thinkingSteps,       // 🧠 NEW: Step list for ThinkingPanel
        thinkingElapsedMs,   // ⏱️ NEW: Elapsed time in ms
        setMessages,
        socket: socketRef.current,
        // Pagination Exports
        loadMoreHistory,
        hasMoreHistory,
        isLoadingHistory,
        availableDates, // Export
        jumpToDate, // Export
        statuses, // 🟢 Export
        markStatusViewed, // 🟢 Export
        // Typing
        isTyping,
        typingChatId,
        setTypingStatus,
        initialMode, // 🟢 Export Initial Mode
        aiDisabledUntil, // 🤖 Export AI Reset Timer
        toggleAiMode, // 🤖 Export Toggle
        deleteMessage, // 🗑️ Export Deletion
        toggleReaction, // ❤️ Export Reaction
        searchChatHistory // 🔍 Export Search History
    };
};
