
import React, { useRef } from 'react';
import { cn } from '@/lib/utils';

interface SidebarFiltersProps {
    dynamicFilterTags: string[];
    activeFilter: string;
    onFilterChange: (filter: string) => void;
}

export const SidebarFilters: React.FC<SidebarFiltersProps> = ({
    dynamicFilterTags,
    activeFilter,
    onFilterChange
}) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    return (
        <div className="relative mt-3 mb-1 group">
            <div
                ref={scrollContainerRef}
                className="flex items-center gap-2 overflow-x-auto no-scrollbar px-3 pb-2 snap-x"
            >
                {dynamicFilterTags.map(f => {
                    const isActive = activeFilter === f;
                    const isArchive = f.startsWith('Archive');
                    // Remove count for value
                    const filterValue = f.includes('(') ? f.split(' (')[0] : f;

                    return (
                        <button
                            key={f}
                            onClick={() => onFilterChange(filterValue)}
                            className={cn(
                                "px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 snap-start shrink-0",
                                isActive
                                    ? "bg-zinc-800 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                    : "bg-neutral-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-neutral-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200",
                                isArchive && !isActive && "text-zinc-400 bg-zinc-900/40 border border-white/5"
                            )}
                        >
                            <span>{f}</span>
                            {/* 🔵 Blue Dot for Archived Unread */}
                            {isArchive && f.includes('(') && (
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse ml-0.5 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                            )}
                        </button>
                    );
                })}
            </div>
            {/* 🌫️ Right Side Depth Shadow */}
            <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white/90 dark:from-neutral-950 to-transparent pointer-events-none z-10" />
        </div>
    );
};
