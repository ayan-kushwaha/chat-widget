"use client";
import React, { useEffect, useRef } from "react";
import { RetroGrid } from "@/components/ui/retro-grid";
import { BorderBeam } from "@/components/ui/border-beam";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { Activity, ArrowUpRight, Globe, Zap, Server, Shield } from "lucide-react";

// --- Helper: Number Ticker ---
const NumberTicker = ({ value, delay = 0 }: { value: number, delay?: number }) => {
    const ref = useRef<HTMLSpanElement>(null);
    const motionValue = useMotionValue(0);
    const springValue = useSpring(motionValue, { damping: 60, stiffness: 100 });
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    useEffect(() => {
        if (isInView) {
            setTimeout(() => {
                motionValue.set(value);
            }, delay * 1000);
        }
    }, [motionValue, isInView, value, delay]);

    useEffect(() => {
        springValue.on("change", (latest) => {
            if (ref.current) {
                ref.current.textContent = Intl.NumberFormat("en-US").format(Math.floor(latest));
            }
        });
    }, [springValue]);

    return <span ref={ref} />;
};

export function AnalyticsPreview() {
    return (
        <section className="py-32 bg-[#020617] relative overflow-hidden">
            {/* Retro Grid Background */}
            <RetroGrid className="opacity-[0.08]" />

            {/* Ambient Glows */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Header */}
                <div className="text-center mb-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">Live Business Pulse</span>
                    </div>

                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
                        Watch Your Business <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Grow Live.</span>
                    </h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
                        Stop guessing. See exactly who is on your website, what they want to buy, and how much money you are saving. It's your 24/7 Command Center for revenue.
                    </p>
                </div>

                {/* Dashboard Grid - Expanded Mission Control (12 Cards) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-7xl mx-auto mb-24">

                    {/* 1. GLOBAL NEURAL ACTIVITY & TERMINAL (Span 8, Height 2x) */}
                    <div className="md:col-span-8 md:row-span-2 min-h-[500px] relative overflow-hidden rounded-3xl border border-white/10 bg-[#0c1222] p-0 flex flex-col group">
                        <BorderBeam size={400} duration={15} colorFrom="#10b981" colorTo="#3b82f6" />

                        <div className="absolute inset-0 opacity-20">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 to-transparent" />
                            <div className="w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
                        </div>

                        {/* Radar Scan Effect */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full border border-white/5 opacity-10 animate-[spin_10s_linear_infinite] pointer-events-none">
                            <div className="w-full h-1/2 bg-gradient-to-b from-emerald-500/10 to-transparent blur-3xl" />
                        </div>

                        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5 backdrop-blur-sm z-10">
                            <div className="flex items-center gap-3">
                                <Globe className="w-4 h-4 text-indigo-400" />
                                <span className="text-xs font-bold text-indigo-100 tracking-wider">LIVE_BUSINESS_ACTIVITY</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-mono text-emerald-500">LIVE CONNECTION</span>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col relative p-4 overflow-hidden">
                            {/* Map Visualization Layer (Background) */}
                            <div className="absolute inset-0 z-0">
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0c1222] via-transparent to-transparent z-10" />
                                {[...Array(12)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.8)]"
                                        initial={{ x: Math.random() * 800, y: Math.random() * 400, opacity: 0 }}
                                        animate={{ opacity: [0, 1, 0], scale: [0.5, 2, 0.5] }}
                                        transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, repeatDelay: Math.random() }}
                                        style={{ left: `${10 + Math.random() * 80}%`, top: `${15 + Math.random() * 60}%` }}
                                    />
                                ))}
                            </div>

                            {/* Main Content Layout (Flex Column) */}
                            <div className="relative z-20 flex-1 flex flex-col gap-4">

                                {/* Top Row: 3 Cards Inline */}
                                <div className="grid grid-cols-3 gap-4">
                                    {/* 1. Active Nodes (Left) */}
                                    <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Active Visitors</div>
                                            <div className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">High Traffic</div>
                                        </div>
                                        <div className="space-y-1.5">
                                            {[
                                                { id: "NODE_ALPHA_01", load: "32%" },
                                                { id: "NODE_BETA_04", load: "89%" },
                                                { id: "NODE_GAMMA_09", load: "12%" }
                                            ].map((node, i) => (
                                                <div key={i} className="flex items-center justify-between text-[10px] pb-1 border-b border-white/5 last:border-0">
                                                    <span className="text-slate-300 font-mono">{i === 0 ? "Pricing Page" : i === 1 ? "Checkout" : "Home"}</span>
                                                    <div className="w-8 h-1 bg-slate-800 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: node.load }}
                                                            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                                                            className={`h-full ${parseInt(node.load) > 80 ? 'bg-amber-500' : 'bg-blue-500'}`}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 2. System Load (Center - NEW) */}
                                    <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg p-3 flex flex-col items-center justify-center text-center">
                                        <div className="relative w-16 h-16 mb-1">
                                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                                <path className="text-slate-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                                                <motion.path
                                                    className="text-indigo-500"
                                                    initial={{ pathLength: 0 }}
                                                    animate={{ pathLength: 0.72 }}
                                                    transition={{ duration: 2, ease: "easeOut" }}
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                    strokeDasharray="100, 100"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                                <span className="text-xs font-bold text-white">High</span>
                                                <span className="text-[8px] text-slate-500 uppercase">DEMAND</span>
                                            </div>
                                        </div>
                                        <div className="text-[9px] text-indigo-300 font-mono">Peak Hours</div>
                                    </div>

                                    {/* 3. Network Status (Right) */}
                                    <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Store Status</div>
                                            <Shield className="w-3 h-3 text-emerald-400" />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-[10px]">
                                                <span className="text-slate-300">AI Agents</span>
                                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px]">
                                                <span className="text-slate-300">Ordering System</span>
                                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                            </div>
                                            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
                                                <div className="h-full w-[85%] bg-blue-500 animate-pulse"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Live Terminal Log (Bottom) */}
                                <div className="mt-auto bg-black/80 backdrop-blur-md rounded-xl border border-white/10 p-4 font-mono text-[10px] md:text-[11px] text-slate-300 h-80 overflow-hidden flex flex-col justify-end shadow-2xl relative group-hover:border-white/20 transition-colors">
                                    <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                                    <div className="flex justify-between items-center opacity-70 mb-3 border-b border-white/10 pb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="flex gap-1.5">
                                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
                                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/50" />
                                                <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50" />
                                            </div>
                                            <span className="ml-2 font-mono text-xs text-slate-400">assistant@cluaiz:~ /live/customer_chats</span>
                                        </div>
                                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 animate-pulse">● LIVE CONVERSATIONS</span>
                                    </div>
                                    <div className="space-y-1.5 overflow-hidden relative">
                                        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10" />
                                        {[
                                            { time: "10:42:01", type: "VISIT", color: "text-blue-400", msg: "New Visitor from Mumbai on 'Pricing Page'" },
                                            { time: "10:42:02", type: "LEAD", color: "text-purple-400", msg: "New Lead Detected: Rahul (rahul@gmail...)" },
                                            { time: "10:42:02", type: "ASK", color: "text-cyan-400", msg: "Rahul asked: 'What is the price for Pro plan?'" },
                                            { time: "10:42:03", type: "THINK", color: "text-indigo-400", msg: "Checking latest pricing offers..." },
                                            { time: "10:42:04", type: "REPLY", color: "text-amber-400", msg: "Replied: 'Pro plan is $29/mo with 7-day trial'" },
                                            { time: "10:42:04", type: "HAPPY", color: "text-pink-400", msg: "Customer Mood: Interested -> Very Happy 😊" },
                                            { time: "10:42:05", type: "SALE", color: "text-emerald-500", msg: "SUCCESS: Rahul clicked 'Start Free Trial'" },
                                            { time: "10:42:06", type: "ALERT", color: "text-red-400", msg: "Blocked Spam Bot (IP: 192.168.x.x)" },
                                            { time: "10:42:07", type: "SYNC", color: "text-blue-300", msg: "Updating Sales Dashboard (+1 Conversion)" },
                                            { time: "10:42:08", type: "INFO", color: "text-slate-400", msg: "Waiting for next customer..." },
                                        ].map((log, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: -10 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.15 }}
                                                className="flex gap-3 font-mono border-l-2 border-transparent hover:border-white/10 pl-2 transition-colors"
                                            >
                                                <span className="text-slate-600 w-[60px] shrink-0">[{log.time}]</span>
                                                <span className={`${log.color} font-bold w-[70px] shrink-0`}>{log.type}</span>
                                                <span className="truncate text-slate-300">{log.msg}</span>
                                            </motion.div>
                                        ))}
                                        <motion.div
                                            animate={{ opacity: [0, 1, 0] }}
                                            transition={{ duration: 0.8, repeat: Infinity }}
                                            className="text-emerald-500 font-bold pl-2"
                                        >_</motion.div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. SENTIMENT WAVEFORM (Span 4) */}
                    <div className="md:col-span-4 h-[250px] rounded-3xl border border-white/10 bg-[#0c1222] p-6 flex flex-col relative overflow-hidden group">
                        <BorderBeam size={200} duration={10} delay={5} colorFrom="#ec4899" colorTo="#8b5cf6" />
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <Activity className="w-4 h-4 text-pink-400" /> Customer Mood
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                                </span>
                                <span className="text-xs text-pink-400 font-mono animate-pulse">LIVE</span>
                            </div>
                        </div>
                        <div className="flex-1 flex items-center justify-center gap-1 mb-2">
                            {[50, 80, 45, 90, 60, 30, 70, 40, 85, 55, 95, 40, 70, 90, 50, 30, 60, 40].map((h, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ height: 20 }}
                                    animate={{ height: [20, h, 20] }}
                                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
                                    className="w-1.5 bg-gradient-to-t from-pink-500 to-purple-500 rounded-full opacity-80"
                                />
                            ))}
                        </div>
                        {/* Content Tiles */}
                        <div className="grid grid-cols-3 gap-2 mt-auto pt-2">
                            <div className="bg-white/5 rounded p-2 text-center border border-white/5">
                                <div className="text-[10px] text-slate-400 mb-0.5">Happy</div>
                                <div className="text-lg font-bold text-emerald-400 leading-none">64%</div>
                            </div>
                            <div className="bg-white/5 rounded p-2 text-center border border-white/5">
                                <div className="text-[10px] text-slate-400 mb-0.5">Neutral</div>
                                <div className="text-lg font-bold text-slate-200 leading-none">28%</div>
                            </div>
                            <div className="bg-white/5 rounded p-2 text-center border border-white/5">
                                <div className="text-[10px] text-slate-400 mb-0.5">Upset</div>
                                <div className="text-lg font-bold text-pink-500 leading-none">8%</div>
                            </div>
                        </div>
                    </div>

                    {/* 3. INTENT BREAKDOWN (Span 4) */}
                    <div className="md:col-span-4 h-[250px] rounded-3xl border border-white/10 bg-[#0c1222] p-6 flex flex-col relative overflow-hidden group">
                        <BorderBeam size={200} duration={12} delay={2} colorFrom="#f59e0b" colorTo="#f43f5e" />
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-400" /> User Intent
                            </h3>
                        </div>
                        <div className="space-y-4">
                            {[
                                { label: "Wants to Buy", val: 82, color: "bg-amber-500" },
                                { label: "Needs Help", val: 45, color: "bg-blue-500" },
                                { label: "Just Browsing", val: 28, color: "bg-purple-500" }
                            ].map((item, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-xs mb-1 text-slate-400">
                                        <span>{item.label}</span>
                                        <span className="text-white">{item.val}%</span>
                                    </div>
                                    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${item.val}%` }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 1.5, delay: 0.2 }}
                                            className={`h-full rounded-full ${item.color}`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 4. CONVERSION FUNNEL (Span 4) */}
                    <div className="md:col-span-4 h-[220px] rounded-3xl border border-white/10 bg-[#0c1222] p-5 flex flex-col relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <ArrowUpRight className="w-4 h-4 text-emerald-400" /> Pipeline
                            </h3>
                            <span className="text-xs text-emerald-400 font-mono">+24%</span>
                        </div>
                        <div className="flex-1 flex flex-col justify-center gap-2">
                            {/* Funnel Steps */}
                            <div className="w-full bg-slate-900/50 rounded-lg p-1.5 flex justify-between items-center border border-white/5">
                                <span className="text-[10px] text-slate-400">Visitors</span>
                                <div className="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden"><div className="h-full w-full bg-slate-600 rounded-full"></div></div>
                                <span className="text-[10px] font-bold text-white">12.5k</span>
                            </div>
                            <div className="w-[90%] mx-auto bg-slate-900/50 rounded-lg p-1.5 flex justify-between items-center border border-white/5">
                                <span className="text-[10px] text-slate-400">Leads</span>
                                <div className="h-1.5 w-20 bg-slate-800 rounded-full overflow-hidden"><div className="h-full w-3/4 bg-blue-500 rounded-full"></div></div>
                                <span className="text-[10px] font-bold text-white">8.2k</span>
                            </div>
                            <div className="w-[80%] mx-auto bg-slate-900/50 rounded-lg p-1.5 flex justify-between items-center border border-white/5">
                                <span className="text-[10px] text-slate-400">Qualified</span>
                                <div className="h-1.5 w-16 bg-slate-800 rounded-full overflow-hidden"><div className="h-full w-2/3 bg-purple-500 rounded-full"></div></div>
                                <span className="text-[10px] font-bold text-white">4.1k</span>
                            </div>
                            <div className="w-[70%] mx-auto bg-emerald-900/20 rounded-lg p-1.5 flex justify-between items-center border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                                <span className="text-[10px] text-emerald-400 font-bold">Closed</span>
                                <div className="h-1.5 w-12 bg-slate-800 rounded-full overflow-hidden"><div className="h-full w-full bg-emerald-500 rounded-full"></div></div>
                                <span className="text-[10px] font-bold text-white">1.9k</span>
                            </div>
                        </div>
                    </div>

                    {/* 5. THREAT MONITOR (Span 4) */}
                    <div className="md:col-span-4 h-[220px] rounded-3xl border border-white/10 bg-[#0c1222] p-4 flex flex-col relative overflow-hidden group">
                        <BorderBeam size={200} duration={8} delay={0} colorFrom="#ef4444" colorTo="#f87171" />
                        <div className="absolute inset-0 bg-red-900/5" />

                        <div className="flex items-center justify-between mb-3 relative z-10">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <Shield className="w-4 h-4 text-red-500" /> Spam Blocker
                            </h3>
                            <span className="text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20 animate-pulse">ACTIVE</span>
                        </div>

                        {/* Scrolling Threat Log */}
                        <div className="flex-1 overflow-hidden relative z-10 space-y-2 mask-linear-fade">
                            <div className="absolute inset-0 bg-gradient-to-b from-[#0c1222] via-transparent to-[#0c1222] z-20 pointer-events-none opacity-20" />
                            {[
                                { ip: "192.168.x.x", type: "Spam Bot", loc: "UK" },
                                { ip: "10.0.x.x", type: "Fake Traffic", loc: "RU" },
                                { ip: "172.16.x.x", type: "Scraper", loc: "CN" },
                                { ip: "45.33.x.x", type: "Competitor Bot", loc: "US" },
                                { ip: "89.10.x.x", type: "Phishing", loc: "IN" },
                                { ip: "203.0.x.x", type: "Malware", loc: "BR" }
                            ].map((threat, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.8, duration: 0.5 }}
                                    className="flex items-center justify-between bg-red-500/5 border border-red-500/10 rounded p-1.5"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-300 font-mono">{threat.ip}</span>
                                            <span className="text-[9px] text-red-400">{threat.type}</span>
                                        </div>
                                    </div>
                                    <span className="text-[9px] text-slate-500 font-bold">{threat.loc}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* 6. RESPONSE ENGINE SPEEDS (Span 4) */}
                    <div className="md:col-span-4 h-[220px] rounded-3xl border border-white/10 bg-[#0c1222] p-5 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] pointer-events-none" />

                        <div className="flex items-center justify-between z-10">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <Server className="w-4 h-4 text-indigo-400" /> Reply Speed
                            </h3>
                            <span className="text-xs font-mono text-indigo-300">Instant</span>
                        </div>

                        {/* Latency Graph Visualization */}
                        <div className="flex-1 flex items-end justify-center relative mt-2">
                            <div className="absolute top-[-27px]  inset-x-0 bottom-0 h-24 flex items-end justify-between gap-1 opacity-50">
                                {[40, 60, 30, 80, 50, 90, 40, 70, 30, 60, 20, 50, 80, 40, 70].map((h, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ height: "20%" }}
                                        animate={{ height: [`${h}%`, `${h * 0.6}%`, `${h}%`] }}
                                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                                        className="w-full bg-gradient-to-t from-indigo-600 to-transparent rounded-t-sm"
                                    />
                                ))}
                            </div>

                            {/* Overlay Stats */}
                            <div className="grid grid-cols-2 gap-3 w-full relative z-10 mb-2">
                                <div className="bg-white/5 border border-white/10 p-2 rounded-lg backdrop-blur-sm">
                                    <div className="text-[9px] text-slate-400 uppercase">Avg. Time</div>
                                    <div className="text-xl font-bold text-white flex items-end gap-1">
                                        0.1 <span className="text-[10px] text-slate-500 mb-1">sec</span>
                                    </div>
                                </div>
                                <div className="bg-white/5 border border-white/10 p-2 rounded-lg backdrop-blur-sm">
                                    <div className="text-[9px] text-slate-400 uppercase">Chats/Hr</div>
                                    <div className="text-xl font-bold text-white flex items-end gap-1">
                                        1.2k <span className="text-[10px] text-slate-500 mb-1">chats</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ROW 4: 4 x 3-span cards (Total 12 cols) */}

                    {/* 7. KNOWLEDGE GAPS (Span 3) */}
                    <div className="md:col-span-3 h-[180px] rounded-3xl border border-white/10 bg-[#0c1222] p-5 flex flex-col relative overflow-hidden">
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-3">
                            <Shield className="w-3 h-3 text-red-400" /> Unanswered Qs
                        </h3>
                        <div className="space-y-3">
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                                <div className="flex justify-between text-[10px] mb-1">
                                    <span className="text-red-300">"Bulk Discounts?"</span>
                                    <span className="text-red-400 font-bold">14x</span>
                                </div>
                                <div className="w-full h-1 bg-red-900/30 rounded-full"><div className="w-[80%] h-full bg-red-500 rounded-full" /></div>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-lg p-2">
                                <div className="flex justify-between text-[10px] mb-1">
                                    <span className="text-slate-400">"Return Policy?"</span>
                                    <span className="text-slate-300">8x</span>
                                </div>
                                <div className="w-full h-1 bg-white/10 rounded-full"><div className="w-[40%] h-full bg-slate-400 rounded-full" /></div>
                            </div>
                        </div>
                    </div>

                    {/* 8. COST SAVINGS (Span 3) */}
                    <div className="md:col-span-3 h-[180px] rounded-3xl border border-white/10 bg-[#0c1222] p-5 flex flex-col justify-center text-center relative overflow-hidden">
                        <BorderBeam size={150} duration={8} delay={0} colorFrom="#10b981" colorTo="#34d399" />
                        <div className="absolute inset-0 bg-emerald-900/5" />
                        <div className="relative z-10">
                            <div className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest mb-1">Money Saved</div>
                            <div className="text-3xl font-bold text-white tracking-tight mb-0.5">
                                $<NumberTicker value={14250} />
                            </div>
                            <div className="text-[9px] text-slate-500">vs Hiring Humans</div>
                            <div className="mt-3 inline-block px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] border border-emerald-500/20">3.5 Staff Eqv.</div>
                        </div>
                    </div>

                    {/* 9. ACTIVE CHANNELS (Span 3) */}
                    <div className="md:col-span-3 h-[180px] rounded-3xl border border-white/10 bg-[#0c1222] p-5 flex flex-col relative overflow-hidden">
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-3">
                            <Globe className="w-3 h-3 text-blue-400" /> Channels
                        </h3>
                        <div className="flex items-center gap-2 h-full pb-2">
                            <div className="relative w-14 h-14 rounded-full border-4 border-slate-700 flex items-center justify-center shrink-0">
                                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
                                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray="60, 100" />
                                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#22c55e" strokeWidth="4" strokeDasharray="30, 100" strokeDashoffset="-60" />
                                </svg>
                            </div>
                            <div className="space-y-1 text-[10px]">
                                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded bg-blue-500" /> <span className="text-slate-300">Web 60%</span></div>
                                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded bg-emerald-500" /> <span className="text-slate-300">WA 30%</span></div>
                                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded bg-purple-500" /> <span className="text-slate-300">Email 10%</span></div>
                            </div>
                        </div>
                    </div>

                    {/* 10. USER REGIONS (Span 3) - NEW */}
                    <div className="md:col-span-3 h-[180px] rounded-3xl border border-white/10 bg-[#0c1222] p-5 flex flex-col relative overflow-hidden">
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-3">
                            <Globe className="w-3 h-3 text-indigo-400" /> Top Regions
                        </h3>
                        <div className="space-y-2">
                            {[{ c: "USA", v: "42%" }, { c: "India", v: "28%" }, { c: "UK", v: "15%" }].map((r, i) => (
                                <div key={i} className="flex items-center justify-between text-[10px] bg-white/5 p-1.5 rounded">
                                    <span className="text-slate-300">{r.c}</span>
                                    <span className="text-indigo-400 font-mono">{r.v}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
