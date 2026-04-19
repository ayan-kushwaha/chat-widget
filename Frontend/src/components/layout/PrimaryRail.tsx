
"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { navigationConfig } from "@/config/navigationConfig";
import { useNavigationStore } from "@/store/navigationStore";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
// import { UserButton } from "@clerk/nextjs";
// Assuming we are using the custom user menu from the old sidebar for now or a placeholder
// For now, I'll use a simple placeholder or the UserAvatar if available. 
// Re-using the custom user part from original sidebar refactor later.

export function PrimaryRail() {
    const { activeModule, setActiveModule } = useNavigationStore();

    return (
        <aside className="w-[72px] h-screen flex flex-col items-center py-4 bg-neutral-900 border-r border-neutral-800 z-50 flex-shrink-0">
            {/* Logo Placeholder */}
            <div className="mb-8 w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-glow">
                <span className="text-white font-bold text-xl">C</span>
            </div>

            {/* Main Navigation Icons */}
            <div className="flex-1 flex flex-col gap-4 w-full px-2">
                <TooltipProvider delayDuration={0}>
                    {navigationConfig.map((module) => {
                        const Icon = module.icon;
                        const isActive = activeModule === module.id;

                        return (
                            <Tooltip key={module.id}>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => setActiveModule(module.id)}
                                        className={cn(
                                            "w-full aspect-square flex items-center justify-center rounded-xl transition-all duration-200 group relative",
                                            isActive
                                                ? "bg-indigo-600 text-white shadow-md"
                                                : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                                        )}
                                    >
                                        <Icon className="w-6 h-6" />

                                        {/* Active Indicator Dot */}
                                        {isActive && (
                                            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/20 rounded-r-full" />
                                        )}
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="bg-neutral-900 text-white border-neutral-800">
                                    <p>{module.label}</p>
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </TooltipProvider>
            </div>

            {/* Bottom Actions (Profile/Settings quick access) */}
            <div className="mt-auto flex flex-col gap-4 w-full px-2">
                {/* Placeholder for Profile */}
                <div className="w-full aspect-square bg-neutral-800 rounded-full flex items-center justify-center text-neutral-400 text-xs">
                    U
                </div>
            </div>
        </aside>
    );
}
