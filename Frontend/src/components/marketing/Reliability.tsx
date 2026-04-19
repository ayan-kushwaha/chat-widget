"use client";

import React from "react";
import { ShieldCheck, Server, Zap, Globe, Lock, Activity, Database, FileKey } from "lucide-react";
import { cn } from "@/lib/utils";
import { Meteors } from "@/components/ui/meteors";
import { RetroGrid } from "@/components/ui/retro-grid";
import { BorderBeam } from "@/components/ui/border-beam";
import { motion } from "framer-motion";

// --- 1. LIVE UPTIME GRAPH ---
const LiveUptimeGraph = () => {
    return (
        <div className="w-full flex flex-col justify-end h-32 mt-6 relative z-10">
            {/* Bars */}
            <div className="flex items-end h-full gap-1.5 opacity-80">
                {[...Array(24)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-sm"
                        initial={{ height: "20%" }}
                        animate={{ height: ["30%", "60%", "40%", "80%", "30%"] }}
                        transition={{
                            duration: Math.random() * 2 + 2,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "easeInOut",
                            delay: i * 0.05
                        }}
                    />
                ))}
            </div>
            {/* Base Line */}
            <div className="h-px w-full bg-emerald-500/30 mt-px" />
        </div>
    );
};

// --- 2. SECURITY SCANNER ---
const SecurityScanner = () => {
    return (
        <div className="relative w-full h-32 mt-4 rounded-lg bg-slate-900/50 border border-slate-700/50 overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 gap-1 opacity-20">
                {[...Array(24)].map((_, i) => (
                    <div key={i} className="bg-blue-500/30" />
                ))}
            </div>
            <motion.div
                className="absolute top-0 bottom-0 w-1 bg-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.5)] z-10"
                animate={{ left: ["0%", "100%", "0%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            <Lock className="w-8 h-8 text-blue-400 relative z-20" />
            <div className="absolute bottom-2 right-3 text-[10px] font-mono text-blue-400">SCAN: ACTIVE</div>
        </div>
    );
};

// --- 3. NETWORK NODES ---
const NetworkNodes = () => {
    return (
        <div className="relative w-full h-32 mt-4 rounded-lg bg-[#0c1222]/50 border border-indigo-500/20 overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <motion.line x1="20%" y1="60%" x2="50%" y2="30%" stroke="#a855f7" strokeWidth="2" strokeOpacity="0.6" initial={{ pathLength: 0 }} animate={{ pathLength: [0, 1, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />
                <motion.line x1="50%" y1="30%" x2="80%" y2="50%" stroke="#a855f7" strokeWidth="2" strokeOpacity="0.6" initial={{ pathLength: 0 }} animate={{ pathLength: [0, 1, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 1 }} />
            </svg>
            <motion.div className="absolute top-[60%] left-[20%] w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,1)] z-10" animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }} />
            <motion.div className="absolute top-[30%] left-[50%] w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,1)] z-10" animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} />
            <motion.div className="absolute top-[50%] left-[80%] w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,1)] z-10" animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity, delay: 1 }} />
            <div className="absolute bottom-2 left-3 text-[10px] font-mono text-indigo-300 tracking-wider">● LATENCY: 42ms</div>
        </div>
    );
}

// --- 4. SCALABILITY LOGS ---
const ScalingLogs = () => {
    return (
        <div className="relative w-full h-32 mt-4 rounded-lg bg-[#1a1205]/50 border border-amber-500/20 overflow-hidden font-mono text-[10px] p-3 text-amber-500/70">
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1205] via-transparent to-transparent z-10" />
            <div className="flex flex-col gap-1.5 opacity-80">
                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }}>&gt; Spawning Worker_01... OK</motion.div>
                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, delay: 0.5, repeat: Infinity }}>&gt; Load detected (85%). Scaling up...</motion.div>
                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, delay: 1, repeat: Infinity }}>&gt; +5 Nodes added in 12ms</motion.div>
                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, delay: 1.5, repeat: Infinity }}>&gt; Throughput: 12,500 req/s</motion.div>
                <div className="text-amber-400 font-bold mt-1">&gt; STATUS: AUTO-SCALING ACTIVE_</div>
            </div>
        </div>
    );
}

export function Reliability() {
    return (
        <section className="py-32 bg-[#020617] relative overflow-hidden">
            <RetroGrid className="opacity-[0.06]" />
            <div className="absolute top-1/3 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]" />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Header */}
                <div className="text-center mb-20 max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-slate-700 bg-slate-800/50 backdrop-blur-sm shadow-lg"
                    >
                        <ShieldCheck className="w-3.5 h-3.5 text-slate-300" />
                        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Enterprise Infrastructure</span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-6"
                    >
                        Engineered for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">Unbroken Trust.</span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
                        className="text-lg md:text-xl text-slate-400 leading-relaxed"
                    >
                        We run on the same infrastructure as Fortune 500 companies.
                        Your business deserves a system that <span className="text-white font-medium">never sleeps, never fails, and never stops selling.</span>
                    </motion.p>
                </div>

                {/* Bento Grid Layout - Updated to 6 Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* 1. UPTIME (Wide Card) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="col-span-1 md:col-span-2 relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-slate-900/20 p-8 backdrop-blur-md group hover:bg-slate-900/40 hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between min-h-[320px]"
                    >
                        <BorderBeam size={500} duration={10} delay={0} borderWidth={1.5} colorFrom="#10b981" colorTo="#065f46" />

                        <div className="flex flex-row justify-between items-start z-20 relative">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                                    <Activity className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white tracking-tight">99.99% Uptime SLA</h3>
                                </div>
                            </div>
                            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold font-mono animate-pulse">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> SYSTEM OPERATIONAL
                            </div>
                        </div>

                        <div className="relative flex-1 flex flex-col justify-end">
                            <LiveUptimeGraph />
                        </div>

                        <div className="mt-4 pt-4 border-t border-white/5 relative z-20">
                            <p className="text-slate-400 text-sm font-medium">
                                "The system is always online. It never misses a lead, ensuring your business captures value 24/7."
                            </p>
                        </div>
                    </motion.div>

                    {/* 2. SECURITY (Tall Card) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                        className="col-span-1 relative overflow-hidden rounded-3xl border border-blue-500/20 bg-slate-900/20 p-8 backdrop-blur-md group hover:bg-slate-900/40 hover:border-blue-500/40 transition-all duration-300"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 mb-6 shadow-lg shadow-blue-500/10">
                            <Lock className="w-6 h-6 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Bank-Grade Security</h3>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6">AES-256 Encrypted & SOC2 Compliant.</p>
                        <SecurityScanner />
                    </motion.div>

                    {/* 3. GLOBAL (Small Card) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
                        className="col-span-1 relative overflow-hidden rounded-3xl border border-purple-500/20 bg-slate-900/20 p-8 backdrop-blur-md group hover:bg-slate-900/40 hover:border-purple-500/40 transition-all duration-300"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 mb-6 shadow-lg shadow-purple-500/10">
                            <Globe className="w-6 h-6 text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Global Network</h3>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6">Mumbai, NYC, London Nodes.</p>
                        <NetworkNodes />
                    </motion.div>

                    {/* 4. [NEW] DISASTER RECOVERY (Small Card) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.25 }}
                        className="col-span-1 relative overflow-hidden rounded-3xl border border-pink-500/20 bg-slate-900/20 p-8 backdrop-blur-md group hover:bg-slate-900/40 hover:border-pink-500/40 transition-all duration-300"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20 mb-6 shadow-lg shadow-pink-500/10">
                            <Database className="w-6 h-6 text-pink-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Real-Time Backup</h3>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6">Data mirrored across 3 zones.</p>
                        {/* Simple Pulse Ring for Backup */}
                        <div className="h-32 rounded-lg bg-[#0c1222]/50 border border-pink-500/10 flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(#ec4899_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
                            <div className="relative z-10 w-12 h-12 rounded-full border-2 border-pink-500/50 flex items-center justify-center">
                                <div className="w-6 h-6 bg-pink-500 rounded-full animate-ping opacity-50 absolute" />
                                <div className="w-2 h-2 bg-pink-400 rounded-full" />
                            </div>
                            <div className="absolute bottom-2 font-mono text-[10px] text-pink-400">LAST BACKUP: 100ms AGO</div>
                        </div>
                    </motion.div>


                    {/* 5. [NEW] DATA PRIVACY COMPLIANCE (Small Card) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.25 }}
                        className="col-span-1 relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-slate-900/20 p-8 backdrop-blur-md group hover:bg-slate-900/40 hover:border-cyan-500/40 transition-all duration-300"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 mb-6 shadow-lg shadow-cyan-500/10">
                            <FileKey className="w-6 h-6 text-cyan-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">GDPR Ready</h3>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6">Full data sovereignty controls.</p>
                        {/* Shield Animation */}
                        <div className="h-32 rounded-lg bg-[#0c1222]/50 border border-cyan-500/10 flex items-center justify-center relative overflow-hidden">
                            <ShieldCheck className="w-12 h-12 text-cyan-500/20 absolute" />
                            <motion.div
                                animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 1.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-full h-full border border-cyan-500/20 rounded-full absolute"
                            />
                            <div className="absolute bottom-2 font-mono text-[10px] text-cyan-400">COMPLIANCE: VERIFIED</div>
                        </div>
                    </motion.div>


                    {/* 6. SCALABILITY (Full Width) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
                        className="col-span-1 md:col-span-3 relative overflow-hidden rounded-3xl border border-amber-500/20 bg-slate-900/20 p-8 backdrop-blur-md group hover:bg-slate-900/40 hover:border-amber-500/40 transition-all duration-300 flex flex-col md:flex-row justify-between items-center gap-8 min-h-[200px]"
                    >
                        <Meteors number={30} className="opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex items-center gap-6 w-full md:w-auto">
                            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-lg shadow-amber-500/10 shrink-0">
                                <Zap className="w-8 h-8 text-amber-400" />
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-white mb-2">Instant Scalability</h3>
                                <p className="text-slate-400">Auto-scales for viral traffic spikes. Handles 10k+ chats.</p>
                            </div>
                        </div>

                        {/* Logs on the right side for full width layout */}
                        <div className="w-full md:w-1/2">
                            <ScalingLogs />
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
