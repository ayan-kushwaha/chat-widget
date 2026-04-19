"use client";

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Phone,
    User,
    Bot,
    Clock,
    Shield,
    StickyNote,
    FileText,
    CheckCheck,
    ChevronDown,
    Pin,
    X,
    Check,
    Star,
    Trash2,
    Forward,
    Calendar,
    CalendarCheck2,
    Ban
} from 'lucide-react';
import { SlCallIn, SlCallOut } from "react-icons/sl";
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ReactDOM from 'react-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VoicePlayer } from '../utils/VoicePlayer';
import { MessageActions } from './MessageActions';
import { cn } from '@/lib/utils';
import { MessageContextMenu } from './MessageContextMenu';
import { GlobalChatContextMenu } from './GlobalChatContextMenu';
import { QuotedMessage } from './QuotedMessage';
import { TypingIndicator } from './TypingIndicator';
import { MessageReactions } from './MessageReactions';
import { PollCard } from '../cards/PollCard';
import { ProductCard } from '../cards/ProductCard';
import { SlotCard } from '../cards/SlotCard';
import { BookingTicket } from '../cards/BookingTicket';
import { OfferCard } from '../cards/OfferCard';
import { LocationCard } from '../cards/LocationCard';
import { FormCard } from '../cards/FormCard';
import { DocumentCard } from '../cards/DocumentCard';
import DynamicBackground from '@/components/layout/DynamicBackground';
import Ribbons from '@/components/BitsUI/Ribbons';
import GradualBlur from '@/components/BitsUI/GradualBlur';
import { ForwardModal } from '../overlays/ForwardModal';
import { LinkPreviewMessage } from './LinkPreviewMessage';
import { Calendar as DatePickerCalendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { SDUIAction } from '@/components/sdui/types';
import { UniversalRenderer } from '@/components/sdui/UniversalRenderer';
import { useThemeStore } from '@/store/themeStore';
import { useCallStore } from '@/store/useCallStore';


const playHoverSound = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.frequency.value = 800;
        osc.type = 'sine';

        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
        // Ignore audio errors
    }
};

const speakText = (text: string) => {
    if (typeof window === 'undefined') return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 1;
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
};


import { ChatMessage, ThinkingStep } from '../types';
import { useChatScroll } from '../hooks/useChatScroll';
import { Typewriter } from './Typewriter';
import { DateDivider } from './DateDivider';
import { MessageBubble, BubbleTail } from './MessageBubble';
import { ThinkingPanel } from './ThinkingPanel';

interface MessageStreamProps {
    messages: ChatMessage[];
    isThinking?: boolean;
    thinkingMessage?: string;
    thinkingSteps?: ThinkingStep[];
    thinkingElapsedMs?: number;
    theme?: 'light' | 'dark';
    onContextMenuStateChange?: (isOpen: boolean) => void;
    onReply?: (messageId: string, content: string) => void;
    onEditInfo?: () => void;
    onArchive?: () => void;
    onViewHistory?: () => void;
    onCloseChat?: () => void;
    onReschedule?: (msgId: string, metadata: any) => void;
    onCancel?: (msgId: string) => void;
    orgId: string;
    onSDUIAction?: (action: SDUIAction) => void;
    viewMode?: 'widget' | 'dashboard';
    // Pagination
    onLoadMore?: () => void;
    hasMore?: boolean;
    isLoadingHistory?: boolean;
    availableDates?: string[]; // 📅 NEW
    onJumpToDate?: (date: Date) => void;
    mode?: 'ai' | 'human'; // 🟢 NEW: Conversation Mode
    isTyping?: boolean; // ✍️ NEW: Real-time Typing Status
    deleteMessage?: (messageId: string, mode?: 'everyone' | 'me', chatId?: string) => void; // 🗑️ UPDATED: Deletion
    toggleReaction?: (messageId: string, emoji: string) => void; // ❤️ NEW: Reaction Toggle
    searchQuery?: string; // 🔍 NEW: Search Query for Highlighting
    activeWordIndex?: number; // 🎙️ NEW: Voice Word Index
    isVoiceSpeaking?: boolean; // 🎙️ NEW: Voice Speaking State
    voiceBotReply?: string; // 🎙️ NEW: Currently Speaking Text
}

export const MessageStream: React.FC<MessageStreamProps> = ({
    messages,
    isThinking,
    thinkingMessage,
    thinkingSteps = [],
    thinkingElapsedMs = 0,
    onContextMenuStateChange,
    onReply,
    onEditInfo,
    onArchive,
    onViewHistory,
    onCloseChat,
    onReschedule,
    onCancel,
    theme = 'dark',
    orgId,
    onSDUIAction,
    viewMode = 'dashboard',
    onLoadMore,
    hasMore,
    isLoadingHistory,
    availableDates,
    onJumpToDate,
    mode = 'ai', // Default to AI
    isTyping,
    deleteMessage,
    toggleReaction, // ❤️ NEW
    searchQuery, // 🔍 NEW
    activeWordIndex = -1, // 🎙️
    isVoiceSpeaking = false, // 🎙️
    voiceBotReply // 🎙️
}) => {
    const { fontFamily, fontSize } = useThemeStore();


    // 1. Scroll Hook
    const {
        viewportRef,
        bottomRef,
        unreadCount,
        showScrollButton,
        allowInteraction,
        handleScroll,
        scrollToBottom,
        scrollToMessage
    } = useChatScroll({ messages, onLoadMore, hasMore });

    // 2. State
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, msgId: string } | null>(null);
    const [globalContextMenu, setGlobalContextMenu] = useState<{ x: number, y: number } | null>(null);
    const [isHovering, setIsHovering] = useState(false);

    // Replying
    const [replyingTo, setReplyingTo] = useState<{ id: string; sender: string; content: string } | null>(null);

    // 🔊 Audio Triggers (External)
    const [autoPlayId, setAutoPlayId] = useState<string | null>(null);
    const [finishedTyping, setFinishedTyping] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        messages.forEach(m => initial[m.id] = true);
        return initial;
    });

    // 🛑 Prevent Typing Effect on History Load
    useEffect(() => {
        setFinishedTyping(prev => {
            const next = { ...prev };
            let hasChanges = false;
            messages.forEach(msg => {
                // If message is older than 5 seconds (socket latency), mark true.
                const isOld = (Date.now() - new Date(msg.createdAt).getTime()) > 5000;
                if (!next[msg.id] && (isOld || msg.sender === 'user')) {
                    next[msg.id] = true;
                    hasChanges = true;
                }
            });
            return hasChanges ? next : prev;
        });
    }, [messages]);

    const handleFinishedTyping = (msgId: string) => {
        setFinishedTyping(prev => ({ ...prev, [msgId]: true }));
    };

    // 🌟 Message Interaction V2 States
    const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string | string[], mode: 'single' | 'bulk' } | null>(null);
    const [showForwardModal, setShowForwardModal] = useState(false);

    // Pinned Messages
    const [pinnedMessages, setPinnedMessages] = useState<ChatMessage[]>([]);

    const togglePin = (msgId: string) => {
        const msg = messages.find(m => m.id === msgId);
        if (!msg) return;

        const isPinned = pinnedMessages.some(p => p.id === msgId);

        if (!isPinned && pinnedMessages.length >= 10) {
            toast.error('You can only pin up to 10 messages', { id: 'pin-limit-toast' });
            return;
        }

        setPinnedMessages(prev => {
            if (isPinned) {
                return prev.filter(p => p.id !== msgId);
            } else {
                return [...prev, msg];
            }
        });
    };



    const handleForward = (contactIds: string[]) => {
        const selectedMessages = messages.filter(m => selectedIds.has(m.id));
        toast.success(`Forwarding ${selectedMessages.length} message(s) to ${contactIds.length} contact(s)...`, {
            id: 'forward-toast'
        });

        // Simulate forwarding delay
        setTimeout(() => {
            toast.success('Messages forwarded successfully!', { id: 'forward-success' });
            setShowForwardModal(false);
            setSelectionMode(false);
            setSelectedIds(new Set());
        }, 1500);
    };

    const handleContextMenu = (e: React.MouseEvent, msgId: string) => {
        e.preventDefault(); e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, msgId });
        setGlobalContextMenu(null);
    };

    const handleGlobalContextMenu = (e: React.MouseEvent) => {
        if (viewMode === 'widget') return; // 🛑 Allow bubbling to parent (MultiViewWidget)
        e.preventDefault();
        setGlobalContextMenu({ x: e.clientX, y: e.clientY });
        setContextMenu(null);
    };

    const handleJumpToDate = (targetDate: Date) => {
        const targetDateStr = targetDate.toDateString();

        // Find the first message that matches the date or is after it
        // 🔍 Loading Indicator for Infinite Scroll


        const msg = messages.find(m => {
            const mDate = new Date(m.createdAt);
            // Simple comparison: Is message date >= target date?
            // Actually, exact date match is better for "Jump to THIS date"
            return mDate.toDateString() === targetDateStr;
        });

        if (msg) {
            scrollToMessage(msg.id);
            toast.success(`Jumped to ${targetDate.toLocaleDateString()}`);
        } else if (onJumpToDate) {
            // 🚫 Not found locally -> Fetch from Backend
            toast.info(`Fetching context for ${targetDate.toLocaleDateString()}...`);
            onJumpToDate(targetDate);
        } else {
            // Optional: Find closest next date (Legacy fallback)
            const nextMsg = messages.find(m => new Date(m.createdAt) > targetDate);
            if (nextMsg) {
                scrollToMessage(nextMsg.id);
                toast.info(`No messages on that exact date. Jumped to closest after.`);
            } else {
                toast.error("No messages found locally.");
            }
        }
    };

    // 🗓️ Calculate Booked Dates (for Calendar highlighting)
    const bookedDates = useMemo(() => {
        const dates = new Set<string>();
        messages.forEach(m => {
            dates.add(new Date(m.createdAt).toDateString());
        });
        return Array.from(dates).map(d => new Date(d));
    }, [messages]);

    // 🔍 Dynamic Message Filter (The Search Layer)
    const filteredMessages = useMemo(() => {
        if (!searchQuery || searchQuery.trim().length === 0) return messages;
        const q = searchQuery.toLowerCase();
        return messages.filter(m =>
            m.content?.toLowerCase().includes(q) ||
            m.senderName?.toLowerCase().includes(q)
        );
    }, [messages, searchQuery]);

    // Rendering Logic - Grouped for proper Sticky Behavior
    const groupedMessages = useMemo(() => {
        const groups: Record<string, ChatMessage[]> = {};
        filteredMessages.forEach((msg) => {
            const dateStr = new Date(msg.createdAt).toDateString(); // Robust parsing
            if (!groups[dateStr]) groups[dateStr] = [];
            groups[dateStr].push(msg);
        });
        return groups;
    }, [filteredMessages]);

    const renderedGroups = Object.keys(groupedMessages).map((dateStr) => {
        const groupMsgs = groupedMessages[dateStr];
        const dateObj = new Date(groupMsgs[0].createdAt);

        return (
            <div key={dateStr} className="relative">
                <DateDivider
                    date={dateObj}
                    onJumpToDate={handleJumpToDate}
                    bookedDates={availableDates ? availableDates.map(d => new Date(d)) : undefined} // Use DB dates if available
                />

                {groupMsgs.map((msg, idx) => {
                    const isPinned = pinnedMessages.some(p => p.id === msg.id);

                    // Determine if first in visual group (sender change) within this day
                    let isFirstInGroup = true; // FIXED: Force distinct records as requested ("alag alag record")
                    if (idx > 0) {
                        const prev = groupMsgs[idx - 1];
                        if (prev.sender === msg.sender) isFirstInGroup = false;
                    }

                    return (
                        <MessageBubble
                            key={msg.id || `${dateStr}-${idx}`}
                            msg={msg}
                            isFirstInGroup={isFirstInGroup}
                            isPinned={isPinned}
                            onContextMenu={handleContextMenu}
                            onQuoteClick={scrollToMessage}
                            onHover={setIsHovering}
                            autoPlay={autoPlayId === msg.id}
                            orgId={orgId}
                            viewMode={viewMode}
                            isFinishedTyping={
                                finishedTyping[msg.id] ||
                                (msg.createdAt && (Date.now() - new Date(msg.createdAt).getTime() > 5000)) || // Sync check for history
                                msg.sender === 'user'
                            }
                            onTypingComplete={() => handleFinishedTyping(msg.id)}
                            isStarred={starredIds.has(String(msg.id))}
                            selectionMode={selectionMode}
                            isSelected={selectedIds.has(String(msg.id))}
                            onToggleSelect={(id) => {
                                setSelectedIds(prev => {
                                    const next = new Set(prev);
                                    if (next.has(id)) next.delete(id);
                                    else next.add(id);
                                    return next;
                                });
                            }}
                            onReschedule={onReschedule}
                            onCancel={onCancel}
                            theme={theme}
                            onReactionClick={(emoji) => toggleReaction?.(msg._id || String(msg.id), emoji)}
                            searchQuery={searchQuery} // 🔍 Pass Search Query
                            activeWordIndex={activeWordIndex} // 🎙️
                            isVoiceSpeaking={isVoiceSpeaking} // 🎙️
                            currentlySpeakingText={voiceBotReply} // 🎙️
                        />
                    );
                })}
            </div>
        );
    });

    return (
        <div
            className="h-full z-50 w-full relative group overflow-hidden"
            onContextMenu={handleGlobalContextMenu}
            style={{ fontFamily: fontFamily, fontSize: `${fontSize}px` }}
        >

            <DynamicBackground />

            {/* ✨ Dynamic Blur Layer - Function of Pinned Height */}
            <div
                className="absolute left-0 right-0 z-40 pointer-events-none transition-all duration-300"
                style={{ top: pinnedMessages.length > 0 ? '40px' : '0px' }}
            >
                <GradualBlur
                    target="parent"
                    position="top"
                    height="1rem"
                    strength={4}
                    divCount={10}
                    curve="bezier"
                    exponential
                    opacity={1}
                    zIndex={0}
                />
            </div>

            <ScrollArea
                // className="h-full w-full pointer-events-none"
                // className={`h-full w-full transition-all duration-200 ${allowInteraction ? 'pointer-events-auto' : 'pointer-events-none'}`} //done
                className={`h-full w-full ${allowInteraction ? 'pointer-events-auto' : 'pointer-events-none'}`}
                viewportRef={viewportRef}
                onScroll={handleScroll}
                style={{ '--pinned-offset': pinnedMessages.length > 0 ? '40px' : '0px' } as React.CSSProperties}
            >

                {/* 🌀 Loading Spinner for History */}
                {isLoadingHistory && (
                    <div className="flex justify-center py-4 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="bg-zinc-800/80 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 border border-white/5 shadow-xl">
                            <Loader2 size={14} className="animate-spin text-emerald-500" />
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Loading History...</span>
                        </div>
                    </div>
                )}

                {/* 📌 PINNED MESSAGES HEADER */}
                <AnimatePresence>
                    {pinnedMessages.length > 0 && (
                        <div className="sticky top-0 z-50 w-full  mx-auto   pointer-events-none">
                            <motion.div
                                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                                className={cn(
                                    "backdrop-blur-xl  p-1 flex items-center gap-3 shadow-2xl pointer-events-auto",
                                    viewMode === 'widget'
                                        ? "bg-white/95 dark:bg-neutral-950/90" : "bg-neutral-950"
                                )}
                            >
                                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                    <Pin size={14} className="text-emerald-400" />
                                </div>
                                {/* <div className="flex gap-2   overflow-x-scroll no-scrollbar py-1"> */}
                                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 flex-1 w-0 min-w-0 ">
                                    {pinnedMessages.map(msg => (
                                        <button
                                            key={`pin-${msg.id}`}
                                            onClick={() => scrollToMessage(msg.id)}
                                            className={cn(
                                                "flex items-center gap-2 border rounded-lg px-1 pl-2 py-1 text-xs transition-with-all shrink-0 max-w-[200px] group",
                                                viewMode === 'widget'
                                                    ? "bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border-black/5 dark:border-white/5 text-zinc-600 dark:text-zinc-300"
                                                    : "bg-white/5 hover:bg-white/10 border-white/5 text-zinc-300 transition-all"
                                            )}
                                        >
                                            <span className="truncate max-w-[120px]">{msg.content}</span>
                                            <span
                                                role="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    togglePin(msg.id);
                                                }}
                                                className="hover:text-red-400 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={10} />
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <div className="flex flex-col  min-h-full max-w-5xl mx-auto relative cursor-default px-4">
                    {renderedGroups}

                    {/* 🟢 GPT-STYLE REAL THINKING PANEL (Inside Bubble) */}
                    {isThinking && mode === 'ai' && (
                        <MessageBubble
                            msg={{
                                id: 'thinking-bubble',
                                _id: 'thinking-bubble',
                                sender: 'ai',
                                senderName: 'Cluaiz AI',
                                type: 'thinking_wrapper',
                                content: '', // Empty content, as the ThinkingPanel will be rendered instead
                                createdAt: new Date()
                            }}
                            isFirstInGroup={true}
                            onContextMenu={() => { }}
                            onHover={() => { }}
                            viewMode={viewMode}
                            theme={theme}
                            customContent={
                                <div className="min-w-[200px] max-w-[450px]">
                                    <ThinkingPanel
                                        steps={thinkingSteps}
                                        isActive={isThinking}
                                        elapsedMs={thinkingElapsedMs}
                                    />
                                </div>
                            }
                        />
                    )}

                    {/* Anchor for Auto-Scroll */}
                    <div ref={bottomRef} className={cn("w-full transition-all", viewMode === 'widget' ? "h-10" : "h-10")} />
                </div>
            </ScrollArea>

            {/* ⬇️ SCROLL BUTTON (Sticky Logic) */}
            <AnimatePresence>

                {
                    showScrollButton && (
                        <motion.button
                            initial={{ opacity: 0, y: 10, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.8 }}
                            onClick={() => scrollToBottom()}
                            className="absolute right-6 bottom-24 z-50 bg-[#202c33] text-emerald-500 p-2 rounded-full shadow-2xl border border-white/5 hover:bg-[#2a3942] transition-colors"
                        >
                            <ChevronDown size={24} />
                            {unreadCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-emerald-500 text-black text-[10px] font-bold min-w-[1.25rem] h-5 px-1 flex items-center justify-center rounded-full shadow-md animate-bounce">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </motion.button>
                    )
                }
            </AnimatePresence >

            {/* Context Menus */}
            {
                contextMenu && (
                    <MessageContextMenu
                        {...contextMenu}
                        isPinned={pinnedMessages.some(m => m.id === contextMenu.msgId)}
                        isStarred={starredIds.has(contextMenu.msgId)}
                        isDeleted={messages.find(m => m.id === contextMenu.msgId)?.isDeleted} // 🧼 Pass Delete State
                        viewMode={viewMode}
                        onClose={() => setContextMenu(null)}
                        onAction={(action) => {
                            if (action === 'speak') {
                                setAutoPlayId(contextMenu.msgId);
                                setContextMenu(null);
                            }
                            if (action === 'reply') {
                                const msg = messages.find(m => m.id === contextMenu.msgId);
                                if (msg) {
                                    setReplyingTo({
                                        id: msg.id,
                                        sender: msg.senderName || msg.sender,
                                        content: msg.content
                                    });
                                    setContextMenu(null);
                                    onReply?.(msg.id, msg.content);
                                }
                            }
                            if (action === 'call') {
                                const msg = messages.find(m => m.id === contextMenu.msgId);
                                if (msg) {
                                    useCallStore.getState().startCall(
                                        msg.senderName || msg.sender,
                                        'Unknown',
                                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.senderName || msg.sender}`
                                    );
                                    setContextMenu(null);
                                }
                            }
                            if (action === 'pin') {
                                togglePin(contextMenu.msgId);
                                setContextMenu(null);
                            }
                            if (action === 'copy') {
                                const msg = messages.find(m => m.id === contextMenu.msgId);
                                if (msg && msg.content) {
                                    navigator.clipboard.writeText(msg.content);
                                    toast.success('Message copied to clipboard', { id: 'copy-toast' });
                                    setContextMenu(null);
                                }
                            }
                            if (action === 'star') {
                                setStarredIds(prev => {
                                    const next = new Set(prev);
                                    if (next.has(contextMenu.msgId)) next.delete(contextMenu.msgId);
                                    else next.add(contextMenu.msgId);
                                    return next;
                                });
                                setContextMenu(null);
                            }
                            if (action === 'select') {
                                setSelectionMode(true);
                                setSelectedIds(new Set([contextMenu.msgId]));
                                setContextMenu(null);
                            }
                            if (action === 'delete') {
                                setDeleteConfirm({ id: contextMenu.msgId, mode: 'single' });
                                setContextMenu(null);
                            }
                        }}
                        onReact={(emoji) => {
                            console.log('✅ [UI] onReact clicked:', emoji, contextMenu.msgId);
                            if (toggleReaction) {
                                toggleReaction(contextMenu.msgId, emoji);
                            } else {
                                console.error('❌ toggleReaction function is missing in MessageStream props');
                                toast.error("Reaction function unavailable. Please refresh.");
                            }
                            setContextMenu(null);
                        }}
                    />
                )
            }
            {
                globalContextMenu && (
                    <GlobalChatContextMenu
                        x={globalContextMenu.x}
                        y={globalContextMenu.y}
                        onClose={() => setGlobalContextMenu(null)}
                        onAction={(action) => {
                            if (action === 'edit') {
                                if (onEditInfo) onEditInfo();
                                else toast.info('Contact Information panel opened.');
                            }
                            if (action === 'archive') {
                                if (onArchive) onArchive();
                                else toast.success('Conversation moved to Archive');
                            }
                            if (action === 'group') {
                                toast.info('Group selection mode active');
                            }
                            if (action === 'history') {
                                if (onViewHistory) onViewHistory();
                                else toast.info('Loading interaction history...');
                            }
                            if (action === 'close') {
                                if (onCloseChat) onCloseChat();
                                else toast('Chat session closed');
                            }
                        }}
                    />
                )
            }
            {/* 🗑️ DELETE CONFIRMATION MODAL */}
            <AnimatePresence>
                {deleteConfirm && (
                    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDeleteConfirm(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-neutral-900 border border-white/10 rounded-3xl p-6 w-full max-w-[340px] shadow-2xl relative z-20 pointer-events-auto"
                        >
                            <div className="flex flex-col items-center gap-4 text-center mb-6">
                                <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center">
                                    <Trash2 className="text-red-500" size={32} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">Delete Message?</h3>
                                    <p className="text-sm text-zinc-400 font-medium">This action cannot be undone.</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                {(() => {
                                    // 🛡️ Logic to show/hide "Delete for everyone"
                                    const isBulk = Array.isArray(deleteConfirm.id);
                                    const targetMsg = isBulk ? null : messages.find(m => m.id === deleteConfirm.id);

                                    // Rule: Users can only delete their OWN messages for EVERYONE, and only within 24h.
                                    // Admin/Dashboard can always delete for everyone.
                                    const isUserMessage = targetMsg?.sender === 'user';
                                    const isFresh = targetMsg ? (Date.now() - new Date(targetMsg.createdAt).getTime() < 24 * 60 * 60 * 1000) : true;

                                    const canDeleteForEveryone = viewMode === 'dashboard' || (isUserMessage && isFresh && !isBulk);

                                    return canDeleteForEveryone && (
                                        <button
                                            onClick={() => {
                                                const idsToDelete = Array.isArray(deleteConfirm.id) ? deleteConfirm.id : [deleteConfirm.id];
                                                idsToDelete.forEach(id => deleteMessage?.(id, 'everyone'));
                                                toast.success('Deleted for everyone');
                                                setDeleteConfirm(null);
                                                setSelectionMode(false);
                                                setSelectedIds(new Set());
                                            }}
                                            className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all text-sm pointer-events-auto shadow-lg shadow-red-500/20"
                                        >
                                            Delete for everyone
                                        </button>
                                    );
                                })()}

                                <button
                                    onClick={() => {
                                        const idsToDelete = Array.isArray(deleteConfirm.id) ? deleteConfirm.id : [deleteConfirm.id];
                                        idsToDelete.forEach(id => deleteMessage?.(id, 'me'));

                                        toast.success('Hidden from your view');
                                        setDeleteConfirm(null);
                                        setSelectionMode(false);
                                        setSelectedIds(new Set());
                                    }}
                                    className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all text-sm pointer-events-auto border border-white/5"
                                >
                                    Delete for me
                                </button>

                                {(() => {
                                    const isBulk = Array.isArray(deleteConfirm.id);
                                    const targetMsg = isBulk ? null : messages.find(m => m.id === deleteConfirm.id);
                                    const isUserMessage = targetMsg?.sender === 'user';
                                    if (viewMode === 'widget' && targetMsg && !isUserMessage) {
                                        return <p className="text-[10px] text-zinc-500 text-center mt-2 px-4 uppercase tracking-tighter font-black">AI/Admin messages can only be hidden from your side.</p>
                                    }
                                    return null;
                                })()}

                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="w-full py-3 text-zinc-500 hover:text-white font-bold transition-all text-sm pointer-events-auto mt-2"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 🛠️ SELECTION TOOLBAR PORTAL */}
            {selectionMode && typeof document !== 'undefined' && ReactDOM.createPortal(
                <AnimatePresence mode="wait">
                    <motion.div
                        key="selection-toolbar"
                        initial={{ y: 100, x: '-50%', opacity: 0 }}
                        animate={{ y: 0, x: '-50%', opacity: 1 }}
                        exit={{ y: 100, x: '-50%', opacity: 0 }}
                        className="fixed bottom-24 left-1/2 z-[99999] w-[90%] max-w-[320px] bg-neutral-950 border border-white/10 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.8)] px-6 py-3 flex items-center justify-between pointer-events-auto backdrop-blur-2xl"
                    >
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => {
                                    setSelectionMode(false);
                                    setSelectedIds(new Set());
                                }}
                                className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded-full transition-all"
                            >
                                <X size={16} />
                            </button>
                            <span className="text-emerald-500 font-black text-[11px] uppercase tracking-wider">{selectedIds.size} Selected</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setShowForwardModal(true)}
                                disabled={selectedIds.size === 0}
                                className="p-2.5 text-emerald-500 hover:bg-emerald-500/10 rounded-full transition-all disabled:opacity-20 active:scale-90"
                                title="Forward"
                            >
                                <Forward size={18} />
                            </button>
                            <button
                                onClick={() => {
                                    setDeleteConfirm({ id: Array.from(selectedIds), mode: 'bulk' });
                                }}
                                disabled={selectedIds.size === 0}
                                className="p-2.5 text-red-500 hover:bg-red-500/10 rounded-full transition-all disabled:opacity-20 active:scale-90"
                                title="Delete"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}
            {/* 📤 FORWARDING MODAL */}
            <AnimatePresence>
                {showForwardModal && (
                    <ForwardModal
                        isOpen={showForwardModal}
                        onClose={() => setShowForwardModal(false)}
                        onForward={handleForward}
                        messageCount={selectedIds.size}
                    />
                )}
            </AnimatePresence>
        </div >
    );
};
