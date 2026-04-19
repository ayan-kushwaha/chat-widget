import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Conversation } from '../types';

interface QuickActionsProps {
    scrolled: boolean;
    conversation: Conversation;
    onClose: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ scrolled, conversation, onClose }) => {
    // Mock Status (In real app, this comes from conversation/socket)
    const isOnline = true;
    const [displayInfoMode, setDisplayInfoMode] = useState<'email' | 'phone'>('phone');

    // 🕒 Toggling Info Interval (Every 60 Seconds)
    useEffect(() => {
        const interval = setInterval(() => {
            setDisplayInfoMode(prev => prev === 'email' ? 'phone' : 'email');
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <AnimatePresence>
            {scrolled && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="absolute top-0 left-0 right-0 z-[100] w-full bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between px-6 py-2.5 pointer-events-auto select-none"
                >
                    {/* --- LEFT: IDENTITY --- */}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                        {/* Avatar with Status Border */}
                        <div className="relative shrink-0">
                            <motion.div
                                animate={isOnline ? {
                                    boxShadow: [
                                        "0 0 0 0px rgba(16, 185, 129, 0)",
                                        "0 0 0 3px rgba(16, 185, 129, 0.4)",
                                        "0 0 0 0px rgba(16, 185, 129, 0)"
                                    ]
                                } : {}}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                className={cn(
                                    "rounded-full p-0.5",
                                    isOnline ? "bg-emerald-500/20" : "bg-zinc-500/20"
                                )}
                            >
                                <Avatar className={cn(
                                    "w-10 h-10 border-2 transition-all duration-500",
                                    isOnline ? "border-emerald-500" : "border-zinc-500"
                                )}>
                                    <AvatarImage src={conversation.userAvatar} className="rounded-full" />
                                    <AvatarFallback>{conversation.userName?.[0] || 'U'}</AvatarFallback>
                                </Avatar>
                            </motion.div>

                            {/* Status Dot */}
                            <div className={cn(
                                "absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white dark:border-[#09090b] rounded-full z-20",
                                isOnline ? "bg-emerald-500" : "bg-zinc-400"
                            )}></div>
                        </div>

                        {/* Name & Dynamic Info */}
                        <div className="flex flex-col justify-center min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="text-[15px] font-black text-zinc-900 dark:text-white leading-none truncate">
                                    {conversation.userName}
                                </h3>
                                {isOnline && (
                                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tight flex items-center gap-1">
                                        <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
                                        Online
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col mt-0.5 h-3 justify-center">
                                <AnimatePresence mode="wait">
                                    {displayInfoMode === 'email' ? (
                                        <motion.p
                                            key="email"
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            className="text-[10px] text-zinc-500 font-bold truncate leading-tight"
                                        >
                                            {conversation.userEmail || `contact@${conversation.userName?.toLowerCase().replace(/\s/g, '')}.com`}
                                        </motion.p>
                                    ) : (
                                        <motion.p
                                            key="phone"
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            className="text-[10px] text-zinc-400 font-bold truncate leading-tight"
                                        >
                                            {conversation.userMobile || conversation.userPhone || "+91 63943 11141"}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    {/* --- RIGHT: ACTIONS --- */}
                    <div className="flex items-center gap-2 pr-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-full text-zinc-400 hover:text-zinc-800 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                        >
                            <Search size={18} />
                        </Button>

                        <div className="w-px h-5 bg-black/5 dark:bg-white/5 mx-1" />

                        {onClose && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="h-9 w-9 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-500 hover:text-white hover:bg-red-500 transition-all shadow-sm"
                            >
                                <X size={18} />
                            </Button>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
