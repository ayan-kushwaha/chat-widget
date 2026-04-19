import React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Clock, Calendar } from "lucide-react";
import { CollapsibleSection } from "../shared/CollapsibleSection";
import { SectionHeader, DayTimelineCard } from "../shared/DayTimelineCard";
import { DAYS } from "../constants";

interface ProfileHoursEditProps {
    org: {
        operatingHours?: {
            enabled: boolean;
        };
    };
    weeklyHours: Record<string, any>;
    isOpen: boolean;
    onToggle: (id: string) => void;
    toggleAllHours: (checked: boolean) => void;
    toggleDay: (day: string) => void;
    updateTimeRange: (day: string, vals: number[]) => void;
    timeToValue: (timeStr: string) => number;
}

export function ProfileHoursEdit({
    org,
    weeklyHours,
    isOpen,
    onToggle,
    toggleAllHours,
    toggleDay,
    updateTimeRange,
    timeToValue
}: ProfileHoursEditProps) {
    return (
        <CollapsibleSection
            id="hours"
            title="Business Hours"
            icon={Clock}
            isOpen={isOpen}
            onToggle={onToggle}
        >
            <div className="space-y-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                    <SectionHeader title="Operating Timeline" icon={Calendar} />
                    <div className="flex items-center gap-3">
                        <Label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Enable Hours</Label>
                        <Switch
                            checked={org.operatingHours?.enabled ?? true}
                            onCheckedChange={toggleAllHours}
                            className="data-[state=checked]:bg-blue-600"
                        />
                    </div>
                </div>
                {(org.operatingHours?.enabled ?? true) && (
                    <div className="grid gap-4 border border-white/5 rounded-3xl p-4 bg-black/10">
                        {DAYS.map((day) => (
                            <DayTimelineCard
                                key={day}
                                day={day}
                                enabled={weeklyHours[day]?.enabled}
                                start={weeklyHours[day]?.start}
                                end={weeklyHours[day]?.end}
                                onToggle={() => toggleDay(day)}
                                onRangeChange={(vals: number[]) => updateTimeRange(day, vals)}
                                timeToValue={timeToValue}
                            />
                        ))}
                    </div>
                )}
            </div>
        </CollapsibleSection>
    );
}
