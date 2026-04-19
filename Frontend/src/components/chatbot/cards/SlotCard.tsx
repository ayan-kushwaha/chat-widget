"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, CheckCircle2, ChevronRight, X, ChevronLeft, Sparkles, Check, MousePointer2 } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface SlotCardProps {
    date?: string;
    time?: string;
    status?: 'scheduled' | 'pending' | 'cancelled';
}

const TIME_SLOTS = [
    { id: '1', time: '09:00 AM', period: 'Morning' },
    { id: '2', time: '10:00 AM', period: 'Morning' },
    { id: '3', time: '11:00 AM', period: 'Morning' },
    { id: '4', time: '12:00 PM', period: 'Afternoon' },
    { id: '5', time: '01:00 PM', period: 'Afternoon' },
    { id: '6', time: '02:00 PM', period: 'Afternoon' },
    { id: '7', time: '03:00 PM', period: 'Afternoon' },
    { id: '8', time: '05:00 PM', period: 'Evening' },
    { id: '9', time: '06:00 PM', period: 'Evening' },
];

export const SlotCard: React.FC<SlotCardProps> = ({
    date: initialDate,
    time: initialTime,
}) => {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate ? new Date(initialDate) : new Date(2026, 0, 13));
    const [selectedSlot, setSelectedSlot] = useState<string | null>(initialTime || null);
    const [isConfirming, setIsConfirming] = useState(false);
    const [isBooked, setIsBooked] = useState(false);

    const handleConfirm = async () => {
        if (!selectedDate || !selectedSlot) {
            toast.error("Please select a date and time slot");
            return;
        }
        setIsConfirming(true);
        // Simulate cinematic processing
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsConfirming(false);
        setIsBooked(true);
        toast.success("Spot secured! See you there. ⚡");
    };

    if (isBooked) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative max-w-[380px] group/ticket"
            >
                {/* 🌌 GLOWING AMBIENCE */}
                <div className="absolute inset-0 bg-blue-500/10 blur-[60px] rounded-full pointer-events-none opacity-50 group-hover/ticket:opacity-100 transition-opacity" />

                {/* 💎 MAIN TICKET BODY */}
                <div className="relative bg-[#050810]/80 backdrop-blur-2xl border border-white/5 rounded-[32px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.6)]">

                    {/* 🔧 METALLIC HEADER */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />

                    <div className="p-8 pb-6 border-b border-dashed border-white/10 relative">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                                    <Check size={24} className="text-white" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] leading-none mb-1">Booking Secured</span>
                                    <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">Slot Protocol Active</h3>
                                </div>
                            </div>
                            <CheckCircle2 size={24} className="text-emerald-500/50" />
                        </div>

                        {/* 🎟️ TICKET CUTOUTS (LEFT/RIGHT) */}
                        <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-[#0a0f18] rounded-full border border-white/5 z-10" />
                        <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-[#0a0f18] rounded-full border border-white/5 z-10" />
                    </div>

                    <div className="p-8 pt-10 space-y-8">
                        {/* 📊 PROTOCOL DATA */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Temporal Point</span>
                                <div className="flex items-center gap-2 text-white">
                                    <CalendarIcon size={14} className="text-blue-500" />
                                    <span className="text-sm font-black tracking-tight">{format(selectedDate!, 'MMM dd, yyyy')}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Quantum Time</span>
                                <div className="flex items-center gap-2 text-white">
                                    <Clock size={14} className="text-blue-500" />
                                    <span className="text-sm font-black tracking-tight">{selectedSlot}</span>
                                </div>
                            </div>
                        </div>

                        {/* ⚙️ LIFECYCLE CONTROLS */}
                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => setIsBooked(false)}
                                className="flex-1 py-4 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2 group/btn"
                            >
                                <X size={14} className="group-hover/btn:rotate-90 transition-transform" />
                                Cancel
                            </button>
                            <button
                                onClick={() => setIsBooked(false)}
                                className="flex-1 py-4 bg-blue-600 rounded-2xl text-[10px] font-black text-white uppercase tracking-[0.2em] shadow-lg shadow-blue-600/20 hover:bg-blue-500 hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-2"
                            >
                                <Sparkles size={14} />
                                Reschedule
                            </button>
                        </div>
                    </div>

                    {/* 🧊 SCANNER EFFECT */}
                    <motion.div
                        className="absolute inset-0 pointer-events-none"
                        initial={{ top: "-100%" }}
                        animate={{ top: "100%" }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    >
                        <div className="h-40 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent w-full" />
                    </motion.div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0f172a]/95 backdrop-blur-3xl border border-white/10 rounded-[40px] overflow-hidden max-w-[400px] shadow-[0_30px_100px_rgba(0,0,0,0.8)] flex flex-col relative"
        >
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

            {/* Header section with depth */}
            <div className="p-8 pb-4 relative z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600/20 to-indigo-600/10 flex items-center justify-center border border-blue-500/30 shadow-[0_0_20px_rgba(37,99,235,0.15)]">
                            <CalendarIcon size={22} className="text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                        </div>
                        <div>
                            <h3 className="font-black text-white text-lg tracking-tight">Book a Slot</h3>
                            <div className="flex items-center gap-1.5 opacity-60">
                                <Sparkles size={10} className="text-blue-400" />
                                <p className="text-[10px] text-zinc-300 font-bold uppercase tracking-[0.2em]">Select Date & Time</p>
                            </div>
                        </div>
                    </div>
                    <button className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-full transition-all border border-white/5 group">
                        <X size={20} className="text-zinc-500 group-hover:text-white transition-colors" />
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="px-8 flex-1 overflow-y-auto no-scrollbar scroll-smooth flex flex-col pb-32 relative z-10">

                {/* Calendar Title */}
                <div className="flex items-center justify-between mb-4 mt-2">
                    <h4 className="text-[13px] font-black text-white uppercase tracking-[0.1em] flex items-center gap-2">
                        {/* Dot indicator */}
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        January 2026
                    </h4>
                    <div className="flex gap-2">
                        <button className="p-2 hover:bg-white/5 rounded-xl border border-white/5 transition-all active:scale-90">
                            <ChevronLeft size={14} className="text-zinc-400" />
                        </button>
                        <button className="p-2 hover:bg-white/5 rounded-xl border border-white/5 transition-all active:scale-90">
                            <ChevronRight size={14} className="text-zinc-400" />
                        </button>
                    </div>
                </div>

                {/* Cinematic Calendar */}
                <div className="mb-8 relative group/calendar">
                    {/* Shadow behind selection */}
                    <div className="absolute inset-0 bg-blue-500/5 blur-[40px] rounded-full pointer-events-none opacity-0 group-hover/calendar:opacity-100 transition-opacity" />

                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="p-0 border-none w-full"
                        classNames={{
                            month: "space-y-6 w-full",
                            table: "w-full border-collapse",
                            head_row: "flex mb-4 gap-2 justify-between",
                            head_cell: "text-zinc-600 rounded-md w-10 font-black text-[9px] uppercase tracking-widest text-center",
                            row: "flex w-full mt-2 gap-2 justify-between",
                            cell: "h-10 w-10 text-center text-xs p-0 relative focus-within:z-20",
                            day: cn(
                                "h-10 w-10 p-0 font-bold rounded-[14px] transition-all text-zinc-500 hover:text-white hover:bg-white/5 flex items-center justify-center relative overflow-hidden group/day"
                            ),
                            day_selected: "bg-blue-600 text-white hover:bg-blue-500 focus:bg-blue-600 focus:text-white rounded-[14px] shadow-[0_0_25px_rgba(37,99,235,0.4)] scale-110 z-10",
                            day_today: "text-blue-500 after:absolute after:bottom-1 after:w-1 after:h-0.5 after:bg-blue-500 after:rounded-full",
                            day_disabled: "text-zinc-800 opacity-20 cursor-not-allowed line-through",
                        }}
                    />
                </div>

                {/* Slots Section */}
                <div className="space-y-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                <Clock size={12} className="text-blue-400" />
                            </div>
                            <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Available Slots</h4>
                        </div>
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Select One</span>
                    </div>

                    <div className="relative overflow-hidden group/slots p-1">
                        <div className="grid grid-cols-3 gap-3">
                            <AnimatePresence mode="popLayout">
                                {TIME_SLOTS.map((slot, i) => (
                                    <motion.button
                                        key={slot.id}
                                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        transition={{ delay: i * 0.05, type: "spring", damping: 15 }}
                                        onClick={() => setSelectedSlot(slot.time)}
                                        className={cn(
                                            "relative px-3 py-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 group/slot overflow-hidden",
                                            selectedSlot === slot.time
                                                ? "bg-blue-600 border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.3)] scale-[1.05] z-10"
                                                : "bg-black/40 border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 text-zinc-400"
                                        )}
                                    >
                                        <span className={cn(
                                            "text-[11px] font-black tracking-tighter",
                                            selectedSlot === slot.time ? "text-white" : "text-zinc-200"
                                        )}>{slot.time}</span>
                                        <span className={cn(
                                            "text-[7px] uppercase tracking-[0.2em] font-bold",
                                            selectedSlot === slot.time ? "text-blue-100/70" : "text-zinc-600"
                                        )}>{slot.period}</span>

                                        {/* Selection cursor indicator */}
                                        {selectedSlot === slot.time && (
                                            <motion.div
                                                layoutId="slot-active"
                                                className="absolute inset-x-0 bottom-0 h-0.5 bg-white/40"
                                            />
                                        )}
                                    </motion.button>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Glass Footer */}
            <div className="absolute bottom-0 left-0 w-full p-8 pt-4 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/95 to-transparent z-20">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!selectedDate || !selectedSlot || isConfirming}
                    onClick={handleConfirm}
                    className={cn(
                        "w-full py-5 rounded-[22px] text-[11px] font-black uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-3 shadow-2xl relative overflow-hidden",
                        (!selectedDate || !selectedSlot)
                            ? "bg-zinc-900 text-zinc-700 cursor-not-allowed border border-white/5 opacity-50"
                            : isConfirming
                                ? "bg-blue-700 text-white cursor-wait"
                                : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-[0_0_30px_rgba(37,99,235,0.4)]"
                    )}
                >
                    {isConfirming ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Securing...</span>
                        </>
                    ) : (
                        <>
                            <Check size={18} className={cn(selectedSlot ? "text-white" : "text-zinc-700")} />
                            <span>Confirm Spot</span>
                        </>
                    )}

                    {/* Pulsing glow inside button */}
                    {selectedSlot && !isConfirming && (
                        <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />
                    )}
                </motion.button>
            </div>

            {/* Global style for gradient animation */}
            <style jsx global>{`
                @keyframes gradient-x {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .animate-gradient-x {
                    background-size: 200% 200%;
                    animation: gradient-x 3s linear infinite;
                }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </motion.div>
    );
};
