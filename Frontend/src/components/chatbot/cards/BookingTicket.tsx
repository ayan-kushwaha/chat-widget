"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Zap, CheckCircle2, MoreHorizontal, Phone, Video, MessageSquare, X, Sparkles, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

interface BookingTicketProps {
    date: Date;
    time: string;
    type: string;
    reason?: string;
    status?: 'confirmed' | 'pending' | 'cancelled';
    onReschedule?: () => void;
    onCancel?: () => void;
}

const TYPE_ICONS: Record<string, any> = {
    'chat': MessageSquare,
    'call': Phone,
    'meeting': Video,
    'video': Video,
};

const DEFAULT_ICON = Zap;

export const BookingTicket: React.FC<BookingTicketProps> = ({
    date,
    time,
    type,
    reason,
    status = 'confirmed',
    onReschedule,
    onCancel
}) => {
    const Icon = TYPE_ICONS[type?.toLowerCase()] || DEFAULT_ICON;
    const isCancelled = status === 'cancelled';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={cn("group relative", isCancelled && "opacity-60 grayscale")}
        >
            {/* 🌌 OUTER GLOW */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-[28px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* 🎟️ TICKET CORE */}
            <div className={cn(
                "relative w-full min-w-[320px] max-w-[420px] backdrop-blur-3xl border rounded-[28px] overflow-hidden flex flex-col shadow-2xl transition-all duration-500",
                "bg-white/80 dark:bg-[#050810]/90 border-black/5 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-none"
            )}>

                {/* Visual "Stubs" (The Ticket Cutouts) */}
                <div className={cn(
                    "absolute -left-3 top-[55%] -translate-y-1/2 w-6 h-6 rounded-full border z-20 transition-colors",
                    "bg-neutral-100 dark:bg-[#0a0f18] border-black/5 dark:border-white/5 shadow-inner"
                )} />
                <div className={cn(
                    "absolute -right-3 top-[55%] -translate-y-1/2 w-6 h-6 rounded-full border z-20 transition-colors",
                    "bg-neutral-100 dark:bg-[#0a0f18] border-black/5 dark:border-white/5 shadow-inner"
                )} />

                {/* Top Section */}
                <div className="p-6 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-full bg-blue-600/10 flex items-center justify-center border border-blue-500/20 shadow-lg shadow-blue-500/5">
                            <Icon size={20} className="text-blue-400" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] block mb-0.5">
                                {isCancelled ? 'Protocol Terminated' : 'Booking Secured'}
                            </span>
                            <span className={cn(
                                "text-[14px] font-[900] uppercase tracking-tighter italic transition-colors",
                                "text-[#1d1d1f] dark:text-white"
                            )}>
                                {type} Protocol
                            </span>
                        </div>
                    </div>
                    {isCancelled ? <X size={20} className="text-red-500/50" /> : <CheckCircle2 size={20} className="text-emerald-500" />}
                </div>

                {/* Divider (Dashed) */}
                <div className="px-6">
                    <div className={cn(
                        "h-[1px] w-full border-t border-dashed transition-colors",
                        "border-black/5 dark:border-white/10"
                    )} />
                </div>

                {/* Middle Detail Grid */}
                <div className="p-6 flex gap-2 justify-between">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Temporal Point</span>
                        <div className="flex items-center gap-2.5">
                            <Calendar size={14} className="text-blue-500" />
                            <span className={cn(
                                "text-sm font-black italic transition-colors",
                                "text-[#1d1d1f] dark:text-white"
                            )}>{format(date, 'MMM dd, yyyy')}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5 text-right">
                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Quantum Time</span>
                        <div className="flex items-center gap-2.5 justify-end">
                            <Clock size={14} className="text-blue-500" />
                            <span className={cn(
                                "text-sm font-black italic transition-colors",
                                "text-[#1d1d1f] dark:text-white"
                            )}>{time}</span>
                        </div>
                    </div>
                </div>

                {/* Reason / Manifest (Optional) */}
                {reason && (
                    <div className="px-6 pb-6">
                        <div className={cn(
                            "p-4 rounded-2xl relative group/manifest overflow-hidden border transition-all",
                            "bg-blue-50 dark:bg-blue-500/5 border-blue-500/20 dark:border-blue-500/10 shadow-inner dark:shadow-none"
                        )}>
                            {/* Decorative background glow */}
                            <div className="absolute -right-4 -top-4 w-12 h-12 bg-blue-500/10 blur-xl rounded-full" />

                            <div className="flex items-center gap-3 mb-3">
                                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.9)] animate-pulse" />
                                <span className="text-[11px] font-[900] text-blue-400 uppercase tracking-[0.3em] font-mono">Manifest Protocol</span>
                            </div>
                            <p className={cn(
                                "text-[13px] font-[950] leading-relaxed uppercase tracking-tight italic pl-2 border-l-2 transition-colors",
                                "text-[#1d1d1f] dark:text-white border-blue-500/60 dark:border-blue-500/40"
                            )}>
                                {reason}
                            </p>
                        </div>
                    </div>
                )}

                {/* ⚙️ LIFECYCLE CONTROLS */}
                <div className="px-6 pb-7 flex gap-4 pt-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!isCancelled) onCancel?.();
                        }}
                        disabled={isCancelled}
                        className={cn(
                            "flex-1 py-4 border rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 group/btn shadow-inner",
                            isCancelled
                                ? "bg-red-500/10 border-red-500/30 text-red-500"
                                : "bg-neutral-50 dark:bg-white/[0.03] border-black/5 dark:border-white/5 text-zinc-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:border-red-500/20 dark:hover:border-red-500/40 hover:bg-red-50 dark:hover:bg-red-500/5"
                        )}
                    >
                        {isCancelled ? (
                            <>
                                <ShieldAlert size={14} />
                                CANCELLED
                            </>
                        ) : (
                            <>
                                <X size={14} className="group-hover/btn:rotate-90 transition-transform" />
                                Termination
                            </>
                        )}
                    </button>
                    {!isCancelled && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onReschedule?.();
                            }}
                            className="flex-1 py-4 bg-gradient-to-br from-blue-600 to-indigo-700 border border-blue-400/30 rounded-2xl text-[10px] font-black text-white uppercase tracking-[0.2em] hover:from-blue-500 hover:to-indigo-600 transition-all flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:shadow-[0_15px_40px_rgba(37,99,235,0.5)] active:scale-95"
                        >
                            <Sparkles size={14} />
                            Reschedule
                        </button>
                    )}
                </div>

                {/* Footer Scanline */}
                <div className="w-full h-1 bg-gradient-to-r from-blue-600/50 via-indigo-500/50 to-blue-600/50 animate-pulse" />
            </div>
        </motion.div>
    );
};
