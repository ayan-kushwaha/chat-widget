"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface TimePickerProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    disabled?: boolean;
}

export function CustomTimePicker({ value, onChange, className, disabled }: TimePickerProps) {
    const [open, setOpen] = React.useState(false);

    // Internal state
    const [hours, setHours] = React.useState(9);
    const [minutes, setMinutes] = React.useState(0);
    const [period, setPeriod] = React.useState<"AM" | "PM">("AM");

    // Sync internal state with props
    React.useEffect(() => {
        if (value) {
            // Parse "HH:MM AM/PM" or "HH:MM"
            const cleanVal = value.trim().toUpperCase();
            const isPM = cleanVal.includes("PM");
            const isAM = cleanVal.includes("AM");

            // Remove AM/PM for parsing number
            const timePart = cleanVal.replace("AM", "").replace("PM", "").trim();
            const parts = timePart.split(':');

            if (parts.length >= 2) {
                let h = parseInt(parts[0], 10);
                const m = parseInt(parts[1], 10);

                if (!isNaN(h) && !isNaN(m)) {
                    // If input is 24h (e.g. 14:00) but no AM/PM indicator, convert to 12h logic?
                    // Or if input is 12h already?
                    // Let's assume input might be mixed, so we normalize.

                    // If explicit AM/PM tags exist:
                    if (isPM && h < 12) {
                        // Keep h as 12h format? No, let's store internal state as 12h + period
                        // Actually, easier to just store what we see visually: 1-12, 0-59, AM/PM
                    }
                    // If we receive "14:00" (old 24h data), convert to 2:00 PM
                    if (!isAM && !isPM) {
                        if (h >= 12) {
                            if (h > 12) h -= 12;
                            setPeriod("PM");
                        } else {
                            if (h === 0) h = 12;
                            setPeriod("AM");
                        }
                    } else {
                        setPeriod(isPM ? "PM" : "AM");
                    }

                    setHours(h);
                    setMinutes(m);
                }
            }
        }
    }, [value]);

    // Generate arrays
    const hoursArray = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12
    const minutesArray = Array.from({ length: 60 }, (_, i) => i);

    const handleTimeChange = (h: number, m: number, p: "AM" | "PM") => {
        setHours(h);
        setMinutes(m);
        setPeriod(p);
        // Format as HH:MM AA
        const formatted = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${p}`;
        onChange(formatted);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        "w-full justify-between text-left font-normal bg-black/40 border-white/10 text-white hover:bg-white/5 hover:text-white",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    <span className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {value || "Select time"}
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-slate-950 border-white/10" align="start">
                <div className="flex h-[300px] divide-x divide-white/10 text-white">
                    {/* Hours Column */}
                    <div className="flex flex-col">
                        <div className="flex items-center justify-center p-2 text-xs font-medium text-slate-400 border-b border-white/10 bg-white/5">
                            Hr
                        </div>
                        <ScrollArea className="h-full w-[60px]">
                            <div className="p-2 space-y-1">
                                {hoursArray.map((hour) => (
                                    <Button
                                        key={hour}
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleTimeChange(hour, minutes, period)}
                                        className={cn(
                                            "w-full justify-center text-sm font-normal",
                                            hours === hour
                                                ? "bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
                                                : "text-slate-300 hover:bg-white/10 hover:text-white"
                                        )}
                                    >
                                        {hour.toString().padStart(2, '0')}
                                    </Button>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Minutes Column */}
                    <div className="flex flex-col">
                        <div className="flex items-center justify-center p-2 text-xs font-medium text-slate-400 border-b border-white/10 bg-white/5">
                            Min
                        </div>
                        <ScrollArea className="h-full w-[60px]">
                            <div className="p-2 space-y-1">
                                {minutesArray.map((minute) => (
                                    <Button
                                        key={minute}
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleTimeChange(hours, minute, period)}
                                        className={cn(
                                            "w-full justify-center text-sm font-normal",
                                            minutes === minute
                                                ? "bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
                                                : "text-slate-300 hover:bg-white/10 hover:text-white"
                                        )}
                                    >
                                        {minute.toString().padStart(2, '0')}
                                    </Button>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* AM/PM Column */}
                    <div className="flex flex-col">
                        <div className="flex items-center justify-center p-2 text-xs font-medium text-slate-400 border-b border-white/10 bg-white/5">
                            Am/Pm
                        </div>
                        <ScrollArea className="h-full w-[60px]">
                            <div className="p-2 space-y-1">
                                {["AM", "PM"].map((p) => (
                                    <Button
                                        key={p}
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleTimeChange(hours, minutes, p as "AM" | "PM")}
                                        className={cn(
                                            "w-full justify-center text-sm font-normal",
                                            period === p
                                                ? "bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
                                                : "text-slate-300 hover:bg-white/10 hover:text-white"
                                        )}
                                    >
                                        {p}
                                    </Button>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
