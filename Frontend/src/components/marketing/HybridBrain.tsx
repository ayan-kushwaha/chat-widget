"use client";
import React, { useRef } from "react";
import { Brain, Globe, FileText, MessageSquare, Mail, Zap, Target, Bot, Moon, Layers, Cpu, Activity, Database, PenTool, RefreshCw, Mic, Share2 } from "lucide-react";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { cn } from "@/lib/utils";
import { MorphingText } from "@/components/ui/morphing-text";
import { NeonGradientCard } from "@/components/ui/neon-gradient-card";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { OrbitingCircles } from "@/components/ui/orbiting-circles";

const Circle = React.forwardRef<
    HTMLDivElement,
    { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "z-10 flex size-14 items-center justify-center rounded-full border border-slate-800 bg-slate-950 p-3",
                className,
            )}
        >
            {children}
        </div>
    );
});

Circle.displayName = "Circle";

export function HybridBrain() {
    const containerRef = useRef<HTMLDivElement>(null);
    const brainRef = useRef<HTMLDivElement>(null);

    // Input Refs (Left)
    const webRef = useRef<HTMLDivElement>(null);
    const fileRef = useRef<HTMLDivElement>(null);
    const dbRef = useRef<HTMLDivElement>(null);
    const socialRef = useRef<HTMLDivElement>(null); // New Node

    // Input Refs (Right)
    const chatRef = useRef<HTMLDivElement>(null);
    const mailRef = useRef<HTMLDivElement>(null);
    const manualRef = useRef<HTMLDivElement>(null);
    const apiRef = useRef<HTMLDivElement>(null);

    // Output Ref
    const resultRef = useRef<HTMLDivElement>(null);

    // Pipeline Refs for wiring
    const pipe1Ref = useRef<HTMLDivElement>(null);
    const pipe2Ref = useRef<HTMLDivElement>(null);
    const pipe3Ref = useRef<HTMLDivElement>(null);
    const pipe4Ref = useRef<HTMLDivElement>(null);


    return (
        <section className="py-24 bg-[#020617] relative overflow-hidden flex flex-col items-center min-h-[1400px]">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 size-full pointer-events-none">
                <FlickeringGrid
                    className="z-0 absolute inset-0 size-full"
                    squareSize={4}
                    gridGap={8}
                    color="#6366f1"
                    maxOpacity={0.15}
                    flickerChance={0.05}
                    height={1500}
                    width={2000}
                />
            </div>
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-[#020617] [mask-image:radial-gradient(circle_at_center,transparent_0%,black_95%)] z-0" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full flex flex-col items-center">
                {/* (A) Top Section - Neural Core Title */}
                <div className="text-center mb-24 max-w-5xl">
                    <h2 className="text-4xl md:text-7xl font-bold text-white tracking-tight mb-6 drop-shadow-[0_0_35px_rgba(255,255,255,0.15)] leading-tight">
                        The <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Neural Core</span> That Powers Your Business
                    </h2>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-2 text-xl text-slate-400 font-light">
                        <span>Your AI brain that </span>
                        <div className="w-[140px] inline-flex justify-start font-semibold text-indigo-300">
                            <MorphingText
                                texts={["Learns", "Reasons", "Optimizes", "Decides", "Scales"]}
                                className="text-xl"
                            />
                        </div>
                        <span>autonomously.</span>
                    </div>
                </div>

                {/* Main Visual Container */}
                <div
                    ref={containerRef}
                    className="relative w-full max-w-7xl flex flex-col items-center"
                >
                    {/* (B) & (C) Connection Graph Area */}
                    <div className="relative w-full h-[650px] flex items-center justify-center">

                        {/* (B) Left Input Sources (4 Nodes) */}
                        <div className="absolute left-0 lg:left-0 top-1/2 -translate-y-1/2 flex flex-col gap-12">
                            <InputNode ref={webRef} icon={<Globe className="text-cyan-400" />} title="WEBSITE" desc="Live scraping & monitoring" color="cyan" />
                            <InputNode ref={fileRef} icon={<FileText className="text-blue-400" />} title="DOCS" desc="PDF/Manual deep parsing" color="blue" />
                            <InputNode ref={dbRef} icon={<Database className="text-emerald-400" />} title="DATABASE" desc="Product & Inventory sync" color="emerald" />
                            <InputNode ref={socialRef} icon={<Share2 className="text-pink-400" />} title="SOCIAL" desc="Trends & brand monitoring" color="pink" />
                        </div>

                        {/* (B) Right Input Sources (4 Nodes) */}
                        <div className="absolute right-0 lg:right-0 top-1/2 -translate-y-1/2 flex flex-col gap-12 items-end">
                            <InputNode ref={chatRef} icon={<MessageSquare className="text-indigo-400" />} title="CHATS" desc="Past & live conversations" color="indigo" align="right" />
                            <InputNode ref={mailRef} icon={<Mail className="text-violet-400" />} title="EMAIL" desc="Support tickets parsing" color="violet" align="right" />
                            <InputNode ref={manualRef} icon={<PenTool className="text-rose-400" />} title="MANUAL" desc="Direct knowledge training" color="rose" align="right" />
                            <InputNode ref={apiRef} icon={<Cpu className="text-orange-400" />} title="API" desc="External tools integration" color="orange" align="right" />
                        </div>

                        {/* (C) Center Brain - The Hero Element */}
                        <div className="relative z-30 flex flex-col items-center justify-center group/brain">
                            <div className="relative size-72 flex items-center justify-center mb-10">
                                {/* Orbiting Particles */}
                                <OrbitingCircles iconSize={6} radius={130} reverse speed={0.6} className="opacity-60 border-none bg-transparent">
                                    <div className="size-2 rounded-full bg-cyan-400 shadow-[0_0_15px_cyan]" />
                                </OrbitingCircles>
                                <OrbitingCircles iconSize={6} radius={130} speed={0.6} delay={15} className="opacity-60 border-none bg-transparent">
                                    <div className="size-2 rounded-full bg-purple-400 shadow-[0_0_15px_purple]" />
                                </OrbitingCircles>
                                <OrbitingCircles iconSize={8} radius={90} duration={10} reverse className="opacity-40 border-none bg-transparent">
                                    <Bot className="text-indigo-500 w-5 h-5" />
                                </OrbitingCircles>

                                {/* 3-Layer Glow - Fast Pulse on Hover */}
                                <div className="absolute inset-0 bg-indigo-600 blur-[100px] opacity-20 animate-[pulse_4s_ease-in-out_infinite] group-hover/brain:animate-[pulse_15s_ease-in-out_infinite] group-hover/brain:opacity-40 transition-all duration-400" />
                                <div className="absolute inset-10 bg-indigo-500 blur-[50px] opacity-30 animate-[pulse_3s_ease-in-out_infinite] group-hover/brain:animate-[pulse_1.5s_ease-in-out_infinite]" />

                                {/* The Main Brain Circle */}
                                <Circle ref={brainRef} className="size-48 border-2 border-indigo-500/40 bg-slate-950/90 shadow-[0_0_100px_-20px_rgba(99,102,241,0.5)] z-20 backdrop-blur-xl cursor-pointer hover:border-indigo-400 hover:scale-110 transition-all duration-400">
                                    <div className="relative flex items-center justify-center size-full rounded-full overflow-hidden">
                                        {/* Inner subtle moving grid */}
                                        <div className="absolute inset-0 opacity-30 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat mix-blend-overlay"></div>

                                        {/* Brain Icon - Slow pulse normal, Fast pulse hover */}
                                        <Brain className="size-24 text-white drop-shadow-[0_0_20px_rgba(255,255,255,1)] animate-[pulse_3s_ease-in-out_infinite] group-hover/brain:animate-[pulse_0.4s_ease-in-out_infinite]" />

                                        <div className="absolute inset-0 rounded-full border border-indigo-400/30 animate-[spin_15s_linear_infinite] group-hover/brain:animate-[spin_2s_linear_infinite]" />
                                    </div>
                                </Circle>
                            </div>

                            {/* Textbox UNDER brain */}
                            <div className="text-center max-w-md relative z-30 bg-[#020617]/80 backdrop-blur-md p-6 rounded-2xl border border-indigo-500/20 shadow-2xl">
                                <p className="text-base text-slate-300 leading-relaxed">
                                    The <span className="text-white font-bold">Hybrid AI Engine</span> that combines <span className="text-indigo-400 font-semibold">Gemini's Reasoning</span> + <span className="text-orange-400 font-semibold">Ollama's Speed</span> to turn raw data into <span className="text-emerald-400 font-bold decoration-dotted underline underline-offset-4">Intelligent Action</span>.
                                </p>
                            </div>
                        </div>

                        {/* Beams connecting Inputs -> Brain */}
                        <Beam from={webRef} to={brainRef} container={containerRef} color1="#06b6d4" color2="#6366f1" />
                        <Beam from={fileRef} to={brainRef} container={containerRef} color1="#3b82f6" color2="#6366f1" />
                        <Beam from={dbRef} to={brainRef} container={containerRef} color1="#10b981" color2="#6366f1" />
                        <Beam from={socialRef} to={brainRef} container={containerRef} color1="#ec4899" color2="#6366f1" />

                        <Beam from={chatRef} to={brainRef} container={containerRef} color1="#818cf8" color2="#6366f1" reverse />
                        <Beam from={mailRef} to={brainRef} container={containerRef} color1="#a78bfa" color2="#6366f1" reverse />
                        <Beam from={manualRef} to={brainRef} container={containerRef} color1="#f43f5e" color2="#6366f1" reverse />
                        <Beam from={apiRef} to={brainRef} container={containerRef} color1="#f97316" color2="#6366f1" reverse />

                        {/* Beam Brain -> Action Result (Hidden path, visual logic) */}
                        <AnimatedBeam
                            containerRef={containerRef}
                            fromRef={brainRef}
                            toRef={resultRef}
                            curvature={0}
                            gradientStartColor="#6366f1"
                            gradientStopColor="#10b981"
                            duration={1.2}
                            className="opacity-0"
                        />
                    </div>

                    {/* (D) Action Result Card - Cleaned Glow */}
                    <div className="mt-16 mb-24 relative z-20 group hover:-translate-y-2 transition-transform duration-500">
                        {/* Beam-like connection visual */}
                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[2px] h-16 bg-gradient-to-b from-indigo-500/50 to-emerald-500/50 blur-[1px]"></div>
                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[6px] h-6 bg-indigo-400 blur-[8px] rounded-full animate-pulse"></div>

                        <div ref={resultRef} className="relative">
                            {/* Reduced Glow Opacity */}
                            <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500/20 to-emerald-400/20 blur-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
                            <NeonGradientCard className="w-[600px] border-white/5 bg-[#0a0a0a]/95 backdrop-blur-2xl !rounded-3xl shadow-2xl">
                                <div className="p-10 flex flex-col items-center text-center">
                                    <h3 className="text-3xl font-bold text-white mb-3 tracking-tight">
                                        ACTION OUTPUT
                                    </h3>
                                    <div className="flex items-center gap-4 text-xs font-bold text-emerald-400 tracking-[0.25em] uppercase mb-8 bg-emerald-950/40 px-4 py-2 rounded-full border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                        <span>Autonomous</span>
                                        <span className="text-emerald-700">•</span>
                                        <span>Instant</span>
                                        <span className="text-emerald-700">•</span>
                                        <span>Accurate</span>
                                    </div>

                                    <div className="flex flex-col gap-5 w-full text-left bg-white/5 p-6 rounded-2xl border border-white/5">
                                        <ResultItem icon={<Zap className="w-5 h-5 text-amber-400" />} text="Converts questions into qualified leads instantly" />
                                        <ResultItem icon={<Target className="w-5 h-5 text-red-400" />} text="Detects customer intent with real-time reasoning" />
                                        <ResultItem icon={<Bot className="w-5 h-5 text-cyan-400" />} text="Responds using your exact knowledge base" />
                                        <ResultItem icon={<Moon className="w-5 h-5 text-indigo-400" />} text="Works 24/7 without holidays or breaks" />
                                    </div>
                                </div>
                            </NeonGradientCard>
                        </div>
                    </div>

                    {/* (E) Bottom 4-Step Pipeline - BEAM CONNECTED */}
                    <div className="w-full relative z-20 pt-16 border-t border-white/5">

                        <div className="flex flex-col md:flex-row items-center justify-between gap-8 w-full max-w-6xl mx-auto px-4 relative">
                            {/* Beam Connections between steps */}
                            <Beam from={pipe1Ref} to={pipe2Ref} container={containerRef} color1="#06b6d4" color2="#6366f1" />
                            <Beam from={pipe2Ref} to={pipe3Ref} container={containerRef} color1="#6366f1" color2="#10b981" />
                            <Beam from={pipe3Ref} to={pipe4Ref} container={containerRef} color1="#10b981" color2="#ec4899" />

                            <PipelineStep ref={pipe1Ref} icon={<Layers className="w-6 h-6 text-cyan-400" />} title="INGEST" desc="Continuously monitors your website, documents, and live feedback channels to build a real-time knowledge graph." step="01" />
                            <PipelineStep ref={pipe2Ref} icon={<Cpu className="w-6 h-6 text-indigo-400" />} title="PROCESS" desc="Advanced Neural Engine analyzes intent, context, and sentiment using a hybrid Gemini + Ollama architecture." step="02" />
                            <PipelineStep ref={pipe3Ref} icon={<Activity className="w-6 h-6 text-emerald-400" />} title="EXECUTE" desc="Instantly engages customers, captures qualified leads, routes complex queries, and updates CRM data." step="03" />
                            <PipelineStep ref={pipe4Ref} icon={<RefreshCw className="w-6 h-6 text-pink-400" />} title="IMPROVE" desc="Self-learning system that analyzes past interactions to improve accuracy and refine responses over time." step="04" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// Helper Components

function Beam({ from, to, container, color1, color2, reverse = false }: any) {
    return (
        <AnimatedBeam
            containerRef={container}
            fromRef={from}
            toRef={to}
            curvature={reverse ? -20 : 20}
            gradientStartColor={color1}
            gradientStopColor={color2}
            reverse={reverse}
            duration={3}
            className="opacity-50"
        />
    )
}

const InputNode = React.forwardRef<HTMLDivElement, { icon: React.ReactNode, title: string, desc: string, color: string, align?: "left" | "right" }>(
    ({ icon, title, desc, color, align = "left" }, ref) => (
        <div className={`flex items-center gap-6 group/node ${align === "right" ? "flex-row-reverse text-right" : "text-left"}`}>
            <Circle ref={ref} className={`border-${color}-500/20 bg-${color}-950/10 shadow-[0_0_25px_rgba(255,255,255,0.05)] group-hover/node:border-${color}-500/60 group-hover/node:shadow-[0_0_20px_${color}] group-hover/node:scale-110 transition-all duration-300`}>
                {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: `h-6 w-6 text-${color}-400` })}
            </Circle>
            <div className="hidden lg:block w-40 transform group-hover/node:translate-x-1 transition-transform duration-300">
                <h4 className={`text-sm font-bold text-${color}-400 tracking-widest mb-1`}>{title}</h4>
                <p className="text-xs text-slate-500 leading-tight group-hover/node:text-slate-400">{desc}</p>
            </div>
        </div>
    ));
InputNode.displayName = "InputNode";

function ResultItem({ icon, text }: { icon: React.ReactNode, text: string }) {
    return (
        <div className="flex items-center gap-4 text-base text-slate-200 font-medium group/item hover:translate-x-2 transition-transform duration-300">
            <div className="bg-white/5 p-2 rounded-lg border border-white/10 group-hover/item:border-indigo-500/50 group-hover/item:bg-indigo-500/10 transition-colors">
                {icon}
            </div>
            {text}
        </div>
    );
}

const PipelineStep = React.forwardRef<HTMLDivElement, { icon: React.ReactNode, title: string, desc: string, step: string }>(
    ({ icon, title, desc, step }, ref) => (
        <div ref={ref} className="flex flex-col items-center text-center max-w-[260px] gap-6 group relative z-10 p-4">
            <div className="size-16 rounded-2xl bg-[#0b0f19] border border-slate-800 flex items-center justify-center shadow-xl group-hover:border-indigo-500/50 group-hover:-translate-y-2 group-hover:shadow-[0_0_30px_-10px_rgba(99,102,241,0.4)] transition-all duration-300 relative z-20">
                <span className="absolute -top-3 -right-3 size-8 flex items-center justify-center bg-slate-800 rounded-full text-xs font-bold text-slate-400 border border-slate-700 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-400 transition-colors">
                    {step}
                </span>
                {icon}
            </div>
            <div>
                <h5 className="text-sm font-bold text-white tracking-[0.25em] uppercase mb-3 group-hover:text-indigo-400 transition-colors">{title}</h5>
                <p className="text-sm text-slate-500 leading-relaxed font-medium group-hover:text-slate-400">
                    {desc}
                </p>
            </div>
        </div>
    ));
PipelineStep.displayName = "PipelineStep";



