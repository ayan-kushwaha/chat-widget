import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    RefreshCcw,
    Volume2,
    VolumeX,
    Moon,
    Sun,
    MessageSquare,
    UserPlus,
    X
} from 'lucide-react';

interface ContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onNewChat: () => void;
    onToggleMute: () => void;
    onToggleTheme: () => void;
    onQuickAction: (action: string) => void;
    onCloseChat?: () => void;
    isMuted: boolean;
    isDark: boolean;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
    x, y, onClose, onNewChat, onToggleMute, onToggleTheme, onQuickAction, onCloseChat, isMuted, isDark
}) => {
    // Prevent menu from going off-screen
    const menuWidth = 180;
    const menuHeight = 240;
    const adjustedX = Math.min(x, window.innerWidth - menuWidth - 20);
    const adjustedY = Math.min(y, window.innerHeight - menuHeight - 20);

    const menuItems = [
        { label: 'New Chat', icon: RefreshCcw, onClick: onNewChat, color: 'text-blue-500' },
        { label: isMuted ? 'Unmute Sounds' : 'Mute Sounds', icon: isMuted ? Volume2 : VolumeX, onClick: onToggleMute, color: 'text-red-500' },
        { label: isDark ? 'Light Mode' : 'Dark Mode', icon: isDark ? Sun : Moon, onClick: onToggleTheme, color: 'text-amber-500' },
        ...(onCloseChat ? [{ label: 'Close Chat', icon: X, onClick: onCloseChat, color: 'text-rose-600' }] : []),
    ];

    const quickActions = [
        { label: 'Talk to Human', icon: UserPlus, action: 'I want to talk to an agent' },
        { label: 'Pricing Info', icon: MessageSquare, action: 'Can you tell me about pricing?' },
    ];

    return (
        <>
            {/* Backdrop to catch clicks for closing */}
            <div
                className="fixed inset-0 z-[9998]"
                onClick={onClose}
                onContextMenu={(e) => {
                    e.preventDefault();
                    onClose();
                }}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                style={{ left: adjustedX, top: adjustedY }}
                className="fixed z-[9999] w-[200px] bg-[#1f1f1f] border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col select-none py-1.5"
            >
                <div className="flex items-center justify-between px-4 py-2 mb-1 border-b border-white/5">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-tighter">Cluaiz Menu</span>
                    <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300 transition-colors">
                        <X size={14} />
                    </button>
                </div>

                {menuItems.map((item, idx) => (
                    <button
                        key={idx}
                        onClick={() => {
                            item.onClick();
                            onClose();
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-all text-left group"
                    >
                        <item.icon size={16} className={`${item.color} group-hover:scale-110 transition-transform opacity-80 group-hover:opacity-100`} />
                        <span className="text-[13px] font-medium text-neutral-300 group-hover:text-white">{item.label}</span>
                    </button>
                ))}

                <div className="my-1 border-t border-white/5" />

                <div className="px-4 py-2 text-[10px] font-bold text-neutral-500 uppercase tracking-tighter">Quick Actions</div>

                {quickActions.map((item, idx) => (
                    <button
                        key={idx}
                        onClick={() => {
                            onQuickAction(item.action);
                            onClose();
                        }}
                        className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-white/5 transition-all text-left group"
                    >
                        <item.icon size={14} className="text-blue-400 group-hover:rotate-12 transition-transform opacity-70 group-hover:opacity-100" />
                        <span className="text-[12px] font-medium text-neutral-400 group-hover:text-neutral-200">{item.label}</span>
                    </button>
                ))}
            </motion.div>
        </>
    );
};
