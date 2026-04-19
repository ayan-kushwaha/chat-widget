"use client";

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Shield,
    StickyNote,
    Bot,
    Pin,
    Star,
    CheckCheck,
    Check,
    FileText,
    Calendar,
    Clock,
    Ban,
    PhoneCall,
    PhoneMissed
} from 'lucide-react';
import { SlCallIn, SlCallOut } from "react-icons/sl";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { cn } from '@/lib/utils';
import { ChatMessage } from '../types';
import { QuotedMessage } from './QuotedMessage';
import { LinkPreviewMessage } from './LinkPreviewMessage';
import { Typewriter } from './Typewriter';
import { PollCard } from '../cards/PollCard';
import { ProductCard } from '../cards/ProductCard';
import { SlotCard } from '../cards/SlotCard';
import { BookingTicket } from '../cards/BookingTicket';
import { OfferCard } from '../cards/OfferCard';
import { LocationCard } from '../cards/LocationCard';
import { FormCard } from '../cards/FormCard';
import { DocumentCard } from '../cards/DocumentCard';
import { MessageActions } from './MessageActions';
import { VoicePlayer } from '../utils/VoicePlayer';
import { MessageReactions } from './MessageReactions';

// Helpers
export const BubbleTail = ({ color, side }: { color: string, side: 'left' | 'right' }) => (
    <div className={cn(
        "absolute top-0 w-3 h-3.5 overflow-hidden",
        side === 'left' ? "-left-3 -mt-[0.5px]" : "-right-2.5"
    )}>
        <svg width="12" height="14" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d={side === 'left'
                    ? "M0 0C6.62742 0 12 5.37258 12 12V0H0Z"
                    : "M12 0C5.37258 0 0 5.37258 0 12V0H12Z"}
                fill={color}
            />
        </svg>
    </div>
);

const isOnlyEmojis = (text: string) => {
    if (!text) return false;
    const cleanText = text.trim();
    if (cleanText.length === 0 || cleanText.length > 50) return false;

    const hasAlphanumeric = /[a-zA-Z0-9]/.test(cleanText);
    const hasEmoji = /\p{Extended_Pictographic}|\p{Emoji_Presentation}/u.test(cleanText);

    return !hasAlphanumeric && hasEmoji;
};

// Helper to fix old MinIO URLs (backward compatibility)
const fixMinIOUrl = (url: string | undefined): string | undefined => {
    if (!url) return url;
    if (url.startsWith('/static/uploads')) {
        return `http://127.0.0.1:5000${url}`;
    }
    return url.replace('/cluaiz-storage/chats/', '/cluaiz-chats/');
};

// 🧼 Decoding helper for unicode escape sequences like \ud83d\ude0a
const decodeUnicode = (str: string) => {
    return str.replace(/\\u([a-fA-F0-9]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
};

const Highlight = ({ text, query }: { text: string, query: string }) => {
    if (!query || !text || typeof text !== 'string') return <>{text}</>;

    // Escape special regex characters in query
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));

    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase()
                    ? <mark key={i} className="bg-yellow-400 text-green-950 px-0.5 rounded font-bold shadow-sm inline-block leading-normal">{part}</mark>
                    : part
            )}
        </>
    );
};

const highlightChildren = (children: React.ReactNode, query: string): React.ReactNode => {
    if (!query) return children;
    return React.Children.map(children, (child) => {
        if (typeof child === 'string') {
            return <Highlight text={child} query={query} />;
        }
        if (React.isValidElement(child)) {
            const element = child as React.ReactElement<any>;
            if (element.props.children) {
                return React.cloneElement(element, {
                    children: highlightChildren(element.props.children, query)
                });
            }
        }
        return child;
    });
};

interface MessageBubbleProps {
    msg: ChatMessage;
    isFirstInGroup: boolean;
    onContextMenu: (e: React.MouseEvent, msgId: string) => void;
    onQuoteClick?: (replyToId: string) => void;
    onHover: (isHovering: boolean) => void;
    isPinned?: boolean;
    autoPlay?: boolean;
    orgId?: string;
    isFinishedTyping?: boolean;
    onTypingComplete?: () => void;
    isStarred?: boolean;
    selectionMode?: boolean;
    isSelected?: boolean;
    onToggleSelect?: (id: string) => void;
    onReschedule?: (msgId: string, metadata: any) => void;
    onCancel?: (msgId: string) => void;
    theme?: 'light' | 'dark';
    viewMode?: 'widget' | 'dashboard';
    onReactionClick?: (emoji: string) => void;
    searchQuery?: string;
    customContent?: React.ReactNode; // 🎯 Added for Thinking UI rendering
    activeWordIndex?: number; // 🎙️ NEW: Voice Word Index
    isVoiceSpeaking?: boolean; // 🎙️ NEW: Voice Speaking State
    currentlySpeakingText?: string; // 🎙️ NEW: Text being spoken
}

const WordAnimation = ({ content, activeIndex, isSpeaking }: { content: string, activeIndex: number, isSpeaking: boolean }) => {
    // Split while preserving spaces/formatting as much as possible
    const words = useMemo(() => content.trim().split(/\s+/), [content]);

    return (
        <span className="flex flex-wrap gap-x-1.5 leading-relaxed">
            {words.map((word, i) => (
                <motion.span
                    key={i}
                    animate={{
                        color: isSpeaking && i === activeIndex ? "#10b981" : "inherit",
                        scale: isSpeaking && i === activeIndex ? 1.05 : 1,
                        textShadow: isSpeaking && i === activeIndex ? "0 0 8px rgba(16,185,129,0.3)" : "none"
                    }}
                    transition={{ duration: 0.2 }}
                    className={cn(  
                        "inline-block",
                        isSpeaking && i === activeIndex ? "font-bold" : "font-medium"
                    )}
                >
                    {word}
                </motion.span>
            ))}
        </span>
    );
};

const MessageBubbleBase: React.FC<MessageBubbleProps> = ({
    msg,
    isFirstInGroup,
    onContextMenu,
    onQuoteClick,
    onHover,
    isPinned,
    autoPlay,
    orgId,
    isFinishedTyping,
    onTypingComplete,
    isStarred,
    selectionMode,
    isSelected,
    onToggleSelect,
    onReschedule,
    onCancel,
    theme,
    viewMode,
    onReactionClick,
    searchQuery,
    customContent,
    activeWordIndex = -1,
    isVoiceSpeaking = false,
    currentlySpeakingText
}) => {
    const isUserSender = msg.sender === 'user';
    const isMe = viewMode === 'widget' ? isUserSender : !isUserSender;
    const isUser = isMe;
    const isSystem = msg.sender === 'system' || msg.type === 'system_alert';

    const isBigEmoji = useMemo(() => {
        return msg.type === 'text' && isOnlyEmojis(msg.content);
    }, [msg.content, msg.type]);

    if (isSystem) {
        const action = msg.metadata?.action;
        const isWipe = action === 'wipe';
        const isRestore = action === 'restore';
        const isUserSideHide = isWipe && msg.metadata?.mode === 'me';

        const content = useMemo(() => {
            let text = msg.content || (msg as any).text || '';
            if (typeof text === 'string' && text.includes('<thinking>')) {
                text = text.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim();
            }
            return decodeUnicode(text);
        }, [msg.content, (msg as any).text]);

        const displayContent = (viewMode === 'widget' && msg.metadata?.user_display_text)
            ? msg.metadata.user_display_text
            : content;

        // Dynamic styling based on action type
        const bgClass = isUserSideHide
            ? 'bg-amber-500/10 dark:bg-amber-500/10 border-amber-500/20'
            : isWipe
                ? 'bg-red-500/10 dark:bg-red-500/10 border-red-500/20'
                : isRestore
                    ? 'bg-emerald-500/10 dark:bg-emerald-500/10 border-emerald-500/20'
                    : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5';

        const textClass = isUserSideHide
            ? 'text-amber-600 dark:text-amber-400'
            : isWipe
                ? 'text-red-600 dark:text-red-400'
                : isRestore
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-zinc-600 dark:text-zinc-500';

        const iconColor = isUserSideHide
            ? 'text-amber-500'
            : isWipe
                ? 'text-red-500'
                : 'text-emerald-500';

        return (
            <div className="flex justify-center my-4 px-4">
                <div className={`flex items-center justify-center gap-2.5 text-[10px] font-bold px-5 py-2.5 rounded-full uppercase tracking-[0.12em] backdrop-blur-md border transition-all duration-300 max-w-[85%] text-center shadow-sm leading-tight ${bgClass} ${textClass}`}>
                    <Shield size={11} className={`shrink-0 ${iconColor}`} />
                    <span className="inline-block">{displayContent}</span>
                </div>
            </div>
        );
    }

    const bubbleColor = isUser
        ? "var(--chat-bubble-bg)"
        : "var(--ai-bubble-bg)";

    const [isExpanded, setIsExpanded] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const CHAR_LIMIT = 1110;

    const content = useMemo(() => {
        let text = msg.content || (msg as any).text || '';
        if (typeof text === 'string' && text.includes('<thinking>')) {
            text = text.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim();
        }
        return decodeUnicode(text);
    }, [msg.content, (msg as any).text]);

    const shouldTruncate = content.length > CHAR_LIMIT;
    const displayedContent = (!isExpanded && shouldTruncate) ? content.slice(0, CHAR_LIMIT) + '...' : content;

    // ❤️ Check for reactions to add spacing
    const hasReactions = !msg.isDeleted && msg.reactions && Object.keys(msg.reactions).length > 0;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "flex flex-col w-full transition-all duration-300 pointer-events-auto px-1 md:px-6",
                isFirstInGroup ? "mt-4" : "",
                // 🟢 Dynamic Spacing & Stacking: Prevent next message from covering reactions
                hasReactions ? "mb-8 z-10" : "mb-1 z-0",
                isUser ? "items-end" : "items-start",
                isSelected && "bg-emerald-500/5 ring-1 ring-emerald-500/10 rounded-xl"
            )}
            onClick={() => selectionMode && onToggleSelect?.(msg.id)}
        >
            <div
                onMouseEnter={() => onHover(true)}
                onMouseLeave={() => onHover(false)}
                id={`msg-${msg.id}`}
                className={cn(
                    "flex gap-3 p-1 rounded-2xl transition-colors duration-500 group relative",
                    "w-fit max-w-[90%] md:max-w-[60%] lg:max-w-[45vw]",
                    isUser ? "flex-row-reverse items-end" : "flex-row items-start",
                    selectionMode && "cursor-pointer"
                )}
            >
                {selectionMode && (
                    <div className="flex items-center justify-center p-2 self-center">
                        <div className={cn(
                            "w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center",
                            isSelected ? "bg-emerald-500 border-emerald-500" : "border-zinc-700 bg-white/5"
                        )}>
                            {isSelected && <Check size={14} className="text-black" />}
                        </div>
                    </div>
                )}

                <div className={cn("flex flex-col gap-1", isUser ? "items-end" : "items-start")}>
                    {isPinned && (
                        <span className={cn("absolute -top-3 z-10 flex items-center gap-2 text-[10px] text-zinc-500", isUser ? "right-1" : "left-1")}>
                            <Pin size={10} className="text-zinc-400 rotate-45" /> Pinned
                        </span>
                    )}

                    <div className={cn("flex flex-col max-w-[100%]", isUser ? "items-end" : "items-start")}>
                        {msg.isDeleted ? (
                            <div
                                style={{
                                    backgroundColor: bubbleColor,
                                    color: isUser ? "var(--chat-bubble-fg)" : "var(--ai-bubble-fg)",
                                    opacity: 0.3 // 🧼 Lower Opacity for better "muted" look
                                }}
                                className={cn(
                                    "px-3 py-2 leading-relaxed relative shadow-sm w-fit max-w-full group/bubble transition-all duration-300",
                                    "text-zinc-500", // 🧼 Requested Grey Color
                                    !isUser && "shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:shadow-none border border-black/5 dark:border-none",
                                    isUser
                                        ? (isFirstInGroup ? "rounded-l-2xl rounded-br-2xl rounded-tr-none" : "rounded-2xl")
                                        : (isFirstInGroup ? "rounded-r-2xl rounded-bl-2xl rounded-tl-none" : "rounded-2xl")
                                )}
                            >
                                {isFirstInGroup && <BubbleTail color={bubbleColor} side={isUser ? 'right' : 'left'} />}
                                <div className="flex items-center gap-2 py-1 italic min-w-[140px]">
                                    <Ban size={14} className="shrink-0" />
                                    <span className="text-[13px] font-normal font-mono tracking-tighter">
                                        {isUser ? "You deleted this message" : "This message was deleted"}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div
                                    onContextMenu={(e) => onContextMenu(e, msg.id)}
                                    style={{
                                        backgroundColor: bubbleColor,
                                        color: isUser ? "var(--chat-bubble-fg)" : "var(--ai-bubble-fg)",
                                        fontSize: "var(--chat-font-size, 1rem)"
                                    }}
                                    className={cn(
                                        "px-3 py-2 leading-relaxed relative shadow-sm w-fit max-w-full group/bubble transition-all duration-300",
                                        !isUser && msg.type !== 'thinking_wrapper' && "shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:shadow-none border border-black/5 dark:border-none",
                                        msg.type === 'thinking_wrapper' && "bg-transparent! border-none! shadow-none! px-1! py-1!",
                                        isUser
                                            ? (isFirstInGroup ? "rounded-l-2xl rounded-br-2xl rounded-tr-none" : "rounded-2xl")
                                            : (isFirstInGroup ? "rounded-r-2xl rounded-bl-2xl rounded-tl-none" : "rounded-2xl"),
                                        msg.type === 'text' ? "whitespace-normal" : "whitespace-pre-wrap"
                                    )}
                                >
                                    {!isBigEmoji && isFirstInGroup && <BubbleTail color={bubbleColor} side={isUser ? 'right' : 'left'} />}

                                    {(msg.replyTo || msg.metadata?.replyTo) && (
                                        <QuotedMessage
                                            sender={msg.replyTo?.sender || msg.metadata?.replyTo?.sender}
                                            content={msg.replyTo?.content || msg.metadata?.replyTo?.content}
                                            onClick={() => {
                                                onQuoteClick?.(msg.replyTo?.id || msg.metadata?.replyTo?.id);
                                            }}
                                            className={cn(
                                                "mb-2 cursor-pointer hover:bg-black/20 transition-colors",
                                                isUser ? "bg-black/10 border-emerald-500" : "bg-black/20 border-emerald-400"
                                            )}
                                        />
                                    )}

                                    {msg.metadata?.linkPreview && (
                                        <LinkPreviewMessage data={msg.metadata.linkPreview} />
                                    )}

                                    {msg.type === 'image' && msg.metadata?.url && (
                                        <div className="rounded-xl overflow-hidden mb-2 border border-white/10 relative group bg-black/50">
                                            <img
                                                src={fixMinIOUrl(msg.metadata.url)}
                                                alt={msg.metadata.fileName || "Image"}
                                                className="max-w-full h-auto object-cover max-h-[300px] cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                                                loading="lazy"
                                                onClick={() => setIsLightboxOpen(true)}
                                            />
                                        </div>
                                    )}

                                    {msg.type === 'video' && msg.metadata?.url && (
                                        <div className="rounded-xl overflow-hidden mb-2 border border-white/10 bg-black relative group">
                                            <video
                                                src={fixMinIOUrl(msg.metadata.url)}
                                                controls
                                                className="max-w-full w-full rounded-xl max-h-[300px]"
                                            />
                                        </div>
                                    )}

                                    {msg.type === 'audio' && msg.metadata?.url && (
                                        <div className="rounded-xl overflow-hidden mb-2 border border-white/10 bg-black/20 p-2 backdrop-blur-sm">
                                            <audio
                                                src={fixMinIOUrl(msg.metadata.url)}
                                                controls
                                                className="w-full h-10"
                                                style={{ filter: 'invert(1) hue-rotate(180deg)' }}
                                            />
                                        </div>
                                    )}

                                    {/* 📞 CALL LOG CARD (Inside Bubble - Full Design) */}
                                    {msg.type === 'call_log' && (
                                        <div className="flex flex-col gap-2 min-w-[240px]">
                                            <div className={cn(
                                                "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest pl-1",
                                                msg.metadata?.call_status === 'missed' ? "text-red-500" : "text-emerald-500"
                                            )}>
                                                {isMe ? <SlCallOut size={12} /> : <SlCallIn size={12} />}
                                                <span>{msg.metadata?.call_status === 'missed' ? "Missed Call" : "Voice Call"}</span>
                                            </div>

                                            <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-black/5 dark:border-white/10 flex items-center gap-4 shadow-sm relative overflow-hidden group/call">
                                                <div className={cn(
                                                    "p-3 rounded-full flex-shrink-0 transition-all relative z-10",
                                                    msg.metadata?.call_status === 'missed' ? "bg-red-500/10 text-red-600 dark:text-red-500" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500"
                                                )}>
                                                    {msg.metadata?.call_status === 'missed' ? <PhoneMissed size={20} className="rotate-12" /> : <PhoneCall size={20} />}
                                                </div>

                                                {/* Background Decoration */}
                                                <div className={cn(
                                                    "absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-[0.03] pointer-events-none transition-transform group-hover/call:scale-110",
                                                    msg.metadata?.call_status === 'missed' ? "bg-red-500" : "bg-emerald-500"
                                                )} />

                                                <div className="flex flex-col z-10 flex-1">
                                                    <span className={cn(
                                                        "font-bold text-sm leading-tight mb-0.5",
                                                        msg.metadata?.call_status === 'missed' ? "text-red-600 dark:text-red-400" : "text-zinc-900 dark:text-zinc-100"
                                                    )}>
                                                        {(() => {
                                                            if (viewMode === 'widget') {
                                                                if (isMe) return "You called Support";
                                                                return msg.senderName || "Cluaiz AI";
                                                            } else {
                                                                if (isMe) return `You called ${msg.metadata?.callerName || msg.senderName || 'Visitor'}`;
                                                                return msg.metadata?.callerName || msg.senderName || "Visitor";
                                                            }
                                                        })()}
                                                    </span>
                                                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1.5">
                                                        {msg.metadata?.call_status === 'missed'
                                                            ? "No answer"
                                                            : (msg.metadata?.duration ? (
                                                                <>
                                                                    <Clock size={10} />
                                                                    {Math.floor(msg.metadata.duration / 60)}m {msg.metadata.duration % 60}s
                                                                </>
                                                            ) : "Connected")
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 🟢 Render Custom Content (like Thinking UI) if provided */}
                                    {customContent && customContent}

                                    {/* 📝 Render Text/Media if no customContent */}
                                    {!customContent && (msg.type === 'text' ||
                                        (msg.type === 'image' && msg.content !== '📷 Image') ||
                                        (msg.type === 'video' && msg.content !== '🎥 Video') ||
                                        (msg.type === 'audio' && msg.content !== '🎵 Audio') ||
                                        (msg.type === 'document' && msg.content !== '📎 Document')) && (
                                            isBigEmoji ? (
                                                <div className="text-5xl leading-tight opacity-100 transition-transform cursor-default">
                                                    {msg.content}
                                                </div>
                                            ) : (
                                                <div
                                                    className={cn(
                                                        "prose prose-sm max-w-none transition-colors",
                                                        "prose-p:text-inherit prose-li:text-inherit prose-blockquote:text-inherit prose-td:text-inherit prose-th:text-inherit",
                                                        "prose-headings:text-emerald-400 prose-headings:font-bold prose-headings:my-2",
                                                        "prose-strong:text-emerald-400 prose-strong:font-bold",
                                                        "prose-a:text-blue-400 hover:prose-a:text-blue-300 prose-a:underline prose-a:font-medium",
                                                        "prose-code:text-amber-300 prose-code:bg-white/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
                                                        "prose-p:leading-relaxed prose-p:my-1 prose-p:font-medium",
                                                        "prose-table:border prose-table:border-[rgba(255,255,255,0.2)] dark:prose-table:border-[rgba(255,255,255,0.1)] prose-table:my-2 prose-table:mx-auto",
                                                        "prose-th:bg-black/5 dark:prose-th:bg-white/5 prose-th:px-3 prose-th:py-2 prose-th:border prose-th:border-[rgba(255,255,255,0.2)] dark:prose-th:border-[rgba(255,255,255,0.1)]",
                                                        "prose-td:px-3 prose-td:py-2 prose-td:border prose-td:border-[rgba(255,255,255,0.2)] dark:prose-td:border-[rgba(255,255,255,0.1)] prose-td:font-normal"
                                                    )}
                                                    style={{ fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit' }}
                                                >
                                                    {!isUser && !isSystem && !isFinishedTyping ? (
                                                        <Typewriter
                                                            text={displayedContent}
                                                            onComplete={onTypingComplete}
                                                            searchQuery={searchQuery}
                                                        />
                                                    ) : (isVoiceSpeaking && !isUser && !isSystem && currentlySpeakingText === displayedContent) ? (
                                                        <WordAnimation
                                                            content={displayedContent}
                                                            activeIndex={activeWordIndex}
                                                            isSpeaking={isVoiceSpeaking}
                                                        />
                                                    ) : (
                                                        <ReactMarkdown
                                                            remarkPlugins={[remarkGfm]}
                                                            components={{
                                                                p: ({ children }) => <p>{highlightChildren(children, searchQuery || '')}</p>,
                                                                li: ({ children }) => <li>{highlightChildren(children, searchQuery || '')}</li>,
                                                                span: ({ children }) => <span>{highlightChildren(children, searchQuery || '')}</span>,
                                                                strong: ({ children }) => <strong>{highlightChildren(children, searchQuery || '')}</strong>,
                                                                em: ({ children }) => <em>{highlightChildren(children, searchQuery || '')}</em>,
                                                                h1: ({ children }) => <h1>{highlightChildren(children, searchQuery || '')}</h1>,
                                                                h2: ({ children }) => <h2>{highlightChildren(children, searchQuery || '')}</h2>,
                                                                h3: ({ children }) => <h3>{highlightChildren(children, searchQuery || '')}</h3>,
                                                                td: ({ children }) => <td>{highlightChildren(children, searchQuery || '')}</td>,
                                                                table: ({ children }) => (
                                                                    <div className="overflow-x-auto my-2 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                                                        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                                                                            {children}
                                                                        </table>
                                                                    </div>
                                                                ),
                                                                thead: (props: any) => <thead className="bg-black/5 dark:bg-white/5">{props.children}</thead>,
                                                                th: (props: any) => <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-inherit opacity-80">{props.children}</th>,
                                                            }}
                                                        >
                                                            {displayedContent}
                                                        </ReactMarkdown>
                                                    )}

                                                    {shouldTruncate && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setIsExpanded(!isExpanded);
                                                            }}
                                                            className="mt-1 text-xs font-bold hover:underline opacity-70 block"
                                                        >
                                                            {isExpanded ? 'Show less' : 'Read more'}
                                                        </button>
                                                    )}
                                                </div>
                                            )
                                        )}

                                    {msg.type !== 'thinking_wrapper' && (
                                        <div className="mt-1 flex items-center justify-between gap-3 opacity-80 h-7">
                                            {(msg.sender === 'ai' || msg.sender === 'bot') && !['call_log', 'image', 'video', 'audio', 'document'].includes(msg.type) && (
                                                <motion.div
                                                    initial={{ opacity: 0, x: -5 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="flex items-center gap-1 h-7"
                                                >
                                                    <MessageActions text={msg.content} />
                                                    <div className="w-px h-3 bg-current opacity-20 mx-1" />
                                                    <VoicePlayer
                                                        text={msg.content}
                                                        orgId={orgId}
                                                        tokenCount={msg.metadata?.tokensUsed}
                                                        color="inherit"
                                                        autoPlay={autoPlay}
                                                    />
                                                </motion.div>
                                            )}

                                            {/* External Timestamp */}
                                            <div className="flex items-center gap-1.5 ml-auto h-7">
                                                {isStarred && (
                                                    <Star size={12} className="text-amber-400 fill-amber-400 opacity-90 animate-in zoom-in-50 duration-300" />
                                                )}
                                                <span className="text-[9px] font-bold uppercase tracking-tight opacity-70 whitespace-nowrap" style={{ color: 'inherit' }}>
                                                    {msg.createdAt ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(msg.createdAt)) : ''}
                                                </span>
                                                {isUser && (
                                                    <>
                                                        {(msg.metadata?.last_message_status === 'sent' || (!msg.metadata?.last_message_status)) && (
                                                            <Check size={12} className="text-zinc-500 opacity-70" />
                                                        )}
                                                        {msg.metadata?.last_message_status === 'delivered' && (
                                                            <CheckCheck size={12} className="text-zinc-500 opacity-70" />
                                                        )}
                                                        {msg.metadata?.last_message_status === 'read' && (
                                                            <CheckCheck size={12} className="text-sky-400 opacity-90" />
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* ❤️ REACTIONS (Moved inside for pinning relative to bubble) */}
                                    {!msg.isDeleted && msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                        <MessageReactions
                                            reactions={msg.reactions}
                                            userReaction={msg.userReaction}
                                            onReactionClick={(emoji) => onReactionClick?.(emoji)}
                                            isUserMessage={isUser}
                                        />
                                    )}
                                </div>


                                {msg.type === 'poll' && msg.metadata && (
                                    <PollCard
                                        question={msg.content}
                                        options={msg.metadata.options || []}
                                        allowMultiple={msg.metadata.allowMultiple || false}
                                        votes={msg.metadata.votes || {}}
                                        hasVoted={msg.metadata.hasVoted || false}
                                        userVote={msg.metadata.userVote || []}
                                        isSender={isUser}
                                    />
                                )}

                                {msg.type === 'product' && msg.metadata?.product && (
                                    <ProductCard
                                        id={msg.metadata.product.id}
                                        title={msg.metadata.product.title}
                                        description={msg.metadata.product.description}
                                        price={msg.metadata.product.price}
                                        image={msg.metadata.product.image}
                                        category={msg.metadata.product.category}
                                    />
                                )}

                                {msg.type === 'booking_request' && msg.metadata?.slot && (
                                    <SlotCard
                                        date={msg.metadata.slot.date}
                                        time={msg.metadata.slot.time}
                                        status="scheduled"
                                    />
                                )}

                                {msg.type === 'booking_confirmation' && msg.metadata?.slot && (
                                    <BookingTicket
                                        date={new Date(msg.metadata.slot.date)}
                                        time={msg.metadata.slot.time}
                                        type={msg.metadata.slot.type || 'Chat'}
                                        reason={msg.metadata.slot.reason}
                                        status={msg.metadata.slot.status}
                                        onReschedule={() => onReschedule?.(msg.id, msg.metadata.slot)}
                                        onCancel={() => onCancel?.(msg.id)}
                                    />
                                )}

                                {msg.type === 'offer' && msg.metadata && (
                                    <OfferCard
                                        title={msg.metadata.title}
                                        code={msg.metadata.code}
                                        discount={msg.metadata.discount}
                                        expiry={msg.metadata.expiry}
                                    />
                                )}

                                {msg.type === 'location' && msg.metadata && (
                                    <LocationCard
                                        lat={msg.metadata.lat}
                                        lng={msg.metadata.lng}
                                        address={msg.metadata.address}
                                    />
                                )}

                                {msg.type === 'form_request' && msg.metadata && (
                                    <FormCard
                                        title={msg.metadata.title}
                                        fields={msg.metadata.fields}
                                    />
                                )}

                                {msg.type === 'quick_reply' && msg.metadata && (
                                    <div className="space-y-3">
                                        <p className="text-white">{msg.metadata.text}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {msg.metadata.buttons.map((btn: string, i: number) => (
                                                <button
                                                    key={i}
                                                    className="px-4 py-2 border rounded-xl text-sm font-medium text-emerald-400 transition-all shadow-sm active:scale-95 bg-white dark:bg-[#1e293b] hover:bg-neutral-50 dark:hover:bg-[#2a3942] border-black/5 dark:border-white/10"
                                                >
                                                    {btn}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {msg.type === 'document' && msg.metadata && (
                                    <DocumentCard
                                        fileName={msg.metadata.fileName || "Document.pdf"}
                                        fileSize={msg.metadata.fileSize}
                                        fileType={msg.metadata.fileType}
                                        url={msg.metadata.url}
                                    />
                                )}




                                {msg.type === 'form_submission' && (
                                    <div className="flex flex-col gap-4 min-w-[260px]">
                                        <div className="flex items-center justify-between text-emerald-500">
                                            <div className="flex items-center gap-2 uppercase text-[10px] font-black tracking-widest">
                                                <FileText size={14} /> New Lead Form
                                            </div>
                                            <Shield size={14} className="opacity-50" />
                                        </div>
                                        <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-3">
                                            {Object.entries(msg.metadata?.form_fields || {}).map(([key, val]: [string, any]) => (
                                                <div key={key} className="flex flex-col gap-0.5">
                                                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{key}</span>
                                                    <span className="text-xs font-bold text-zinc-200">{String(val)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {msg.type === 'booking_card' && (
                                    <div className="flex flex-col gap-4 min-w-[240px]">
                                        <div className="flex items-center gap-2 text-blue-400">
                                            <Calendar size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Meeting Booked</span>
                                        </div>
                                        <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/10">
                                            <div className="flex items-center gap-1 mb-2 text-white">
                                                <Clock size={14} className="text-blue-400" />
                                                <span className="text-sm font-bold">{msg.metadata?.slot || 'Confirmed Slot'}</span>
                                            </div>
                                            <p className="text-xs text-zinc-400 leading-relaxed font-medium">Confirmed via automated Relationship OS workflow.</p>
                                        </div>
                                    </div>
                                )}

                            </>
                        )}
                    </div>
                </div>
            </div>

            {
                isLightboxOpen && (
                    <Lightbox
                        open={isLightboxOpen}
                        close={() => setIsLightboxOpen(false)}
                        slides={[{ src: fixMinIOUrl(msg.metadata?.url) || "" }]}
                        render={{
                            buttonPrev: () => null,
                            buttonNext: () => null,
                        }}
                    />
                )
            }
        </motion.div >
    );
};

export const MessageBubble = MessageBubbleBase;
