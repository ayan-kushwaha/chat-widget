"use client";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export const SectionHeader = ({ title, icon: Icon }: { title: string, icon: any }) => (
    <div className="flex items-center gap-3 border-b border-white/5 pb-4 shrink-0">
        <div className="p-2.5 bg-blue-600/10 rounded-xl border border-blue-600/20">
            <Icon size={16} className="text-blue-500" />
        </div>
        <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] italic">{title}</h3>
    </div>
);

export const DayTimelineCard = ({ day, enabled, start, end, onToggle, onRangeChange, timeToValue }: any) => {
    const valStart = timeToValue(start);
    const valEnd = timeToValue(end);

    return (
        <div className={cn(
            "p-6 rounded-3xl border transition-all duration-500 flex flex-col gap-6",
            enabled
                ? "bg-white/[0.02] border-blue-500/20 shadow-lg shadow-blue-500/5 text-white"
                : "bg-black/20 border-white/5 opacity-50 grayscale text-zinc-500"
        )}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Switch checked={enabled} onCheckedChange={onToggle} className="data-[state=checked]:bg-blue-600" />
                    <span className="text-xs font-black uppercase tracking-[0.2em]">{day}</span>
                </div>
                {enabled && (
                    <div className="px-3 py-1.5 bg-[#0a0f18] border border-blue-500/30 rounded-xl">
                        <span className="text-[10px] font-black text-blue-400 tracking-tighter">{start} — {end}</span>
                    </div>
                )}
            </div>

            {enabled && (
                <div className="px-2 pt-2 cursor-pointer">
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
