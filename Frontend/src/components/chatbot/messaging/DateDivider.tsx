"use client";

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as DatePickerCalendar } from "@/components/ui/calendar";

interface DateDividerProps {
    date: Date;
    onJumpToDate?: (date: Date) => void;
    bookedDates?: Date[];
}

export const DateDivider: React.FC<DateDividerProps> = ({ date: rawDate, onJumpToDate, bookedDates }) => {
    // 🛡️ FIX: Validate date to prevent crash
    const date = new Date(rawDate);

    // 🛡️ Check if date is valid
    if (isNaN(date.getTime())) {
        console.warn('⚠️ [DateDivider] Invalid date received:', rawDate);
        return null; // Skip rendering if date is invalid
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    let label = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
    if (isToday) label = 'Today';
    else if (isYesterday) label = 'Yesterday';

    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (selectedDate: Date | undefined) => {
        if (selectedDate && onJumpToDate) {
            onJumpToDate(selectedDate);
            setIsOpen(false);
        }
    };

    return (
        <div
            className="flex justify-center py-4 sticky top-0 z-30 pointer-events-none transition-all duration-300 w-full"
            style={{ top: 'calc(0rem + var(--pinned-offset, 0px))' }}
        >
            <div className="pointer-events-auto">
                <Popover open={isOpen} onOpenChange={setIsOpen}>
                    <PopoverTrigger asChild>
                        <span
                            className="px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] shadow-xl border cursor-pointer transition-all flex items-center gap-2 select-none bg-white dark:bg-[#0f1115] hover:bg-neutral-50 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-500 border-black/5 dark:border-white/5 hover:border-emerald-500/30"
                        >
                            {label}
                            <ChevronDown size={10} className="transition-colors text-zinc-400 dark:text-zinc-600" />
                        </span>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-[#0f1115] border-white/10" align="center">
                        <DatePickerCalendar
                            mode="single"
                            selected={date}
                            onSelect={handleSelect}
                            initialFocus
                            className="rounded-md border-none"
                            disabled={(date) => {
                                if (!bookedDates) return false;
                                return !bookedDates.some(bd => bd.toDateString() === date.toDateString());
                            }}
                            modifiers={{
                                booked: bookedDates || [],
                            }}
                            modifiersClassNames={{
                                booked: "font-black text-emerald-500", // Dates with messages
                            }}
                        />
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
};
