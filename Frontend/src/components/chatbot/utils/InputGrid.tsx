"use client";

import React from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Image,
    MapPin,
    Calendar,
    BarChart3,
    FileEdit,
    Package,
    Zap,
    Tag,
    X,
} from 'lucide-react';

interface InputGridProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (type: GridOptionType) => void;
    triggerRef?: React.RefObject<HTMLElement | null>;
}

export type GridOptionType =
    | 'gallery'
    | 'document'
    | 'location'
    | 'booking'
    | 'poll'
    | 'form'
    | 'product'
    | 'quick_reply'
    | 'offer'
    | 'note';

interface GridOption {
    id: GridOptionType;
    label: string;
    icon: any;
    color: string;
    className: string;
}

const GRID_OPTIONS: GridOption[] = [
    // Media
    {
        id: 'gallery',
        label: 'Gallery',
        icon: Image,
        color: 'text-zinc-500 dark:text-zinc-400',
        className: 'bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/50 hover:border-zinc-300 dark:hover:border-zinc-600'
    },
    {
        id: 'location',
        label: 'Location',
        icon: MapPin,
        color: 'text-red-500 dark:text-red-400',
        className: 'bg-red-50/50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 hover:border-red-200 dark:hover:border-red-500/40'
    },
    {
        id: 'booking',
        label: 'Book Slot',
        icon: Calendar,
        color: 'text-purple-500 dark:text-purple-400',
        className: 'bg-purple-50/50 dark:bg-purple-500/10 border-purple-100 dark:border-purple-500/20 hover:border-purple-200 dark:hover:border-purple-500/40'
    },
    // Business
    {
        id: 'poll',
        label: 'Poll',
        icon: BarChart3,
        color: 'text-emerald-500 dark:text-emerald-400',
        className: 'bg-emerald-50/50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 hover:border-emerald-200 dark:hover:border-emerald-500/40'
    },
    {
        id: 'form',
        label: 'Form',
        icon: FileEdit,
        color: 'text-orange-500 dark:text-orange-400',
        className: 'bg-orange-50/50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20 hover:border-orange-200 dark:hover:border-orange-500/40'
    },
    {
        id: 'product',
        label: 'Product',
        icon: Package,
        color: 'text-indigo-500 dark:text-indigo-400',
        className: 'bg-indigo-50/50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20 hover:border-indigo-200 dark:hover:border-indigo-500/40'
    },
    {
        id: 'quick_reply',
        label: 'Quick Reply',
        icon: Zap,
        color: 'text-yellow-500 dark:text-yellow-400',
        className: 'bg-yellow-50/50 dark:bg-yellow-500/10 border-yellow-100 dark:border-yellow-500/20 hover:border-yellow-200 dark:hover:border-yellow-500/40'
    },
    // Sales & Others
    {
        id: 'offer',
        label: 'Offer',
        icon: Tag,
        color: 'text-pink-500 dark:text-pink-400',
        className: 'bg-pink-50/50 dark:bg-pink-500/10 border-pink-100 dark:border-pink-500/20 hover:border-pink-200 dark:hover:border-pink-500/40'
    },
];

export const InputGrid: React.FC<InputGridProps> = ({ isOpen, onClose, onSelect, triggerRef }) => {
    const [isMounted, setIsMounted] = React.useState(false);
    const [position, setPosition] = React.useState<{ top?: number; left?: number; bottom?: number; right?: number } | null>(null);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    // 📍 Calculate Position on Open
    React.useEffect(() => {
        if (isOpen && triggerRef?.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            // Default: Align Bottom-Left of menu to Top-Left of trigger
            // Menu Height approx 400px? Let's use bottom positioning relative to viewport to be safe against varying heights.

            // Actually, "jah pe click kiya" usually means near the button.
            // Since it's a "Command Center", it usually pops UP from the input bar.

            // Let's position it roughly 10px above the button, aligned to its left edge.
            // Screen handling: If close to right edge, align right.

            const isDesktop = window.innerWidth >= 768;

            if (isDesktop) {
                setPosition({
                    bottom: window.innerHeight - rect.top + 10, // 10px above the top of the button
                    left: rect.left
                });
            } else {
                // Mobile: Stick to bottom standard
                setPosition(null);
            }
        }
    }, [isOpen, triggerRef]);

    const handleSelect = (type: GridOptionType) => {
        onSelect(type);
        onClose();
    };

    if (!isMounted || typeof document === 'undefined') return null;

    return ReactDOM.createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-transparent z-[9998]" // Transparent backdrop for "popover" feel, or minimal dim
                        onClick={onClose}
                    />

                    {/* Grid Panel - Anchored */}
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{
                            type: "spring",
                            damping: 25,
                            stiffness: 350
                        }}
                        style={position ? {
                            position: 'fixed',
                            bottom: position.bottom,
                            left: position.left,
                            zIndex: 9999
                        } : undefined}
                        className={!position ?
                            "fixed bottom-20 left-4 right-auto z-[9999] flex justify-start pointer-events-none" :
                            "fixed z-[9999] pointer-events-none origin-bottom-left"
                        }
                    >
                        {/* 🟢 Background: slate-950 to match theme */}
                        <div className="pointer-events-auto w-full max-w-[360px] bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden ring-1 ring-black/5">
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                                <div>
                                    <h3 className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                                        Command Center
                                    </h3>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                        <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500">System Ready</span>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Grid - Compact 4 Cols */}
                            <div className="p-3">
                                <div className="grid grid-cols-4 gap-2">
                                    {GRID_OPTIONS.map((option, index) => (
                                        <motion.button
                                            key={option.id}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.02 }}
                                            onClick={() => handleSelect(option.id)}
                                            className={`
                                                flex flex-col items-center justify-center gap-2 p-2 rounded-xl
                                                ${option.className}
                                                border hover:shadow-md
                                                transition-all duration-200
                                                active:scale-95
                                                group h-[84px]
                                            `}
                                        >
                                            {/* Icon Container */}
                                            <div className={`
                                                w-8 h-8 rounded-lg
                                                flex items-center justify-center
                                                bg-white/50 dark:bg-black/20
                                                group-hover:scale-110 transition-transform duration-300
                                                ${option.color}
                                            `}>
                                                <option.icon
                                                    size={18}
                                                    className="transition-transform"
                                                />
                                            </div>

                                            {/* Label */}
                                            <span className={`
                                                text-[9px] font-bold uppercase tracking-tight text-center leading-tight
                                                text-slate-600 dark:text-zinc-400
                                                group-hover:text-slate-900 dark:group-hover:text-zinc-200 transition-colors
                                            `}>
                                                {option.label}
                                            </span>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Footer Hint */}
                            <div className="px-4 pb-2 bg-slate-50/30 dark:bg-transparent">
                                <p className="text-[9px] text-center text-slate-400 dark:text-zinc-600 font-medium">
                                    Use shortcuts for faster access
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};
