import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, User, Bot, Phone, Reply, Copy, Star, ThumbsUp, ThumbsDown, CheckSquare, Trash2, Volume2, VolumeX, Bell, BellOff, Ban } from 'lucide-react';
import { InboxService } from '@/services/inbox.service';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { VoicePlayer } from '@/components/chatbot/utils/VoicePlayer';
import { MessageActions } from '@/components/chatbot/messaging/MessageActions';
import { playSmartNotification } from '@/utils/notification';
import { playSendSound } from '@/utils/sendSound';
import { MessageStatusIcon, MessageStatus, formatMessageTime } from '@/components/chatbot/messaging/MessageStatusIcon';
import { ReplyContextBar } from '@/components/chatbot/messaging/ReplyContextBar';
import { QuotedMessage } from '@/components/chatbot/messaging/QuotedMessage';

interface AgentChatProps {
    chat: any;
    socket: any;
    orgId: string;
}

// Typewriter Component
const Typewriter = ({ text, onComplete }: { text: string; onComplete?: () => void }) => {
    const [displayedText, setDisplayedText] = useState('');
    const onCompleteRef = useRef(onComplete);

    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    useEffect(() => {
        const trimmedText = text.trimStart();
        setDisplayedText('');
        let index = 0;
        let isCancelled = false;

        const interval = setInterval(() => {
            if (isCancelled) return;

            if (index < trimmedText.length) {
                setDisplayedText(trimmedText.substring(0, index + 1));
                index++;
            } else {
                clearInterval(interval);
                if (onCompleteRef.current) {
                    onCompleteRef.current();
                }
            }
        }, 15);

        return () => {
            isCancelled = true;
            clearInterval(interval);
        };
    }, [text]);

    return (
        <div className="prose prose-sm dark:prose-invert max-w-none 
            prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white
            prose-p:leading-relaxed prose-p:mb-2
            prose-li:my-0.5">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {displayedText}
            </ReactMarkdown>
        </div>
    );
};

// Context Menu Component
const MessageContextMenu = ({
    x, y,
    onClose,
    onAction,
    message,
    isMuted,
    onToggleMute
}: {
    x: number;
    y: number;
    onClose: () => void;
    onAction: (action: string) => void;
    message?: any;
    isMuted?: boolean;
    onToggleMute?: () => void;
}) => {
    const menuWidth = 280;
    const menuHeight = 480;

    const adjustedX = x + menuWidth > window.innerWidth ? x - menuWidth : x;
    const adjustedY = y + menuHeight > window.innerHeight ? y - menuHeight : y;

    const emojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

    const actions = [
        ...(message?.sender === 'ai' && !message?.isDeleted ? [{ icon: Volume2, label: 'Play Audio', action: 'play_audio', color: 'text-blue-500' }] : []),
        ...(!message?.isDeleted ? [
            { icon: Reply, label: 'Reply', action: 'reply', color: 'text-slate-600' },
            { icon: Copy, label: 'Copy', action: 'copy', color: 'text-slate-600' },
            { icon: Star, label: 'Star', action: 'star', color: 'text-slate-600' },
            { icon: ThumbsUp, label: 'Good response', action: 'good', color: 'text-slate-600' },
            { icon: ThumbsDown, label: 'Bad response', action: 'bad', color: 'text-slate-600' },
        ] : []),
        { icon: CheckSquare, label: 'Select', action: 'select', color: 'text-slate-600' },
        { icon: Trash2, label: 'Delete', action: 'delete', color: 'text-red-500' },
    ];

    return (
        <>
            <div className="fixed inset-0 z-[9998]" onClick={onClose} />
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{ left: adjustedX, top: adjustedY }}
                className="fixed z-[9999] w-[280px] bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-3 flex flex-col gap-2"
            >
                {!message?.isDeleted && (
                    <div className="flex items-center justify-between gap-1 pb-2 border-b border-slate-700">
                        {emojis.map((emoji, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    onAction(`react_${emoji}`);
                                    onClose();
                                }}
                                className="text-xl hover:scale-125 transition-transform"
                            >
                                {emoji}
                            </button>
                        ))}
                        <button className="text-slate-400 hover:text-white text-lg">+</button>
                    </div>
                )}

                {onToggleMute && (
                    <>
                        <button
                            onClick={() => {
                                onToggleMute();
                                onClose();
                            }}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-700/50 transition-all text-left"
                        >
                            {isMuted ? (
                                <BellOff size={16} className="text-red-500" />
                            ) : (
                                <Bell size={16} className="text-slate-400" />
                            )}
                            <span className={`text-sm font-medium ${isMuted ? 'text-red-500' : 'text-white'}`}>
                                {isMuted ? 'Unmute Notifications' : 'Mute Notifications'}
                            </span>
                        </button>
                        <div className="border-t border-slate-700 my-1" />
                    </>
                )}

                {actions.map((item, idx) => (
                    <button
                        key={idx}
                        onClick={() => {
                            onAction(item.action);
                            onClose();
                        }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-700/50 transition-all text-left ${item.action === 'delete' ? 'hover:bg-red-500/10' : ''
                            } ${item.action === 'play_audio' ? 'hover:bg-blue-500/10' : ''}`}
                    >
                        <item.icon size={16} className={item.color} />
                        <span className={`text-sm font-medium ${item.color}`}>{item.label}</span>
                    </button>
                ))}
            </motion.div>
        </>
    );
};

export const AgentChatWindow: React.FC<AgentChatProps> = ({ chat, socket, orgId }) => {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const [mode, setMode] = useState(chat.mode);
    const [finishedTyping, setFinishedTyping] = useState<Record<number, boolean>>({});
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; messageId: number } | null>(null);
    const [audioPlayQueue, setAudioPlayQueue] = useState<number | null>(null);
    const [isUserTyping, setIsUserTyping] = useState(false);
    const [replyingTo, setReplyingTo] = useState<{ id: string | number; sender: string; content: string } | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const [isMuted, setIsMuted] = useState(() => {
        if (typeof window !== 'undefined') {
            const { audioManager } = require('@/utils/audioManager');
            return audioManager.getMuteState();
        }
        return false;
    });

    const toggleMute = () => {
        if (typeof window !== 'undefined') {
            const { audioManager } = require('@/utils/audioManager');
            const newMutedState = audioManager.toggleMute();
            setIsMuted(newMutedState);
        }
    };

    useEffect(() => {
        if (!socket) return;

        const handleMessage = (data: any) => {
            if (data.sender === 'system') return;
            setMessages(prev => {
                const isDuplicate = prev.some(m => (data.id && m.id === data.id) || (m.content === (data.answer || data.message || data.text) && Math.abs(new Date(m.timestamp).getTime() - new Date().getTime()) < 2000));
                if (isDuplicate) return prev;
                playSmartNotification();
                return [...prev, {
                    id: data.id || Date.now(),
                    sender: data.sender,
                    content: data.answer || data.message || data.text,
                    timestamp: new Date(),
                    tokensUsed: data.tokensUsed,
                    replyTo: data.replyTo || data.metadata?.replyTo,
                    status: 'delivered' as MessageStatus
                }];
            });
            scrollToBottom();
        };

        const handleUserMessage = (data: any) => {
            if (data.chatId !== chat.chatId) return;
            setMessages(prev => {
                const isDuplicate = prev.some(m => (data.id && m.id === data.id) || (m.content === data.message && Math.abs(new Date(m.timestamp).getTime() - new Date().getTime()) < 2000));
                if (isDuplicate) return prev;
                return [...prev, {
                    id: data.id || Date.now(),
                    sender: 'user',
                    content: data.message,
                    timestamp: new Date(),
                    replyTo: data.replyTo || data.metadata?.replyTo,
                    status: 'delivered' as MessageStatus
                }];
            });
            scrollToBottom();
        };

        const handleAgentJoined = (data: any) => {
            if (chat.chatId !== data.chatId) return;
            setMode('human');
            setMessages(prev => [...prev, {
                id: Date.now(),
                sender: 'system',
                content: `${data.name || 'Agent'} joined the chat. AI Paused. ⏸️`,
                timestamp: new Date()
            }]);
        }

        const handleUserTyping = (data: { chatId: string, isTyping: boolean }) => {
            if (data.chatId === chat.chatId) setIsUserTyping(data.isTyping);
        };

        const handleMessageDeleted = (data: { messageId: string, mongoId?: string }) => {
            console.log('🗑️ [Socket] Message Hidden (Delete for Me):', data.messageId);
            setMessages(prev => prev.map(m =>
                (m.id === data.messageId || m._id === data.messageId || (data.mongoId && m._id === data.mongoId))
                    ? { ...m, isDeleted: true, content: "This message was deleted", type: 'text' }
                    : m
            ));
        };

        const handleMessageUpdated = (data: { messageId: string, mongoId?: string, isDeleted: boolean, content: string, type?: string }) => {
            console.log('🔄 [Socket] Message Updated (Soft Delete):', data.messageId);
            setMessages(prev => prev.map(m =>
                (m.id === data.messageId || m._id === data.messageId || (data.mongoId && m._id === data.mongoId))
                    ? { ...m, isDeleted: data.isDeleted, content: data.content, type: data.type || 'text' }
                    : m
            ));
        };

        socket.on('receive_message', handleMessage);
        socket.on('user_message_to_agent', handleUserMessage);
        socket.on('agent_joined', handleAgentJoined);
        socket.on('user_typing', handleUserTyping);
        socket.on('message_deleted', handleMessageDeleted);
        socket.on('message_updated', handleMessageUpdated);

        return () => {
            socket.off('receive_message', handleMessage);
            socket.off('user_message_to_agent', handleUserMessage);
            socket.off('agent_joined', handleAgentJoined);
            socket.off('user_typing', handleUserTyping);
            socket.off('message_deleted', handleMessageDeleted);
            socket.off('message_updated', handleMessageUpdated);
        };
    }, [socket, chat.chatId]);

    const scrollToBottom = () => {
        setTimeout(() => {
            if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSend = () => {
        if (!input.trim() || !socket) return;
        const tempMsgId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        socket.emit('agent_message', {
            id: tempMsgId,
            orgId,
            chatId: chat.chatId,
            message: input,
            agentId: 'current-agent-id',
            replyTo: replyingTo ? { id: replyingTo.id, sender: replyingTo.sender, content: replyingTo.content } : undefined
        });
        setMessages(prev => [...prev, {
            id: tempMsgId,
            sender: 'agent',
            content: input,
            timestamp: new Date(),
            status: 'sent' as MessageStatus,
            replyTo: replyingTo ? { id: replyingTo.id, sender: replyingTo.sender, content: replyingTo.content } : undefined
        }]);
        playSendSound();
        setInput('');
        setReplyingTo(null);
        scrollToBottom();
        socket.emit('agent_typing_stop', { orgId, chatId: chat.chatId });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInput(val);
        if (socket) {
            if (val.trim()) socket.emit('agent_typing_start', { orgId, chatId: chat.chatId });
            else socket.emit('agent_typing_stop', { orgId, chatId: chat.chatId });
        }
    };

    const handleJoin = () => {
        if (!socket) return;
        socket.emit('agent_join', { orgId, chatId: chat.chatId, agentId: 'current-agent-id' });
        setMode('human');
    };

    const handleFinishedTyping = (idx: number) => {
        setFinishedTyping(prev => ({ ...prev, [idx]: true }));
    };

    const handleContextMenu = (e: React.MouseEvent, messageId: number) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, messageId });
    };

    const handleContextAction = (action: string) => {
        if (action === 'reply') {
            const msg = messages.find(m => m.id === contextMenu?.messageId);
            if (msg) {
                setReplyingTo({ id: msg.id, sender: msg.sender, content: msg.content });
                setTimeout(() => inputRef.current?.focus(), 100);
            }
        } else if (action === 'delete') {
            if (!socket || !contextMenu?.messageId) return;
            socket.emit('delete_message', { orgId, chatId: chat.chatId, messageId: contextMenu.messageId, mode: 'everyone' });
        } else if (action === 'copy') {
            const msg = messages.find(m => m.id === contextMenu?.messageId);
            if (msg) navigator.clipboard.writeText(msg.content);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-white dark:bg-slate-950 rounded-md">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900 rounded-t-md">
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.userName}`} />
                        <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">{chat.userName}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {isUserTyping ? <span className="text-emerald-500 font-bold animate-pulse">Typing...</span> : `${chat.location || 'Unknown Location'} • ${chat.channel}`}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 items-center">
                    <button onClick={toggleMute} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                        {isMuted ? <BellOff size={18} className="text-slate-400" /> : <Bell size={18} className="text-slate-600 dark:text-slate-300" />}
                    </button>
                    {mode === 'ai' ? <Button size="sm" onClick={handleJoin} className="bg-black text-white hover:bg-gray-800">👮 Takeover</Button> : <Badge variant="secondary" className="bg-purple-100 text-purple-700">✓ Human</Badge>}
                </div>
            </div>

            <ScrollArea className="flex-1 p-4 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex flex-col gap-3">
                    <div className="text-center text-xs text-slate-400 my-2">-- Real-time Session --</div>
                    {messages.map((msg, idx) => (
                        <div
                            key={msg.id}
                            onContextMenu={(e: any) => handleContextMenu(e, msg.id)}
                            className={`max-w-[80%] p-3 text-sm relative ${msg.sender === 'agent' ? 'bg-blue-600 text-white self-end rounded-2xl rounded-br-md ml-auto shadow-md' : msg.sender === 'user' ? 'bg-white dark:bg-slate-800 border-slate-200 self-start rounded-2xl rounded-bl-md shadow-sm' : msg.sender === 'ai' ? 'bg-slate-200 dark:bg-slate-800 self-start rounded-2xl rounded-bl-md shadow-sm' : 'bg-slate-100 text-center text-xs self-center w-full rounded-lg'}`}
                        >
                            {msg.sender !== 'system' && <div className="text-[10px] opacity-70 mb-1 capitalize">{msg.sender}</div>}

                            {msg.isDeleted ? (
                                <div className="flex items-center gap-2 py-1 italic text-slate-500 opacity-40">
                                    <Ban size={14} className="shrink-0" />
                                    <span className="font-mono tracking-tighter">{msg.sender === 'agent' ? "You deleted this message" : "This message was deleted"}</span>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-1">
                                    {msg.replyTo && <QuotedMessage sender={msg.replyTo.sender} content={msg.replyTo.content} />}
                                    {msg.sender === 'ai' ? (
                                        <Typewriter text={msg.content} onComplete={() => handleFinishedTyping(idx)} />
                                    ) : (
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                        </div>
                                    )}
                                    {msg.sender !== 'system' && (
                                        <div className={`flex items-center gap-1 justify-end text-[10px] ${msg.sender === 'agent' ? 'text-white/70' : 'text-slate-400'}`}>
                                            <span>{formatMessageTime(msg.timestamp)}</span>
                                            {msg.sender === 'agent' && msg.status && <MessageStatusIcon status={msg.status} />}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 rounded-b-md">
                {replyingTo && (
                    <div className="bg-blue-500 text-white p-2 rounded mb-2 flex justify-between items-center text-xs font-bold">
                        <span>REPLYING TO: {replyingTo.sender}</span>
                        <button onClick={() => setReplyingTo(null)} className="bg-red-500 px-2 py-1 rounded">CANCEL</button>
                    </div>
                )}
                <div className="flex gap-2">
                    <Input
                        ref={inputRef}
                        placeholder={mode === 'ai' ? "AI is handling this..." : "Type your message..."}
                        value={input}
                        onChange={handleInputChange}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        className="flex-1 bg-zinc-100 dark:bg-white/5 border-none"
                    />
                    <Button onClick={handleSend} disabled={!input.trim()}><Send size={16} /></Button>
                </div>
            </div>

            <AnimatePresence>
                {contextMenu && (
                    <MessageContextMenu
                        x={contextMenu.x} y={contextMenu.y}
                        message={messages.find(m => m.id === contextMenu.messageId)}
                        isMuted={isMuted} onToggleMute={toggleMute}
                        onClose={() => setContextMenu(null)}
                        onAction={handleContextAction}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
