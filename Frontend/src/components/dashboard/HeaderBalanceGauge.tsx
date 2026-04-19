"use client";

import React, { useState } from "react";
import { Zap, TrendingUp } from "lucide-react";
import { useOrganization } from "@/hooks/useOrganization";
import { cn } from "@/lib/utils";

export function HeaderBalanceGauge() {
    const { organization } = useOrganization();
    const [showDetails, setShowDetails] = useState(false);

    // Get usage data (default to 0 to prevent crashes)
    const tokensUsed = organization?.usage?.tokensUsed || 0;
    const planTokens = organization?.subscription?.snapshot?.limits?.max_tokens || 100000;
    const topupTokens = organization?.usage?.topup_balance || 0;
    const totalTokens = planTokens + topupTokens;

    const percentage = totalTokens > 0 ? Math.min((tokensUsed / totalTokens) * 100, 100) : 0;
    const remaining = Math.max(0, totalTokens - tokensUsed);

    if (!organization) return null;

    return (
        <div
            className="relative group"
            onMouseEnter={() => setShowDetails(true)}
            onMouseLeave={() => setShowDetails(false)}
        >
            {/* Main Gauge (Red/Black) */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl    transition-all cursor-default relative z-20">
                <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-red-500/10">
                        <Zap className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                    </div>
                    <div className="flex flex-col items-start leading-none gap-0.5">
                        <span className="text-[10px] font-medium text-red-500 uppercase tracking-wider">Token Balance</span>
                        <span className="text-xs font-bold text-white font-mono">
                            {tokensUsed.toLocaleString()} / {totalTokens.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Hover Popover */}
            <div className={cn(
                "absolute top-full right-0 mt-2 w-[300px] bg-[#0F0F10] border border-white/10 rounded-xl shadow-2xl p-4 z-40 transition-all duration-200",
                showDetails ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-2 pointer-events-none"
            )}>
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-white">Token Balance</h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/20">
                        {percentage.toFixed(1)}% Used
                    </span>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-neutral-400 flex items-center gap-2"><TrendingUp className="w-3 h-3" /> Used</span>
                        <span className="font-mono font-bold text-white">{tokensUsed.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-neutral-400 flex items-center gap-2"><Zap className="w-3 h-3 text-green-500" /> Remaining</span>
                        <span className="font-mono font-bold text-green-400">
                            {remaining.toLocaleString()}
                        </span>
                    </div>

                    <div className="h-px bg-white/10 my-2" />

                    <div className="flex justify-between items-center text-xs">
                        <span className="text-neutral-500">Plan Allocation</span>
                        <span className="font-mono text-neutral-300">{planTokens.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-neutral-500">Top-up Balance</span>
                        <span className="font-mono text-blue-400">+{topupTokens.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-1">
                        <span className="font-bold text-white">Total Tokens</span>
                        <span className="font-mono font-bold text-white">
                            {totalTokens.toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* PROGRESS BAR */}
                <div className="mt-4 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-red-500 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
