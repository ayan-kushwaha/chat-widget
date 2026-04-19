"use client";

import React, { useState, useEffect } from "react";
import { Timeline } from "@/components/ui/timeline";
import { cn } from "@/lib/utils";
import { Zap, Bot, Database, Search, FileText, CheckCircle2, MessageSquare, User, Loader2, ArrowUpRight, Globe, FileType } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- ANIMATION 1: MULTI-SOURCE INPUT (URL, PDF, MANUAL) ---
const WebsiteScan = () => {
    const [source, setSource] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setSource((prev) => (prev + 1) % 3);
        }, 2500); // Change every 2.5s
        return () => clearInterval(interval);
    }, []);

    const sources = [
        {
            type: "Website",
            icon: <Globe className="w-4 h-4 text-blue-400" />,
            text: "https://your-business.com",
            color: "blue",
            badge: "Scanning URL"
        },
        {
            type: "Document",
            icon: <FileType className="w-4 h-4 text-orange-400" />,
            text: "pricing_guide.pdf",
            color: "orange",
            badge: "Reading PDF"
        },
        {
            type: "Manual",
            icon: <FileText className="w-4 h-4 text-purple-400" />,
            text: "Return Policy: 30 Days...",
            color: "purple",
            badge: "Importing Text"
        }
    ];

    const current = sources[source];

    return (
        <div className="h-52 w-full bg-[#0c1222]/50 flex flex-col items-center relative overflow-hidden group">
            {/* Header matches source type */}
            <div className="w-full h-8 bg-[#1e293b] border-b border-slate-700 flex items-center px-4 gap-2 z-20 shrink-0 shadow-sm transition-colors duration-500">
                <div className="flex gap-1.5 mr-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 h-5 bg-[#0f172a] rounded flex items-center px-3 border border-slate-700/50 overflow-hidden relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={source}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            className="flex items-center gap-2 w-full"
                        >
                            {current.icon}
                            <span className={`text-[10px] font-mono text-${current.color}-400`}>{current.text}</span>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Content Area */}
            <div className="w-3/4 mt-4 space-y-3 relative z-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={source}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 0.5, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-3"
                    >
                        {/* Dynamic Content Representation */}
                        <div className={`h-20 w-full bg-${current.color}-500/10 border border-${current.color}-500/20 rounded flex flex-col p-3 gap-2`}>
                            <div className={`h-2 w-1/3 bg-${current.color}-500/40 rounded`} />
                            <div className={`h-2 w-2/3 bg-${current.color}-500/30 rounded`} />
                            {source === 0 && <div className="h-8 w-full bg-slate-700/30 rounded mt-1" />}
                            {source === 1 && <div className="space-y-1"><div className="h-1 w-full bg-slate-700/30" /> <div className="h-1 w-full bg-slate-700/30" /></div>}
                            {source === 2 && <div className="h-10 w-full bg-slate-700/30 rounded flex items-center justify-center text-[8px] text-slate-500">Raw Text Data</div>}
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Scanning Laser Overlay */}
                <motion.div
                    className={`absolute inset-x-0 h-0.5 z-20 bg-${current.color}-500 shadow-[0_0_20px_rgba(59,130,246,1)]`}
                    style={{ top: "30%" }}
                    animate={{ top: ["0%", "100%"], opacity: [0, 1, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                />
            </div>

            {/* Dynamic Helper Badge */}
            <div className={`absolute bottom-3 right-3 bg-${current.color}-600/90 text-white px-3 py-1.5 rounded-md text-[10px] font-bold shadow-xl z-30 flex items-center gap-2 backdrop-blur-md border border-white/10 transition-colors duration-500`}>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="w-24">{current.badge}</span>
            </div>
        </div>
    );
};

// --- ANIMATION 2: MULTI-STEP LOGS (Matrix Style) ---
const BrainProcess = () => {
    const [visibleLogs, setVisibleLogs] = useState<string[]>([]);

    useEffect(() => {
        const fullLogs = [
            "Initializing Crawler...",
            "Accessing sitemap.xml",
            "Discovered 24 URLs",
            "Parsing 'Pricing' PDF...",
            "Vectorizing Manual Text...",
            "Learning Refund Policy...",
            "Optimizing Responses...",
            "Training Complete."
        ];

        let i = 0;
        const interval = setInterval(() => {
            if (i < fullLogs.length) {
                setVisibleLogs(prev => [...prev.slice(-6), fullLogs[i]]); // Keep last 6
                i++;
            } else {
                i = 0;
                setVisibleLogs([]);
            }
        }, 800);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-52 w-full bg-[#0a0f18]/80 flex flex-col relative overflow-hidden group font-mono text-[10px] p-4">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:20px_20px] opacity-20" />

            <div className="flex items-center gap-2 mb-3 text-emerald-400 font-bold border-b border-emerald-500/20 pb-2 z-10">
                <Bot className="w-3.5 h-3.5" /> Neural Training
            </div>

            <div className="space-y-2 relative z-10">
                <AnimatePresence>
                    {visibleLogs.map((log, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center gap-2 text-slate-300"
                        >
                            <span className="text-emerald-500/50 font-bold">{">"}</span>
                            <span className={log === "Training Complete." ? "text-emerald-400 font-bold" : ""}>{log}</span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Scan line effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent animate-scan pointer-events-none" />
        </div>
    );
};

// --- ANIMATION 3: CODE ---
const CodeEmbed = () => (
    <div className="h-52 w-full bg-[#0a0a0a]/50 flex flex-col relative overflow-hidden font-mono text-xs p-5">
        <div className="flex items-center justify-between text-slate-600 mb-2 border-b border-white/5 pb-2">
            <span>index.html</span>
            <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-slate-700" />
                <div className="w-2 h-2 rounded-full bg-slate-700" />
            </div>
        </div>

        <div className="space-y-1 opacity-80">
            <div className="text-slate-600">&lt;head&gt;</div>
            <div className="text-slate-600 pl-4">&lt;meta charset="UTF-8"&gt;</div>
            <div className="text-slate-600 pl-4">&lt;title&gt;My Business&lt;/title&gt;</div>

            <motion.div
                className="pl-4 py-2 my-1 bg-indigo-500/10 border border-indigo-500/20 rounded text-indigo-400"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "100%" }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                style={{ whiteSpace: "nowrap", overflow: "hidden" }}
            >
                &lt;script src="cluaiz.js"&gt;&lt;/script&gt;
            </motion.div>

            <div className="text-slate-600">&lt;/head&gt;</div>
        </div>

        <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1 bg-indigo-500 text-white font-bold rounded text-[10px] shadow-lg shadow-indigo-500/20">
            <CheckCircle2 className="w-3 h-3" /> Snippet Added
        </div>
    </div>
);

// --- ANIMATION 4: INFINITE LEADS STREAM ---
const LiveActive = () => {
    // Longer list for infinite scroll feel
    const leads = [
        { name: "Rahul S.", action: "Booked Appointment", time: "Just now" },
        { name: "Sarah J.", action: "Asked about Pricing", time: "2s ago" },
        { name: "Amit K.", action: "Requesting Callback", time: "5s ago" },
        { name: "Mike D.", action: "Browsing Products", time: "10s ago" },
        { name: "Lisa M.", action: "Started Chat", time: "12s ago" }
    ];

    return (
        <div className="h-52 w-full bg-[#022c22]/50 flex flex-col p-4 relative overflow-hidden">
            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2 relative z-20 bg-[#022c22]/10 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-bold text-emerald-400 uppercase">Live Dashboard</span>
                </div>
                <span className="text-[10px] text-emerald-500/70 font-mono">Online</span>
            </div>

            <div className="relative z-10 overflow-hidden h-full mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)">
                <motion.div
                    className="space-y-3"
                    animate={{ y: [-10, -100] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                    {[...leads, ...leads].map((lead, i) => (
                        <div key={i} className="flex items-center gap-3 p-2.5 rounded bg-emerald-900/30 border border-emerald-500/20 backdrop-blur-sm">
                            <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                <User className="w-3.5 h-3.5 text-emerald-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-0.5">
                                    <span className="text-xs font-bold text-emerald-100 truncate">{lead.name}</span>
                                    <span className="text-[9px] text-emerald-500 whitespace-nowrap">{lead.time}</span>
                                </div>
                                <div className="text-[10px] text-emerald-400/80 truncate">{lead.action}</div>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* Stats Footer */}
            <div className="absolute bottom-0 inset-x-0 h-8 bg-[#022c22] border-t border-emerald-500/20 flex items-center justify-around z-20">
                <div className="text-[9px] text-emerald-400 flex items-center gap-1"><ArrowUpRight className="w-2.5 h-2.5" /> +12% Conv.</div>
                <div className="text-[9px] text-emerald-400 flex items-center gap-1"><MessageSquare className="w-2.5 h-2.5" /> 24/7 Active</div>
            </div>
        </div>
    );
}


export function HowItWorks() {
    const data = [
        {
            title: "1. Connect Data Sources",
            content: (
                <div className="group rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-md overflow-hidden hover:border-blue-500/30 transition-all duration-300 hover:bg-slate-900/60 shadow-xl">
                    <WebsiteScan />
                    <div className="p-8 border-t border-white/5 bg-white/[0.02]">
                        <p className="text-slate-300 text-base leading-relaxed">
                            Paste your website URL, upload documents, or simply enter text manually. Cluaiz ingests data from any source—Google Drive, internal docs, or product sheets—creating a unified brain for your business.
                        </p>
                    </div>
                </div>
            ),
        },
        {
            title: "2. Auto-Training (60s)",
            content: (
                <div className="group rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-md overflow-hidden hover:border-emerald-500/30 transition-all duration-300 hover:bg-slate-900/60 shadow-xl">
                    <BrainProcess />
                    <div className="p-8 border-t border-white/5 bg-white/[0.02]">
                        <p className="text-slate-300 text-base leading-relaxed">
                            In under 60 seconds, our AI deep-scans your entire site—reading pricing tables, return policies, and product specs. It builds a sales-ready knowledge base specifically optimized to drive conversions and handle objections.
                        </p>
                    </div>
                </div>
            ),
        },
        {
            title: "3. Copy Snippet",
            content: (
                <div className="group rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-md overflow-hidden hover:border-indigo-500/30 transition-all duration-300 hover:bg-slate-900/60 shadow-xl">
                    <CodeEmbed />
                    <div className="p-8 border-t border-white/5 bg-white/[0.02]">
                        <p className="text-slate-300 text-base leading-relaxed">
                            Forget clear APIs or complex webhooks. Just copy our single universal line of code and paste it into your header. It loads asynchronously, works on any platform (Shopify, WordPress, React), and never slows down your site.
                        </p>
                    </div>
                </div>
            ),
        },
        {
            title: "4. Go Live",
            content: (
                <div className="group rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-md overflow-hidden hover:border-emerald-500/30 transition-all duration-300 hover:bg-slate-900/60 shadow-xl">
                    <LiveActive />
                    <div className="p-8 border-t border-white/5 bg-white/[0.02]">
                        <p className="text-slate-300 text-base leading-relaxed">
                            Your AI workforce is now live. It engages 100% of traffic, qualifies leads in real-time, and books high-value appointments directly to your calendar—driving measurable revenue while you focus on scaling.
                        </p>
                    </div>
                </div>
            ),
        },
    ];

    return (
        <section className="w-full relative overflow-hidden bg-slate-950 py-24">
            {/* Background Pattern - Smooth Fade */}
            <RetroGrid />

            {/* Header */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 mb-12 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full border border-indigo-500/30 bg-indigo-500/10 cursor-default shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                    <Zap className="w-4 h-4 text-indigo-400 fill-indigo-400" />
                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Start in 2 Minutes</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
                    Setup is <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Instant.</span>
                </h2>
                <p className="text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
                    Forget expensive developers and months of custom coding. Cluaiz is a battle-tested, plug-and-play solution designed for speed. If you can copy-paste, you can deploy a Fortune 500-grade sales infrastructure today.
                </p>
            </div>

            {/* Timeline */}
            <div className="max-w-7xl mx-auto">
                <Timeline data={data} />
            </div>

        </section>
    );
}

// RetroGrid with Mask
function RetroGrid() {
    return (
        <div className="absolute inset-0 pointer-events-none"
            style={{
                backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                opacity: 0.05,
                maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)'
            }}
        />
    )
}
