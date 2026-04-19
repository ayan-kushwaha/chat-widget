"use client";

import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Info,
    Archive,
    UserPlus,
    History,
    Volume2,
    VolumeX,
    Sun,
    Moon,
    Home
} from 'lucide-react';
import { X as AnimatedX } from '@/components/animate-ui/icons/x';
import { cn } from '@/lib/utils';

interface GlobalChatContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onAction: (action: string) => void;
    viewMode?: 'widget' | 'dashboard';
    isMuted?: boolean;
    isDark?: boolean;
}

export const GlobalChatContextMenu: React.FC<GlobalChatContextMenuProps> = ({
    x,
    y,
    onClose,
    onAction,
    viewMode = 'dashboard',
    isMuted = false,
    isDark = false
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // 🌟 Define Menu Items based on View Mode
    const dashboardActions = [
        { id: 'edit', label: 'Edit Info', icon: Info },
        { id: 'archive', label: 'Archive', icon: Archive },
        { id: 'group', label: 'Add to group', icon: UserPlus },
        { id: 'history', label: 'View History', icon: History },
        { id: 'close', label: 'Close chat', icon: AnimatedX, color: 'text-red-500' },
    ];

    const widgetActions = [
        { id: 'back_home', label: 'Back to Home', icon: Home, color: 'text-zinc-400' },
        { id: 'toggle_mute', label: isMuted ? 'Unmute Sounds' : 'Mute Sounds', icon: isMuted ? Volume2 : VolumeX, color: 'text-red-500' },
        { id: 'toggle_theme', label: isDark ? 'Light Mode' : 'Dark Mode', icon: isDark ? Sun : Moon, color: 'text-amber-500' },
        { id: 'close_widget', label: 'Close Chat', icon: AnimatedX, color: 'text-rose-600' },
    ];

    const actions = viewMode === 'widget' ? widgetActions : dashboardActions;

    // Adjust position to keep menu inside viewport
    const adjustedX = Math.min(x, typeof window !== 'undefined' ? window.innerWidth - 220 : x);
    const adjustedY = Math.min(y, typeof window !== 'undefined' ? window.innerHeight - 300 : y);

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
                className="w-56 bg-[#1f1f1f] border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col select-none py-1.5"
            >
                <div className="flex items-center justify-between px-4 py-2 mb-1 border-b border-white/5">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-tighter">
                        {viewMode === 'widget' ? 'Cluaiz Menu' : 'Chat Options'}
                    </span>
                    <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300 transition-colors">
                        <AnimatedX size={14} animateOnHover />
                    </button>
                </div>

                {actions.map((act, index) => (
                    <React.Fragment key={act.id}>
                        {/* Divider Logic */}
                        {(viewMode === 'dashboard' && index === 4) && <div className="h-[1px] bg-white/5 mx-3 my-1" />}
                        {(viewMode === 'widget' && index === 3) && <div className="h-[1px] bg-white/5 mx-3 my-1" />}

                        <button
                            onClick={() => {
                                onAction(act.id);
                                onClose();
                            }}
                            className={cn(
                                "w-full flex items-center gap-3.5 px-4 py-2.5 text-[13px] font-medium transition-all text-neutral-300 hover:bg-white/5 hover:text-white group text-left",
                                act.color
                            )}
                        >
                            <act.icon size={16} className={cn("opacity-70 group-hover:opacity-100 transition-opacity", act.color)} />
                            {act.label}
                        </button>
                    </React.Fragment>
                ))}
            </motion.div>
        </AnimatePresence>,
        document.body
    );
};
