"use client";

import React, { useState, useMemo } from 'react';
// Build sync v3.0 - ensure watcher picks up SlotPicker correctly
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    ArrowLeft,
    Clock,
    Calendar,
    Settings2,
    Check,
    Plus,
    Trash2,
    CalendarCheck2,
    MonitorPlay,
    Timer,
    Zap,
    Copy,
    ChevronRight,
    Search,
    ShieldAlert,
    UserPlus,
    LayoutGrid,
    Coffee,
    MapPin,
    Phone,
    Mail,
    User,
    ChevronDown,
    CalendarDays
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { DEFAULT_BOOKING_CONFIG, BookingConfig, DayConfig, BreakRange } from '@/lib/booking-engine';
import { format, isSameDay } from 'date-fns';
import { DateRange } from "react-day-picker";

interface BookingSettingsSlideoverProps {
    isOpen: boolean;
    onClose: () => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const BookingSettingsSlideover: React.FC<BookingSettingsSlideoverProps> = ({ isOpen, onClose }) => {
    const [config, setConfig] = useState<BookingConfig>(DEFAULT_BOOKING_CONFIG);
    const [activeTab, setActiveTab] = useState("availability");
    const [isAddingBreak, setIsAddingBreak] = useState(false);

    // --- Tab 1: Availability Handlers ---
    const updateTimeRange = (day: string, values: number[]) => {
        const start = `${String(Math.floor(values[0])).padStart(2, '0')}:${String(Math.round((values[0] % 1) * 60)).padStart(2, '0')}`;
        const end = `${String(Math.floor(values[1])).padStart(2, '0')}:${String(Math.round((values[1] % 1) * 60)).padStart(2, '0')}`;

        setConfig((prev: BookingConfig) => ({
            ...prev,
            weeklyHours: {
                ...prev.weeklyHours,
                [day]: { ...prev.weeklyHours[day], start, end }
            }
        }));
    };

    const toggleDay = (day: string) => {
        setConfig((prev: BookingConfig) => ({
            ...prev,
            weeklyHours: {
                ...prev.weeklyHours,
                [day]: { ...prev.weeklyHours[day], enabled: !prev.weeklyHours[day].enabled }
            }
        }));
    };

    const cloneMondayToAll = () => {
        const monday = config.weeklyHours['Monday'];
        setConfig((prev: BookingConfig) => ({
            ...prev,
            weeklyHours: DAYS.reduce((acc, day) => ({
                ...acc,
                [day]: { ...monday }
            }), {})
        }));
        toast.success("Clone Protocol Executed: All days synced with Monday! 🧬", {
            icon: <Zap className="text-blue-500" />,
            style: { background: '#0a0f18', color: '#fff', border: '1px solid #1e293b' }
        });
    };

    const timeToValue = (time: string) => {
        if (!time) return 0;
        const [h, m] = time.split(':').map(Number);
        return h + m / 60;
    };

    // --- Tab 2: Exceptions (Range Mode) Handlers ---
    const [range, setRange] = useState<DateRange | undefined>({
        from: new Date(),
        to: undefined
    });

    const [rangeLabel, setRangeLabel] = useState("Seasonal Break");

    const addExceptionRange = () => {
        if (!range?.from || !range?.to) {
            toast.error("Vortex Error: Please select both Start and End dates on the map.");
            return;
        }

        const newBreak: BreakRange = {
            id: Math.random().toString(36).substr(2, 9),
            start: range.from,
            end: range.to,
            label: rangeLabel
        };

        setConfig((prev: BookingConfig) => ({
            ...prev,
            breakRanges: [...prev.breakRanges, newBreak]
        }));

        setRange({ from: new Date(), to: undefined });
        setIsAddingBreak(false);
        toast.success(`Temporal Bridge established: ${rangeLabel} active! 🛸`);
    };

    const removeBreak = (id: string) => {
        setConfig((prev: BookingConfig) => ({
            ...prev,
            breakRanges: prev.breakRanges.filter(b => b.id !== id)
        }));
    };

    // --- Tab 3: Logic & Intake Handlers ---
    const toggleIntakeField = (field: keyof BookingConfig['intakeFields']) => {
        setConfig((prev: BookingConfig) => ({
            ...prev,
            intakeFields: {
                ...prev.intakeFields,
                [field]: !prev.intakeFields[field]
            }
        }));
    };

    const handleSave = () => {
        toast.success("Matrix Updated: Configuration established. ⚡");
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] overflow-hidden pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl pointer-events-auto"
                    />

                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
                        className="absolute right-0 top-0 bottom-0 w-full max-w-[550px] bg-[#050810] border-l border-white/10 flex flex-col pointer-events-auto shadow-2xl overflow-hidden"
                    >
                        {/* Background Visuals */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 blur-[120px] rounded-full" />
                        </div>

                        {/* 🛸 CINEMATIC HEADER */}
                        <div className="relative pt-10 pb-6 px-8 z-20">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <motion.button
                                        whileHover={{ scale: 1.1, x: -4 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={onClose}
                                        className="p-3 bg-white/5 border border-white/5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all"
                                    >
                                        <ArrowLeft size={22} />
                                    </motion.button>
                                    <div className="flex flex-col">
                                        <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-2">
                                            Chronos Engine
                                            <span className="text-blue-500">v2</span>
                                        </h2>
                                        <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.4em]">Business Availability Matrix</p>
                                    </div>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-blue-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
                                    <div className="relative w-14 h-14 rounded-2xl bg-[#0a0f18] border border-blue-500/30 flex items-center justify-center">
                                        <CalendarCheck2 className="text-blue-500" size={28} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 🗂️ TABS NAVIGATION */}
                        <Tabs defaultValue="availability" className="flex-1 flex flex-col min-h-0" onValueChange={setActiveTab}>
                            <div className="px-8 mt-4 mb-6 shrink-0">
                                <TabsList className="w-full bg-white/[0.03] border border-white/5 p-1 h-14 rounded-2xl">
                                    <TabsTrigger value="availability" className="flex-1 h-full rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                        <Clock size={14} /> Availability
                                    </TabsTrigger>
                                    <TabsTrigger value="overrides" className="flex-1 h-full rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                        <CalendarDays size={14} /> Exceptions
                                    </TabsTrigger>
                                    <TabsTrigger value="logic" className="flex-1 h-full rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                        <ShieldAlert size={14} /> Logic
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            {/* TAB 1: VISUAL TIME ENGINE */}
                            <TabsContent value="availability" className="flex-1 overflow-y-auto no-scrollbar px-8 pb-40 space-y-8 mt-0 outline-none">
                                <div className="flex items-center justify-between mb-4">
                                    <SectionHeader title="Weekly Schedule" icon={Calendar} />
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={cloneMondayToAll}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[9px] font-black text-blue-400 uppercase tracking-widest hover:bg-blue-500/20 transition-all"
                                    >
                                        <Copy size={12} /> Clone Monday
                                    </motion.button>
                                </div>

                                <div className="space-y-4">
                                    {DAYS.map((day) => (
                                        <DayTimelineCard
                                            key={day}
                                            day={day}
                                            enabled={config.weeklyHours[day].enabled}
                                            start={config.weeklyHours[day].start}
                                            end={config.weeklyHours[day].end}
                                            onToggle={() => toggleDay(day)}
                                            onRangeChange={(vals: number[]) => updateTimeRange(day, vals)}
                                            timeToValue={timeToValue}
                                        />
                                    ))}
                                </div>
                            </TabsContent>

                            {/* TAB 2: EXCEPTIONS (Unified Range Selector) */}
                            <TabsContent value="overrides" className="flex-1 overflow-y-auto no-scrollbar px-8 pb-40 space-y-8 mt-0 outline-none">
                                <div className="space-y-10">
                                    <section className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <SectionHeader title="Temporal Barriers" icon={Zap} />
                                            {!isAddingBreak && (
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => setIsAddingBreak(true)}
                                                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 rounded-xl text-[9px] font-black text-white uppercase tracking-widest shadow-lg shadow-blue-600/20"
                                                >
                                                    <Plus size={14} /> Add Break Protocol
                                                </motion.button>
                                            )}
                                        </div>

                                        <AnimatePresence>
                                            {isAddingBreak && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-8 flex flex-col items-center shadow-2xl relative mb-10">
                                                        <button
                                                            onClick={() => setIsAddingBreak(false)}
                                                            className="absolute top-6 right-6 p-2 text-zinc-600 hover:text-white transition-colors"
                                                        >
                                                            <X size={16} />
                                                        </button>

                                                        <ShadcnCalendar
                                                            mode="range"
                                                            selected={range}
                                                            onSelect={setRange}
                                                            className="p-0 border-none scale-105 mb-6"
                                                            classNames={{
                                                                day_range_middle: "bg-blue-500/20 text-blue-200",
                                                                day_range_start: "bg-blue-600 text-white rounded-l-xl",
                                                                day_range_end: "bg-blue-600 text-white rounded-r-xl",
                                                                day_selected: "bg-blue-600 text-white hover:bg-blue-500 focus:bg-blue-600 focus:text-white rounded-xl shadow-lg shadow-blue-500/30",
                                                                day_today: "text-blue-500 border border-blue-500/20",
                                                                day: "rounded-lg"
                                                            }}
                                                        />

                                                        <div className="w-full mt-4 p-6 bg-black/40 border border-white/10 rounded-3xl space-y-6">
                                                            <div className="space-y-3">
                                                                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em] ml-2">Break Title</label>
                                                                <input
                                                                    type="text"
                                                                    value={rangeLabel}
                                                                    onChange={(e) => setRangeLabel(e.target.value)}
                                                                    placeholder="e.g. Annual Vacation"
                                                                    className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-5 py-4 text-[11px] font-bold text-white outline-none focus:border-blue-500/30"
                                                                />
                                                            </div>

                                                            <Button
                                                                onClick={addExceptionRange}
                                                                disabled={!range?.from || !range?.to}
                                                                className="w-full py-7 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-[0.4em] shadow-xl shadow-blue-600/20 transition-all disabled:opacity-30"
                                                            >
                                                                Lock Temporal Range
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <div className="space-y-4">
                                            {config.breakRanges.length > 0 ? config.breakRanges.map(br => (
                                                <motion.div
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    key={br.id}
                                                    className="flex items-center justify-between p-5 bg-white/[0.03] border border-white/5 rounded-3xl group/br hover:border-blue-500/20 transition-all"
                                                >
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-blue-500/50">
                                                            <Coffee size={20} />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-black text-white uppercase tracking-tight italic">{br.label}</span>
                                                            <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">
                                                                {format(new Date(br.start), 'MMM d')} — {format(new Date(br.end), 'MMM d')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => removeBreak(br.id)}
                                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-700 hover:text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover/br:opacity-100 transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </motion.div>
                                            )) : (
                                                <div className="py-12 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-[40px]">
                                                    <p className="text-[10px] font-black text-zinc-800 uppercase tracking-[0.4em] italic text-balance">Negative Space: No barriers established.</p>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                </div>
                            </TabsContent>

                            {/* TAB 3: ENGINE LOGIC */}
                            <TabsContent value="logic" className="flex-1 overflow-y-auto no-scrollbar px-8 pb-40 space-y-12 mt-0 outline-none">
                                <div className="space-y-6">
                                    <SectionHeader title="Booking Strategy" icon={ShieldAlert} />
                                    <div className="grid grid-cols-1 gap-4">
                                        <LogicSettingRow
                                            label="Advance Notice"
                                            desc="Minimum time required before a booking can be scheduled"
                                            value={`${config.minNoticePeriod} hrs`}
                                            onPlus={() => setConfig((prev: BookingConfig) => ({ ...prev, minNoticePeriod: prev.minNoticePeriod + 0.5 }))}
                                            onMinus={() => setConfig((prev: BookingConfig) => ({ ...prev, minNoticePeriod: Math.max(0, prev.minNoticePeriod - 0.5) }))}
                                        />
                                        <LogicSettingRow
                                            label="Booking Window"
                                            desc="How far into the future users can see availability"
                                            value={`${config.lookAheadLimit} days`}
                                            onPlus={() => setConfig((prev: BookingConfig) => ({ ...prev, lookAheadLimit: prev.lookAheadLimit + 1 }))}
                                            onMinus={() => setConfig((prev: BookingConfig) => ({ ...prev, lookAheadLimit: Math.max(1, prev.lookAheadLimit - 1) }))}
                                        />
                                        <LogicSettingRow
                                            label="Seat Capacity"
                                            desc="Maximum number of simultaneous bookings per slot"
                                            value={`${config.seatCapacity} unit`}
                                            onPlus={() => setConfig((prev: BookingConfig) => ({ ...prev, seatCapacity: prev.seatCapacity + 1 }))}
                                            onMinus={() => setConfig((prev: BookingConfig) => ({ ...prev, seatCapacity: Math.max(1, prev.seatCapacity - 1) }))}
                                        />
                                        <LogicSettingRow
                                            label="Buffer Time"
                                            desc="Required recovery period between consecutive meetings"
                                            value={`${config.bufferTime} min`}
                                            onPlus={() => setConfig((prev: BookingConfig) => ({ ...prev, bufferTime: prev.bufferTime + 5 }))}
                                            onMinus={() => setConfig((prev: BookingConfig) => ({ ...prev, bufferTime: Math.max(0, prev.bufferTime - 5) }))}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <SectionHeader title="Identity Manifest" icon={UserPlus} />
                                    <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.2em] px-2 italic">Define the mandatory data requirements for user verification.</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <IntakeFieldCheckbox
                                            icon={User}
                                            label="Full Name"
                                            checked={config.intakeFields.name}
                                            onToggle={() => toggleIntakeField('name')}
                                            accent="blue"
                                        />
                                        <IntakeFieldCheckbox
                                            icon={Mail}
                                            label="Email Sync"
                                            checked={config.intakeFields.email}
                                            onToggle={() => toggleIntakeField('email')}
                                            accent="indigo"
                                        />
                                        <IntakeFieldCheckbox
                                            icon={Phone}
                                            label="Voice ID"
                                            checked={config.intakeFields.phone}
                                            onToggle={() => toggleIntakeField('phone')}
                                            accent="emerald"
                                        />
                                        <IntakeFieldCheckbox
                                            icon={MapPin}
                                            label="Geo-Address"
                                            checked={config.intakeFields.address}
                                            onToggle={() => toggleIntakeField('address')}
                                            accent="rose"
                                        />
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                        {/* 💾 COMPACT FULL-WIDTH FOOTER */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 pt-3 border-t border-white/5 bg-[#050810]/95 backdrop-blur-3xl z-[100] flex flex-col gap-3">
                            <motion.button
                                whileHover={{ scale: 1.01, y: -1 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={handleSave}
                                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-[0.5em] transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 relative overflow-hidden group"
                            >
                                <Check size={16} className="group-hover:scale-110 transition-transform" />
                                Save Protocol
                                <div className="absolute inset-0 bg-white/5 animate-pulse pointer-events-none" />
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// ... (Sub-components: IntakeFieldCheckbox, SectionHeader, DayTimelineCard, LogicSettingRow)
// Re-added for completeness in restoration

const IntakeFieldCheckbox = ({ icon: Icon, label, checked, onToggle, accent }: any) => {
    const accentColors: Record<string, string> = {
        blue: "text-blue-400",
        indigo: "text-indigo-400",
        emerald: "text-emerald-400",
        rose: "text-rose-400"
    };

    return (
        <button
            onClick={onToggle}
            className={cn(
                "flex items-center gap-3 p-4 rounded-2xl border transition-all text-left group",
                checked
                    ? "bg-white/[0.04] border-white/20 shadow-lg"
                    : "bg-transparent border-white/5 grayscale"
            )}
        >
            <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center border transition-all",
                checked ? `bg-white/10 border-white/20 ${accentColors[accent]}` : "bg-zinc-900 border-white/5 text-zinc-600"
            )}>
                <Icon size={14} />
            </div>
            <div className="flex flex-col">
                <span className={cn("text-[10px] font-black uppercase tracking-widest", checked ? "text-white" : "text-zinc-700")}>{label}</span>
                <span className="text-[8px] font-bold text-zinc-600 uppercase transition-opacity">{checked ? 'ENABLED' : 'DISABLED'}</span>
            </div>
            <div className={cn(
                "ml-auto w-4 h-4 rounded-md border flex items-center justify-center transition-all",
                checked ? "bg-blue-600 border-blue-500" : "bg-transparent border-white/10"
            )}>
                {checked && <Check size={10} className="text-white" />}
            </div>
        </button>
    );
};

const SectionHeader = ({ title, icon: Icon }: { title: string, icon: any }) => (
    <div className="flex items-center gap-3 border-b border-white/5 pb-4 shrink-0">
        <div className="p-2.5 bg-blue-600/10 rounded-xl border border-blue-600/20">
            <Icon size={16} className="text-blue-500" />
        </div>
        <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] italic">{title}</h3>
    </div>
);

const DayTimelineCard = ({ day, enabled, start, end, onToggle, onRangeChange, timeToValue }: any) => {
    const valStart = timeToValue(start);
    const valEnd = timeToValue(end);

    return (
        <div className={cn(
            "p-6 rounded-3xl border transition-all duration-500 flex flex-col gap-6",
            enabled
                ? "bg-white/[0.02] border-blue-500/20 shadow-lg shadow-blue-500/5"
                : "bg-black/20 border-white/5 opacity-50 grayscale"
        )}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Switch checked={enabled} onCheckedChange={onToggle} className="data-[state=checked]:bg-blue-600" />
                    <span className="text-xs font-black text-white uppercase tracking-[0.2em]">{day}</span>
                </div>
                {enabled && (
                    <div className="px-3 py-1.5 bg-[#0a0f18] border border-blue-500/30 rounded-xl">
                        <span className="text-[10px] font-black text-blue-400 tracking-tighter">{start} — {end}</span>
                    </div>
                )}
            </div>

            {enabled && (
                <div className="px-2 pt-2">
                    <Slider
                        defaultValue={[valStart, valEnd]}
                        max={24}
                        step={0.25}
                        onValueChange={(vals: number[]) => onRangeChange(vals)}
                        className="py-4"
                    />
                </div>
            )}
        </div>
    );
};

const LogicSettingRow = ({ label, desc, value, onPlus, onMinus }: any) => (
    <div className="p-4  rounded-3xl bg-white/[0.02] border border-white/10 flex items-center gap-2 justify-between group hover:border-blue-500/20 transition-colors">
        <div className="flex flex-col gap-1">
            <span className="text-[13px] font-black text-white uppercase tracking-wider italic">{label}</span>
            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{desc}</span>
        </div>
        <div className="flex items-center gap-4 bg-black/40 p-1 rounded-2xl border border-white/10">
            <button onClick={onMinus} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all text-lg font-black">-</button>
            <span className="text-xs font-black text-blue-400 min-w-[50px] text-center">{value}</span>
            <button onClick={onPlus} className="w-8 h-8 rounded-xl bg-blue-600/20 hover:bg-blue-600 flex items-center justify-center text-blue-400 hover:text-white transition-all shadow-lg shadow-blue-600/10"><Plus size={14} /></button>
        </div>
    </div>
);
