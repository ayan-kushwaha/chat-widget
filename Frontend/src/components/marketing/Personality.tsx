"use client";
import React from "react";
import { motion } from "framer-motion";
import { Fingerprint, Smile, History, TrendingUp, Users, Heart, Sparkles, Activity, Zap, MessageCircle, Split, ShieldCheck, Database, BrainCircuit, Sliders, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { BorderBeam } from "@/components/ui/border-beam";

// --- Utility: Color Styles Lookup ---
const colorStyles: any = {
    pink: {
        bg: "bg-pink-500/10",
        text: "text-pink-400",
        textDim: "text-pink-200/80",
        bar: "bg-pink-400",
        glow: "shadow-[0_0_15px_#ec4899]",
        beamFrom: "#ec4899",
        beamTo: "#a855f7"
    },
    cyan: {
        bg: "bg-cyan-500/10",
        text: "text-cyan-400",
        textDim: "text-cyan-200/80",
        bar: "bg-cyan-400",
        glow: "shadow-[0_0_15px_#06b6d4]",
        beamFrom: "#06b6d4",
        beamTo: "#3b82f6"
    },
    purple: {
        bg: "bg-purple-500/10",
        text: "text-purple-400",
        textDim: "text-purple-200/80",
        bar: "bg-purple-400",
        glow: "shadow-[0_0_15px_#a855f7]",
        beamFrom: "#a855f7",
        beamTo: "#6366f1"
    },
    emerald: {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        textDim: "text-emerald-200/80",
        bar: "bg-emerald-400",
        glow: "shadow-[0_0_15px_#10b981]",
        beamFrom: "#10b981",
        beamTo: "#34d399"
    }
};

// --- Visual: The DNA Core (Compact) ---
const DNAEngine = () => {
    return (
        <div className="relative w-full h-[300px] flex items-center justify-center">
            {/* Core Glow */}
            <div className="absolute inset-0 bg-indigo-500/20 blur-[60px] rounded-full" />

            {/* DNA Strands */}
            <div className="relative flex flex-col gap-3 transform-style-3d scale-90">
                {Array.from({ length: 10 }).map((_, i) => (
                    <motion.div
                        key={i}
                        className="flex items-center justify-between w-40"
                        animate={{ rotateY: 360 }}
                        transition={{ duration: 5, repeat: Infinity, ease: "linear", delay: -i * 0.3 }} // Increased speed slightly (5s)
                    >
                        <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 shadow-[0_0_10px_#ec4899]" />
                        <div className="h-[1.5px] w-full bg-white/10" />
                        <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_10px_#06b6d4]" />
                    </motion.div>
                ))}
            </div>

            <div className="absolute bottom-[-20px] flex flex-col items-center">
                <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">Neural Core</span>
                <div className="flex items-center gap-1.5 mt-1">
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-[11px] font-bold text-emerald-400">Online</span>
                </div>
            </div>
        </div>
    );
};

// --- Component: Holographic Metric Node (No Background/Border) ---
const MetricNode = ({ icon, label, type = "text", value, color, align = "left" }: any) => {
    const styles = colorStyles[color] || colorStyles.pink; // Fallback

    return (
        <motion.div
            className={cn(
                "flex items-center gap-5 w-[260px] group",
                align === "right" ? "flex-row-reverse text-right" : "flex-row"
            )}
            initial={{ opacity: 0, x: align === "left" ? 20 : -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Holographic Icon (Glowing, No Box) */}
            <div className={`p-3 rounded-full bg-black/40 border border-${color}-500/30 ${styles.text} ${styles.glow} group-hover:scale-110 transition-transform duration-500`}>
                {icon}
            </div>

            <div className="flex-1">
                <div className={`text-[13px] text-slate-500 font-bold uppercase tracking-wider mb-2 ${align === "right" ? "ml-auto" : "mr-auto"}`}>{label}</div>

                {/* 1. TEXT TYPE (Static) */}
                {type === "text" && (
                    <div className={`text-[15px] font-bold ${styles.textDim}`}>{value}</div>
                )}

                {/* 2. WAVE TYPE (Tone - Audio Visualizer) */}
                {type === "wave" && (
                    <div className={`flex items-end gap-[3px] h-8 ${align === "right" ? "justify-end" : "justify-start"}`}>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <motion.div
                                key={i}
                                className={`w-[5px] rounded-full ${styles.bar} shadow-[0_0_8px_currentColor]`}
                                animate={{ height: ["20%", "100%", "30%"] }}
                                transition={{
                                    duration: 0.8,
                                    repeat: Infinity,
                                    repeatType: "mirror",
                                    ease: "easeInOut",
                                    delay: i * 0.1
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* 3. RADAR TYPE (Routing - Ping Effect) */}
                {type === "radar" && (
                    <div className={`flex items-center gap-3 ${align === "right" ? "justify-end" : "justify-start"} relative h-8`}>
                        <div className="relative flex items-center justify-center w-8 h-8">
                            <div className="absolute w-full h-full rounded-full border border-cyan-500/60 opacity-0 animate-ping" />
                            <div className="absolute w-[60%] h-[60%] rounded-full border border-cyan-500/90 opacity-0 animate-[ping_1.5s_linear_infinite]" />
                            <div className={`w-2.5 h-2.5 rounded-full ${styles.bar} shadow-[0_0_12px_cyan]`} />
                        </div>
                        <span className={`text-[15px] font-bold ${styles.textDim}`}>{value}</span>
                    </div>
                )}

                {/* 4. BAR TYPE (Response - Length Bars) - NEW IMPROVED */}
                {type === "bar" && (
                    <div className={`flex flex-col gap-1 ${align === "right" ? "items-end" : "items-start"}`}>
                        <div className={`text-[15px] font-bold ${styles.textDim} mb-1`}>{value}</div>
                        <div className="flex items-center gap-1 h-2 bg-white/5 rounded-full p-[2px] w-[120px]">
                            <motion.div
                                className={`h-full rounded-full ${styles.bar}`}
                                animate={{ width: ["20%", "80%", "40%"] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            />
                        </div>
                    </div>
                )}

                {/* 5. SCROLL TYPE (Memory - Rolling Text) */}
                {type === "scroll" && (
                    <div className={`relative h-10 overflow-hidden w-full ${align === "right" ? "text-right" : "text-left"}`}>
                        {/* Fade Masks */}
                        <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-b from-[#020617] to-transparent z-10" />
                        <div className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-t from-[#020617] to-transparent z-10" />

                        <motion.div
                            animate={{ y: ["0%", "-20%", "-40%", "-60%", "-80%"] }}
                            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                            className={`text-[13px] font-mono ${styles.textDim} flex flex-col gap-2 py-1 items-${align === "right" ? "end" : "start"}`}
                        >
                            <div className="px-2 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">#VIP_Segment</div>
                            <div className="px-2 py-1 rounded bg-white/5 text-slate-400 border border-white/10">Intent: High</div>
                            <div className="px-2 py-1 rounded bg-white/5 text-slate-400 border border-white/10">Role: Founder</div>
                            <div className="px-2 py-1 rounded bg-white/5 text-slate-400 border border-white/10">Pref: Dark_Mode</div>
                            <div className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Action: Upgrade</div>
                            <div className="px-2 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">#VIP_Segment</div>
                        </motion.div>
                    </div>
                )}

                {/* 6. SCAN TYPE (Privacy/Governance - Moving Shield) */}
                {type === "scan" && (
                    <div className={`flex flex-col gap-1.5 ${align === "right" ? "items-end" : "items-start"} w-full`}>
                        <span className={`text-[15px] font-bold ${styles.textDim}`}>{value}</span>
                        <div className={`relative w-full max-w-[140px] h-1.5 bg-white/10 rounded-full overflow-hidden`}>
                            <motion.div
                                className={`absolute top-0 bottom-0 w-[40%] ${styles.bar} shadow-[0_0_10px_currentColor]`}
                                animate={{ x: ["-100%", "300%"] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            />
                        </div>
                    </div>
                )}

                {/* 7. SHIELD TYPE (Privacy - Shimmering Lock) */}
                {type === "shield" && (
                    <div className={`flex items-center gap-2 ${align === "right" ? "flex-row-reverse" : "flex-row"}`}>
                        <span className={`text-[15px] font-bold ${styles.textDim}`}>{value}</span>
                        <div className={`relative px-2 py-0.5 rounded border border-${color}-500/30 bg-${color}-500/10 overflow-hidden`}>
                            <div className="text-[10px] font-bold text-white uppercase tracking-wider relative z-10 flex items-center gap-1">
                                <Lock className="w-3 h-3" /> SECURE
                            </div>
                            {/* Shimmer Effect */}
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                                animate={{ x: ["-150%", "150%"] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            />
                        </div>
                    </div>
                )}

            </div>
        </motion.div>
    )
}

// --- Component: Strategy Card (Bottom - Standard) ---
const StrategyCard = ({ icon, title, highlight, desc, color }: any) => {
    const styles = colorStyles[color] || colorStyles.pink;

    return (
        <div className="group relative h-full">
            <div className="relative h-full overflow-hidden rounded-3xl border border-white/5 bg-[#0a0f1d]/40 backdrop-blur-md p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:bg-[#0a0f1d]/80">

                {/* Border Beam */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <BorderBeam
                        size={250}
                        duration={8}
                        colorFrom={styles.beamFrom}
                        colorTo={styles.beamTo}
                    />
                </div>

                <div className="flex items-start justify-between mb-6">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 shadow-inner">
                        {icon}
                    </div>
                    <div className={`text-[10px] font-bold px-2 py-1 rounded ${styles.bg} ${styles.text} ${styles.bg.replace('/10', '/20')}`}>
                        {highlight}
                    </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                    {desc}
                </p>
            </div>
        </div>
    )
}

export function Personality() {
    return (
        <section className="py-24 bg-[#020617] relative flex flex-col items-center overflow-hidden">

            {/* Background Atmosphere */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-indigo-500/5 blur-[120px] rounded-full" />
            </div>

            <div className="max-w-7xl mx-auto px-4 w-full relative z-10 flex flex-col items-center">

                {/* 1. Header */}
                <div className="text-center mb-20 max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-indigo-500/30 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">Your Business Personality</span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-4 leading-tight">
                        Your Brand's <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-indigo-500">Digital Soul.</span>
                    </h2>
                    <p className="text-lg text-slate-400 max-w-3xl mx-auto">
                        Cluaiz doesn't just read scripts. It inherits your <span className="text-white font-medium">Tone</span>, <span className="text-white font-medium">Iron Rules</span>, and <span className="text-white font-medium">Memory</span> to become an indistinguishable extension of you.
                    </p>
                </div>

                {/* 2. The "Holographic Nerve Center" Layout */}
                <div className="w-full flex md:flex-row flex-col items-center justify-center gap-16 lg:gap-32 mb-28 relative">

                    {/* Left Holographic Nodes (3 Slots) */}
                    <div className="flex flex-col gap-8 z-10">
                        {/* 1. Tone (Vibe) */}
                        <MetricNode
                            align="left"
                            icon={<Activity className="w-6 h-6" />}
                            label="Tone Intelligence"
                            type="wave"
                            color="pink"
                        />
                        {/* 2. Privacy (Data) - RESTORED */}
                        <MetricNode
                            align="left"
                            icon={<Lock className="w-6 h-6" />}
                            label="Privacy Vault"
                            type="shield" // New Animation
                            value="Encrypted: AES-256"
                            color="emerald"
                        />
                        {/* 3. Governance (Rules) - NEW */}
                        <MetricNode
                            align="left"
                            icon={<ShieldCheck className="w-6 h-6" />}
                            label="Governance Core"
                            type="scan"
                            value="Iron Rules Active"
                            color="cyan"
                        />
                    </div>

                    {/* Central DNA (Compact) */}
                    <div className="w-[120px] md:w-[200px] flex-shrink-0 z-0">
                        <DNAEngine />
                    </div>

                    {/* Right Holographic Nodes (3 Slots) */}
                    <div className="flex flex-col gap-8 z-10">
                        {/* 1. Routing (Logic) - RESTORED */}
                        <MetricNode
                            align="right"
                            icon={<Split className="w-6 h-6" />}
                            label="Hybrid Routing"
                            type="radar"
                            value="Smart Mode"
                            color="cyan"
                        />
                        {/* 2. Response (Style) - NEW */}
                        <MetricNode
                            align="right"
                            icon={<Zap className="w-6 h-6" />}
                            label="Response Engine"
                            type="bar" // New Type for Length
                            value="Auto-Length: Adaptive"
                            color="pink"
                        />
                        {/* 3. Memory (Context) */}
                        <MetricNode
                            align="right"
                            icon={<History className="w-6 h-6" />}
                            label="Memory Core"
                            type="scroll"
                            color="purple"
                        />
                    </div>
                </div>

                {/* 3. Bottom Cards (The Strategy) */}
                <div className="grid md:grid-cols-3 gap-6 w-full max-w-6xl mb-8">

                    <StrategyCard
                        color="pink"
                        icon={<Database className="w-6 h-6 text-pink-400" />}
                        highlight="LEAD GEN"
                        title="Form Intelligence"
                        desc="Cluaiz detects intent and triggers lead forms instantly. It doesn't just chat; it captures valid business leads."
                    />

                    <StrategyCard
                        color="cyan"
                        icon={<Fingerprint className="w-6 h-6 text-cyan-400" />}
                        highlight="CLONING"
                        title="Tone Sequencing"
                        desc="We train the AI on your 'Good Replies'. It learns your slang, warmth, and exact professional vibe."
                    />

                    <StrategyCard
                        color="purple"
                        icon={<BrainCircuit className="w-6 h-6 text-purple-400" />}
                        highlight="RETENTION"
                        title="Auto-Learned Facts"
                        desc="The AI remembers user names, past orders, and preferences forever, making every customer feel like a VIP."
                    />

                </div>

                {/* 4. NEW: Human Override & Training Stream (Below Cards) */}
                <div className="w-full max-w-6xl relative ">
                    <div className="group relative w-full overflow-hidden rounded-3xl border border-white/5 bg-[#0a0f1d]/40 backdrop-blur-md p-8 transition-all duration-300 hover:shadow-2xl hover:bg-[#0a0f1d]/80">

                        {/* Shared Border Beam for Consistency */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                            <BorderBeam
                                size={400}
                                duration={10}
                                colorFrom="#a855f7"
                                colorTo="#3b82f6"
                            />
                        </div>

                        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">

                            {/* Left: Text */}
                            <div className="text-left space-y-4 max-w-xl">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-orange-400 mb-1 uppercase tracking-wider">Supervision Layer</div>
                                        <h3 className="text-2xl font-bold text-white">Human Handoff & Training</h3>
                                    </div>
                                </div>
                                <p className="text-slate-400 text-base leading-relaxed">
                                    Define "Escalation Triggers" to seamlessly handoff complex users to real humans. Plus, feed it your "Style Guide" for instant behavioral cloning.
                                </p>
                            </div>

                            {/* Right: Visual Stream */}
                            <div className="flex-1 w-full h-[140px] relative overflow-hidden rounded-xl bg-black/40 border border-white/5 shadow-inner">
                                {/* Moving Code Stream */}
                                <motion.div
                                    className="absolute top-0 left-0 w-full flex flex-col gap-3 p-6 font-mono text-sm opacity-80"
                                    animate={{ y: ["-10%", "-50%"] }}
                                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                                >
                                    <div className="text-emerald-400">{`> Style: Professional, Witty`}</div>
                                    <div className="text-slate-500">{`> Rule: Never mention competitors`}</div>
                                    <div className="text-cyan-400">{`> Goal: Book appointment`}</div>
                                    <div className="text-pink-400">{`> Trigger: "Speak to agent" -> Handoff`}</div>
                                    <div className="text-emerald-400">{`> Context: Local Knowledge Base`}</div>
                                    <div className="text-slate-500">{`> Response: < 50 words`}</div>
                                    <div className="text-cyan-400">{`> Handoff: Active`}</div>
                                </motion.div>

                                {/* Overlay Fade */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30" />
                            </div>

                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}