"use client";
import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function TileSelector({ options, value, onChange }: { options: { value: string; label: string; icon: string }[]; value: string; onChange: (v: string) => void; }) {
    const [isEditingList, setIsEditingList] = useState(false);

    const isKnownValue = options.some(opt => opt.value === value);
    const hasOther = options.some(opt => opt.value === "other");
    const activeValue = (!isKnownValue && value && hasOther) ? "other" : value;

    // If an option is selected and we're not explicitly editing the list, only show the selected option
    const showOnlySelected = activeValue && !isEditingList;
    const displayedOptions = showOnlySelected ? options.filter(o => o.value === activeValue) : options;

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center h-4">
                {showOnlySelected && (
                    <button
                        type="button"
                        onClick={() => setIsEditingList(true)}
                        className="text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors ml-auto mr-1"
                    >
                        Change Selection
                    </button>
                )}
            </div>
            <div className="grid grid-cols-2 gap-4">
                {displayedOptions.map(opt => {
                    const isActive = activeValue === opt.value;
                    return (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                                onChange(opt.value);
                                setIsEditingList(false);
                            }}
                            className={cn(
                                "relative flex flex-col items-center gap-4 p-8 rounded-2xl text-center transition-all duration-300 ease-out border overflow-hidden group min-h-[160px] justify-center",
                                isActive
                                    ? "bg-blue-500/5 border-blue-500/30 shadow-2xl"
                                    : "bg-[#09090b] border-white/5 hover:bg-white/5 hover:border-white/10 shadow-sm"
                            )}
                        >
                            {/* Elegant Checkmark for active state */}
                            {isActive && (
                                <div className="absolute top-4 right-4 text-blue-500 animate-in zoom-in duration-200">
                                    <Check size={18} strokeWidth={3} />
                                </div>
                            )}

                            <div className={cn(
                                "p-4 rounded-2xl transition-all duration-300 transform group-hover:scale-110",
                                isActive ? "bg-blue-500/10 text-white scale-110 ring-2 ring-blue-500/20" : "bg-white/5 text-zinc-500 grayscale group-hover:grayscale-0 group-hover:text-zinc-300"
                            )}>
                                <span className="text-3xl">{opt.icon}</span>
                            </div>

                            <span className={cn(
                                "text-sm font-bold tracking-tight mt-2 transition-colors duration-300 uppercase",
                                isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
                            )}>
                                {opt.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
