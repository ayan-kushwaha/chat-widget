import { useState, useEffect, useRef, useMemo, RefObject } from 'react';
import { useFileHandler } from './useFileHandler';
import { useSocket, Message as SocketMessage } from '@/hooks/useSocket';
import { ChatMessage } from '../types';
import { playSendSound, playReceiveSound } from '@/utils/sendSound';
import axios from 'axios';
import { toast } from 'sonner';
import { GridOptionType } from '../utils/InputGrid';
import { PollData } from '../builders/PollBuilder';
import { useCallStore } from '@/store/useCallStore';
import { useUITeleporter } from '../../../hooks/useUITeleporter'; // 🎯 SKILL 13

interface UseChatLogicProps {
    orgId: string;
    conversationId?: string;
    externalFilterType?: string | null;
    userName: string;
    textareaRef: RefObject<HTMLTextAreaElement | null>;
    viewMode?: 'widget' | 'dashboard'; // 🌍 Context Awareness
    initialMessage?: string; // 🚀 Trigger specific flows on mount
}

import { useBrowserVoice } from '../../browser-voice/useBrowserVoice';

export const useChatLogic = ({
    orgId,
    conversationId,
    externalFilterType,
    userName,
    textareaRef,
    viewMode = 'dashboard', // Default to dashboard if not specified? Or widget? ChatWindow passes dashboard.
    initialMessage
}: UseChatLogicProps) => {
    const {
        messages,
        sendMessage,
        isThinking,
        thinkingMessage,
        thinkingSteps,
        thinkingElapsedMs,
        isConnected,
        setMessages,
        socket,
        loadMoreHistory,
        hasMoreHistory,
        isLoadingHistory,
        availableDates,
        jumpToDate,
        statuses, // 🟢
        markStatusViewed, // 🟢
        isTyping,
        typingChatId,
        setTypingStatus,
        initialMode, // 🟢 Import
        deleteMessage, // 🗑️ Import
        toggleReaction, // ❤️ Import
        messagesVersion, // 🔥 Import
        aiDisabledUntil, // 🤖 Import
        searchChatHistory // 🔍 Import
    } = useSocket(orgId, viewMode === 'dashboard' ? 'agent' : 'user', conversationId); // 🟢 Identity based on viewMode + chatId

    const [inputValue, setInputValue] = useState('');
    const initialInputBeforeVoice = useRef('');
    const lastSpokenMessageIdRef = useRef<string | null>(null); // 🎙️ Track last spoken msg to prevent loops
    const speechQueue = useRef<string[]>([]); // 🎙️ Queue for streaming segments
    const lastSpokenIndexRef = useRef(0); // 🎙️ Last characters processed for speech in current stream
    const isActuallySpeakingRef = useRef(false); // 🎙️ Track if tts is busy

    // 🎯 SKILL 13: UI Teleporter Initialized
    const { getLiveScreenContext, processMessage: processTeleporterMessage } = useUITeleporter();

    // 🎙️ Voice Mode & Continuous Listening
    const [isVoiceMode, setIsVoiceMode] = useState(false);

    const {
        startInteraction,
        stopInteraction,
        transcript: voiceTranscript,
        interimTranscript, // 🎙️ Real-time Interim
        isListening: isVoiceListening,
        isSpeaking: isVoiceSpeaking,
        activeWordIndex,
        botReply: voiceBotReply,
        forceSpeak,
        speakSegment
    } = useBrowserVoice((text) => {
        // 🚀 SMART AUTO-SEND: Only if input was empty when voice started
        if (initialInputBeforeVoice.current.trim() === '') {
            setInputValue(text);
            setTimeout(() => handleSend(text), 0); // 🎯 Pass text directly to avoid state race
        } else {
            // Append to existing text if user had something typed
            setInputValue(initialInputBeforeVoice.current + (initialInputBeforeVoice.current ? ' ' : '') + text);
        }
    });

    // 🗣️ Sync voice interim transcript to input in real-time
    useEffect(() => {
        if (isVoiceListening) {
            const combined = initialInputBeforeVoice.current +
                (initialInputBeforeVoice.current && interimTranscript ? ' ' : '') +
                interimTranscript;
            setInputValue(combined);
        }
    }, [interimTranscript, isVoiceListening]);

    // 🔄 Export Voice Toggle Globally for ChatInput
    useEffect(() => {
        (window as any).isVoiceMode = isVoiceMode;
        (window as any).toggleVoiceMode = () => {
            console.log("🎙️ [Toggle] Voice Mode:", !isVoiceMode);
            setIsVoiceMode(prev => !prev);
        };
    }, [isVoiceMode]);

    // Manage Voice Session
    useEffect(() => {
        if (isVoiceMode) {
            console.log("🎙️ [VoiceMode] Starting Interaction");
            initialInputBeforeVoice.current = inputValue; // 🎯 Capture state before voice
            lastSpokenMessageIdRef.current = null; // Reset
            speechQueue.current = [];
            lastSpokenIndexRef.current = 0;
            startInteraction();
        } else {
            console.log("🎙️ [VoiceMode] Stopping Interaction");
            lastSpokenMessageIdRef.current = null; // 🧹 Reset on exit
            speechQueue.current = [];
            lastSpokenIndexRef.current = 0;
            stopInteraction();
        }
    }, [isVoiceMode]);

    // 🔗 Real-time Room Join (Fix for Dashboard Updates)

    useEffect(() => {
        if (conversationId && socket && isConnected) {
            console.log(`🔌 Joining Chat Room: ${conversationId}`);
            socket.emit('join_room', conversationId);

            // 🟢 Explicitly join chat room for real-time updates (Same as Widget)
            socket.emit('join_chat', conversationId);
        }
    }, [conversationId, socket, isConnected]);

    // 🔄 Handle initialMessage (e.g. from Menu navigation)
    useEffect(() => {
        if (initialMessage === '[SYSTEM: START_VOICE]') {
            console.log("🎙️ [Initial] Triggering Voice Mode");
            setIsVoiceMode(true);
        } else if (initialMessage && socket && isConnected) {
            // Handle regular initial messages if needed
            setInputValue(initialMessage);
        }
    }, [initialMessage, socket, isConnected]);

    // 🟢 Initialize Mode from Socket (Admin Handoff)
    const [mode, setMode] = useState<'ai' | 'human'>(initialMode || 'ai');

    // 🟢 Sync Initial Mode when it loads
    useEffect(() => {
        if (initialMode) setMode(initialMode);
    }, [initialMode]);

    // 🤖 User-Side AI Toggle (Widget Only - Independent from Admin)
    const [aiEnabledByUser, setAiEnabledByUser] = useState<boolean>(() => {
        if (viewMode === 'widget') {
            // Auto-reset to true on page load/refresh
            return true;
        }
        return true; // Dashboard always has AI enabled by user
    });

    // 🤖 Sync mode with aiEnabledByUser for widget icon display
    useEffect(() => {
        if (viewMode === 'widget') {
            setMode(aiEnabledByUser ? 'ai' : 'human');
        }
    }, [aiEnabledByUser, viewMode]);

    // 🟢 Listen for Mode Changes
    useEffect(() => {
        if (!socket) return;

        const handleModeUpdate = (data: { mode: 'ai' | 'human' }) => {
            console.log("🔄 [useChatLogic] Mode Updated:", data.mode);
            setMode(data.mode);
        };

        socket.on("conversation_mode_updated", handleModeUpdate);

        return () => {
            socket.off("conversation_mode_updated", handleModeUpdate);
        };
    }, [socket]);

    // 🚀 TUNNEL LISTENER (Zero Latency Streaming)
    useEffect(() => {
        if (!socket) return;

        const handleStreamChunk = (data: { chunk: string; chatId: string }) => {
            if (conversationId && data.chatId && data.chatId !== conversationId && data.chatId !== socket.id) return;

            setMessages((prevMessages) => {
                const lastMsg = prevMessages[prevMessages.length - 1];
                if (!lastMsg) return prevMessages;

                const isAI = lastMsg.sender === 'ai' || (lastMsg as any).role === 'ai';
                const isPlaceholder = lastMsg.sender === 'user'; // Create new AI message if last was user

                if (isAI) {
                    const currentText = (lastMsg as any).text || (lastMsg as any).content || "";
                    const newText = currentText + data.chunk;

                    // 🎙️ VOICE STREAMING: Process new text for speech if voice mode is active
                    if (isVoiceMode && !isVoiceListening) {
                        const newAvailableText = newText.substring(lastSpokenIndexRef.current);
                        const breakMatch = newAvailableText.match(/[.!?\n]/);
                        if (breakMatch) {
                            const breakPoint = breakMatch.index! + 1;
                            const segment = newAvailableText.substring(0, breakPoint).trim();
                            if (segment) {
                                speechQueue.current.push(segment);
                                lastSpokenIndexRef.current += breakPoint;
                                // Trigger processing if not busy
                                if (!isVoiceSpeaking && !isActuallySpeakingRef.current) {
                                    processNextSpeech();
                                }
                            }
                        }
                    }

                    return [...prevMessages.slice(0, -1), { ...lastMsg, text: newText, content: newText } as any];
                } else if (isPlaceholder) {
                    const tempId = `stream-${Date.now()}`;
                    lastSpokenIndexRef.current = 0; // Reset for new stream
                    return [...prevMessages, {
                        id: tempId,
                        sender: 'ai',
                        content: data.chunk,
                        text: data.chunk,
                        role: 'ai',
                        type: 'text',
                        createdAt: new Date()
                    } as any];
                }

                return prevMessages;
            });
        };

        socket.on('ai_stream_chunk', handleStreamChunk);

        return () => {
            socket.off('ai_stream_chunk', handleStreamChunk);
        };
    }, [socket, conversationId]);

    const [remoteMode, setRemoteMode] = useState<'ai' | 'human'>('ai'); // Synced State (Legacy?)
    const [isMaximized, setIsMaximized] = useState(false);
    const [showMaximize, setShowMaximize] = useState(false);

    // 🔍 Search & Filter State
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string | null>(externalFilterType || null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // 🔍 Deep Search Integration
    useEffect(() => {
        // Only trigger deep search if we have a query AND the conversation is active
        // Also debounce to prevent spamming
        const timer = setTimeout(() => {
            if (conversationId && searchQuery && searchQuery.trim().length > 0) {
                console.log(`🔍 [useChatLogic] Triggering deep history search for: "${searchQuery}"`);
                searchChatHistory(searchQuery, conversationId);
            } else if (conversationId && isConnected && (!searchQuery || searchQuery.trim().length === 0)) {
                console.log(`🔍 [useChatLogic] Search cleared. Resetting history for: ${conversationId}`);
                socket?.emit('join_room', conversationId);
            }
        }, 600); // 600ms Debounce

        return () => clearTimeout(timer);
    }, [searchQuery, conversationId, socket, isConnected]);

    // 🕵️ MILLISECOND DOM SCAN (Live Context) - REMOVED (Handled by useUITeleporter)

    // 🚀 ACTION INTERCEPTOR (Executing AI Commands)
    useEffect(() => {
        if (!socket || viewMode === 'dashboard') return;

        const handleReceiveMessage = (message: any) => {
            // 🎯 SKILL 13: Forward incoming messages to the Teleporter hook
            if (message?.ui_action) {
                processTeleporterMessage(message);
            }

            // Legacy Action Handler (Optional fallback)
            const action = message.metadata?.action;
            const data = message.metadata?.data || message.metadata?.action_data;

            if (action && data) {
                // ... Legacy navigation/click logic remains as fallback
            }
        };

        socket.on('receive_message', handleReceiveMessage);
        return () => { socket.off('receive_message', handleReceiveMessage); };
    }, [socket, viewMode, processTeleporterMessage]);

    // Sync external filter type
    useEffect(() => {
        if (externalFilterType) {
            setFilterType(externalFilterType);
        }
    }, [externalFilterType]);

    // 🔊 Handle Receive Sound
    const prevMsgLen = useRef(0);
    useEffect(() => {
        if (messages.length > prevMsgLen.current) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg && (
                (lastMsg as any).sender === 'ai' ||
                (lastMsg as any).sender === 'agent' ||
                (lastMsg as any).role === 'ai' ||
                (lastMsg as any).role === 'bot'
            )) {
                playReceiveSound();
            }
        }
        prevMsgLen.current = messages.length;
    }, [messages]);

    // ↩️ Reply State
    const [replyingTo, setReplyingTo] = useState<{ id: string; sender: string; content: string } | null>(null);

    const {
        selectedFile,
        filePreviewUrl,
        handleFileUpload,
        clearFile,
        processFile: handleFileSelect, // Alias to match existing usage
        setSelectedFile,
        setFilePreviewUrl,
        sendFileToAI,
        setSendFileToAI
    } = useFileHandler({
        chatId: conversationId || orgId,
        orgId
    });

    // 🔗 Link Preview State
    const [linkPreviewData, setLinkPreviewData] = useState<any>(null);
    const [isFetchingLink, setIsFetchingLink] = useState(false);
    const linkPreviewDebounceRef = useRef<NodeJS.Timeout | null>(null);

    // Builders state
    const [isPollBuilderOpen, setIsPollBuilderOpen] = useState(false);
    const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
    const [isSlotPickerOpen, setIsSlotPickerOpen] = useState(false);
    const [isQuickReplyOpen, setIsQuickReplyOpen] = useState(false);
    const [isOfferOpen, setIsOfferOpen] = useState(false);
    const [isLocationOpen, setIsLocationOpen] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isNoteBuilderOpen, setIsNoteBuilderOpen] = useState(false);
    const [isInputGridOpen, setIsInputGridOpen] = useState(false);
    const [reschedulingMsgId, setReschedulingMsgId] = useState<string | null>(null);

    const timestampCache = useRef<Record<string, Date>>({});

    const socketMessages: ChatMessage[] = useMemo(() => messages
        .filter((m: any) => {
            // 🛡️ CRITICAL FIX: Prevent Cross-Talk by filtering messages
            // If I am in a specific conversation (Dashboard Mode), only show messages for this ID.
            if (conversationId && m.chatId && m.chatId !== conversationId) return false;

            // 🔍 Search Filter (Case Insensitive)
            if (searchQuery) {
                const searchLower = searchQuery.toLowerCase();
                const content = (m.text || m.content || "").toLowerCase();
                const sender = (m.senderName || m.sender || "").toLowerCase();
                if (!content.includes(searchLower) && !sender.includes(searchLower)) return false;
            }

            // 🏷️ Category Filter
            if (filterType) {
                const msgType = m.type || m.metadata?.type || 'text';

                switch (filterType) {
                    case 'links':
                        const content = m.text || m.content || "";
                        if (!/(https?:\/\/[^\s]+)/g.test(content) && !m.metadata?.linkPreview) return false;
                        break;
                    case 'my_sms':
                        if (m.sender !== 'user') return false;
                        break;
                    case 'incoming_sms':
                        if (m.sender !== 'ai' && m.sender !== 'bot' && m.sender !== 'agent') return false;
                        break;
                    case 'booking':
                        if (msgType !== 'booking_confirmation' && msgType !== 'slot_picker') return false;
                        break;
                    case 'form':
                        if (msgType !== 'form_request' && msgType !== 'form_submission') return false;
                        break;
                    case 'voice_call':
                        if (msgType !== 'call_log') return false;
                        break;
                    default:
                        if (msgType !== filterType) return false;
                }
            }

            return true;
        })
        .map((m: any, i) => {
            // 🛡️ CRITICAL FIX: Use STABLE IDs (Timestamp + Content Hash) instead of Index
            let stableTime: Date;
            if (m.createdAt && !isNaN(new Date(m.createdAt).getTime())) stableTime = new Date(m.createdAt);
            else if (m.created_at && !isNaN(new Date(m.created_at).getTime())) stableTime = new Date(m.created_at);
            else if (m.timestamp && !isNaN(new Date(m.timestamp).getTime())) stableTime = new Date(m.timestamp);
            else {
                // Fallback: If no time, use current time (cached by index to avoid re-render loops)
                // Note: We use index here ONLY for cache key, but the stored value is Time.
                const fallbackId = m._id || `msg-${i}`;
                if (!timestampCache.current[fallbackId]) {
                    timestampCache.current[fallbackId] = new Date();
                }
                stableTime = timestampCache.current[fallbackId];
            }

            // Index-based IDs (msg-${i}) shift when history loads, causing "Scroll to Wrong Message" bugs.
            const stableIdSuffix = m.sender ? `${m.sender.slice(0, 5)}` : 'anon';

            // Ensure timestamp is valid number
            const timeVal = stableTime.getTime();
            const timestampStr = isNaN(timeVal) ? Date.now().toString() : timeVal.toString();

            // Fallback ID must be consistent for the same message content/time
            // We strip any spaces to ensure hash consistency if sender has spaces
            const id = m._id || m.id || `msg-${timestampStr}-${stableIdSuffix.replace(/\s/g, '')}`;

            // 🔍 DEBUG HYDRATION
            if (m.metadata?.client_id) {
                console.log(`💧 Hydrated Msg [${i}]:`, {
                    mongoId: m._id,
                    clientId: m.metadata.client_id,
                    generatedId: id
                });
            }

            return {
                id,
                _id: m._id, // 💾 Preserve original Mongo ID
                originalId: m.metadata?.client_id || m.id, // 💾 Hydrate Client ID from DB (Architecture Fix)
                sender: m.sender || (m.role === 'user' ? 'user' : 'ai'),
                senderName: m.senderName || (m.role === 'bot' ? 'Cluaiz AI' : undefined),
                content: m.text || m.content || "",
                type: m.type || m.metadata?.type || 'text',
                isDeleted: m.isDeleted, // 🧼 CRITICAL: Map isDeleted flag to ChatMessage
                metadata: m.metadata,
                reactions: m.reactions, // ❤️ CRITICAL: Map reactions from socket to ChatMessage
                replyTo: (m.replyTo || m.metadata?.replyTo) ? {
                    ... (m.replyTo || m.metadata?.replyTo),
                    // Ensure the ReplyTo ID acts as a "foreign key" lookup string
                    id: (m.replyTo || m.metadata?.replyTo).id || (m.replyTo || m.metadata?.replyTo)._id
                } : undefined, // ↩️ Add Reply Context (Normalized)
                createdAt: stableTime,
            };
        })
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()), [messages, conversationId, searchQuery, filterType]);

    // 🤖 [AI SYNC] Automatically Speak AI Replies in Voice Mode
    useEffect(() => {
        if (!isVoiceMode) return;
        if (socketMessages.length === 0) return;

        const lastMessage = socketMessages[socketMessages.length - 1];

        // 🛡️ GUARD: Don't re-speak the same message twice
        if (lastSpokenMessageIdRef.current === lastMessage.id) return;

        if (lastMessage.sender === 'ai' || lastMessage.sender === 'bot') {
            const textToSpeak = lastMessage.content;
            if (textToSpeak && !isVoiceSpeaking && !isVoiceListening) {
                console.log("🗣️ [VoiceMode] Speaking AI Reply:", textToSpeak);
                lastSpokenMessageIdRef.current = lastMessage.id; // ✅ Mark as handled
                forceSpeak(textToSpeak);
            }
        }
    }, [socketMessages, isVoiceMode, isVoiceSpeaking, isVoiceListening]);



    const processNextSpeech = () => {
        if (speechQueue.current.length === 0) {
            isActuallySpeakingRef.current = false;
            return;
        }

        isActuallySpeakingRef.current = true;
        const segment = speechQueue.current.shift()!;
        console.log("🗣️ [StreamingVoice] Speaking segment:", segment);
        speakSegment(segment, () => {
            // After finished speaking segment, check if more in queue
            setTimeout(() => processNextSpeech(), 50);
        });
    };

    const handleSend = async (overrideValue?: string) => {
        console.log("🚀 [useChatLogic] handleSend triggered", { inputValue, overrideValue, selectedFile, isConnected, orgId });
        const currentInput = (overrideValue !== undefined ? overrideValue : inputValue).trim();
        const currentFile = selectedFile;
        // 📸 OPTIMISTIC UPDATE: Immediate Local Feedback
        const tempId = `temp-${Date.now()}`;
        let optimisticMessage: any = null;

        // 1. Create Optimistic Message if File Exists
        if (currentFile) {
            const isImage = currentFile.type.startsWith('image/');
            if (isImage && filePreviewUrl) {
                optimisticMessage = {
                    id: tempId,
                    role: viewMode === 'dashboard' ? 'bot' : 'user',
                    sender: viewMode === 'dashboard' ? 'agent' : 'user',
                    text: currentInput || '📷 Image',
                    type: 'image',
                    metadata: {
                        type: 'image',
                        url: filePreviewUrl, // 🟢 Local Blob URL
                        fileName: currentFile.name,
                        mimeType: currentFile.type,
                        status: 'sending' // ⏳ Loading State
                    },
                    timestamp: new Date().toISOString()
                };
                // ⚡ Show immediately
                setMessages(prev => [...prev, optimisticMessage]);
                playSendSound();

                // Clear input immediately for better UX
                setInputValue('');
                clearFile(); // Keeps preview URL valid? No, clearFile revokes it. 
                // ⚠️ WAIT: We need the preview URL to stay valid until upload finishes?
                // Actually, clearFile revokes it. We should revoke AFTER upload or let the blob persist for a bit.
                // Modified clearFile usage below.
            }
        } else if (!currentInput) {
            return; // Nothing to send
        }

        // 2. Clear UI immediately (Optimistic)
        if (!optimisticMessage) {
            setInputValue('');
            playSendSound();
        }

        setIsMaximized(false);
        setShowMaximize(false);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = '38px';
        }

        // 3. Background Upload & Send
        let attachmentData = null;
        if (currentFile) {
            try {
                // Determine upload endpoint manually since we detached logic
                // But we can re-use handleFileUpload but we need to ensure it doesn't clearFile too early if we rely on it?
                // handleFileUpload in useFileHandler DOES NOT clearFile automatically on success? 
                // Let's check useFileHandler: It DOES call clearFile() on success.
                // 🚩 Issue: clearFile revokes the URL. The optimistic image will vanish/break.
                // Fix: We need to Manage the revoke ourselves or delay it.
                // We will rely on `handleFileUpload` but we might need to recreate the blob if needed or modify `useFileHandler`?
                // No, let's just proceed. If it revokes, the browser *might* lose the image.
                // Better strategy: Don't use `filePreviewUrl` from hook that gets revoked. Use a separate one?
                // The `filePreviewUrl` is state. `clearFile` sets it to null and revokes.
                // We should pass a flag to handleFileUpload to NOT clear? No, it's internal.
                // Let's Assume the upload is fast enough? No.
                // We will rely on simple "Loading..." placeholder if image breaks?
                // OR: We just don't use `clearFile` inside `handleFileUpload`? 
                // Looking at `useFileHandler.ts`: `if (response.data.success) { clearFile(); ... }`
                // 🛑 We must modify `useFileHandler` to optionally skip clearing, or we just accept the risk.
                // Actually, let's just upload. The `optimisticMessage` uses `filePreviewUrl` string.
                // If `clearFile` revokes it, the `img src` breaks.
                // We should probably modify `useFileHandler` to NOT clear on success, let the caller do it.
            } catch (e) {
                console.error("Upload preparation failed", e);
            }

            // ⚠️ calling handleFileUpload will clear the file and revoke URL.
            // We need to prevent the UI from breaking.
            // Check `useFileHandler` implementation...
        }

        // 🚀 EXECUTE UPLOAD (This will clear file and revoke URL internally)
        if (currentFile) {
            attachmentData = await handleFileUpload();
            if (!attachmentData) {
                // Upload failed, remove optimistic message
                setMessages(prev => prev.filter(m => m.id !== tempId));
                toast.error("Failed to send attachment");
                return;
            }
        }

        // 4. Construct Final Payload
        const payload = replyingTo ? {
            metadata: {
                replyTo: {
                    id: replyingTo.id,
                    sender: replyingTo.sender,
                    content: replyingTo.content
                },
                reply_to_mongo_id: replyingTo.id // 🧠 Explicitly forward string ID for AI Engine
            }
        } : {};

        let finalPayload: any = { ...payload };

        // 🖇️ Attach Link Preview (if no file)
        if (!currentFile && linkPreviewData) {
            finalPayload.metadata = {
                ...(finalPayload.metadata || {}),
                linkPreview: linkPreviewData
            };
        }

        // 📎 Attach File Data (Real URL)
        if (attachmentData) {
            if (attachmentData.type === 'image') {
                finalPayload.metadata = {
                    ...(finalPayload.metadata || {}),
                    type: 'image',
                    url: attachmentData.url, // 🟢 Server URL
                    fileName: currentFile?.name,
                    mimeType: currentFile?.type
                };
                finalPayload.type = 'image';
            } else if (attachmentData.type === 'video' || attachmentData.type === 'audio') {
                finalPayload.metadata = {
                    ...(finalPayload.metadata || {}),
                    type: attachmentData.type,
                    url: attachmentData.url,
                    fileName: currentFile?.name,
                    mimeType: currentFile?.type
                };
                finalPayload.type = attachmentData.type;
            } else {
                finalPayload.metadata = {
                    ...(finalPayload.metadata || {}),
                    type: 'document',
                    url: attachmentData.url,
                    fileName: currentFile?.name,
                    fileType: currentFile?.type,
                };
                finalPayload.type = 'document';
            }
        }

        // Determine Content
        let typeLabel = '📎 Document';
        if (attachmentData?.type === 'image') typeLabel = '📷 Image';
        else if (attachmentData?.type === 'video') typeLabel = '🎥 Video';
        else if (attachmentData?.type === 'audio') typeLabel = '🎵 Audio';

        const messageContent = currentInput || (attachmentData ? typeLabel : '');

        // 🎭 Role Determination
        const role = viewMode === 'dashboard' ? 'agent' : 'user';
        const targetChatId = attachmentData?.chatId || conversationId;

        // 5. Send Real Message (Socket)
        // This will append the REAL message to `messages` via `useSocket` optimistic update.
        // We must REMOVE our local optimistic message to avoid duplication.
        if (optimisticMessage) {
            setMessages(prev => prev.filter(m => m.id !== tempId));
        }

        // Pass `type` explicitly to avoid "Text" placeholder bug
        const msgType = finalPayload.type || 'text';

        // 🤖 Check if user has disabled AI (Widget only)
        const shouldDisableAI = viewMode === 'widget' && !aiEnabledByUser;
        if (shouldDisableAI) {
            finalPayload.metadata = {
                ...(finalPayload.metadata || {}),
                aiDisabledByUser: true
            };
        }

        // 🕵️ Inject Millisecond DOM Scan (Live Context for Skill 13)
        if (viewMode === 'widget') {
            const liveContext = getLiveScreenContext();
            if (liveContext) {
                finalPayload.metadata = {
                    ...(finalPayload.metadata || {}),
                    screen_context: liveContext
                };
            }
        }

        sendMessage(messageContent, undefined, { ...finalPayload, type: msgType }, role, targetChatId);

        // Cleanup
        if (!currentFile) clearFile(); // Only clear if we didn't upload (since upload clears)
        setReplyingTo(null);
        setLinkPreviewData(null);
    };



    const handleGridSelect = (type: GridOptionType) => {
        switch (type) {
            case 'gallery': {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*,video/*,audio/*';
                input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) handleFileSelect(file);
                };
                input.click();
                break;
            }
            case 'document': {
                const docInput = document.createElement('input');
                docInput.type = 'file';
                docInput.accept = '.pdf,.doc,.docx';
                docInput.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) handleFileSelect(file);
                };
                docInput.click();
                break;
            }
            case 'poll': setIsPollBuilderOpen(true); break;
            case 'product': setIsProductPickerOpen(true); break;
            case 'booking': setIsSlotPickerOpen(true); break;
            case 'form': setIsFormOpen(true); break;
            case 'location': setIsLocationOpen(true); break;
            case 'offer': setIsOfferOpen(true); break;
            case 'quick_reply': setIsQuickReplyOpen(true); break;
            case 'note': setIsNoteBuilderOpen(true); break;
        }
    };

    const handlePollSend = (pollData: any) => {
        const pollMessage = {
            metadata: {
                type: 'poll',
                options: pollData.options,
                allowMultiple: pollData.allowMultiple,
                votes: pollData.options.reduce((acc: any, opt: string) => ({ ...acc, [opt]: 0 }), {})
            }
        };
        sendMessage(pollData.question, undefined, pollMessage);
        setIsPollBuilderOpen(false);
    };

    const handleProductSend = (product: any) => {
        const productMessage = { metadata: { type: 'product', product } };
        sendMessage(`Check out this product: ${product.title}`, undefined, productMessage);
        setIsProductPickerOpen(false);
    };

    const handleSlotSelect = (slot: any) => {
        if (reschedulingMsgId) {
            const updatedMessages = messages.map(m => {
                if ((m as any)._id === reschedulingMsgId) {
                    return {
                        ...m,
                        metadata: {
                            ...m.metadata,
                            slot: { ...slot, date: slot.date.toISOString(), status: 'confirmed' }
                        }
                    };
                }
                return m;
            });
            setMessages(updatedMessages as any);
            setReschedulingMsgId(null);
            toast.success("Booking re-programmed successfully. ⚡");
            setIsSlotPickerOpen(false);
            return;
        }

        const slotMessage = {
            metadata: {
                type: 'booking_confirmation',
                slot: { ...slot, date: slot.date.toISOString() }
            }
        };
        const dateStr = slot.date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        sendMessage(`Booking confirmed: ${slot.type} on ${dateStr} at ${slot.time}`, undefined, slotMessage);
        setIsSlotPickerOpen(false);
    };

    const handleQuickReplySend = (data: any) => {
        const msg = { metadata: { type: 'quick_reply', text: data.text, buttons: data.buttons } };
        sendMessage(data.text, undefined, msg);
        setIsQuickReplyOpen(false);
    };

    const handleOfferSend = (data: any) => {
        const msg = { metadata: { type: 'offer', ...data } };
        sendMessage(`Exclusive Offer: ${data.title}`, undefined, msg);
        setIsOfferOpen(false);
    };

    const handleLocationSend = (data: any) => {
        const msg = { metadata: { type: 'location', ...data } };
        sendMessage('Shared a location', undefined, msg);
        setIsLocationOpen(false);
    };

    const handleFormSend = (data: any) => {
        const msg = { metadata: { type: 'form_request', ...data } };
        sendMessage(`Please fill out: ${data.title}`, undefined, msg);
        setIsFormOpen(false);
    };

    const handleNoteSend = (note: string) => {
        if (socket) {
            socket.emit('save_ai_note', { orgId, content: note });
            toast.success("Note saved to Neural Logs! 🧠");
        } else {
            toast.error("Socket not connected. Failed to save note.");
        }
        setIsNoteBuilderOpen(false);
    };

    const checkForLinks = (text: string) => {
        if (linkPreviewDebounceRef.current) clearTimeout(linkPreviewDebounceRef.current);
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const match = text.match(urlRegex);
        if (match && match.length > 0) {
            const url = match[0];
            if (linkPreviewData?.url === url) return;
            linkPreviewDebounceRef.current = setTimeout(async () => {
                setIsFetchingLink(true);
                try {
                    const { data } = await axios.get(`/api/preview/link?url=${encodeURIComponent(url)}`);
                    setLinkPreviewData(data);
                } catch (err) {
                    console.error("Failed to fetch link preview", err);
                } finally {
                    setIsFetchingLink(false);
                }
            }, 1000);
        } else if (!text.trim()) {
            setLinkPreviewData(null);
        }
    };

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setInputValue(val);
        checkForLinks(val);

        // ✍️ Emit Typing Status
        if (val.trim()) {
            setTypingStatus(true, conversationId);
        } else {
            setTypingStatus(false, conversationId);
        }

        if (textareaRef.current) {
            if (!isMaximized) {
                textareaRef.current.style.height = 'auto';
                const scrollHeight = textareaRef.current.scrollHeight;
                textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
                setShowMaximize(scrollHeight > 70);
            } else {
                setShowMaximize(true);
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            toast.success("Entered Full Screen Mode");
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                toast.info("Exited Full Screen");
            }
        }
    };

    useEffect(() => {
        if (conversationId && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [conversationId]);

    useEffect(() => {
        return () => {
            if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
        };
    }, [filePreviewUrl]);

    useEffect(() => {
        if (selectedFile) {
            setIsMaximized(false);
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
                textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
            }
        }
    }, [selectedFile]);

    return {
        // States
        messages,
        socketMessages,
        isThinking,
        thinkingMessage,
        thinkingSteps,
        thinkingElapsedMs,
        isConnected,
        inputValue,
        setInputValue,
        mode,
        setMode,
        isMaximized,
        setIsMaximized,
        showMaximize,
        isSearchActive,
        setIsSearchActive,
        searchQuery,
        setSearchQuery,
        filterType,
        setFilterType,
        isFilterOpen,
        setIsFilterOpen,
        replyingTo,
        setReplyingTo,
        selectedFile,
        setSelectedFile,
        filePreviewUrl,
        setFilePreviewUrl,
        sendFileToAI,
        setSendFileToAI,
        linkPreviewData,
        setLinkPreviewData,
        isFetchingLink,
        isPollBuilderOpen,
        setIsPollBuilderOpen,
        isProductPickerOpen,
        setIsProductPickerOpen,
        isSlotPickerOpen,
        setIsSlotPickerOpen,
        isQuickReplyOpen,
        setIsQuickReplyOpen,
        isOfferOpen,
        setIsOfferOpen,
        isLocationOpen,
        setIsLocationOpen,
        isFormOpen,
        setIsFormOpen,
        isNoteBuilderOpen,
        setIsNoteBuilderOpen,
        isInputGridOpen,
        setIsInputGridOpen,
        reschedulingMsgId,
        setReschedulingMsgId,
        setMessages,
        sendMessage,

        // Handlers
        handleSend,
        handleInput,
        handleKeyDown,
        handleGridSelect,
        handlePollSend,
        handleProductSend,
        handleSlotSelect,
        handleQuickReplySend,
        handleOfferSend,
        handleLocationSend,
        handleFormSend,
        handleNoteSend,

        // 🔄 Mode Switcher (Widget: User AI Toggle | Dashboard: Admin Handoff)
        toggleMode: (newMode: 'ai' | 'human') => {
            if (viewMode === 'widget') {
                // Widget: Toggle user-side AI preference
                const newAiEnabled = newMode === 'ai';
                setAiEnabledByUser(newAiEnabled);
                console.log(`🤖 [Widget] User toggled AI: ${newAiEnabled ? 'ON' : 'OFF'}`);

                // Emit socket event to sync with dashboard
                if (socket && conversationId) {
                    socket.emit('toggle_ai_mode', {
                        chatId: conversationId,
                        mode: newMode,
                        source: 'user'
                    });
                }
                return;
            }

            // Dashboard: Admin handoff system
            if (!conversationId || !orgId || !socket) return;
            setMode(newMode);
            socket.emit("set_conversation_mode", {
                orgId,
                chatId: conversationId,
                mode: newMode
            });
        },

        // 🔄 Pagination Exports
        loadMoreHistory,
        hasMoreHistory,
        isLoadingHistory,
        availableDates,
        jumpToDate,
        statuses, // 🟢 Export
        markStatusViewed, // 🟢 Export

        isTyping,
        typingChatId,
        setTypingStatus,

        toggleFullScreen,

        // 📞 Call Logging Bridge
        logCall: (data: { duration: number, status: 'answered' | 'missed' | 'declined', callerName: string, type: 'incoming' | 'outgoing' }) => {
            if (!socket) return;
            const role = viewMode === 'dashboard' ? 'agent' : 'user';
            console.log("📝 emitting call:log", { ...data, role });
            socket.emit('call:log', {
                orgId,
                ...data,
                role // 🟢 Send Role to fix Sender ID
            });
        },
        messagesVersion, // 🔥 Export Version for Widget Force Rerender
        aiDisabledUntil, // 🤖 Export AI Reset Timer
        initialMode, // 🟢 Export
        deleteMessage, // 🗑️ Export Deletion
        toggleReaction, // ❤️ Export Reaction
        aiEnabledByUser, // 🤖 Export User-Side AI Toggle
        activeWordIndex, // 🎙️ Export Active Word Index for Highlight
        isSpeaking: isVoiceSpeaking, // 🎙️ Export Voice Speaking State
        voiceBotReply // 🎙️ Export Currently Speaking Text
    };
};
