"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Zap, Gauge } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface BrainCoreCardProps {
    iq: number;
    level: string;
    tokenUsed: number;
    tokenLimit: number;
    status: "active" | "learning" | "idle";
    overageCount: number;
}

export const BrainCoreCard = ({ iq, level, tokenUsed, tokenLimit, status, overageCount }: BrainCoreCardProps) => {
    // --- Animation Variants ---
    const pulseVariants = {
        idle: { scale: [1, 1.05, 1], opacity: [0.6, 0.8, 0.6], transition: { duration: 4, repeat: Infinity } },
        active: { scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7], boxShadow: ["0 0 20px rgba(168,85,247,0.3)", "0 0 40px rgba(168,85,247,0.6)", "0 0 20px rgba(168,85,247,0.3)"], transition: { duration: 2, repeat: Infinity } },
        learning: { scale: [1, 1.25, 1], opacity: [0.8, 1, 0.8], transition: { duration: 1, repeat: Infinity } }
    };

    // --- Token Fuel Data ---
    const tokenPercentage = Math.min((tokenUsed / tokenLimit) * 100, 100);
    const gaugeData = [
        { name: "Used", value: tokenUsed },
        { name: "Remaining", value: Math.max(tokenLimit - tokenUsed, 0) }
    ];
    const GAUGE_COLORS = ["#A855F7", "#1e293b"]; // Purple / Slate-800

    // --- Styling Helpers ---
    const getStatusColor = () => {
        if (status === 'active') return "text-purple-400 bg-purple-500/10 border-purple-500/20";
        if (status === 'learning') return "text-pink-400 bg-pink-500/10 border-pink-500/20";
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    };

    return (
        <GlassCard className="h-full flex flex-col items-center p-6 relative">
            {/* 1. TOP: Status Badge */}
            <div className="absolute top-4 right-4">
                <div className={cn("flex items-center gap-2 px-2 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider", getStatusColor())}>
                    <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", status === 'active' ? "bg-purple-500" : status === 'learning' ? "bg-pink-500" : "bg-blue-500")} />
                    {status}
                </div>
            </div>

            {/* 2. CENTER: Living Orb & IQ */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-6 mt-4">
                {/* Orb */}
                <div className="relative">
                    <motion.div
                        className={cn("w-24 h-24 rounded-full blur-xl absolute inset-0 -translate-x-1/4 -translate-y-1/4", status === 'active' ? "bg-purple-600/40" : "bg-blue-600/40")}
                        animate={status}
                        variants={pulseVariants}
                    />
                    <div className="relative w-32 h-32 rounded-full border border-white/10 flex items-center justify-center bg-black/20 backdrop-blur-sm z-10">
                        <div className="text-center">
                            <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Brain IQ</span>
                            <span className="text-2xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                                {iq.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <span className="text-xs text-slate-400 font-mono bg-white/5 px-3 py-1 rounded-full border border-white/5">
                        {level} Intelligence
                    </span>
                </div>
            </div>

            {/* 3. BOTTOM: Fuel & Rent */}
            <div className="w-full mt-8 space-y-4">
                {/* Fuel Gauge (Compact) */}
                <div className="bg-black/20 rounded-xl p-3 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={gaugeData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={12}
                                        outerRadius={18}
                                        startAngle={90}
                                        endAngle={-270}
                                        dataKey="value"
                                        stroke="none"
                                        cornerRadius={4}
                                    >
                                        {gaugeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={GAUGE_COLORS[index]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Gauge className="w-3 h-3 text-slate-500" />
                            </div>
                        </div>
                        <div>
                            <span className="text-xs text-slate-400 block">Fuel Remaining</span>
                            <span className="text-sm font-bold text-white">{Math.round(100 - tokenPercentage)}%</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] text-slate-600 block">Total Capacity</span>
                        <span className="text-xs font-mono text-slate-400">{tokenLimit.toLocaleString()}</span>
                    </div>
                </div>

                {/* Smart Rent Ticker (Compact) */}
                {overageCount > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center gap-3">
                        <div className="p-1.5 bg-amber-500/20 rounded-full">
                            <Zap className="w-3 h-3 text-amber-400" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-amber-200">Auto-Rent Active</span>
                                <span className="text-xs font-mono text-amber-400">-${(overageCount * 0.05).toFixed(2)}/d</span>
                            </div>
                            <div className="h-1 w-full bg-amber-500/20 rounded-full mt-1 overflow-hidden">
                                <motion.div
                                    className="h-full bg-amber-400"
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </GlassCard>
    );
};
