"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from "framer-motion";
import { BrainCircuit, Calendar, Database, BarChart3, CheckCircle2, Sliders, MessageSquare, Mail, Terminal, ArrowRight, TrendingUp, ShieldCheck, Zap, Sparkles, Activity, Search, Cpu, Layers, GitBranch, LineChart, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { BorderBeam } from "@/components/ui/border-beam";

// --- Components ---

function SpotlightCard({ children, className = "", spotlightColor = "from-white/20 via-white/10 to-transparent", delay = 0 }: { children: React.ReactNode; className?: string; spotlightColor?: string, delay?: number }) {
    const divRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!divRef.current) return;
        const rect = divRef.current.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
    };

    return (
        <motion.div
            ref={divRef}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: delay, duration: 0.5 }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsFocused(true)}
            onMouseLeave={() => setIsFocused(false)}
            className={cn(
                "relative rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 overflow-hidden group hover:border-white/20 transition-colors duration-300",
                className
            )}
        >
            <div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(255,255,255,0.06), transparent 40%)`
                }}
            />
            {/* Spotlight Gradient using Motion Template for performance */}
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
                        radial-gradient(
                        650px circle at ${mouseX}px ${mouseY}px,
                        var(--spotlight-color),
                        transparent 80%
                        )
                    `,
                    // @ts-ignore
                    "--spotlight-color": spotlightColor.includes("amber") ? "rgba(245, 158, 11, 0.15)" :
                        spotlightColor.includes("blue") ? "rgba(59, 130, 246, 0.15)" :
                            spotlightColor.includes("purple") ? "rgba(168, 85, 247, 0.15)" :
                                "rgba(16, 185, 129, 0.15)"
                }}
            />

            <div className="relative z-10">{children}</div>
        </motion.div>
    );
}

// --- Tabs Configuration ---
const TABS = [
    {
        id: "learning",
        label: "Auto-Training",
        icon: Sparkles,
        color: "text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20"
    },
    {
        id: "timeline",
        label: "Activity Log",
        icon: Calendar,
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20"
    },
    {
        id: "manager",
        label: "Knowledge Base",
        icon: Database,
        color: "text-purple-400",
        bg: "bg-purple-500/10",
        border: "border-purple-500/20"
    },
    {
        id: "analytics",
        label: "ROI & Impact",
        icon: BarChart3,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20"
    }
];

// --- Mock Content for Tabs ---
const TabContent = ({ activeTab }: { activeTab: string }) => {
    return (
        <div className="w-full h-full  relative bg-[#0c1222]">
            <AnimatePresence mode="wait">
                {/* 1. AUTO LEARNING VIEW - "The Process" */}
                {activeTab === "learning" && (
                    <motion.div
                        key="learning"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6 h-[400px] overflow-y-auto p-4 pb-10 pr-2 custom-scrollbar"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Live Customer Learning</h4>
                            <div className="flex gap-2">
                                <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20 animate-pulse">Learning...</span>
                            </div>
                        </div>

                        {/* Process Item 1: Chat -> Insight */}
                        <div className="relative group">
                            {/* Connector Line */}
                            <div className="absolute left-[19px] top-8 bottom-0 w-px bg-white/5 group-last:hidden" />

                            <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 z-10 transition-transform group-hover:scale-110">
                                    <MessageSquare className="w-4 h-4 text-slate-400" />
                                </div>

                                <div className="flex-1 space-y-3">
                                    {/* Raw Input Bubble */}
                                    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 relative">
                                        <div className="text-[10px] font-mono text-slate-500 mb-1">CUSTOMER CHAT (WhatsApp)</div>
                                        <p className="text-sm text-slate-400 italic">"I definitely need the <span className="text-slate-300">enterprise plan features</span>, but our budget is capped at <span className="text-slate-300">$5k monthly</span> right now."</p>
                                        {/* Arrow Down */}
                                        <div className="absolute -bottom-5 left-8 text-slate-600">
                                            <ArrowRight className="w-4 h-4 rotate-90" />
                                        </div>
                                    </div>

                                    {/* Extracted Memory Card */}
                                    <div className="bg-gradient-to-r from-emerald-950/30 to-slate-900/30 border border-emerald-500/20 rounded-xl p-4 relative top-1 group-hover:bg-opacity-50 transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
                                                <span className="text-xs font-bold text-emerald-400">New Business Fact</span>
                                            </div>
                                            <div className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-mono">HIGH VALUE</div>
                                        </div>
                                        <div className="space-y-2 mb-3">
                                            <div className="flex items-center justify-between text-xs p-2 rounded bg-black/20 border border-white/5">
                                                <span className="text-slate-500">Intent</span>
                                                <span className="text-white">Purchase (Enterprise)</span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs p-2 rounded bg-black/20 border border-white/5">
                                                <span className="text-slate-500">Constraint</span>
                                                <span className="text-white">Budget &lt; $5k/mo</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="flex-1 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/20">
                                                Save to Knowledge Base
                                            </button>
                                            <button className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-400 text-xs hover:bg-white/10 transition-colors">Edit</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Process Item 2: Email -> Insight */}
                        <div className="relative group pt-4">
                            <div className="absolute left-[19px] top-8 bottom-0 w-px bg-white/5 group-last:hidden" />
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 z-10 transition-transform group-hover:scale-110">
                                    <Mail className="w-4 h-4 text-slate-400" />
                                </div>

                                <div className="flex-1 space-y-3">
                                    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 relative">
                                        <div className="text-[10px] font-mono text-slate-500 mb-1">CUSTOMER EMAIL</div>
                                        <p className="text-sm text-slate-400 italic">"...we are currently evaluating <span className="text-slate-300">CompetitorX</span> as well, mainly for their offline support."</p>
                                        <div className="absolute -bottom-5 left-8 text-slate-600">
                                            <ArrowRight className="w-4 h-4 rotate-90" />
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-r from-amber-950/30 to-slate-900/30 border border-amber-500/20 rounded-xl p-4 relative top-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <Activity className="w-3 h-3 text-amber-400" />
                                                <span className="text-xs font-bold text-amber-400">Competitor Detected</span>
                                            </div>
                                            <div className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400 font-mono">75% CONFIDENCE</div>
                                        </div>
                                        <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                                            Identified <span className="text-white font-semibold">CompetitorX</span> usage. Suggestion: Add to 'Objection Handling' knowledge base?
                                        </p>
                                        <div className="flex gap-2">
                                            <button className="flex-1 py-1.5 rounded-lg bg-amber-600/20 border border-amber-600/50 text-amber-400 text-xs font-bold hover:bg-amber-600/30 transition-colors">
                                                Review Strategy
                                            </button>
                                            <button className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-400 text-xs hover:bg-white/10 transition-colors">Ignore</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Process Item 3: Voice Meeting -> Insight (NEW) */}
                        <div className="relative group pt-4">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 z-10 transition-transform group-hover:scale-110">
                                    <div className="flex gap-0.5 items-end h-3">
                                        <span className="w-0.5 h-3 bg-purple-400 animate-[pulse_1s_ease-in-out_infinite]" />
                                        <span className="w-0.5 h-2 bg-purple-400 animate-[pulse_1.2s_ease-in-out_infinite_0.1s]" />
                                        <span className="w-0.5 h-3 bg-purple-400 animate-[pulse_0.8s_ease-in-out_infinite_0.2s]" />
                                    </div>
                                </div>

                                <div className="flex-1 space-y-3">
                                    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 relative">
                                        <div className="text-[10px] font-mono text-slate-500 mb-1">MEETING NOTES</div>
                                        <p className="text-sm text-slate-400 italic">"Client mentioned they want to <span className="text-slate-300">migrate by Q4</span>. We need to send the <span className="text-slate-300">API docs</span> first."</p>
                                        <div className="absolute -bottom-5 left-8 text-slate-600">
                                            <ArrowRight className="w-4 h-4 rotate-90" />
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-r from-purple-950/30 to-slate-900/30 border border-purple-500/20 rounded-xl p-4 relative top-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-3 h-3 text-purple-400" />
                                                <span className="text-xs font-bold text-purple-400">Action Item</span>
                                            </div>
                                            <div className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-400 font-mono">88% CONFIDENCE</div>
                                        </div>
                                        <div className="space-y-1 mb-3">
                                            <div className="flex items-center gap-2 text-xs text-slate-300"><ArrowRight className="w-3 h-3 text-slate-500" /> Deadline: <span className="text-white">Q4 2024</span></div>
                                            <div className="flex items-center gap-2 text-xs text-slate-300"><ArrowRight className="w-3 h-3 text-slate-500" /> Task: <span className="text-white">Send API Docs</span></div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="flex-1 py-1.5 rounded-lg bg-purple-600/20 border border-purple-600/50 text-purple-400 text-xs font-bold hover:bg-purple-600/30 transition-colors">
                                                Create Task
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </motion.div>
                )}

                {/* 2. TIMELINE VIEW - "Digital Log" */}
                {activeTab === "timeline" && (
                    <motion.div
                        key="timeline"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="relative pl-4 pb-10 space-y-0 h-[400px] overflow-y-auto p-4 custom-scrollbar font-mono"
                    >
                        {[
                            { time: "10:42:05", event: "FACT_LEARNED", details: "Saved: 'User prefers Enterprise Plan concepts'", type: "success", icon: Database },
                            { time: "10:38:12", event: "AUTO_CORRECT", details: "Phone format updated: +1-555... -> +1 (555)...", type: "warn", icon: Sliders },
                            { time: "09:15:00", event: "READING_START", details: "Reading: 'Q3_Sales_Deck.pdf' (14MB)", type: "info", icon: ArrowRight },
                            { time: "09:15:45", event: "READING_DONE", details: "Finished. Learned 156 new selling points.", type: "success", icon: CheckCircle2 },
                            { time: "yesterday", event: "CLEANUP", details: "Removed 12 outdated pricing rules.", type: "dim", icon: Terminal },
                            { time: "yesterday", event: "WEEKLY_REPORT", details: "Generated summary for 'Pricing Objections'.", type: "info", icon: BrainCircuit },
                        ].map((item, i) => (
                            <div key={i} className="relative pl-8 pb-8 group last:pb-0">
                                {/* Connector Line */}
                                <div className="absolute left-[11px] top-6 bottom-0 w-px bg-slate-800 group-last:hidden" />

                                <span className={cn(
                                    "absolute left-0 top-1 w-6 h-6 rounded-full border flex items-center justify-center bg-[#0c1222] z-10 transition-colors",
                                    item.type === 'success' ? "border-emerald-500/50 text-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.2)]" :
                                        item.type === 'warn' ? "border-amber-500/50 text-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.2)]" :
                                            item.type === 'dim' ? "border-slate-700 text-slate-600" :
                                                "border-blue-500/50 text-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.2)]"
                                )}>
                                    <item.icon className="w-3 h-3" />
                                </span>

                                <div className="flex items-center gap-3 mb-1">
                                    <span className={cn("text-xs font-bold",
                                        item.type === 'success' ? "text-emerald-400" :
                                            item.type === 'warn' ? "text-amber-400" :
                                                item.type === 'dim' ? "text-slate-600" : "text-blue-400"
                                    )}>{item.event}</span>
                                    <span className="text-[10px] text-slate-600 uppercase tracking-widest">{item.time}</span>
                                </div>
                                <div className={cn("text-xs leading-relaxed", item.type === 'dim' ? "text-slate-700" : "text-slate-400")}>
                                    <span className="opacity-50">&gt; </span> {item.details}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* 3. MANAGER VIEW - "Neural Network" */}
                {activeTab === "manager" && (
                    <motion.div
                        key="manager"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="h-[400px]  flex flex-col p-4"
                    >
                        {/* Search & Filter */}
                        <div className="flex gap-2 mb-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                                <input type="text" placeholder="Search your company knowledge..." className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-300 focus:outline-none focus:border-purple-500/50" />
                            </div>
                        </div>

                        {/* Interactive Neural Network Visualization */}
                        <div className="flex-1 bg-black/20 rounded-xl border border-white/5 relative overflow-hidden mb-4 p-4 group">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/5 to-transparent pointer-events-none" />

                            {/* Central Hub - High Z-Index to ensure visibility */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
                                <motion.div
                                    animate={{ boxShadow: ["0 0 20px rgba(99,102,241,0.2)", "0 0 40px rgba(99,102,241,0.5)", "0 0 20px rgba(99,102,241,0.2)"] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    className="w-24 h-24 rounded-full bg-[#0c1222] border-2 border-indigo-500 flex flex-col items-center justify-center text-[10px] text-indigo-300 font-bold relative shadow-2xl"
                                >
                                    <BrainCircuit className="w-5 h-5 mb-1 text-indigo-400" />
                                    <span>MAIN TOPIC</span>
                                    <span className="text-[9px] text-indigo-400/70 font-normal">Pricing</span>
                                </motion.div>
                            </div>

                            {/* Orbiting Satellite Nodes */}
                            {[
                                { label: "Enterprise", delay: 0, color: "bg-blue-500", dist: 130 },
                                { label: "Refunds", delay: -5, color: "bg-purple-500", dist: 130 },
                                { label: "Discounts", delay: -10, color: "bg-emerald-500", dist: 130 },
                                { label: "Currency", delay: -15, color: "bg-amber-500", dist: 130 },
                                { label: "Plans", delay: -20, color: "bg-cyan-500", dist: 130 },
                            ].map((node, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute top-1/2 left-1/2 w-[1px] z-20 pointer-events-none"
                                    style={{ height: node.dist * 2, marginTop: -node.dist, marginLeft: 0 }}
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 40, delay: node.delay, repeat: Infinity, ease: "linear" }}
                                >
                                    {/* Node Container */}
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 pointer-events-auto">
                                        <motion.div
                                            animate={{ rotate: -360 }}
                                            transition={{ duration: 40, delay: node.delay, repeat: Infinity, ease: "linear" }}
                                            className="w-full h-full"
                                        >
                                            <div className="w-8 h-8 bg-[#0c1222] border border-white/20 rounded-full flex items-center justify-center shadow-lg relative group/node cursor-pointer hover:scale-110 transition-transform">
                                                <div className={`w-2 h-2 rounded-full ${node.color}`} />
                                                <div className="absolute top-full mt-2 px-2 py-1 bg-slate-900 border border-white/10 rounded text-slate-300 text-[9px] whitespace-nowrap shadow-xl">
                                                    {node.label}
                                                </div>
                                            </div>
                                        </motion.div>
                                    </div>

                                    {/* Beam Connection (Visual Line) */}
                                    <div className="absolute top-4 left-1/2 w-[1px] bg-gradient-to-b from-indigo-500/30 to-transparent" style={{ height: node.dist - 12 }} />
                                </motion.div>
                            ))}

                            <div className="absolute bottom-3 right-3 text-[10px] text-slate-500 font-mono flex items-center gap-2 z-10">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" /> Live Graph View
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* 4. ANALYTICS VIEW - "Simpler Health Score with Scroll" */}
                {activeTab === "analytics" && (
                    <motion.div
                        key="analytics"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="h-[400px] flex flex-col items-center relative overflow-y-auto custom-scrollbar p-6"
                    >
                        {/* Centered Content Container */}
                        <div className="min-h-full flex flex-col items-center justify-center w-full">

                            {/* Central Big Score */}
                            <div className="relative z-10 flex flex-col items-center mt-2">
                                <div className="relative w-40 h-40 flex items-center justify-center mb-6 shrink-0">
                                    {/* Rotating Ring - SVG for perfect circle */}
                                    <svg className="absolute inset-0 w-full h-full animate-spin-slow" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="46" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="none" />
                                        <circle cx="50" cy="50" r="46" stroke="#10b981" strokeWidth="6" fill="none" strokeDasharray="290" strokeDashoffset="40" strokeLinecap="round" className="drop-shadow-[0_0_2px_rgba(16,185,129,0.5)]" />
                                    </svg>

                                    <div className="text-center">
                                        <div className="text-5xl font-bold text-white tracking-tighter">98<span className="text-2xl text-emerald-500">%</span></div>
                                        <div className="text-[9px] text-center  font-bold text-slate-500 uppercase tracking-widest ">Knowledge Score</div>
                                    </div>
                                </div>

                                <div className="text-center max-w-sm mx-auto mb-4">
                                    <h3 className="text-xl font-bold text-white mb-2">AI Readiness: <span className="text-emerald-400">Excellent</span></h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">
                                        Your AI knows <b className="text-white">98%</b> of your business facts correctly.
                                    </p>
                                </div>
                            </div>

                            {/* Simple Stats Grid */}
                            <div className="w-full grid grid-cols-3 gap-4 px-4 pb-4">
                                <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                                    <TrendingUp className="w-4 h-4 text-blue-400 mx-auto mb-2" />
                                    <div className="text-lg font-bold text-white">Rapid</div>
                                    <div className="text-[10px] text-slate-500">Learning Speed</div>
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                                    <ShieldCheck className="w-4 h-4 text-purple-400 mx-auto mb-2" />
                                    <div className="text-lg font-bold text-white">100%</div>
                                    <div className="text-[10px] text-slate-500">Accuracy</div>
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                                    <Zap className="w-4 h-4 text-amber-400 mx-auto mb-2" />
                                    <div className="text-lg font-bold text-white">Instant</div>
                                    <div className="text-[10px] text-slate-500">Reply Time</div>
                                </div>
                            </div>

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


export function MemoryFeature() {
    const [activeTab, setActiveTab] = useState("learning");

    return (
        <section className="py-24 bg-[#020617] relative flex flex-col items-center overflow-hidden">

            {/* Background Effects */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
            <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-[#020617] to-[#020617] pointer-events-none" />

            <div className="max-w-6xl mx-auto  w-full relative z-10">

                {/* 1. Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-purple-500/30 bg-purple-500/10">
                        <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-[11px] font-bold text-purple-400 uppercase tracking-widest">Business Intelligence</span>
                    </div>

                    <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
                        It Gets <span className="text-purple-400">Smarter Every Day.</span>
                    </h2>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        Your AI employee learns from every customer interaction. It remembers preferences, updates pricing knowledge, and gets better at selling—automatically.
                    </p>
                </div>

                {/* 2. Interactive Feature Showcase */}
                <div className="grid lg:grid-cols-12 gap-8 items-start mb-24 relative">

                    {/* LEFT: Navigation Tabs */}
                    <div className="lg:col-span-4 flex flex-col gap-3">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "group flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 text-left relative overflow-hidden",
                                    activeTab === tab.id
                                        ? `bg-slate-900/80 border-slate-700 shadow-xl`
                                        : "bg-transparent border-transparent hover:bg-slate-800/50 hover:border-slate-800"
                                )}
                            >
                                {/* Active Indicator Bar */}
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className={`absolute left-0 top-0 bottom-0 w-1 ${tab.bg.replace('/10', '')}`}
                                    />
                                )}

                                <div className={cn(
                                    "p-2.5 rounded-lg transition-colors",
                                    activeTab === tab.id ? `${tab.bg} ${tab.color}` : "bg-slate-800 text-slate-500 group-hover:text-slate-300"
                                )}>
                                    <tab.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className={cn("font-bold text-sm", activeTab === tab.id ? "text-white" : "text-slate-400")}>
                                        {tab.label}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        {tab.id === "learning" && "Your AI learning daily"}
                                        {tab.id === "timeline" && "See what changed"}
                                        {tab.id === "manager" && "Update products/prices"}
                                        {tab.id === "analytics" && "Check growth stats"}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* RIGHT: Visual Preview (The "Screen") */}
                    <div className="lg:col-span-8 z-20">
                        <div className="relative rounded-2xl border border-white/10 bg-[#0c1222] shadow-2xl overflow-hidden min-h-[450px] z-20">
                            {/* Window Chromes */}
                            <div className="h-10 border-b border-white/5 bg-white/5 flex items-center px-4 gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                                <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
                                <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                                <div className="ml-4 text-[10px] font-mono text-slate-500">cluaiz_memory_studio_v1.0.exe</div>
                            </div>

                            {/* Inner Content Area */}
                            <TabContent activeTab={activeTab} />

                            {/* System Status Footer */}
                            <div className="absolute bottom-0 left-0 right-0 h-8 border-t border-white/5 bg-white/5  backdrop-blur-md  flex items-center px-4 text-[10px] font-mono text-slate-500 z-10">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2" /> System Status: Online
                            </div>

                            {/* Border Beam Effect */}
                            <BorderBeam size={300} duration={10} colorFrom="#a855f7" colorTo="#3b82f6" />
                        </div>
                    </div>

                </div>

                {/* 3. The 4 Features of Memory (Advanced Spotlight Cards with Hover Control) */}
                <div className="grid md:grid-cols-4 gap-4 w-full relative z-10 text-left">
                    {[
                        {
                            id: "learning",
                            icon: Cpu,
                            title: "1. Auto-Training",
                            desc: "Your AI listens to sales calls & chats to learn new objections and customer needs automatically.",
                            color: "text-amber-400",
                            spotlight: "from-amber-500/20 via-amber-500/5 to-transparent",
                            iconBg: "bg-amber-500/10",
                            iconBorder: "border-amber-500/20"
                        },
                        {
                            id: "timeline",
                            icon: Layers,
                            title: "2. Activity Log",
                            desc: "See exactly what your AI learned today. Full transparency on every new fact it memorized.",
                            color: "text-blue-400",
                            spotlight: "from-blue-500/20 via-blue-500/5 to-transparent",
                            iconBg: "bg-blue-500/10",
                            iconBorder: "border-blue-500/20"
                        },
                        {
                            id: "manager",
                            icon: GitBranch,
                            title: "3. Knowledge Base",
                            desc: "A simple view of everything your AI knows. Add new products or pricing updates in seconds.",
                            color: "text-purple-400",
                            spotlight: "from-purple-500/20 via-purple-500/5 to-transparent",
                            iconBg: "bg-purple-500/10",
                            iconBorder: "border-purple-500/20"
                        },
                        {
                            id: "analytics",
                            icon: LineChart,
                            title: "4. ROI & Impact",
                            desc: "Track how much smarter your AI is getting and how many hours of training you saved.",
                            color: "text-emerald-400",
                            spotlight: "from-emerald-500/20 via-emerald-500/5 to-transparent",
                            iconBg: "bg-emerald-500/10",
                            iconBorder: "border-emerald-500/20"
                        },
                    ].map((item, i) => (
                        <div key={i} onMouseEnter={() => setActiveTab(item.id)} className="h-full">
                            <SpotlightCard delay={i * 0.1} spotlightColor={item.spotlight} className={activeTab === item.id ? "border-white/40 bg-white/[0.04]" : ""}>
                                <div className={`w-12 h-12 rounded-xl ${item.iconBg} border ${item.iconBorder} flex items-center justify-center mb-4 ${item.color} shadow-lg relative z-10 group-hover:scale-110 transition-transform duration-300`}>
                                    <item.icon className="w-6 h-6" />
                                </div>

                                <h3 className={`text-base font-bold mb-2 relative z-10 transition-colors ${activeTab === item.id ? "text-white" : "text-white/70"}`}>
                                    {item.title}
                                </h3>

                                <p className="text-xs text-slate-400 leading-relaxed relative z-10 group-hover:text-slate-300 transition-colors">
                                    {item.desc}
                                </p>

                                {/* Active State Indicator */}
                                {activeTab === item.id && (
                                    <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-white shadow-[0_0_10px_white] animate-pulse" />
                                )}
                            </SpotlightCard>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
}
