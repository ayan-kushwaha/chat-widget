"use client";

import React, { useState, useEffect } from "react";
import { 
    X, Check, Clock, Zap, UserX, MessageSquare, Briefcase, Brain, 
    MousePointer2, FileText, PhoneMissed, MailWarning, 
    Banknote, Thermometer, Hourglass, FileQuestion, MessageCircleWarning, User,
    Sun, Award, Database, Users,
    ListTodo, TrendingDown, UserMinus, PauseCircle, ShieldAlert, Trash2,
    MessageCircle, TrendingUp, PlayCircle, CalendarCheck, RefreshCw, Sparkles, Coins,
    Bot, Puzzle, SearchX, AlertOctagon, Lightbulb, Target, UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// --- ANIMATION 1A: CHAOS (Human/Manual) ---
const ChaosAnimation = () => {
    const failures = [
        { icon: PhoneMissed, title: "Missed Call", desc: "No answer (9:05 PM)" },
        { icon: MailWarning, title: "Ignored Email", desc: "Buried in inbox..." },
        { icon: UserX, title: "Lead Ghosted", desc: "Went to competitor" },
    ];

    return (
        <div className="h-52 w-full bg-red-950/10 relative overflow-hidden rounded-xl border border-red-500/10 flex flex-col items-center justify-center p-4">
            <div className="absolute inset-0 bg-[radial-gradient(#ef4444_1px,transparent_1px)] [background-size:20px_20px] opacity-20" />
            
            {failures.map((fail, i) => (
                <motion.div
                    key={i}
                    className="absolute bg-slate-900 border border-red-500/30 p-2.5 rounded-lg shadow-xl flex items-center gap-3 w-56 z-10"
                    initial={{ x: -150, y: 40 + i * 40, opacity: 0, rotate: -5, scale: 0.9 }}
                    animate={{ 
                        x: [null, 20, 100], 
                        y: [null, 10 + i * 30, -50], 
                        opacity: [0, 1, 0],
                        rotate: [0, -2, 5]
                    }}
                    transition={{ duration: 5, repeat: Infinity, delay: i * 1.8 }}
                >
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                        <fail.icon className="w-4 h-4 text-red-500" />
                    </div>
                    <div>
                        <div className="text-xs text-red-200 font-bold">{fail.title}</div>
                        <div className="text-[10px] text-red-400">{fail.desc}</div>
                    </div>
                </motion.div>
            ))}

            <div className="relative z-0 w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4 animate-pulse">
                <Clock className="w-8 h-8 text-red-500" />
            </div>
            
            <div className="absolute bottom-3 text-red-500/50 text-[10px] font-mono">
                System Overloaded...
            </div>
        </div>
    );
};

// --- ANIMATION 1B: ORDER (AI Agent) ---
const ZenAnimation = () => {
    const [leads, setLeads] = useState([
        { name: "Rahul", action: "Booked Demo", time: "Just now" },
        { name: "Sarah", action: "Purchased Plan", time: "2s ago" },
    ]);

    useEffect(() => {
        const newLeads = [
            { name: "Amit", action: "Asked Pricing", time: "1s ago" },
            { name: "Lisa", action: "Resolved Issue", time: "Just now" },
            { name: "Mike", action: "Booked Demo", time: "Just now" },
            { name: "Priya", action: "Purchased", time: "3s ago" },
        ];
        let i = 0;
        const interval = setInterval(() => {
            setLeads(prev => [newLeads[i], ...prev.slice(0, 2)]);
            i = (i + 1) % newLeads.length;
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-52 w-full bg-indigo-950/10 relative overflow-hidden rounded-xl border border-indigo-500/20 flex flex-col items-center justify-center p-4">
            <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:20px_20px] opacity-20" />
            
            <div className="relative z-20 w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(99,102,241,0.3)] shrink-0">
                <Zap className="w-6 h-6 text-indigo-400 fill-indigo-400/20" />
                <div className="absolute inset-0 rounded-full border border-indigo-500/30 animate-ping opacity-20" />
            </div>

            <div className="w-full space-y-2 relative z-10 max-w-xs h-32 overflow-hidden flex flex-col items-center">
                <AnimatePresence mode="popLayout">
                    {leads.map((lead, i) => (
                        <motion.div 
                            key={`${lead.name}-${i}`} 
                            layout
                            initial={{ scale: 0.8, opacity: 0, y: 20 }} 
                            animate={{ scale: 1, opacity: 1, y: 0 }} 
                            exit={{ scale: 0.9, opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                            className="w-full bg-slate-900/80 border border-indigo-500/30 p-2 rounded-lg flex items-center justify-between shadow-lg backdrop-blur-sm"
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                                    <Check className="w-3 h-3 text-green-400" />
                                </div>
                                <div>
                                    <span className="text-xs text-indigo-100 font-bold block">{lead.name}</span>
                                    <span className="text-[9px] text-slate-400">{lead.time}</span>
                                </div>
                            </div>
                            <div className="text-[9px] bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20 font-bold shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                                {lead.action} ⚡
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

// --- ANIMATION 2A: BORING FORMS (Red) ---
const FormBoredomAnimation = () => {
    return (
        <div className="h-52 w-full bg-slate-900/50 relative overflow-hidden rounded-xl border border-slate-700/50 flex flex-col items-center justify-center p-6">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ef44440a_1px,transparent_1px),linear-gradient(to_bottom,#ef44440a_1px,transparent_1px)] bg-[size:16px_16px]" />
            
            <div className="w-3/4 max-w-[200px] bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2 opacity-60">
                <div className="h-2 w-1/3 bg-slate-800 rounded" />
                <div className="h-6 w-full bg-slate-900 border border-slate-800 rounded" />
                <div className="h-2 w-1/4 bg-slate-800 rounded mt-1" />
                <div className="h-6 w-full bg-slate-900 border border-slate-800 rounded" />
                <div className="h-8 w-full bg-slate-800 rounded mt-2 opacity-50" />
            </div>

            <motion.div 
                className="absolute z-20"
                initial={{ top: "60%", left: "50%" }}
                animate={{ 
                    top: ["60%", "40%", "40%", "20%"], 
                    left: ["50%", "50%", "55%", "120%"], 
                    scale: [1, 1, 0.9, 1]
                }}
                transition={{ duration: 3, repeat: Infinity, times: [0, 0.3, 0.6, 1] }}
            >
                <MousePointer2 className="w-6 h-6 text-red-500 fill-red-500/20" />
            </motion.div>

            <motion.div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500/90 text-white px-3 py-1 rounded text-[10px] font-bold shadow-xl whitespace-nowrap"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0, 0, 1, 0], scale: [0.8, 0.8, 1, 0.8] }}
                transition={{ duration: 3, repeat: Infinity, times: [0, 0.6, 0.7, 1] }}
            >
                Too Long... Bye! 👋
            </motion.div>
        </div>
    )
}

// --- ANIMATION 2B: ACTIVE CHAT (Indigo - LOOPING) ---
const ActiveChatAnimation = () => {
    const [key, setKey] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => {
            setKey(prev => prev + 1);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-52 w-full bg-indigo-950/10 relative overflow-hidden rounded-xl border border-indigo-500/20 flex flex-col items-center justify-center p-4">
             <div className="absolute inset-0 bg-[linear-gradient(to_right,#6366f10a_1px,transparent_1px),linear-gradient(to_bottom,#6366f10a_1px,transparent_1px)] bg-[size:16px_16px]" />
             
             <div key={key} className="w-full max-w-[220px] space-y-3 relative z-10">
                <motion.div 
                    className="flex gap-2"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                >
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/30">
                        <Zap className="w-3 h-3 text-indigo-400" />
                    </div>
                    <div className="bg-slate-900 border border-indigo-500/20 px-3 py-1.5 rounded-2xl rounded-tl-none text-[10px] text-indigo-100">
                        Hey! Want to double your leads?
                    </div>
                </motion.div>

                <motion.div 
                    className="flex gap-2 justify-end"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }}
                >
                    <div className="bg-indigo-600 px-3 py-1.5 rounded-2xl rounded-tr-none text-[10px] text-white">
                        Yes, show me how!
                    </div>
                </motion.div>

                 <motion.div 
                    className="flex justify-center mt-2"
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 2.5, type: "spring" }}
                >
                     <div className="bg-green-500/20 border border-green-500/30 text-green-400 px-3 py-1 rounded-full text-[10px] flex items-center gap-1.5 font-bold">
                        <Check className="w-3 h-3" /> Demo Booked Instantly
                     </div>
                </motion.div>
             </div>
        </div>
    )
}

// --- ANIMATION 3A: DUMB BOT (Red) ---
const DumbBotAnimation = () => (
    <div className="h-52 w-full bg-red-950/10 relative overflow-hidden rounded-xl border border-red-500/10 flex flex-col items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(#ef4444_1px,transparent_1px)] [background-size:20px_20px] opacity-20" />
        
        {/* Robot Head */}
        <div className="w-16 h-16 bg-slate-800 border-2 border-slate-700 rounded-lg flex items-center justify-center mb-4 relative">
             <Bot className="w-8 h-8 text-slate-500" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping" />
        </div>

        {/* Failed Dialog */}
        <motion.div 
            className="bg-slate-900 border border-red-500/30 px-4 py-2 rounded-lg relative z-10"
            animate={{ x: [-2, 2, -2, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
        >
             <div className="text-[10px] text-red-200 font-mono">ERROR 404: Context Not Found</div>
             <div className="text-[9px] text-red-400 mt-1 flex items-center gap-1">
                <SearchX className="w-3 h-3" /> "Sorry, I don't understand."
             </div>
        </motion.div>
    </div>
);

// --- ANIMATION 3B: NEURAL BRAIN (Indigo - IMPROVED) ---
const NeuralBrainAnimation = () => {
    const [step, setStep] = useState(0);
    const steps = [
        { text: "Scanning Context...", color: "text-cyan-300", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
        { text: "Analyzing Sentiment: High", color: "text-purple-300", bg: "bg-purple-500/10", border: "border-purple-500/20" },
        { text: "Formulating Persuasion...", color: "text-indigo-300", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
        { text: "Deal Closed ✅", color: "text-green-300", bg: "bg-green-500/10", border: "border-green-500/20" }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setStep((prev) => (prev + 1) % steps.length);
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-52 w-full bg-indigo-950/10 relative overflow-hidden rounded-xl border border-indigo-500/20 flex flex-col items-center justify-center p-4">
            <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:20px_20px] opacity-20" />
            
            {/* Brain Graph with Pulsing Nodes */}
            <div className="relative w-full max-w-[220px] h-[120px] flex items-center justify-center">
                 {/* Center Core */}
                 <div className="relative z-10">
                     <Brain className="w-12 h-12 text-indigo-400" />
                     <motion.div className="absolute inset-0 bg-indigo-500/30 rounded-full blur-xl" animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 2, repeat: Infinity }} />
                 </div>
                 
                 {/* Orbiting Nodes */}
                 {[0, 1, 2, 3].map((i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_cyan]"
                        animate={{ 
                            rotate: 360,
                            scale: [1, 1.5, 1]
                        }}
                        style={{ 
                            offsetPath: "path('M 0 -40 A 40 40 0 1 1 0 40 A 40 40 0 1 1 0 -40')",
                            offsetDistance: `${i * 25}%`
                         }}
                        transition={{ 
                            rotate: { duration: 10, ease: "linear", repeat: Infinity },
                            scale: { duration: 2, repeat: Infinity, delay: i }
                         }}
                    />
                 ))}
                 
                 {/* Connecting Lines (Simulated with absolute divs for simplified react logic) */}
                 <motion.div className="absolute inset-0 border border-indigo-500/10 rounded-full w-[100px] h-[100px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin-slow" />
            </div>

            {/* Dynamic Status Text */}
            <AnimatePresence mode="wait">
                <motion.div 
                    key={step}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={cn(
                        "mt-4 px-3 py-1.5 rounded-full text-[10px] font-mono border flex items-center gap-2",
                        steps[step].bg, steps[step].border, steps[step].color
                    )}
                >
                     <motion.div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                     {steps[step].text}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}


// --- COMPARISON DATA BLOCKS ---
const COMPARISONS = [
    {
        title: "Vs. Hiring Staff",
        subtitle: "Why manually hiring staff drains your profits with low efficiency and high limits.",
        left: {
            title: "Human Employee",
            badge: "Expensive",
            icon: Briefcase,
            visual: ChaosAnimation,
            points: [
                { text: "Available 9am - 5pm only (Misses 60% leads)", icon: Clock },
                { text: "Salary: ₹25,000 - ₹50,000 per month", icon: Banknote },
                { text: "Needs training, sick leaves & holidays", icon: Thermometer },
                { text: "Takes 15-60 mins to reply to messages", icon: Hourglass },
                { text: "Forgets follow-ups and loses context", icon: FileQuestion },
                { text: "Inconsistent tone with customers", icon: MessageCircleWarning },
                { text: "Can handle only 1 chat at a time", icon: User }
            ]
        },
        right: {
            title: "Cluaiz AI Agent",
            badge: "Cost Saving",
            icon: Zap,
            visual: ZenAnimation,
            points: [
                { text: "Available 24/7/365 (Never sleeps)", icon: Sun },
                { text: "Cost: Starts at ₹0 (Free Tier)", icon: Coins },
                { text: "Pre-trained expert, zero holidays", icon: Award },
                { text: "Instant 0.2s response time", icon: Zap },
                { text: "Perfect memory of every conversation", icon: Database },
                { text: "Consistent, professional behavior", icon: Sparkles },
                { text: "Handles 10,000+ chats simultaneously", icon: Users }
            ]
        }
    },
    {
        title: "Vs. Contact Context",
        subtitle: "Why boring static forms kill 98% of your conversion rates instantly.",
        left: {
            title: "Website Forms",
            badge: "Passive",
            icon:  FileText,
            visual: FormBoredomAnimation,
            points: [
                { text: "User must fill 10 fields (High Friction)", icon: ListTodo },
                { text: "Avg. Conversion Rate: 2-3%", icon: TrendingDown },
                { text: "Visitor leaves if not contacted instantly", icon: UserMinus },
                { text: "Passive: Waits for user to act", icon: PauseCircle },
                { text: "No instant validation of data", icon: ShieldAlert },
                { text: "Boring, static experience", icon: FileText },
                { text: "Lost in 'Spam' folder often", icon: Trash2 }
            ]
        },
        right: {
            title: "Cluaiz Conversation",
            badge: "High Conversion",
            icon: MessageSquare,
            visual: ActiveChatAnimation,
            points: [
                { text: "User just chats naturally (Zero Friction)", icon: MessageCircle },
                { text: "Avg. Conversion Rate: 40%+", icon: TrendingUp },
                { text: "Engages visitor the second they land", icon: Zap },
                { text: "Active: Proactively greets & sells", icon: PlayCircle },
                { text: "Instantly qualifies & books meetings", icon: CalendarCheck },
                { text: "Interactive, engaging experience", icon: Sparkles },
                { text: "Direct CRM sync in real-time", icon: RefreshCw }
            ]
        }
    },
    {
        title: "Vs. Basic Chatbots",
        subtitle: "Why rigid 'keyword-match' bots fail while Cluaiz's neural brain closes actual deals.",
        left: {
            title: "Ordinary Rule-Bot",
            badge: "Dumb",
            icon:  Bot,
            visual: DumbBotAnimation,
            points: [
                { text: "Zero context awareness (Matches keywords)", icon: SearchX },
                { text: "Fails on 'Human' questions", icon: AlertOctagon },
                { text: "Rigid 'Press 1 for Sales' menu", icon: ListTodo },
                { text: "Cannot handle complex objections", icon: ShieldAlert },
                { text: "No learning or improvement over time", icon: Brain },
                { text: "Feels robotic and impersonal", icon: Bot },
                { text: "Frustrates users -> They leave", icon: UserMinus }
            ]
        },
        right: {
            title: "Cluaiz Neural Brain",
            badge: "Genius",
            icon: Brain,
            visual: NeuralBrainAnimation,
            points: [
                { text: "Understands intent & sentiment deeply", icon: Brain },
                { text: "Answers ANY question fluently", icon: MessageSquare },
                { text: "Adaptive conversation flow", icon: RefreshCw },
                { text: "Persuades & overcomes sales objections", icon: Target },
                { text: "Self-improves from every chat", icon: TrendingUp },
                { text: "Feels like a top human sales agent", icon: UserCheck },
                { text: "Delights users -> They buy", icon: Coins }
            ]
        }
    }
];

export function BeforeAfter() {
    return (
        <section className="py-24 bg-slate-950 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                
                {/* Header */}
                 <div className="text-center mb-20">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                        Why <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Upgrade to AI?</span>
                    </h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                        Compare Cluaiz against traditional business methods. The math is simple.
                    </p>
                </div>

                <div className="space-y-32">
                    {COMPARISONS.map((comp, idx) => (
                        <div key={idx}>
                             <div className="text-center mb-10">
                                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{comp.title}</h3>
                                <p className="text-slate-400 text-lg max-w-2xl mx-auto">{comp.subtitle}</p>
                             </div>

                             <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                                {/* LEFT CARD (The Old Way) */}
                                <div className="group relative rounded-3xl border border-red-500/10 bg-slate-900/20 p-1">
                                    <div className="relative bg-slate-950/80 rounded-[22px] p-6 border border-white/5 h-full">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                 <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
                                                    <comp.left.icon className="w-5 h-5 text-red-400" />
                                                </div>
                                                <h3 className="text-xl font-bold text-slate-300">{comp.left.title}</h3>
                                            </div>
                                            <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">{comp.left.badge}</span>
                                        </div>

                                        {comp.left.visual && <div className="mb-6"><comp.left.visual /></div>}

                                        <ul className="space-y-3">
                                            {comp.left.points.map((pt, pIdx) => (
                                                <li key={pIdx} className="flex items-start gap-3 text-slate-400 text-sm">
                                                    <pt.icon className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                                    <span>{pt.text}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* RIGHT CARD (The Cluaiz Way) */}
                                <div className="group relative rounded-3xl border border-indigo-500/30 bg-slate-900/40 p-1 shadow-2xl shadow-indigo-500/10">
                                     <div className="absolute -inset-px bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-3xl opacity-20 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
                                    <div className="relative bg-slate-900 rounded-[22px] p-6 border border-white/10 h-full">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                 <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                                    <comp.right.icon className="w-5 h-5 text-indigo-400" />
                                                </div>
                                                <h3 className="text-xl font-bold text-white">{comp.right.title}</h3>
                                            </div>
                                            <span className="text-[10px] font-bold text-white bg-gradient-to-r from-indigo-500 to-cyan-500 px-3 py-1 rounded-full shadow">{comp.right.badge}</span>
                                        </div>

                                        {comp.right.visual && <div className="mb-6"><comp.right.visual /></div>}

                                        <ul className="space-y-3">
                                            {comp.right.points.map((pt, pIdx) => (
                                                <li key={pIdx} className="flex items-center gap-3 text-white text-sm font-medium">
                                                    <pt.icon className="w-4 h-4 text-green-400 shrink-0" />
                                                    <span>{pt.text}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
