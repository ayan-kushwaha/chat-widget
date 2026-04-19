
import React, { useState, useEffect } from 'react';
import { Search, X as CloseIcon, Calendar as CalendarIcon, ListFilter, Check, Archive, Users, Bot, Ban, Sparkles, History, HelpCircle, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { cn } from '@/lib/utils';

import { Group } from '@/services/group.service';

interface SidebarSearchProps {
    localQuery: string;
    setLocalQuery: (query: string) => void;
    onSearchChange: (query: string) => void;
    placeholderIndex: number;
    PLACEHOLDERS: string[];
    dateRange?: DateRange;
    onDateRangeChange?: (range: DateRange | undefined) => void;
    bookedDates: Date[];
    activeFilter: string;
    onFilterChange: (filter: string) => void;
    groups?: Group[];
    onManageGroups?: () => void;
}

export const SidebarSearch: React.FC<SidebarSearchProps> = ({
    localQuery,
    setLocalQuery,
    onSearchChange,
    placeholderIndex,
    PLACEHOLDERS,
    dateRange,
    onDateRangeChange,
    bookedDates,
    activeFilter,
    onFilterChange,
    groups = [],
    onManageGroups
}) => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    return (
        <div className="relative mx-2 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 group-focus-within:text-emerald-500 transition-colors z-30 pointer-events-none" size={18} />
            <div className="relative w-full">
                <input
                    type="text"
                    value={localQuery}
                    onChange={(e) => setLocalQuery(e.target.value)}
                    className="w-full pl-10 pr-24 py-2 bg-neutral-100 dark:bg-zinc-900 border-none rounded-xl text-sm font-medium text-zinc-900 dark:text-white focus:ring-1 focus:ring-emerald-500/50 transition-all outline-none z-0 relative bg-transparent placeholder:text-transparent"
                />

                {/* 🎬 Animated Placeholder */}
                <AnimatePresence mode="wait">
                    {localQuery.length === 0 && (
                        <motion.span
                            key={placeholderIndex}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.3 }}
                            className="absolute left-10 inset-y-0 flex items-center text-sm font-medium text-zinc-400 dark:text-zinc-500 pointer-events-none truncate pr-24 w-full"
                        >
                            {PLACEHOLDERS[placeholderIndex]}
                        </motion.span>
                    )}
                </AnimatePresence>

                {/* 🔘 ACTION GROUP (Clear + Calendar + Filter) */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 z-30">
                    {localQuery && (
                        <button
                            onClick={() => {
                                setLocalQuery('');
                                if (onSearchChange) onSearchChange('');
                            }}
                            className="p-1.5 text-zinc-400 hover:text-emerald-500 transition-colors rounded-lg"
                            title="Clear search"
                        >
                            <CloseIcon size={16} />
                        </button>
                    )}

                    {dateRange?.from && (
                        <button
                            onClick={() => onDateRangeChange?.(undefined)}
                            className="p-1.5 text-zinc-500 hover:text-red-500 rounded-lg transition-all"
                            title="Reset date filter"
                        >
                            <CloseIcon size={14} />
                        </button>
                    )}

                    {/* 🆕 Advanced Filter Button */}
                    <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                        <PopoverTrigger asChild>
                            <button
                                className={cn(
                                    "p-1.5 rounded-lg transition-all",
                                    (activeFilter !== 'All' && activeFilter !== 'Online' && activeFilter !== 'Favourites')
                                        ? "text-emerald-500 bg-emerald-500/10"
                                        : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                                )}
                            >
                                <ListFilter size={16} />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-56 bg-zinc-900 border border-white/10 p-1 shadow-2xl">
                            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-2 py-1 mb-1">
                                Advanced Filters
                            </div>
                            <div className="space-y-1">
                                {[
                                    { label: "Unread", icon: MessageSquare },
                                    { label: "Archive", icon: Archive },
                                    { label: "Groups", icon: Users },
                                    { label: "Assistants", icon: Bot },
                                    { label: "Blocked", icon: Ban },
                                    { label: "New User", icon: Sparkles },
                                    { label: "Old User", icon: History },
                                    { label: "Unknown User", icon: HelpCircle }
                                ].map(({ label, icon: Icon }) => (
                                    <button
                                        key={label}
                                        onClick={() => {
                                            onFilterChange(label);
                                            setIsFilterOpen(false);
                                        }}
                                        className={cn(
                                            "w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors flex items-center justify-between group",
                                            activeFilter === label
                                                ? "bg-emerald-500/10 text-emerald-500 font-bold"
                                                : "text-zinc-300 hover:bg-white/5"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Icon size={14} className={cn(
                                                "opacity-70 group-hover:opacity-100 transition-opacity",
                                                activeFilter === label ? "text-emerald-500" : "text-zinc-500"
                                            )} />
                                            <span>{label}</span>
                                        </div>
                                        {activeFilter === label && <Check size={14} />}
                                    </button>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* 🗓️ Calendar Popover */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <button
                                className={cn(
                                    "p-1.5 transition-colors rounded-lg",
                                    dateRange?.from
                                        ? "text-emerald-500 bg-emerald-500/10"
                                        : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                                )}
                            >
                                <CalendarIcon size={16} />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-neutral-900 border-zinc-800" align="end">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={onDateRangeChange}
                                numberOfMonths={1}
                                modifiers={{
                                    booked: bookedDates
                                }}
                                modifiersStyles={{
                                    booked: {
                                        fontWeight: '900',
                                        color: '#10b981', // Emerald 500
                                        position: 'relative'
                                    }
                                }}
                            />
                            <div className="p-3 border-t border-white/10 bg-black/20 text-xs text-center text-zinc-500">
                                🟢 Bold dates have chat history
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        </div>
    );
};
