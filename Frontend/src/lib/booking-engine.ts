"use client";

import { format, addMinutes, isBefore, isSameDay, isWithinInterval, parseISO } from 'date-fns';

export interface DayConfig {
    enabled: boolean;
    start: string; // e.g. "09:00"
    end: string;   // e.g. "18:00"
    breaks?: { start: string; end: string }[];
}

export interface BreakRange {
    id: string;
    start: Date;
    end: Date;
    label: string;
}

export interface BookingConfig {
    slotDuration: number;
    bufferTime: number;
    minNoticePeriod: number; // in hours
    lookAheadLimit: number; // in days
    seatCapacity: number;   // max bookings per slot
    weeklyHours: Record<string, DayConfig>;
    dateOverrides?: Record<string, DayConfig | { enabled: boolean }>;
    intakeFields: {
        name: boolean;
        email: boolean;
        phone: boolean;
        address: boolean;
    };
    breakRanges: BreakRange[];
}

export interface Booking {
    id: string;
    date: Date | string;
    time: string;
    type: string;
    userName: string;
    userEmail: string;
}

/**
 * Calculates available slots for a given date based on business hours, existing bookings, and break ranges.
 */
export const calculateAvailableSlots = (
    date: Date,
    config: BookingConfig,
    existingBookings: Booking[]
): string[] => {
    // 1. Check if date falls within any Break Range
    const isDuringBreak = config.breakRanges.some(br =>
        isWithinInterval(date, { start: new Date(br.start), end: new Date(br.end) })
    );
    if (isDuringBreak) return [];

    const dateStr = format(date, 'yyyy-MM-dd');
    const dayName = format(date, 'EEEE');

    // 2. Check Overrides first, then Weekly
    const dayConfig = (config.dateOverrides && config.dateOverrides[dateStr])
        ? config.dateOverrides[dateStr]
        : config.weeklyHours[dayName];

    if (!dayConfig || !dayConfig.enabled) return [];

    // Cast because dateOverrides can be special
    const configToUse = dayConfig as DayConfig;
    if (!configToUse.start || !configToUse.end) return [];

    const slots: string[] = [];
    const [startH, startM] = configToUse.start.split(':').map(Number);
    const [endH, endM] = configToUse.end.split(':').map(Number);

    let current = new Date(date);
    current.setHours(startH, startM, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(endH, endM, 0, 0);

    const now = new Date();
    const minTime = new Date(now.getTime() + config.minNoticePeriod * 60 * 60 * 1000);

    while (current < endTime) {
        // Respect Notice Period
        if (current > minTime) {
            const timeStr = format(current, 'hh:mm a');

            // Check for collisions (Respecting Seat Capacity)
            const concurrentBookings = existingBookings.filter(b =>
                isSameDay(new Date(b.date), date) && b.time === timeStr
            );

            if (concurrentBookings.length < config.seatCapacity) {
                slots.push(timeStr);
            }
        }

        current = addMinutes(current, config.slotDuration + config.bufferTime);
    }

    return slots;
};

/**
 * Mock config for testing and initial setup
 */
export const DEFAULT_BOOKING_CONFIG: BookingConfig = {
    slotDuration: 30,
    bufferTime: 10,
    minNoticePeriod: 4,
    lookAheadLimit: 14,
    seatCapacity: 1,
    weeklyHours: {
        'Monday': { enabled: true, start: "09:00", end: "18:00" },
        'Tuesday': { enabled: true, start: "09:00", end: "18:00" },
        'Wednesday': { enabled: true, start: "09:00", end: "18:00" },
        'Thursday': { enabled: true, start: "09:00", end: "18:00" },
        'Friday': { enabled: true, start: "09:00", end: "18:00" },
        'Saturday': { enabled: false, start: "10:00", end: "14:00" },
        'Sunday': { enabled: false, start: "10:00", end: "14:00" },
    },
    dateOverrides: {},
    intakeFields: {
        name: true,
        email: true,
        phone: false,
        address: false,
    },
    breakRanges: []
};
