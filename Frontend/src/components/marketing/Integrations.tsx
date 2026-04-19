"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { MessageCircle, Mail, Database, Table, Webhook, TrendingUp, Clock, Bell, BrainCircuit, Calendar, CreditCard, User } from "lucide-react";
import { RetroGrid } from "@/components/ui/retro-grid";
import { Meteors } from "@/components/ui/meteors";

// --- Circle Component for Nodes ---
const Circle = React.forwardRef<
    HTMLDivElement,
    { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "z-10 flex h-14 w-14 items-center justify-center rounded-full border-2 bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)] backdrop-filter backdrop-blur-md dark:bg-black",
                className,
            )}
        >
            {children}
        </div>
    );
});

Circle.displayName = "Circle";


export function Integrations() {
    const containerRef = useRef<HTMLDivElement>(null);
    const div1Ref = useRef<HTMLDivElement>(null); // WhatsApp
    const div2Ref = useRef<HTMLDivElement>(null); // Email
    const div3Ref = useRef<HTMLDivElement>(null); // Calendar
    const div4Ref = useRef<HTMLDivElement>(null); // CRM
    const div5Ref = useRef<HTMLDivElement>(null); // Sheets
    const div6Ref = useRef<HTMLDivElement>(null); // Payments/API
    const centerRef = useRef<HTMLDivElement>(null); // Cluaiz Brain

    return (
        <section className="py-32 bg-[#020617] relative overflow-hidden flex flex-col items-center justify-center min-h-[900px]">
            {/* Retro Grid Background */}
            <RetroGrid className="opacity-[0.06]" />

            {/* Background Gradients */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/5 via-slate-950 to-slate-950 pointer-events-none" />

            {/* Ambient Glows */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]" />


            {/* Container */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full flex flex-col items-center">

                {/* 1. HERO HEADER */}
                <div className="text-center max-w-4xl mx-auto mb-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">Fully Automated Business</span>
                    </div>

                    <h2 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white tracking-tight mb-8 leading-tight">
                        Your AI Assistant <br /> That Runs <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Your Business.</span>
                    </h2>

                    <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        Cluaiz doesn't just chat. It collects leads, follows up, sends WhatsApp alerts, and syncs to your CRM. <span className="text-white font-medium">It's a full-time employee that never sleeps.</span>
                    </p>
                </div>

                {/* 2. AUTOMATION PIPELINE VISUAL (6 Nodes) */}
                <div
                    className="relative flex w-full max-w-[900px] items-center justify-center overflow-hidden rounded-lg bg-transparent p-10  mb-24"
                    ref={containerRef}
                >
                    {/* Row 1: The Inputs */}
                    <div className="flex h-full w-full flex-col items-stretch justify-between gap-10">
                        <div className="flex flex-row items-center justify-between">
                            <div className="flex flex-col gap-8">
                                <Circle ref={div1Ref} className="border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                                    <MessageCircle className="w-6 h-6 text-emerald-400" />
                                </Circle>
                                <span className="text-[10px] text-center text-emerald-400/70 font-mono tracking-wider ">WHATSAPP</span>
                            </div>
                            <div className="flex flex-col gap-8">
                                <Circle ref={div5Ref} className="border-blue-500/30 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                                    <Database className="w-6 h-6 text-blue-400" />
                                </Circle>
                                <span className="text-[10px] text-center text-blue-400/70 font-mono tracking-wider ">CRM</span>
                            </div>
                        </div>

                        {/* Middle Row (Left & Right) */}
                        <div className="flex flex-row items-center justify-between">
                            <div className="flex flex-col gap-8 ml-8">
                                <Circle ref={div2Ref} className="border-red-500/30 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                                    <Mail className="w-6 h-6 text-red-500" />
                                </Circle>
                                <span className="text-[10px] text-center text-red-500/70 font-mono tracking-wider ">EMAIL</span>
                            </div>

                            {/* CENTER BRAIN */}
                            <div className="relative">
                                <div
                                    ref={centerRef}
                                    className="z-30 flex h-24 w-24 items-center justify-center rounded-full border-2 border-indigo-500/50 bg-[#0c1222] p-3 shadow-[0_0_50px_-5px_rgba(99,102,241,0.5)]"
                                >
                                    <BrainCircuit className="h-10 w-10 text-indigo-400 animate-pulse" />
                                </div>
                                {/* Ripples */}
                                <div className="absolute inset-0 rounded-full border border-indigo-500/20 animate-[ping_3s_linear_infinite]" />
                            </div>

                            <div className="flex flex-col gap-8 mr-8">
                                <Circle ref={div6Ref} className="border-purple-500/30 bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                                    <Webhook className="w-6 h-6 text-purple-500" />
                                </Circle>
                                <span className="text-[10px] text-center text-purple-500/70 font-mono tracking-wider ">API</span>
                            </div>
                        </div>

                        {/* Row 3: The Outputs */}
                        <div className="flex flex-row items-center justify-between">
                            <div className="flex flex-col gap-8">
                                <Circle ref={div3Ref} className="border-amber-500/30 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                                    <Calendar className="w-6 h-6 text-amber-500" />
                                </Circle>
                                <span className="text-[10px] text-center text-amber-500/70 font-mono tracking-wider ">CALENDAR</span>
                            </div>
                            <div className="flex flex-col gap-8">
                                <Circle ref={div4Ref} className="border-green-600/30 bg-green-600/10 shadow-[0_0_20px_rgba(22,163,74,0.3)]">
                                    <Table className="w-6 h-6 text-green-500" />
                                </Circle>
                                <span className="text-[10px] text-center text-green-500/70 font-mono tracking-wider ">SHEETS</span>
                            </div>
                        </div>
                    </div>

                    {/* Animated Beams */}
                    <AnimatedBeam containerRef={containerRef} fromRef={div1Ref} toRef={centerRef} duration={3} />
                    <AnimatedBeam containerRef={containerRef} fromRef={div2Ref} toRef={centerRef} duration={3} delay={0.5} />
                    <AnimatedBeam containerRef={containerRef} fromRef={div3Ref} toRef={centerRef} duration={3} delay={1} />
                    <AnimatedBeam containerRef={containerRef} fromRef={div4Ref} toRef={centerRef} duration={3} delay={1.5} reverse />
                    <AnimatedBeam containerRef={containerRef} fromRef={div5Ref} toRef={centerRef} duration={3} delay={2} reverse />
                    <AnimatedBeam containerRef={containerRef} fromRef={div6Ref} toRef={centerRef} duration={3} delay={2.5} reverse />
                </div>


                {/* 3. ULTRA PREMIUM CARDS (Holographic + Hover Reveal) */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                    {[
                        { title: "Increases Sales", desc: "No missed leads. Every opportunity captured, instantly.", icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10", glow: "group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]" },
                        { title: "WhatsApp Alerts", desc: "Leads don't sit in a dashboard. They come to your pocket.", icon: Bell, color: "text-[#25D366]", bg: "bg-[#25D366]/10", glow: "group-hover:shadow-[0_0_20px_rgba(37,211,102,0.3)]" },
                        { title: "Instant Response", desc: "0.2s reply time. Speed wins customers.", icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10", glow: "group-hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]" },
                        { title: "Zero Data Entry", desc: "Syncs everything to Excel/CRM. Your manual work is over.", icon: Database, color: "text-blue-400", bg: "bg-blue-500/10", glow: "group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]" },
                    ].map((card, i) => (
                        <div key={i} className="group relative h-full rounded-2xl border border-white/5 bg-[#0a0a0a] p-6 overflow-hidden transition-all hover:scale-[1.02] hover:border-white/20">
                            {/* Hover Gradient Background */}
                            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/5 via-transparent to-transparent`} />

                            {/* Meteors */}
                            <Meteors number={15} className="opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-white/10 transition-all duration-300", card.bg, card.glow)}>
                                <card.icon className={cn("h-6 w-6", card.color)} />
                            </div>

                            <h3 className="font-bold text-lg text-white mb-2 relative z-10">{card.title}</h3>
                            <p className="text-sm text-slate-400 leading-relaxed relative z-10">
                                {card.desc}
                            </p>
                        </div>
                    ))}
                </div>

                {/* 4. CLOSING LINE (Indirect & Powerful) */}
                <div className="mt-20 text-center">
                    <p className="text-lg md:text-xl text-slate-400 font-light tracking-wide">
                        "Scale your operations, <span className="text-white font-medium italic">not your payroll.</span>"
                    </p>
                </div>

            </div>
        </section>
    );
}
