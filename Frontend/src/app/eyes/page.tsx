"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Loader2, Volume2, Beaker, Play } from "lucide-react";
import EmoEyes, { EmoEmotion } from "@/components/neural-display-v2/EmoEyes";
import { EmotionVector, NEUTRAL_VECTOR } from "@/components/neural-display-v2/ExpressionRig";
// import Mouth from "@/components/neural-display-v2/Mouth";
import { useBrowserVoice } from "@/components/browser-voice/useBrowserVoice";
import { EmojiPicker } from "@/components/chatbot/pickers/EmojiPicker";
import { Smile } from "lucide-react";
import { LottieEmoji } from "@/components/global/LottieEmoji";
import { EmojiMeta } from "@/assets/emogy/EmojiMeta";

// ─────────────────────────────────────────────────────────
//  Emoji Codepoint → EmoEmotion Mapping
// ─────────────────────────────────────────────────────────
const EMOJI_TO_EMOTION: Record<string, EmoEmotion> = {
    "1f600": "happy", "1f603": "happy", "1f604": "happy", "1f601": "happy",
    "1f62d": "sad", "1f61e": "sad", "1f622": "sad",
    "1f609": "wink",
    "1f60d": "love", "1f970": "love",
    "1f929": "star",
    "1f914": "curious", "1f928": "curious",
    "1f632": "surprised", "1f62e": "surprised", "1f62f": "surprised",
    "1f620": "angry", "1f621": "angry", "1f92c": "angry",
    "1f634": "sleep", "1f62a": "sleep",
    "1f635_200d_1f4ab": "dizzy", "1f635": "dizzy",
    "1f629": "weary", "1f62b": "weary",
    "1fae3": "peeking",
    "1f612": "bored",
    "1f92f": "mindblown",
    "1fae0": "melting",
    "1f631": "shook",
    "1f60e": "cool",
    "1f973": "excited",
    "1f60f": "smug",
    "1f610": "blank",
    "1f624": "frustrated",
};

const getEmojiCodepoint = (emoji: string) => {
    return [...emoji]
        .map(char => char.codePointAt(0)?.toString(16))
        .filter(Boolean)
        .join('_');
};

type EmotionEntry = { id: EmoEmotion; label: string; icon: string };

const EMOTION_GROUPS: { title: string; accent: string; items: EmotionEntry[] }[] = [
    {
        title: "CORE",
        accent: "#00e5ff",
        items: [
            { id: "idle", label: "Idle", icon: "😐" },
            { id: "happy", label: "Happy", icon: "😄" },
            { id: "sad", label: "Sad", icon: "😔" },
            { id: "angry", label: "Angry", icon: "😠" },
            { id: "surprised", label: "Surprised", icon: "😲" },
            { id: "cute", label: "Cute", icon: "🥺" },
            { id: "wink", label: "Wink", icon: "😉" },
            { id: "curious", label: "Curious", icon: "🤔" },
        ],
    },
    {
        title: "SPECIAL",
        accent: "#ffda00",
        items: [
            { id: "love", label: "Love", icon: "😍" },
            { id: "star", label: "Stars", icon: "🤩" },
            { id: "cool", label: "Cool", icon: "😎" },
            { id: "sleep", label: "Sleep", icon: "😴" },
            { id: "dizzy", label: "Dizzy", icon: "😵" },
            { id: "weary", label: "Weary", icon: "😩" },
            { id: "peeking", label: "Peeking", icon: "👀" },
            { id: "bored", label: "Bored", icon: "😒" },
        ],
    },
    {
        title: "SYSTEM",
        accent: "#ff3366",
        items: [
            { id: "loading", label: "Loading", icon: "⏳" },
            { id: "error", label: "Error", icon: "❌" },
            { id: "rolling", label: "Rolling", icon: "🌀" },
            { id: "tornado", label: "Tornado", icon: "🌪️" },
            { id: "reading", label: "Reading", icon: "📖" },
            { id: "glitch", label: "Glitch", icon: "⚡" },
        ],
    },
    {
        title: "NEW",
        accent: "#b366ff",
        items: [
            { id: "excited", label: "Excited", icon: "🥳" },
            { id: "smug", label: "Smug", icon: "😏" },
            { id: "mindblown", label: "Mind-blown", icon: "🤯" },
            { id: "blank", label: "Blank", icon: "😶" },
            { id: "frustrated", label: "Frustrated", icon: "😤" },
            { id: "shook", label: "Shook", icon: "😱" },
            { id: "melting", label: "Melting", icon: "🫠" },
        ],
    },
];

const COLORS = [
    { hex: "#00e5ff", name: "Cyan" },
    { hex: "#00ffaa", name: "Neon Green" },
    { hex: "#ffaa00", name: "Amber" },
    { hex: "#ff3366", name: "Hot Pink" },
    { hex: "#9966ff", name: "Purple" },
    { hex: "#ff6600", name: "Orange" },
    { hex: "#ffffff", name: "White" },
];
export default function EyesGalleryPage() {
    const [activeEmotion, setActiveEmotion] = useState<EmoEmotion>("idle");
    const [color, setColor] = useState<string>("#00e5ff");
    const [activeMode, setActiveMode] = useState<"presets" | "lab" | "emoji">("presets");
    const [labVector, setLabVector] = useState<EmotionVector>(NEUTRAL_VECTOR);
    const [selectedEmojiPath, setSelectedEmojiPath] = useState<string | null>(null);
    const [isEmojiModalOpen, setIsEmojiModalOpen] = useState(false);

    // ── Browser Voice Testing Hook ──
    const {
        isListening,
        isProcessing,
        isSpeaking,
        transcript,
        interimTranscript,
        botReply,
        currentEmotion,
        activeWordIndex,
        startInteraction,
        stopInteraction
    } = useBrowserVoice();

    // Map the hook's emotion to the UI when active
    const displayEmo = (isListening || isProcessing || isSpeaking) ? (currentEmotion as EmoEmotion) : activeEmotion;

    const activeGroup = EMOTION_GROUPS.find(g => g.items.some(i => i.id === displayEmo)) || EMOTION_GROUPS[0];
    const accentColor = activeGroup?.accent ?? "#00e5ff";

    const stageRef = useRef<HTMLDivElement>(null);
    const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

    // Track mouse over stage for gaze testing
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!stageRef.current) return;
        const rect = stageRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 50;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 50;
        setMouseOffset({ x, y });
    };

    return (
        <div className="w-full h-screen bg-[#050508] flex flex-col font-mono text-white overflow-hidden selection:bg-[#00e5ff] selection:text-black">

            {/* ── Header ── */}
            <header className="px-8 py-5 flex-shrink-0 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl z-50">
                <div className="flex items-center gap-8">
                    <div className="group cursor-pointer">
                        <h1 className="text-2xl font-black tracking-[0.3em] uppercase transition-all group-hover:tracking-[0.4em]" style={{ color: accentColor }}>
                            NEURAL<span className="text-white">EYES</span>
                        </h1>
                        <p className="text-[9px] text-slate-500 uppercase tracking-[0.3em] mt-0.5">
                            12-Point Universal Mesh · v5.0 · Isolated Logic
                        </p>
                    </div>

                    <div className="h-8 w-[1px] bg-white/10" />

                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-md">
                        <button
                            onClick={() => setActiveMode("presets")}
                            className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeMode === "presets" ? 'bg-[#00e5ff] text-black shadow-[0_0_20px_#00e5ff60]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Play size={12} fill={activeMode === "presets" ? "black" : "currentColor"} /> Presets
                        </button>
                        <button
                            onClick={() => setActiveMode("lab")}
                            className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeMode === "lab" ? 'bg-[#ffda00] text-black shadow-[0_0_20px_#ffda0060]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Beaker size={12} fill={activeMode === "lab" ? "black" : "currentColor"} /> Morph Lab
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setIsEmojiModalOpen(true)}
                        className={`p-2.5 rounded-full border transition-all hover:scale-110 active:scale-90 ${activeMode === 'emoji' ? 'bg-[#ff3366] border-[#ff3366] text-black shadow-[0_0_20px_#ff336660]' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}
                        title="Project Emoji"
                    >
                        <Smile size={20} />
                    </button>

                    <div className="h-8 w-[1px] bg-white/10" />

                    <div className="flex items-center gap-3">
                        <span className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">Aesthetics</span>
                        <div className="flex gap-2 p-2 bg-white/5 rounded-full border border-white/10">
                            {COLORS.map(c => (
                                <motion.button
                                    key={c.hex}
                                    onClick={() => setColor(c.hex)}
                                    whileHover={{ scale: 1.2 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="w-5 h-5 rounded-full ring-2 ring-offset-2 ring-offset-black transition-all"
                                    style={{
                                        backgroundColor: c.hex,
                                        boxShadow: color === c.hex ? `0 0 0 2px ${c.hex}` : "none"
                                    }}
                                    title={c.name}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Stage ── */}
            <main
                ref={stageRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setMouseOffset({ x: 0, y: 0 })}
                className="flex-1 flex items-center justify-center relative overflow-hidden group/stage"
            >
                {/* Dynamic Background Noise/Grid */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
                />

                {/* Ambient glow */}
                <motion.div
                    className="absolute w-[800px] h-[800px] rounded-full blur-[160px] pointer-events-none"
                    animate={{ backgroundColor: `${accentColor}12` }}
                    transition={{ duration: 0.8 }}
                />

                {/* Main Display Container - Optimized for "Robot Head" feel */}
                <motion.div
                    className="relative flex items-center justify-center rounded-[85px] border-[14px] group/bezel overflow-hidden"
                    style={{
                        width: 620,
                        height: 380,
                        backgroundColor: "#08080c",
                        backgroundImage: `linear-gradient(145deg, #12121a 0%, #08080c 50%, #050508 100%)`
                    }}
                    animate={{
                        borderColor: `${accentColor}30`,
                        boxShadow: `
                            0 0 0 1px rgba(255,255,255,0.05),
                            0 50px 120px rgba(0,0,0,0.9),
                            0 20px 60px ${accentColor}10,
                            inset 0 0 100px rgba(0,0,0,0.95),
                            inset 0 0 40px ${accentColor}05
                        `
                    }}
                >
                    {/* Metallic Outer Rim Glow */}
                    <div className="absolute -inset-[2px] rounded-[85px] border border-white/5 pointer-events-none" />
                    {/* Glass Glare */}
                    <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none z-20" />

                    {/* Scanlines Effect */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.15] z-10 mix-blend-overlay"
                        style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)" }}
                    />

                    {/* Hardware Sensor Clusters - Restoring the "Robot" feel */}
                    {["top-6 left-10", "top-6 right-10", "bottom-6 left-10", "bottom-6 right-10"].map(pos => (
                        <div key={pos} className={`absolute ${pos} flex gap-1.5 z-30 opacity-40 group-hover/bezel:opacity-100 transition-all duration-500`}>
                            <motion.div
                                className="w-2 h-2 rounded-full border border-white/10"
                                animate={{ backgroundColor: [`${accentColor}10`, accentColor, `${accentColor}10`], scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 4, delay: Math.random() * 2 }}
                            />
                            <div className="w-2 h-2 rounded-full bg-white/5 border border-white/10" />
                        </div>
                    ))}
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />

                    <div className="relative w-full h-full flex items-center justify-center z-20">
                        {activeMode === "emoji" ? (
                            <div className="w-full h-full flex items-center justify-center p-12">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={selectedEmojiPath || "default"}
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 1.1, opacity: 0 }}
                                        transition={{
                                            duration: 0.5,
                                            ease: [0.23, 1, 0.32, 1]
                                        }}
                                        className="w-full h-full flex items-center justify-center"
                                    >
                                        <LottieEmoji
                                            path={selectedEmojiPath || "/emojis/smile_1f600.json"}
                                            style={{ width: "70%", height: "70%", filter: 'drop-shadow(0 0 30px rgba(0,0,0,0.5))' }}
                                        />
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        ) : (
                            <EmoEyes
                                emotion={displayEmo}
                                manualVector={activeMode === "lab" ? labVector : undefined}
                                color={color}
                                scale={1.4}
                                externalMouseOffset={mouseOffset}
                            />
                        )}
                        {/* <div className="absolute top-[68%] left-1/2 -translate-x-1/2">
                            <Mouth
                                emotion={displayEmo}
                                color={color}
                                scale={1}
                                isSpeaking={isSpeaking}
                            />
                        </div> */}
                    </div>

                    {/* HUD lines removed for cleaner look */}
                </motion.div>

                {/* Active HUD Label Removed */}

                {/* Browser Voice HUD */}
                <div className="absolute top-10 right-10 w-72 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl z-50">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-[#00e5ff] uppercase tracking-tighter">Voice Interface</span>
                            <span className="text-[7px] text-slate-500 uppercase">STT / LLM / TTS Pipeline</span>
                        </div>
                        <div className="flex gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${isListening ? 'bg-red-500 shadow-[0_0_8px_red]' : 'bg-white/10'}`} />
                            <div className={`w-1.5 h-1.5 rounded-full ${isProcessing ? 'bg-yellow-500 shadow-[0_0_8px_yellow]' : 'bg-white/10'}`} />
                            <div className={`w-1.5 h-1.5 rounded-full ${isSpeaking ? 'bg-green-500 shadow-[0_0_8px_green]' : 'bg-white/10'}`} />
                        </div>
                    </div>

                    <button
                        onClick={isListening ? stopInteraction : startInteraction}
                        className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 font-black uppercase tracking-[0.2em] text-[10px] transition-all active:scale-95 ${isListening ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            isProcessing ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 animate-pulse' :
                                isSpeaking ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                    'bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/20 hover:bg-[#00e5ff]/20'
                            }`}
                        disabled={isProcessing}
                    >
                        {isListening ? "Listening..." : isProcessing ? "Thinking..." : isSpeaking ? "Speaking..." : "Talk to Neural"}
                    </button>

                    <AnimatePresence>
                        {(transcript || interimTranscript || botReply) && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                className="mt-4 flex flex-col gap-2 overflow-hidden"
                            >
                                {(transcript || interimTranscript) && (
                                    <div className="bg-white/5 p-3 rounded-lg border border-white/5 italic text-[10px] text-[#00e5ff]/80">
                                        "{interimTranscript || transcript}"
                                    </div>
                                )}
                                {botReply && (
                                    <div className="bg-black/40 p-3 rounded-lg border border-[#00e5ff]/20 text-[11px] text-white">
                                        {botReply.trim().split(/\s+/).map((word, i) => {
                                            const isActive = i === activeWordIndex;
                                            return (
                                                <span key={i} className="inline-block mr-1">
                                                    {isActive ? (
                                                        <motion.span
                                                            initial={{ color: "#ffffff", textShadow: "none" }}
                                                            animate={{ color: "#00e5ff", textShadow: "0 0 10px rgba(0,229,255,0.8)" }}
                                                            transition={{ duration: 0.1 }}
                                                        >
                                                            {word}
                                                        </motion.span>
                                                    ) : (
                                                        <span className="text-white/80 transition-colors duration-300">
                                                            {word}
                                                        </span>
                                                    )}
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* ── Control Panel ── */}
            <div className="flex-shrink-0 border-t border-white/5 bg-black/60 backdrop-blur-2xl px-8 py-6 z-50">
                {activeMode === "presets" ? (
                    <div className="flex flex-col gap-5 overflow-y-auto max-h-[300px] pr-4 scrollbar-thin scrollbar-thumb-white/10">
                        {EMOTION_GROUPS.map((group) => (
                            <div key={group.title} className="flex gap-6 items-start">
                                <div className="w-24 pt-2">
                                    <span className="text-[10px] font-black tracking-[0.3em] uppercase opacity-50 block mb-1" style={{ color: group.accent }}>{group.title}</span>
                                    <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div className="h-full" style={{ backgroundColor: group.accent }} animate={{ width: activeGroup.title === group.title ? '100%' : '0%' }} />
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2.5 flex-1">
                                    {group.items.map((emo) => {
                                        const isActive = activeEmotion === emo.id;
                                        return (
                                            <motion.button
                                                key={emo.id}
                                                onClick={() => {
                                                    setActiveEmotion(emo.id);
                                                    setLabVector(NEUTRAL_VECTOR);
                                                }}
                                                whileHover={{ scale: 1.05, y: -2 }}
                                                whileTap={{ scale: 0.95 }}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${isActive
                                                    ? 'bg-white/10 border-white/20 text-white shadow-xl translate-y-[-2px]'
                                                    : 'bg-white/5 border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/10'
                                                    }`}
                                            >
                                                <span className="text-base">{emo.icon}</span>
                                                {emo.label}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : activeMode === "lab" ? (
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-[#ffda00] animate-pulse" />
                                <span className="text-xs font-black tracking-[0.4em] uppercase text-[#ffda00]">Morph Engine Tuning</span>
                            </div>
                            <button
                                onClick={() => setLabVector(NEUTRAL_VECTOR)}
                                className="px-4 py-1 rounded-full border border-white/10 text-[9px] font-bold uppercase tracking-widest text-slate-500 hover:text-white hover:bg-white/5 active:scale-95"
                            >
                                Reset Matrix
                            </button>
                        </div>
                        <div className="grid grid-cols-5 gap-x-10 gap-y-6">
                            {(Object.keys(NEUTRAL_VECTOR) as Array<keyof EmotionVector>).map((key) => (
                                <div key={key} className="flex flex-col gap-3 group">
                                    <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold">
                                        <span className="group-hover:text-[#ffda00] transition-colors">{key}</span>
                                        <span className="text-[#ffda00] tabular-nums font-black">{(labVector[key] * 100).toFixed(0)}</span>
                                    </div>
                                    <div className="relative h-6 flex items-center">
                                        <div className="absolute inset-0 h-[2px] bg-white/10 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.01"
                                            value={labVector[key]}
                                            onChange={(e) => setLabVector(prev => ({ ...prev, [key]: parseFloat(e.target.value) }))}
                                            className="relative w-full h-1 appearance-none cursor-pointer bg-transparent accent-[#ffda00] z-20"
                                        />
                                        <motion.div
                                            className="absolute left-0 h-[2px] bg-[#ffda00] top-1/2 -translate-y-1/2 z-10"
                                            style={{ width: `${labVector[key] * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}
            </div>

            {/* ── Emoji Selection Modal ── */}
            <AnimatePresence>
                {isEmojiModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsEmojiModalOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-2xl bg-[#0a0a0f] rounded-[2.5rem] border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden"
                        >
                            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <div className="flex flex-col gap-1">
                                    <h2 className="text-sm font-black tracking-[0.4em] uppercase text-[#ff3366]">Neural Projection</h2>
                                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Select an animated vector to manifest</p>
                                </div>
                                <button
                                    onClick={() => setIsEmojiModalOpen(false)}
                                    className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors"
                                >
                                    <Square size={16} className="rotate-45" />
                                </button>
                            </div>

                            <div className="p-8 flex justify-center">
                                <EmojiPicker
                                    onSelect={(emoji) => {
                                        const codepoint = getEmojiCodepoint(emoji);
                                        const meta = EmojiMeta[codepoint];
                                        const mappedEmotion = EMOJI_TO_EMOTION[codepoint] || "idle";

                                        setActiveEmotion(mappedEmotion);
                                        if (meta?.path) {
                                            setSelectedEmojiPath(meta.path);
                                        }
                                        setActiveMode("emoji");
                                        setIsEmojiModalOpen(false);
                                    }}
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
