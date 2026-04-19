import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, isAfter } from 'date-fns';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InteractionHistoryProps {
    onNavigateToChat?: (date: Date) => void;
}

export const InteractionHistory: React.FC<InteractionHistoryProps> = ({ onNavigateToChat }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [direction, setDirection] = useState(0);

    const today = new Date();
    const isTodayMonth = isSameMonth(currentMonth, today);
    const canGoNext = !isTodayMonth && !isAfter(currentMonth, today);

    // Generate Mock Activity Data for the current month
    const mockActivity = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        return eachDayOfInterval({ start: monthStart, end: monthEnd }).map(date => ({
            date,
            count: Math.floor(Math.random() * 20),
            intensity: Math.random() > 0.8 ? 'high' : (Math.random() > 0.4 ? 'med' : 'low')
        }));
    }, [currentMonth]);

    const handlePrevMonth = () => {
        setDirection(-1);
        setCurrentMonth(subMonths(currentMonth, 1));
    };

    const handleNextMonth = () => {
        if (!canGoNext) return;
        setDirection(1);
        setCurrentMonth(addMonths(currentMonth, 1));
    };

    // Calendar Grid Days
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);
        return eachDayOfInterval({ start: startDate, end: endDate });
    }, [currentMonth]);

    // Swipe Variants
    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0,
            scale: 0.98
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 300 : -300,
            opacity: 0,
            scale: 0.98
        })
    };

    return (
        <div className="flex flex-col gap-6 w-full max-w-screen-md mx-auto">
            <SectionHeader title="Chating Times Machine" icon={Clock} />

            <div className="bg-zinc-900/40 dark:bg-black/20 border border-zinc-800/50 rounded-[2rem] p-4 relative overflow-hidden transition-all min-h-[350px]">

                {/* 🛠️ Compact Navigation Header */}
                <div className="flex justify-between items-center mb-5">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                            <button
                                onClick={handlePrevMonth}
                                className="p-1.5 rounded-lg text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/5 transition-all"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                onClick={handleNextMonth}
                                disabled={!canGoNext}
                                className={cn(
                                    "p-1.5 rounded-lg transition-all",
                                    canGoNext ? "text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/5" : "text-zinc-800 cursor-not-allowed"
                                )}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>

                        <div className="flex gap-2 justify-center items-center">
                            <h3 className="text-lg font-black text-white tracking-[0.1em] uppercase leading-none">
                                {format(currentMonth, 'MMMM')}
                            </h3>
                            <span className="text-md font-black text-emerald-500 uppercase tracking-[0.1em]">
                                {format(currentMonth, 'yyyy')}
                            </span>
                        </div>
                    </div>

                    <div className="hidden sm:flex gap-2.5">
                        <LegendBox intensity="high" label="Peak" />
                        <LegendBox intensity="med" label="Active" />
                        <LegendBox intensity="low" label="Idle" />
                    </div>
                </div>

                {/* 📅 Grid Layout with Swipe Logic */}
                <div className="w-full relative min-h-[250px]">
                    {/* Week Row - Cleaned up and clearly separated */}
                    <div className="grid grid-cols-7 mb-3">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-center text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">
                                {day}
                            </div>
                        ))}
                    </div>

                    <AnimatePresence initial={false} custom={direction} mode="popLayout">
                        <motion.div
                            key={currentMonth.toISOString()}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 400, damping: 40 },
                                opacity: { duration: 0.15 }
                            }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.3}
                            onDragEnd={(_, info) => {
                                if (info.offset.x > 80) handlePrevMonth();
                                else if (info.offset.x < -80 && canGoNext) handleNextMonth();
                            }}
                            className="grid grid-cols-7 gap-1 md:gap-2 w-full select-none place-items-center"
                        >
                            {calendarDays.map((date, i) => {
                                const activity = mockActivity.find(d => isSameDay(d.date, date));
                                const intensity = activity?.intensity || 'none';
                                const isMonthBound = isSameMonth(date, currentMonth);

                                return (
                                    <DateCard
                                        key={i}
                                        date={date}
                                        intensity={intensity}
                                        count={activity?.count || 0}
                                        isCurrentMonth={isMonthBound}
                                        onClick={() => isMonthBound && onNavigateToChat?.(date)}
                                    />
                                );
                            })}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer Insight */}
                <div className="mt-8 flex justify-center border-t border-white/5 pt-6">
                    <p className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.5em]">
                        Swipe to navigate past chat activity
                    </p>
                </div>
            </div>
        </div>
    );
};

const DateCard = ({ date, intensity, count, isCurrentMonth, onClick }: any) => {
    const isToday = isSameDay(date, new Date());

    return (
        <motion.button
            whileHover={isCurrentMonth ? { boxShadow: "0 0 15px rgba(16,185,129,0.4)", zIndex: 10 } : {}}
            whileTap={isCurrentMonth ? { scale: 0.95 } : {}}
            onClick={onClick}
            disabled={!isCurrentMonth}
            className={cn(
                "w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center transition-all duration-300 relative group border outline-none",
                !isCurrentMonth ? "opacity-0 pointer-events-none" : "cursor-pointer",
                intensity === 'high' ? "bg-emerald-500 border-emerald-400 text-black" :
                    intensity === 'med' ? "bg-emerald-500/20 border-emerald-500/10 text-white hover:bg-emerald-500/30" :
                        "bg-zinc-900 border-white/5 text-zinc-500 hover:border-white/10 hover:text-white",
                isToday && isCurrentMonth && "ring-1 ring-blue-500 ring-offset-1 ring-offset-black"
            )}
        >
            <motion.span
                variants={{
                    hover: { scale: 1.25, x: 1, y: -0.5 }
                }}
                whileHover="hover"
                className="text-[11px] md:text-[13px] font-black italic tracking-tighter"
            >
                {format(date, 'd')}
            </motion.span>

            {/* Micro Activity Tip */}
            {isCurrentMonth && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-[9px] font-black px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 whitespace-nowrap z-50 pointer-events-none shadow-2xl">
                    {count} Msgs
                </div>
            )}
        </motion.button>
    );
};

const SectionHeader = ({ title, icon: Icon }: any) => (
    <div className="flex items-center gap-4 opacity-80 mt-12 mb-6 px-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
        <span className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.4em] flex items-center gap-3 italic">
            <Icon size={14} className="text-zinc-600" /> {title}
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
    </div>
);

const LegendBox = ({ intensity, label }: any) => (
    <div className="flex items-center gap-2">
        <div className={cn(
            "w-3 h-3 rounded-md border",
            intensity === 'high' ? 'bg-emerald-500 border-emerald-400' :
                (intensity === 'med' ? 'bg-emerald-500/20 border-emerald-500/10' : 'bg-zinc-900 border-white/5')
        )} />
        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{label}</span>
    </div>
);
