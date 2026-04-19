"use client";

import React, { useState } from "react";
import { TalentGrid } from "./marketplace/TalentGrid";
import { ActiveTeam } from "./ActiveTeam";
import { BackgroundBeams } from "../ui/background-beams";
import { Sparkles, Users, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

export function TalentPool() {
    const [view, setView] = useState<'marketplace' | 'team'>('marketplace');

    return (
        <div className="h-full w-full rounded-md bg-neutral-950 relative flex flex-col items-center antialiased overflow-y-auto no-scrollbar pb-20">
            <div className="max-w-4xl mx-auto p-4 mt-12 relative z-20 text-center">
                <h1 className="relative z-10 text-3xl md:text-5xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600 text-center font-sans font-bold">
                    {view === 'marketplace' ? 'The Digital Workforce' : 'Your Neural Personnel'}
                </h1>

                <p className="text-neutral-500 max-w-lg mx-auto my-2 text-sm text-center relative z-10">
                    {view === 'marketplace'
                        ? 'Deploy autonomous AI employees that work 24/7. Verified skills and instant onboarding.'
                        : 'Manage your active AI employees and monitor their operational status.'}
                </p>

                {/* 🌈 Premium Toggle Switch */}
                <div className="flex items-center justify-center mt-10 gap-1 p-1 bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-full w-fit mx-auto shadow-2xl">
                    <button
                        onClick={() => setView('marketplace')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all",
                            view === 'marketplace'
                                ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                                : "text-zinc-500 hover:text-white"
                        )}
                    >
                        <ShoppingBag size={14} />
                        Marketplace
                    </button>
                    <button
                        onClick={() => setView('team')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all",
                            view === 'team'
                                ? "bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                                : "text-zinc-500 hover:text-white"
                        )}
                    >
                        <Users size={14} />
                        My Team
                    </button>
                </div>
            </div>

            {view === 'marketplace' ? <TalentGrid /> : <ActiveTeam />}

            <BackgroundBeams />
        </div>
    );
}
