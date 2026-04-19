import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarketplaceFiltersProps {
    filter: string;
    setFilter: (f: string) => void;
}

export const MarketplaceFilters: React.FC<MarketplaceFiltersProps> = ({ filter, setFilter }) => {
    return (
        <div className="mt-8 flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                <input
                    type="text"
                    placeholder="Search by role, skill, or name..."
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm font-bold focus:border-amber-500/50 outline-none transition-colors"
                />
            </div>
            <div className="flex gap-2">
                {['All', 'Sales', 'Support', 'Marketing', 'Technical'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={cn(
                            "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider border transition-all",
                            filter === f
                                ? "bg-white text-black border-white"
                                : "bg-black text-zinc-500 border-zinc-800 hover:border-zinc-600"
                        )}
                    >
                        {f}
                    </button>
                ))}
            </div>
        </div>
    );
};
