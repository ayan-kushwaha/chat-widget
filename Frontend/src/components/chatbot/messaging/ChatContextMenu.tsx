"use client";

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Pin,
    PinOff,
    MessageSquare,
    CheckCircle2,
    XCircle,
    Tag,
    Heart,
    Phone,
    Archive,
    ArchiveRestore,
    BellOff,
    Bell,
    CheckSquare,
    Users,
    ChevronLeft,
    Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Conversation } from '../types';
import { Group } from '@/services/group.service';

interface ChatContextMenuProps {
    x: number;
    y: number;
    conversation: Conversation;
    onClose: () => void;
    onPin: (id: string) => void;
    onArchive: (id: string) => void;
    onToggleFavourite: (id: string) => void;
    onAddLabel: (id: string) => void;
    onEnterSelectionMode?: () => void; // 🆕
    isMuted?: boolean;
    onToggleMute?: () => void;
    groups?: Group[];
    onAddToGroup?: (groupId: string) => void;
    activeGroupId?: string;
}

const MenuItem = ({
    icon: Icon,
    label,
    onClick,
    variant = "default",
    disabled = false
}: {
    icon: any,
    label: string,
    onClick: () => void,
    variant?: "default" | "danger" | "success" | "warning",
    disabled?: boolean
}) => (
    <button
        disabled={disabled}
        onClick={(e) => {
            e.stopPropagation();
            onClick();
        }}
        className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-bold transition-all first:rounded-t-xl last:rounded-b-xl disabled:opacity-30",
            variant === "default" && "text-zinc-300 hover:bg-zinc-800 hover:text-white",
            variant === "danger" && "text-red-500 hover:bg-red-500/10",
            variant === "success" && "text-emerald-500 hover:bg-emerald-500/10",
            variant === "warning" && "text-zinc-400 group-hover:text-amber-500", // Fix for pin highlight
            variant === "warning" && "text-zinc-400 hover:bg-amber-500/10 hover:text-amber-500"
        )}
    >
        <Icon size={16} />
        {label}
    </button>
);

export const ChatContextMenu: React.FC<ChatContextMenuProps> = ({
    x, y, conversation, onClose, onPin, onArchive, onToggleFavourite, onAddLabel, onEnterSelectionMode, isMuted, onToggleMute, groups = [], onAddToGroup, activeGroupId
}) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [view, setView] = React.useState<'main' | 'groups'>('main');

    // Close on click outside
    useEffect(() => {
        const handleClick = () => onClose();
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [onClose]);

    // Detect if menu overflows viewport
    const menuWidth = 220;
    const menuHeight = 260; // Reduced height
    const adjustedX = x + menuWidth > window.innerWidth ? x - menuWidth : x;
    const adjustedY = y + menuHeight > window.innerHeight ? y - menuHeight : y;

    return (
        <AnimatePresence>
            <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                style={{ top: adjustedY, left: adjustedX }}
                className="fixed  z-[100] w-[220px] bg-zinc-900 border border-white/10 rounded-xl shadow-2xl p-1 backdrop-blur-xl"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking menu itself
            >
                <div className="flex flex-col">
                    {view === 'main' ? (
                        <>
                            <MenuItem
                                icon={conversation.is_pinned ? PinOff : Pin}
                                label={conversation.is_pinned ? "Unpin Chat" : "Pin Chat"}
                                onClick={() => { onPin(conversation._id); onClose(); }}
                                variant="warning"
                            />
                            {onEnterSelectionMode && (
                                <MenuItem
                                    icon={CheckSquare}
                                    label="Select Messages"
                                    onClick={() => { onEnterSelectionMode(); onClose(); }}
                                />
                            )}
                            <MenuItem
                                icon={Tag}
                                label="Add Label"
                                onClick={() => { onAddLabel(conversation._id); onClose(); }}
                            />
                            <MenuItem
                                icon={(props: any) => <Heart {...props} fill={conversation.is_favourite ? "currentColor" : "none"} />}
                                label={conversation.is_favourite ? "Remove Favourite" : "Add to Favourites"}
                                onClick={() => { onToggleFavourite(conversation._id); onClose(); }}
                                variant={conversation.is_favourite ? "danger" : "default"}
                            />

                            <div className="h-px bg-white/5 my-1 mx-2" />

                            {groups.length > 0 && onAddToGroup && (
                                <MenuItem
                                    icon={Users}
                                    label={activeGroupId ? "Exit Group" : (groups.some(g =>
                                        g.members.includes(String(conversation._id)) ||
                                        (conversation.chatId && g.members.includes(String(conversation.chatId)))
                                    ) ? "Edit Groups" : "Add to Group")}
                                    onClick={() => {
                                        if (activeGroupId) {
                                            onAddToGroup(activeGroupId);
                                            onClose();
                                        } else {
                                            setView('groups');
                                        }
                                    }}
                                />
                            )}

                            <MenuItem
                                icon={conversation.status === 'archived' ? ArchiveRestore : Archive}
                                label={conversation.status === 'archived' ? "Unarchive Chat" : "Archive Chat"}
                                onClick={() => { onArchive(conversation._id); onClose(); }}
                            />
                            {onToggleMute && (
                                <MenuItem
                                    icon={isMuted ? Bell : BellOff}
                                    label={isMuted ? "Unmute Notifications" : "Mute Notifications"}
                                    onClick={() => { onToggleMute?.(); onClose(); }}
                                    variant={isMuted ? "default" : "danger"}
                                />
                            )}
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 mb-1">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setView('main');
                                    }}
                                    className="p-1 hover:bg-white/10 rounded-md text-zinc-400 hover:text-white transition-colors"
                                >
                                    <ChevronLeft size={14} />
                                </button>
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Select Group</span>
                            </div>
                            <div className="max-h-[220px] overflow-y-auto scrollbar-none pb-1">
                                {groups.map(group => {
                                    const isMember = group.members.includes(String(conversation._id)) ||
                                        (conversation.chatId && group.members.includes(String(conversation.chatId)));

                                    return (
                                        <button
                                            key={group._id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAddToGroup?.(group._id);
                                                onClose();
                                            }}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-3 py-2 text-[12px] font-semibold transition-all text-left",
                                                isMember
                                                    ? "bg-emerald-500/10 text-emerald-500"
                                                    : "text-zinc-400 hover:bg-neutral-800 hover:text-white"
                                            )}
                                        >
                                            <span className="w-4 text-center">{group.emoji || '👥'}</span>
                                            <span className="truncate flex-1">{group.name}</span>
                                            {isMember && <Check size={12} className="shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
