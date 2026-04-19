"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Calendar as CalIcon,
    Clock,
    ChevronLeft,
    ChevronRight,
    Check,
    Phone,
    MessageSquare,
    Video,
    ShieldCheck,
    ArrowRight,
    Zap,
    Sparkles,
    UserCircle,
    Mail,
    Wallet,
    MapPin,
    ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { format, addDays, isSameDay } from 'date-fns';
import { calculateAvailableSlots, DEFAULT_BOOKING_CONFIG } from '@/lib/booking-engine';

interface SlotPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (slot: { date: Date; time: string; type: string; reason: string; formData?: any }) => void;
    isVerified?: boolean;
}

type Step = 'TYPE' | 'SCHEDULE' | 'INTENT' | 'INTAKE' | 'SUCCESS';

export const SlotPicker: React.FC<SlotPickerProps> = ({ isOpen, onClose, onSelect, isVerified = true }) => {
    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme === 'dark';
    const [isMounted, setIsMounted] = useState(false);
    const [step, setStep] = useState<Step>('TYPE');

    // Selections
    const [bookingType, setBookingType] = useState<'chat' | 'call' | 'meeting' | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [reason, setReason] = useState("");

    // Form Data
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: ""
    });

    // Dates Logic (Respecting Lookahead Limit)
    const dates = useMemo(() => {
        return Array.from({ length: DEFAULT_BOOKING_CONFIG.lookAheadLimit }).map((_, i) => addDays(new Date(), i));
    }, []);

    // Slots Logic (Respecting all rules via booking-engine)
    const availableSlots = useMemo(() => {
        return calculateAvailableSlots(selectedDate, DEFAULT_BOOKING_CONFIG, []);
    }, [selectedDate]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // ⚡ RESET STATE ON RE-OPEN (Fixes the "Dismiss Hub" persistent state)
    useEffect(() => {
        if (isOpen) {
            setStep('TYPE');
            setBookingType(null);
            setSelectedSlot(null);
            setReason("");
            // Optional: Reset form data if needed
            setFormData({
                name: "",
                email: "",
                phone: "",
                address: ""
            });
        }
    }, [isOpen]);

    const handleConfirm = () => {
        if (selectedDate && selectedSlot && bookingType) {
            onSelect({
                date: selectedDate,
                time: selectedSlot,
                type: bookingType,
                reason,
                formData
            });
            setStep('SUCCESS');
        }
    };

    const handleNextFromIntent = () => {
        setStep('INTAKE');
    };

    if (!isMounted || typeof document === 'undefined') return null;

    return ReactDOM.createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={cn(
                            "fixed inset-0 z-[10000] backdrop-blur-[40px] transition-colors duration-500",
                            "bg-white/40 dark:bg-black/95"
                        )}
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 40 }}
                        transition={{ type: "spring", damping: 20, stiffness: 150 }}
                        className="fixed inset-0 flex items-center justify-center z-[10001] p-4 pointer-events-none"
                    >
                        <div className={cn(
                            "backdrop-blur-3xl rounded-[60px] border max-w-lg w-full overflow-hidden flex flex-col relative transition-all duration-500 pointer-events-auto shadow-2xl",
                            "bg-white/80 dark:bg-[#050810]/60 border-black/5 dark:border-blue-500/10 shadow-[0_30px_100px_rgba(0,0,0,0.1)] dark:shadow-[0_0_150px_rgba(37,99,235,0.15)] ring-1 ring-black/5 dark:ring-white/5"
                        )}>
                            <motion.div
                                className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent z-50"
                                animate={{ top: ["0%", "100%", "0%"] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            />

                            <AnimatePresence mode="wait">
                                {step === 'TYPE' && (
                                    <motion.div
                                        key="type"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 1.05 }}
                                        className="p-12 relative z-20"
                                    >
                                        <div className="flex items-center gap-5 mb-10">
                                            <button onClick={onClose} className={cn(
                                                "p-3 rounded-2xl border transition-all",
                                                "bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                                            )}>
                                                <ChevronLeft size={20} />
                                            </button>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <Sparkles size={10} className="text-blue-400" />
                                                    <span className="text-[8px] font-black text-blue-400 uppercase tracking-[0.3em]">Protocol v2.0</span>
                                                </div>
                                                <h3 className={cn(
                                                    "text-2xl font-black uppercase tracking-tighter italic leading-none mt-1 transition-colors",
                                                    "text-[#1d1d1f] dark:text-white"
                                                )}>Define Objective</h3>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            <SelectionCard
                                                icon={MessageSquare}
                                                title="Priority Chat"
                                                desc="I want to book a chat session in my available schedule."
                                                onClick={() => { setBookingType('chat'); setStep('SCHEDULE'); }}
                                                accent="blue"
                                            />
                                            <SelectionCard
                                                icon={Phone}
                                                title="Voice Call"
                                                desc="Schedule a quick voice call for a focused audio discussion."
                                                onClick={() => { setBookingType('call'); setStep('SCHEDULE'); }}
                                                accent="emerald"
                                            />
                                            {/* <SelectionCard
                                                icon={Video}
                                                title="Video Meeting"
                                                desc="Arrange a face-to-face video call for in-depth collaboration."
                                                onClick={() => { setBookingType('meeting'); setStep('SCHEDULE'); }}
                                                accent="indigo"
                                            /> */}
                                        </div>
                                    </motion.div>
                                )}

                                {step === 'SCHEDULE' && (
                                    <motion.div
                                        key="schedule"
                                        initial={{ opacity: 0, x: 50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -50 }}
                                        className="p-8 md:p-12 relative z-20 flex flex-col max-h-[85vh]"
                                    >
                                        <div className="flex items-center gap-5 mb-8 shrink-0">
                                            <button onClick={() => setStep('TYPE')} className={cn(
                                                "p-3 rounded-2xl border transition-all",
                                                isDarkMode ? "bg-white/5 border-white/5 text-zinc-400" : "bg-black/5 border-black/5 text-zinc-600"
                                            )}>
                                                <ChevronLeft size={20} />
                                            </button>
                                            <h3 className={cn(
                                                "text-2xl font-black uppercase tracking-tighter italic transition-colors",
                                                isDarkMode ? "text-white" : "text-[#1d1d1f]"
                                            )}>Temporal Axis</h3>
                                        </div>

                                        <div className="space-y-4 mb-8 shrink-0">
                                            <div className="flex justify-between items-end px-1">
                                                <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.4em]">Chronos Hub</p>
                                                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{format(selectedDate, 'MMM yyyy')}</span>
                                            </div>
                                            <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 px-1">
                                                {dates.map((d, i) => (
                                                    <motion.button
                                                        key={i}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => setSelectedDate(d)}
                                                        className={cn(
                                                            "flex flex-col items-center justify-center min-w-[64px] h-[84px] rounded-[22px] border transition-all relative group/date shrink-0",
                                                            isSameDay(d, selectedDate)
                                                                ? "bg-blue-600 border-blue-400 shadow-[0_0_30px_rgba(37,99,235,0.4)] text-white"
                                                                : isDarkMode
                                                                    ? "bg-white/[0.02] border-white/5 hover:border-white/10 text-white"
                                                                    : "bg-neutral-100 border-black/5 hover:border-black/10 text-[#1d1d1f]"
                                                        )}
                                                    >
                                                        <span className={cn(
                                                            "text-[9px] font-black uppercase tracking-tighter mb-1 transition-all",
                                                            isSameDay(d, selectedDate) ? "opacity-100" : "opacity-40"
                                                        )}>{format(d, 'eee')}</span>
                                                        <span className="text-lg font-black">{format(d, 'dd')}</span>
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4 flex-1 min-h-0 overflow-y-auto no-scrollbar py-1">
                                            <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.4em] sticky top-0 bg-[#050810]/60 backdrop-blur-md py-1 z-10">Available Quantums</p>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                {availableSlots.length > 0 ? availableSlots.map((slot) => (
                                                    <button
                                                        key={slot}
                                                        onClick={() => setSelectedSlot(slot)}
                                                        className={cn(
                                                            "py-4 rounded-xl border text-[11px] font-black tracking-tight transition-all relative overflow-hidden group/slot",
                                                            selectedSlot === slot
                                                                ? "bg-blue-500/10 border-blue-500 text-blue-500"
                                                                : isDarkMode
                                                                    ? "bg-black/40 border-white/5 hover:border-blue-500/30 text-zinc-500"
                                                                    : "bg-white border-black/5 hover:border-blue-500/30 text-zinc-600"
                                                        )}
                                                    >
                                                        {slot}
                                                    </button>
                                                )) : (
                                                    <div className="col-span-full py-10 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
                                                        <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest italic">Temporal Paradox: No Slots Found</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-8 shrink-0">
                                            <button
                                                disabled={!selectedSlot}
                                                onClick={() => setStep('INTENT')}
                                                className={cn(
                                                    "w-full py-5 rounded-[28px] font-black text-xs uppercase tracking-[0.6em] transition-all flex items-center justify-center gap-4 group",
                                                    selectedSlot
                                                        ? "bg-blue-600 text-white shadow-[0_25px_50px_rgba(37,99,235,0.3)]"
                                                        : "bg-zinc-900 text-zinc-700 cursor-not-allowed border border-white/5"
                                                )}
                                            >
                                                Next Phase
                                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 'INTENT' && (
                                    <motion.div
                                        key="intent"
                                        initial={{ opacity: 0, x: 50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -50 }}
                                        className="p-12 relative z-20"
                                    >
                                        <div className="flex items-center gap-5 mb-10">
                                            <button onClick={() => setStep('SCHEDULE')} className={cn(
                                                "p-3 rounded-2xl border transition-all",
                                                isDarkMode ? "bg-white/5 border-white/5 text-zinc-400" : "bg-black/5 border-black/5 text-zinc-600"
                                            )}>
                                                <ChevronLeft size={20} />
                                            </button>
                                            <h3 className={cn(
                                                "text-2xl font-black uppercase tracking-tighter italic transition-colors",
                                                isDarkMode ? "text-white" : "text-[#1d1d1f]"
                                            )}>Protocol Intent</h3>
                                        </div>

                                        <div className="space-y-4">
                                            <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.4em]">Briefing Manifest (Optional)</p>
                                            <textarea
                                                value={reason}
                                                onChange={(e) => setReason(e.target.value)}
                                                placeholder="Briefly state your objective..."
                                                className={cn(
                                                    "w-full border rounded-3xl p-6 text-sm font-semibold outline-none focus:border-blue-500/50 transition-all resize-none",
                                                    isDarkMode
                                                        ? "bg-black/40 border-white/10 text-white placeholder:text-zinc-800"
                                                        : "bg-white border-black/5 text-[#1d1d1f] placeholder:text-zinc-400 shadow-inner"
                                                )}
                                            />
                                        </div>

                                        <button
                                            onClick={handleNextFromIntent}
                                            className="w-full mt-10 py-5 rounded-[28px] bg-blue-600 text-white font-black text-xs uppercase tracking-[0.6em] shadow-[0_25px_50px_rgba(37,99,235,0.3)] flex items-center justify-center gap-4 group"
                                        >
                                            Proceed to Identity
                                            <ArrowRight size={18} />
                                        </button>
                                    </motion.div>
                                )}

                                {step === 'INTAKE' && (
                                    <motion.div
                                        key="intake"
                                        initial={{ opacity: 0, x: 50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -50 }}
                                        className="p-12 relative z-20"
                                    >
                                        <div className="flex items-center justify-between mb-10">
                                            <div className="flex items-center gap-5">
                                                <button onClick={() => setStep('INTENT')} className={cn(
                                                    "p-3 rounded-2xl border transition-all",
                                                    isDarkMode ? "bg-white/5 border-white/5 text-zinc-400" : "bg-black/5 border-black/5 text-zinc-600"
                                                )}>
                                                    <ChevronLeft size={20} />
                                                </button>
                                                <h3 className={cn(
                                                    "text-2xl font-black uppercase tracking-tighter italic leading-none transition-colors",
                                                    isDarkMode ? "text-white" : "text-[#1d1d1f]"
                                                )}>Identification</h3>
                                            </div>
                                            <button className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 px-5 py-2.5 rounded-xl transition-all hover:bg-blue-500/20 active:scale-95 shadow-lg shadow-blue-500/5">
                                                Login
                                            </button>
                                        </div>

                                        <div className="space-y-4 max-h-[350px] overflow-y-auto no-scrollbar px-1">
                                            <div className="relative py-2 flex items-center gap-4 mb-2">
                                                <span className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.4em]">ENTER YOUR DETAILS</span>
                                                <div className="flex-1 h-px bg-white/5" />
                                            </div>

                                            {DEFAULT_BOOKING_CONFIG.intakeFields.name && (
                                                <IntakeField
                                                    icon={UserCircle}
                                                    label="Full Name"
                                                    placeholder="Enter name..."
                                                    value={formData.name}
                                                    onChange={(val: string) => setFormData(p => ({ ...p, name: val }))}
                                                />
                                            )}
                                            {DEFAULT_BOOKING_CONFIG.intakeFields.email && (
                                                <IntakeField
                                                    icon={Mail}
                                                    label="Email Sync"
                                                    placeholder="Enter email..."
                                                    value={formData.email}
                                                    onChange={(val: string) => setFormData(p => ({ ...p, email: val }))}
                                                />
                                            )}
                                            {DEFAULT_BOOKING_CONFIG.intakeFields.phone && (
                                                <IntakeField
                                                    icon={Phone}
                                                    label="Voice Protocol"
                                                    placeholder="Enter number..."
                                                    value={formData.phone}
                                                    onChange={(val: string) => setFormData(p => ({ ...p, phone: val }))}
                                                />
                                            )}
                                            {DEFAULT_BOOKING_CONFIG.intakeFields.address && (
                                                <IntakeField
                                                    icon={MapPin}
                                                    label="Geo Coordinates"
                                                    placeholder="Enter address..."
                                                    value={formData.address}
                                                    onChange={(val: string) => setFormData(p => ({ ...p, address: val }))}
                                                />
                                            )}
                                        </div>

                                        <button
                                            onClick={handleConfirm}
                                            className="w-full mt-12 py-6 rounded-[32px] bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-[0_25px_60px_rgba(37,99,235,0.4)] font-black text-xs uppercase tracking-[0.6em] transition-all flex items-center justify-center gap-4 relative overflow-hidden group"
                                        >
                                            <Zap size={20} className="fill-white" />
                                            Establish Secure Uplink
                                            <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />
                                        </button>
                                    </motion.div>
                                )}

                                {step === 'SUCCESS' && (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="p-12 text-center py-24"
                                    >
                                        <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center shadow-3xl border-4 border-white/10 mx-auto mb-12 relative">
                                            <div className="absolute inset-0 bg-blue-500 rounded-full blur-[60px] opacity-30" />
                                            <ShieldCheck size={60} className="text-white relative z-10" />
                                        </div>
                                        <h3 className={cn(
                                            "text-4xl font-black uppercase tracking-tighter mb-4 italic transition-colors",
                                            isDarkMode ? "text-white" : "text-[#1d1d1f]"
                                        )}>Protocol Secured</h3>
                                        <p className="text-zinc-500 text-sm font-bold uppercase tracking-[0.2em] mb-16">Uplink sequence initialized.</p>
                                        <button
                                            onClick={onClose}
                                            className="px-16 py-5 border-2 border-white/5 rounded-[24px] text-[10px] font-black uppercase tracking-[0.6em] text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
                                        >
                                            Dismiss Hub
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </>
            )
            }
        </AnimatePresence >,
        document.body
    );
};

const SelectionCard = ({ icon: Icon, title, desc, onClick, accent }: any) => (
    <motion.button
        whileHover={{ x: 8 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={cn(
            "w-full flex items-center gap-7 p-6 rounded-[32px] border transition-all group backdrop-blur-md relative overflow-hidden",
            "bg-neutral-100 dark:bg-white/[0.02] border-black/5 dark:border-white/5 hover:bg-neutral-50 dark:hover:bg-transparent shadow-sm dark:shadow-none",
            accent === 'blue' ? "hover:border-blue-500/40 hover:bg-blue-500/[0.03]" : (accent === 'emerald' ? "hover:border-emerald-500/40 hover:bg-emerald-500/[0.03]" : "hover:border-indigo-500/40 hover:bg-indigo-500/[0.03]")
        )}
    >
        <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-700 group-hover:rotate-[15deg] group-hover:scale-110 shadow-2xl relative z-10",
            accent === 'blue' ? 'bg-blue-600' : (accent === 'emerald' ? 'bg-emerald-600' : 'bg-indigo-600')
        )}>
            <Icon size={28} className="text-white" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col items-start text-left relative z-10 flex-1">
            <span className={cn(
                "text-xl font-black uppercase tracking-tight italic leading-none mb-1.5 transition-colors",
                "text-[#1d1d1f] dark:text-white"
            )}>{title}</span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed max-w-[220px]">{desc}</span>
        </div>
        <ArrowRight size={20} className="ml-auto text-zinc-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-4 transition-all" />
    </motion.button>
);

const IntakeField = ({ icon: Icon, label, placeholder, value, onChange }: any) => (
    <div className="space-y-2">
        <label className="text-[9px] font-black text-blue-500 uppercase tracking-[0.4em] ml-2 text-left block">{label}</label>
        <div className="relative group">
            <div className={cn(
                "absolute left-6 top-1/2 -translate-y-1/2 transition-colors",
                "text-zinc-400 dark:text-zinc-600 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-500"
            )}>
                <Icon size={18} />
            </div>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={cn(
                    "w-full border rounded-[28px] py-5 pl-16 pr-8 text-sm font-semibold outline-none focus:border-blue-500/50 transition-all",
                    "bg-white dark:bg-black/40 border-black/5 dark:border-white/10 text-[#1d1d1f] dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-800 shadow-inner"
                )}
            />
        </div>
    </div>
);
