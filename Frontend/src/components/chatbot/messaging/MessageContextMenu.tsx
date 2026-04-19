"use client";

import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Star,
    Phone,
    ThumbsUp,
    ThumbsDown,
    CheckSquare,
    Trash2,
    Copy,
    Reply,
    X,
    Plus,
    Pin,
    PinOff,
    Volume2,
    StarOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmojiMeta } from '@/assets/emogy/EmojiMeta';
import { LottieEmoji } from '@/components/global/LottieEmoji';
import { EmojiPicker } from '../pickers/EmojiPicker';

interface MessageContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onAction: (action: string) => void;
    onReact: (emoji: string) => void;
    isPinned?: boolean;
    isStarred?: boolean;
    isDeleted?: boolean; // 🧼 Soft Delete Flag
    viewMode?: 'widget' | 'dashboard';
}

export const MessageContextMenu: React.FC<MessageContextMenuProps> = ({
    x,
    y,
    onClose,
    onAction,
    onReact,
    isPinned,
    isStarred,
    isDeleted,
    viewMode
}) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [showPicker, setShowPicker] = React.useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const reactions = [
        { emoji: '👍', label: 'Like' },
        { emoji: '❤️', label: 'Love' },
        { emoji: '😂', label: 'Haha' },
        { emoji: '😮', label: 'Wow' },
        { emoji: '😢', label: 'Sad' },
        { emoji: '🙏', label: 'Pray' },
    ];

    const actions = [
        { id: 'reply', label: 'Reply', icon: Reply },
        { id: 'call', label: 'Call', icon: Phone },
        { id: 'copy', label: 'Copy', icon: Copy },
        { id: 'pin', label: isPinned ? 'Unpin Message' : 'Pin Message', icon: isPinned ? PinOff : Pin },
        { id: 'star', label: isStarred ? 'Unstar' : 'Star', icon: isStarred ? StarOff : Star },
        { id: 'select', label: 'Select', icon: CheckSquare },
        { id: 'delete', label: 'Delete', icon: Trash2, color: 'text-red-500' },
    ];

    // Adjust position to keep menu inside viewport
    const adjustedX = Math.min(x, typeof window !== 'undefined' ? window.innerWidth - 300 : x);
    const adjustedY = Math.min(y, typeof window !== 'undefined' ? window.innerHeight - 450 : y);
    const showPickerOnLeft = typeof window !== 'undefined' && adjustedX > window.innerWidth / 2;

    // ✨ PORTAL MAGIC: Detach from stacking context
    if (typeof document === 'undefined') return null;

    return ReactDOM.createPortal(
        <AnimatePresence>
            <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                style={{
                    position: 'fixed',
                    top: adjustedY,
                    left: adjustedX,
                    zIndex: 99999
                }}
                className={cn(
                    "flex flex-col select-none",
                    showPicker ? "bg-transparent shadow-none border-none" : "bg-[#1f1f1f] border border-white/10 rounded-[1rem] shadow-[0_10px_40px_rgba(0,0,0,0.5)] px-1 py-1",
                    !showPicker && (viewMode === 'widget' ? "w-52" : "w-53")
                )}
            >
                {!showPicker ? (
                    <>
                        {/* 🌈 REACTIONS BAR */}
                        {!isDeleted && (
                            <div className="flex items-center justify-between px-2 py-2 bg-[#1f1f1f] rounded-t-[1rem]">
                                <div className="flex items-center gap-0.5">
                                    {reactions.map((r) => {
                                        const codepoint = [...r.emoji].map(c => c.codePointAt(0)?.toString(16)).filter(Boolean).join('_');
                                        const meta = EmojiMeta[codepoint];

                                        return (
                                            <button
                                                key={r.emoji}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    console.log('✅ [ContextMenu] Quick React:', r.emoji);
                                                    onReact(r.emoji);
                                                    onClose();
                                                }}
                                                className={cn(
                                                    "flex items-center justify-center rounded-full transition-all hover:scale-125 hover:bg-white/10 p-1",
                                                    viewMode === 'widget' ? "w-8 h-8" : "w-10 h-10"
                                                )}
                                                title={r.label}
                                            >
                                                {meta?.path ? (
                                                    <LottieEmoji
                                                        path={meta.path}
                                                        loop={true}
                                                        autoplay={true}
                                                        shouldPreload={true}
                                                        alt={r.emoji} // 🛡️ Fallback if Lottie fails
                                                        style={{ width: viewMode === 'widget' ? 24 : 32, height: viewMode === 'widget' ? 24 : 32 }}
                                                    />
                                                ) : (
                                                    <span className={viewMode === 'widget' ? "text-lg" : "text-xl"}>{r.emoji}</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="w-[1px] h-6 bg-white/10 mx-1" />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        console.log('✅ [ContextMenu] Opening Emoji Picker');
                                        setShowPicker(true);
                                    }}
                                    className={cn(
                                        "flex items-center justify-center bg-[#27272a] hover:bg-[#3f3f46] rounded-full transition-all text-zinc-400 ml-1",
                                        viewMode === 'widget' ? "w-6 h-6" : "w-8 h-8"
                                    )}
                                >
                                    <Plus size={viewMode === 'widget' ? 14 : 16} />
                                </button>
                            </div>
                        )}

                        <div className="h-[1px] bg-white/5 mx-2" />

                        {/* ⚡ ACTIONS LIST */}
                        <div className="flex flex-col py-1">
                            {actions
                                .filter(act => !isDeleted || ['delete', 'select'].includes(act.id)) // 🧼 Restrict Actions
                                .map((act, index) => (
                                    <React.Fragment key={act.id}>
                                        {index > 0 && index === 3 && !isDeleted && <div className="h-[1px] bg-white/5 mx-2 my-1" />}
                                        {index > 0 && index === 6 && !isDeleted && <div className="h-[1px] bg-white/5 mx-2 my-1" />}
                                        <button
                                            onClick={() => {
                                                onAction(act.id);
                                                onClose();
                                            }}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-3 py-2.5 transition-all text-zinc-300 hover:bg-white/5 hover:rounded-lg hover:text-white group text-left",
                                                viewMode === 'widget' ? "text-[12px]" : "text-[13px] font-medium",
                                                act.color
                                            )}
                                        >
                                            <act.icon
                                                size={viewMode === 'widget' ? 14 : 16}
                                                className={cn("opacity-70 group-hover:opacity-100 transition-opacity", act.color)}
                                            />
                                            {act.label}
                                        </button>
                                    </React.Fragment>
                                ))}
                        </div>
                    </>
                ) : (
                    // 🎨 EMOJI PICKER VIEW (Replaces Menu)
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="shadow-2xl rounded-xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <EmojiPicker
                            onSelect={(emoji) => {
                                onReact(emoji);
                                onClose();
                            }}
                        />
                    </motion.div>
                )}
            </motion.div>
        </AnimatePresence>,
        document.body
    );
};
