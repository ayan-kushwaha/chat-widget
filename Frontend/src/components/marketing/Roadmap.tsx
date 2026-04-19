"use client";

import { motion } from "framer-motion";
import { Zap, Inbox, Users, Search, Rocket, Smartphone, Phone, Briefcase, Eye, Calendar, Building2, MessageSquare, BarChart3, CheckCircle2, TrendingUp, Clock, DollarSign, Shield, Mail, MessageCircle, FileSpreadsheet, Slack, UserCircle, Globe, MessageCircle as MessageCircleIcon, Bell, MessageSquareIcon, Lock, Target, Instagram, Linkedin, FileText, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

// --- Bespoke Visual Animations (Cinematic Loop Versions) ---

const NodeGraph = () => (
    <div className="w-full h-48 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden relative flex items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.05)_0%,transparent_70%)]" />
        
        {/* Central Brain Hub - The "Operating System" */}
        <div className="relative z-20">
            <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full" />
            <div className="w-16 h-16 bg-slate-950 border-2 border-amber-500 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.3)] relative z-10">
                <Zap className="w-8 h-8 text-amber-500 fill-amber-500/20" />
            </div>
             {/* Pulsing Ring */}
            <motion.div 
                className="absolute inset-0 rounded-2xl border border-amber-500/50"
                animate={{ scale: [1, 1.4], opacity: [1, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
            />
        </div>

        {/* Satellite Apps - Properly Spaced */}
        {[
            { icon: MessageSquare, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", angle: 0, dist: 80, delay: 0 },
            { icon: Database, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", angle: 90, dist: 80, delay: 0.2 },
            { icon: Mail, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", angle: 180, dist: 80, delay: 0.4 },
            { icon: Slack, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", angle: 270, dist: 80, delay: 0.6 },
        ].map((node, i) => {
             const rad = (node.angle * Math.PI) / 180;
             const x = Math.cos(rad) * node.dist;
             const y = Math.sin(rad) * node.dist;
             
             return (
                <div key={i} className="absolute z-20" style={{ transform: `translate(${x}px, ${y}px)` }}>
                    <motion.div 
                        className={cn("w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-sm border shadow-lg", node.bg, node.border)}
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 3, delay: i * 0.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <node.icon className={cn("w-5 h-5", node.color)} />
                    </motion.div>
                </div>
             );
        })}

        {/* Dynamic Connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
             {[0, 90, 180, 270].map((angle, i) => {
                 const rad = (angle * Math.PI) / 180;
                 const dx = Math.cos(rad) * 80;
                 const dy = Math.sin(rad) * 80;
                 return (
                    <motion.circle 
                        key={i} r="2" fill="#fbbf24"
                        initial={{ cx: "50%", cy: "50%", opacity: 0 }}
                        animate={{ 
                            cx: [`calc(50%)`, `calc(50% + ${dx}px)`],
                            cy: [`calc(50%)`, `calc(50% + ${dy}px)`],
                            opacity: [1, 1, 0]
                        }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4, ease: "linear" }}
                    />
                 )
             })}
        </svg>
    </div>
);

const ChatBubbles = () => (
    <div className="w-full h-48 flex flex-col justify-center px-16 relative overflow-hidden bg-slate-950/50">
        <div className="flex flex-col gap-3 z-10 w-full max-w-sm mx-auto">
             {/* Static Stack - Items appear but don't move position */}
            <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{ duration: 6, repeat: Infinity, times: [0, 0.1, 0.9, 1] }}
                className="self-start rounded-2xl rounded-tl-sm px-4 py-2 bg-slate-800 border border-slate-700"
            >
                <div className="text-[10px] text-slate-400 mb-0.5 flex items-center gap-1"><MessageSquareIcon className="w-3 h-3 text-green-400" /> WhatsApp</div>
                <div className="text-xs text-slate-200">Price for Enterprise?</div>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: [0, 0, 1, 1, 0] }} // Delays appearance
                transition={{ duration: 6, repeat: Infinity, times: [0, 0.2, 0.3, 0.9, 1] }}
                className="self-start rounded-2xl rounded-tl-sm px-4 py-2 bg-slate-800 border border-slate-700"
            >
                <div className="text-[10px] text-slate-400 mb-0.5 flex items-center gap-1"><Mail className="w-3 h-3 text-blue-400" /> Email</div>
                <div className="text-xs text-slate-200">Demo availability?</div>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: [0, 0, 0, 1, 1, 0] }} // Appears last
                transition={{ duration: 6, repeat: Infinity, times: [0, 0.4, 0.5, 0.6, 0.9, 1] }}
                className="self-end rounded-2xl rounded-tr-sm px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 text-right"
            >
                <div className="text-[10px] text-indigo-300 mb-0.5 flex items-center justify-end gap-1">AI Agent <Zap className="w-3 h-3" /></div>
                <div className="text-xs text-indigo-100">Booking links sent to both! 🚀</div>
            </motion.div>
        </div>
    </div>
);

const Counter = () => {
    const [count, setCount] = useState(12);
    useEffect(() => {
        const interval = setInterval(() => {
            setCount(prev => (prev >= 59 ? 0 : prev + 1));
        }, 1000);
        return () => clearInterval(interval);
    }, []);
    return <span className="tabular-nums">{count.toString().padStart(2, '0')}</span>;
};

const VoiceCallUI = () => (
    <div className="w-full h-48 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col items-center justify-center relative">
        <div className="flex flex-col items-center mb-6 z-10">
            <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center mb-3 relative group">
                <Users className="w-8 h-8 text-slate-500" />
                {[1, 2].map(i => (
                    <motion.div
                        key={i}
                        className="absolute inset-0 rounded-full border border-green-500"
                        animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                        transition={{ duration: 1.5, delay: i * 0.4, repeat: Infinity }}
                    />
                ))}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-slate-900 flex items-center justify-center z-20">
                    <Phone className="w-3 h-3 text-white" />
                </div>
            </div>
            <div className="text-sm font-bold text-white">Incoming Call</div>
            <div className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-1">00:04:<Counter /></div>
        </div>
        <div className="flex items-center gap-1 h-8">
            {[...Array(24)].map((_, i) => (
                <motion.div
                    key={i}
                    animate={{ height: [4, 32 * Math.random(), 4] }}
                    transition={{ duration: 0.2 + Math.random() * 0.3, repeat: Infinity, repeatType: "mirror" }}
                    className="w-1 bg-rose-500 rounded-full opacity-80"
                />
            ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent pointer-events-none" />
    </div>
);

const AgencyDashboard = () => (
    <div className="w-full h-48 bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col gap-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[size:16px_16px] bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]" />
        <div className="flex justify-between items-center z-10">
             <div className="h-5 px-2 bg-indigo-500/20 rounded text-[9px] text-indigo-300 flex items-center font-mono border border-indigo-500/30">LIVE</div>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-4 z-10">
             <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-800/50 flex flex-col justify-center backdrop-blur-sm">
                 <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Total Revenue</div>
                 <div className="text-2xl font-bold text-white flex items-center gap-1">
                    $ <motion.span animate={{ opacity: [1, 0.8, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>12,4</motion.span>85
                 </div>
                 <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +15% this week</div>
             </div>
             <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-800/50 flex items-end justify-between gap-1 backdrop-blur-sm">
                 {[40, 65, 50, 85, 60, 95].map((h, i) => (
                     <motion.div key={i} animate={{ height: [`${h}%`, `${h + 15}%`, `${h}%`] }} transition={{ duration: 2, delay: i * 0.2, repeat: Infinity, ease: "easeInOut" }} className="w-full bg-indigo-500 rounded-t-sm opacity-90" />
                 ))}
             </div>
        </div>
    </div>
);

const ExecutiveUI = () => (
    <div className="w-full h-48 bg-slate-900 p-4 font-mono relative overflow-hidden flex flex-col items-center justify-center">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-pink-900/50 via-slate-900 to-slate-900" />
        <motion.div className="w-64 bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-2xl relative z-10" initial={{ y: 0 }}>
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-pink-500/20">JD</div>
                <div><div className="text-xs text-pink-200">New Meeting Request</div><div className="text-[10px] text-slate-500">Just now</div></div>
            </div>
            <div className="bg-slate-900/50 rounded p-3 mb-3 border border-slate-800">
                <div className="text-xs text-white font-bold mb-1">Strategy Call</div>
                <div className="text-[10px] text-slate-400 flex items-center gap-2"><Clock className="w-3 h-3"/> Today, 2:00 PM</div>
            </div>
            <div className="flex gap-2">
                <div className="flex-1 py-1.5 bg-slate-800 rounded text-center text-[10px] text-slate-400">Decline</div>
                <motion.div initial={{ scale: 1 }} animate={{ scale: [1, 0.95, 1] }} transition={{ duration: 1, repeat: Infinity }} className="flex-1 py-1.5 bg-pink-600 rounded text-center text-[10px] text-white font-bold cursor-pointer">Accept</motion.div>
            </div>
            <motion.div className="absolute inset-0 bg-slate-950/95 flex items-center justify-center rounded-xl backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 1, 1, 0] }} transition={{ duration: 4, repeat: Infinity, times: [0, 0.5, 0.6, 0.9, 1] }}>
                <div className="text-center"><CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" /><div className="text-xs text-white font-bold">Confirmed</div></div>
            </motion.div>
        </motion.div>
    </div>
);

const CRMGraph = () => (
    <div className="w-full h-48 bg-slate-950 flex items-center justify-center relative overflow-hidden">
        <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/50 flex items-center justify-center z-20 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
             <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center overflow-hidden backdrop-blur-sm"><Users className="w-6 h-6 text-blue-400" /></div>
        </div>
        {[0, 120, 240].map((deg, i) => (
             <motion.div key={i} className="absolute" animate={{ rotate: 360 }} transition={{ duration: 12, repeat: Infinity, ease: "linear", delay: i }} style={{ width: "220px", height: "220px" }}>
                <motion.div className="absolute top-0 left-1/2 -ml-5 -mt-5 w-10 h-10 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shadow-lg backface-hidden z-10" animate={{ rotate: -360 }} transition={{ duration: 12, repeat: Infinity, ease: "linear", delay: i }}>
                    <UserCircle className="w-full h-full text-slate-400 p-1" />
                </motion.div>
            </motion.div>
        ))}
        <div className="absolute w-[220px] h-[220px] border border-blue-500/10 rounded-full" />
    </div>
);

const VisionAnalysis = () => (
    <div className="w-full h-48 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden relative group font-mono">
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <Smartphone className="w-32 h-32 text-slate-500" />
        </div>
        {/* Simple High-Tech Reticle */}
        <div className="absolute inset-8 border border-cyan-500/30 rounded-lg">
             <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-500" />
             <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-500" />
             <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-500" />
             <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-500" />
        </div>
        <motion.div 
            animate={{ top: ["20%", "80%", "20%"] }} 
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} 
            className="absolute left-8 right-8 h-px bg-cyan-400 shadow-[0_0_10px_#22d3ee] z-10"
        >
            <div className="absolute right-0 bottom-1 text-[9px] text-cyan-400 font-bold">SCANNING...</div>
        </motion.div>
    </div>
);

const ResearcherRadar = () => (
     <div className="w-full h-48 bg-slate-950 flex items-center justify-center overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.1)_0%,transparent_70%)]" />
        
        {/* Radar Rings - Strictly Circular */}
        <div className="absolute w-44 h-44 border border-purple-500/20 rounded-full z-10 pointer-events-none" />
        <div className="absolute w-28 h-28 border border-purple-500/30 rounded-full z-10 pointer-events-none" />
        <div className="absolute w-12 h-12 bg-purple-500/20 rounded-full blur-sm z-10" />

        {/* Sweeping Line Container */}
        <div className="absolute w-44 h-44 rounded-full animate-[spin_3s_linear_infinite] z-20">
           
             {/* The SCANNER LINE - Perfectly Centered */}
             <div className="absolute top-0 left-1/2 w-[3px] h-1/2 bg-purple-400 shadow-[0_0_15px_#a855f7] origin-bottom -translate-x-1/2" />
        </div>

        {/* Multi-Colored Found Targets */}
        {[
            { top: "30%", left: "65%", delay: 0, color: "bg-green-400", shadow: "shadow-green-500" },
            { top: "65%", left: "35%", delay: 1.2, color: "bg-amber-400", shadow: "shadow-amber-500" },
            { top: "40%", left: "30%", delay: 2.1, color: "bg-blue-400", shadow: "shadow-blue-500" },
            { top: "75%", left: "60%", delay: 0.8, color: "bg-pink-400", shadow: "shadow-pink-500" }
        ].map((dot, i) => (
            <motion.div 
                key={i}
                className="absolute z-10"
                style={{ top: dot.top, left: dot.left }}
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
                transition={{ duration: 1.5, delay: dot.delay, repeat: Infinity }}
            >
                <div className={cn("w-2 h-2 rounded-full shadow-[0_0_10px]", dot.color, dot.shadow)} />
            </motion.div>
        ))}
    </div>
);

const SpyVisual = () => (
    <div className="w-full h-48 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden relative flex items-center justify-center font-mono">
        <div className="absolute inset-0 bg-slate-950/80" />
        
        <div className="relative z-10 w-4/5 space-y-3">
             {/* Header with LIVE on Left */}
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 px-2 py-1 bg-red-950/30 rounded border border-red-900/50">
                     <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                    </span>
                    <span className="text-[9px] text-red-400 font-bold tracking-wider">LIVE</span>
                </div>
                <div className="text-[9px] text-slate-500 tracking-wider">COMPETITOR MONITOR</div>
            </div>
            
            {/* Competitor Data Bars with Glitch Effect on Values */}
            {[
                { label: "New Keywords", val: 85, color: "bg-red-500" },
                { label: "Ad Spend", val: 60, color: "bg-orange-500" },
            ].map((bar, i) => (
                <div key={i} className="flex flex-col gap-1">
                    <div className="flex justify-between text-[9px] text-slate-400">
                        <span>{bar.label}</span>
                        <span className="font-mono">{bar.val}%</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                            className={cn("h-full rounded-full", bar.color)}
                            initial={{ width: 0 }}
                            whileInView={{ width: `${bar.val}%` }}
                            transition={{ duration: 1, delay: i * 0.2 }}
                        />
                    </div>
                </div>
            ))}
            
             <motion.div 
                className="mt-2 p-2 bg-red-950/20 border border-red-500/20 rounded flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
            >
                <Target className="w-3 h-3 text-red-500" />
                <div className="text-[9px] text-red-200">Alert: Price Drop Detected</div>
            </motion.div>
        </div>
    </div>
);

const MobileAppVisual = () => (
    <div className="w-full h-48 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex justify-center relative bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-slate-900 to-slate-900">
        <div className="relative mt-8 w-40 h-52 bg-slate-950 border-[4px] border-slate-800 rounded-[20px] border-b-0 shadow-2xl z-10 overflow-hidden">
             {/* Notch */}
             <div className="absolute top-0 inset-x-0 h-4 bg-slate-900 z-20 flex justify-center">
                 <div className="w-14 h-3 bg-slate-800 rounded-b-[10px]" />
             </div>
             
             {/* Enhanced Notification Feed with Typing/Pop Effect */}
             <div className="p-3 pt-8 flex flex-col gap-2">
                 {[
                     { icon: Users, color: "bg-blue-500", title: "Lead Assigned", desc: "Start chat with Rahul", delay: 0 },
                     { icon: DollarSign, color: "bg-emerald-500", title: "Payment", desc: "$299.00 Received", delay: 1.5 },
                     { icon: Zap, color: "bg-amber-500", title: "Automation", desc: "Follow-up sent", delay: 3 },
                     { icon: MessageSquare, color: "bg-indigo-500", title: "New Reply", desc: "Sure, let's meet!", delay: 4.5 },
                 ].map((notif, i) => (
                     <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: 50, scale: 0.9 }} 
                        animate={{ opacity: [0, 1, 1, 0], x: [20, 0, 0, -20], scale: [0.9, 1, 1, 0.9] }} 
                        transition={{ 
                            duration: 4, 
                            times: [0, 0.1, 0.8, 1], 
                            delay: i * 1.5,
                            repeat: Infinity,
                            repeatDelay: 2
                        }}
                        className="p-2 bg-slate-800/90 backdrop-blur rounded-xl border border-slate-700/50 flex items-center gap-2 shadow-lg"
                     >
                         <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0", notif.color)}>
                             <notif.icon className="w-3.5 h-3.5" />
                         </div>
                         <div className="min-w-0">
                             <div className="text-[9px] text-white font-semibold truncate">{notif.title}</div>
                             <div className="text-[8px] text-slate-400 truncate">{notif.desc}</div>
                         </div>
                     </motion.div>
                 ))}
             </div>
        </div>
        
        {/* Ambient Glow */}
        <div className="absolute bottom-0 w-40 h-24 bg-indigo-600/10 blur-2xl" />
    </div>
);


// --- Master List (Business Impact Focused) ---

const ROADMAP_ITEMS = [
    {
        title: "AI Automation Studio",
        tagline: "The 'n8n Killer'",
        impact: "Saves 20+ Hrs/Week",
        desc: "Stop doing repetitive tasks manually. Connect WhatsApp, Sheets, and Gmail visually to automate 100% of your workflow.",
        status: "In Development",
        icon: Zap,
        color: "amber",
        Visual: NodeGraph
    },
    {
        title: "Unified Inbox",
        tagline: "One Home for All Chats",
        impact: "3x Faster Response",
        desc: "Never miss a lead again. Manage Website, WhatsApp, and Email queries from one dashboard. Zero tab switching.",
        status: "Coming Soon",
        icon: Inbox,
        color: "green",
        Visual: ChatBubbles
    },
    {
        title: "Cluaiz Voice AI",
        tagline: "Talk to your leads",
        impact: "Replaces Call Center",
        desc: "Don't just chat—speak. Your AI agent handles hundreds of inbound support and sales calls simultaneously with human-like voice.",
        status: "Alpha Testing",
        icon: Phone,
        color: "rose",
        Visual: VoiceCallUI
    },
    // SPLIT: Research Agent
    {
        title: "AI Lead Researcher",
        tagline: "Your 24/7 Prospector",
        impact: "Automated Lead Gen",
        desc: "Hunts for leads while you sleep. Scours the web, qualifies prospects, and adds them to your CRM automatically.",
        status: "Beta Access",
        icon: Search,
        color: "purple",
        Visual: ResearcherRadar
    },
    // SPLIT: Spy Agent
    {
        title: "Competitor Spy Agent",
        tagline: "Know Their Moves",
        impact: "Market Intelligence",
        desc: "Watch your competition. Tracks their ads, keywords, and pricing changes in real-time. Stay one step ahead.",
        status: "In Development",
        icon: Target,
        color: "red",
        Visual: SpyVisual
    },
    {
        title: "Agency Partner Portal",
        tagline: "Start your own AI SaaS",
        impact: "New Revenue Stream",
        desc: "Launch your own AI business in minutes. Resell Cluaiz under YOUR brand, keep 100% of the profits from your clients.",
        status: "Planned Q2",
        icon: Building2,
        color: "indigo",
        Visual: AgencyDashboard
    },
    {
        title: "AI Executive Assistant",
        tagline: "Digital Chief of Staff",
        impact: "Founder Productivity",
        desc: "Focus on strategy, not logistics. Your PA manages your calendar, books meetings, and organizes your life 24/7.",
        status: "Concept",
        icon: Calendar,
        color: "pink",
        Visual: ExecutiveUI
    },
    {
        title: "Smart CRM & Contacts",
        tagline: "Know Your Customer",
        impact: "Data Enrichment",
        desc: "Turn chats into customers. AI auto-detects sentiment, finds LinkedIn profiles, and scores leads for your sales team.",
        status: "Planned",
        icon: Users,
        color: "blue",
        Visual: CRMGraph
    },
     {
        title: "Cluaiz Vision",
        tagline: "Give AI 'Eyes'",
        impact: "Visual Support",
        desc: "Let customers show, not just tell. Upload screenshots or products, and Cluaiz resolves complex issues instantly.",
        status: "In Dev",
        icon: Eye,
        color: "cyan",
        Visual: VisionAnalysis
    },
    {
        title: "Cluaiz Mobile App",
        tagline: "Run Business on the Go",
        impact: "Manage Leads Anywhere",
        desc: "Manage leads, reply to chats, and track analytics directly from your pocket. Native iOS and Android apps.",
        status: "Planned Q3",
        icon: Smartphone,
        color: "slate",
        Visual: MobileAppVisual
    },
];

const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
        amber: "text-amber-400 border-amber-500/20 bg-amber-500/10 from-amber-500/20 to-transparent",
        green: "text-green-400 border-green-500/20 bg-green-500/10 from-green-500/20 to-transparent",
        rose: "text-rose-400 border-rose-500/20 bg-rose-500/10 from-rose-500/20 to-transparent",
        purple: "text-purple-400 border-purple-500/20 bg-purple-500/10 from-purple-500/20 to-transparent",
        indigo: "text-indigo-400 border-indigo-500/20 bg-indigo-500/10 from-indigo-500/20 to-transparent",
        pink: "text-pink-400 border-pink-500/20 bg-pink-500/10 from-pink-500/20 to-transparent",
        blue: "text-blue-400 border-blue-500/20 bg-blue-500/10 from-blue-500/20 to-transparent",
        cyan: "text-cyan-400 border-cyan-500/20 bg-cyan-500/10 from-cyan-500/20 to-transparent",
        slate: "text-slate-400 border-slate-500/20 bg-slate-500/10 from-slate-500/20 to-transparent",
        red: "text-red-400 border-red-500/20 bg-red-500/10 from-red-500/20 to-transparent",
    };
    return colors[color] || colors.indigo;
};

export function Roadmap() {
    return (
        <section className="py-32 bg-slate-950 relative overflow-hidden">
             {/* Background Effects */ }
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]" />
             </div>

            <div className="container px-4 mx-auto relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                     <div className="flex justify-center mb-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium uppercase tracking-wider">
                            <Rocket className="w-3 h-3" />
                            <span>Roadmap 2025</span>
                        </div>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-400">
                        The Future of Business OS
                    </h2>
                    <p className="text-lg text-slate-400">
                        We are building the operating system for the next generation of companies.
                        <br className="hidden md:block"/> Here is what's shipping next.
                    </p>
                </div>

                <div className="relative max-w-6xl mx-auto">
                    {/* Centered Single Column Design for Focus */}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
                        {ROADMAP_ITEMS.map((item, idx) => {
                             const colorClass = getColorClasses(item.color);
                             return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                                    className="group relative"
                                >
                                    <div className={cn(
                                        "h-full bg-slate-900/50 border backdrop-blur-sm rounded-2xl overflow-hidden hover:bg-slate-900/80 transition-all duration-500",
                                        "border-slate-800 hover:border-slate-700"
                                    )}>
                                        {/* Animation Container */}
                                        <div className="w-full relative border-b border-slate-800/50">
                                            <item.Visual />
                                            
                                            {/* Status Badge */}
                                            <div className="absolute top-4 right-4">
                                                <div className={cn(
                                                    "px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider border backdrop-blur-md",
                                                    colorClass.replace('bg-', 'bg-opacity-10 bg-')
                                                )}>
                                                    {item.status}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-6 md:p-8">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("p-2 rounded-lg", colorClass)}>
                                                        <item.icon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                                                            {item.title}
                                                        </h3>
                                                        <p className={cn("text-xs font-medium mt-0.5 uppercase tracking-wide opacity-80", colorClass.split(' ')[0])}>
                                                            {item.tagline}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                                {item.desc}
                                            </p>

                                            {/* Impact Tag */}
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800/50 border border-slate-700/50 text-xs text-slate-300">
                                                <Rocket className="w-3 h-3 text-indigo-400" />
                                                <span>Impact: <span className="text-white font-medium">{item.impact}</span></span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                             );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
