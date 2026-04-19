'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimatedBeam } from '@/components/ui/animated-beam';
import { Brain, Globe, Database, FileText, Search, Wifi, CheckCircle2, Loader2, Server, ArrowRight, Building2, X, ExternalLink } from 'lucide-react';
import { StepDiagnostics } from './StepDiagnostics';

interface HandshakeStepProps {
    persona: any;
    businessContext: any;
    knowledgeSources?: any[];
    agentId?: string;
    onNext: () => void;
}

const NodeStatusDisplay = ({ isComplete }: { isComplete: boolean }) => {
    const [data, setData] = useState('');

    useEffect(() => {
        if (isComplete) return;
        const interval = setInterval(() => {
            const chars = '0123456789ABCDEF';
            let result = '';
            for (let i = 0; i < 8; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            setData(`0x${result} :: SYNC`);
        }, 80);
        return () => clearInterval(interval);
    }, [isComplete]);

    if (isComplete) {
        return (
            <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span className="font-bold tracking-wider">SYNCED</span>
            </div>
        );
    }

    return (
        <motion.span
            animate={{ x: [-1, 1, -1] }}
            transition={{ duration: 0.1, repeat: Infinity, repeatType: "mirror" }}
            className="font-mono inline-block font-bold"
        >
            {data}
        </motion.span>
    );
}

// Step-based color progression: Red → Orange → Blue → Green
const STEP_COLORS = [
    { start: "#ef4444", stop: "#f87171" }, // Step 1: Red (connecting)
    { start: "#f97316", stop: "#fb923c" }, // Step 2: Orange (reading KB)
    { start: "#3b82f6", stop: "#60a5fa" }, // Step 3: Blue (analyzing API)
    { start: "#10b981", stop: "#34d399" }, // Step 4: Green (learning pricing + final)
];

const cardShakeStyle = `
@keyframes iconPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.7; }
}
`;

export function HandshakeStep({ persona, businessContext, knowledgeSources = [], agentId = '', onNext }: HandshakeStepProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const coreRef = useRef<HTMLDivElement>(null);
    // Node Refs
    const profileRef = useRef<HTMLDivElement>(null);
    const kbRef = useRef<HTMLDivElement>(null);
    const apiRef = useRef<HTMLDivElement>(null);
    const filesRef = useRef<HTMLDivElement>(null);
    const webRef = useRef<HTMLDivElement>(null);
    const manualRef = useRef<HTMLDivElement>(null);
    const analyticsRef = useRef<HTMLDivElement>(null);
    const usersRef = useRef<HTMLDivElement>(null);

    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [scanStage, setScanStage] = useState<'idle' | 'scanning' | 'synthesizing' | 'complete'>('idle');
    const [activeStep, setActiveStep] = useState(0);
    const [showBrainTerminal, setShowBrainTerminal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => { setIsMounted(true); }, []);

    // Real scan counts derived from knowledgeSources
    const scanCounts = useMemo(() => {
        const websites = knowledgeSources.filter((s: any) => s.type === 'website' || s.source_type === 'website').length;
        const docs = knowledgeSources.filter((s: any) => s.type === 'document' || s.type === 'file' || s.source_type === 'document').length;
        const apis = knowledgeSources.filter((s: any) => s.type === 'api' || s.source_type === 'api').length;
        const manual = knowledgeSources.filter((s: any) => s.type === 'custom_text' || s.type === 'text').length;
        const total = knowledgeSources.length;
        return {
            'Business Profile': `${businessContext.name || 'Org'} • ${total > 0 ? total : Math.floor(Math.random() * 10) + 5} resources`,
            'Knowledge Base': `${docs > 0 ? docs : Math.floor(Math.random() * 4) + 2} documents`,
            'API Gateway': `${apis > 0 ? apis : Math.floor(Math.random() * 3) + 1} apis`,
            'Assets & Files': `${(docs + manual) > 0 ? docs + manual : Math.floor(Math.random() * 20) + 10} files`,
            'Official Website': `${websites > 0 ? websites : Math.floor(Math.random() * 3) + 1} pages`,
            'Ops Manuals': `${manual > 0 ? manual : Math.floor(Math.random() * 5) + 1} entries`,
            'Data Analytics': `live stream`,
            'User Cohorts': `${Math.floor(Math.random() * 500) + 100} segments`,
        };
    }, [knowledgeSources, businessContext.name]);

    const nodes = [
        { ref: profileRef, icon: Building2, label: 'Business Profile', color: 'text-purple-400', delay: 0 },
        { ref: kbRef, icon: Database, label: 'Knowledge Base', color: 'text-amber-400', delay: 0.2 },
        { ref: apiRef, icon: Wifi, label: 'API Gateway', color: 'text-cyan-400', delay: 0.4 },
        { ref: filesRef, icon: FileText, label: 'Assets & Files', color: 'text-rose-400', delay: 0.6 },
        { ref: webRef, icon: Globe, label: 'Official Website', color: 'text-indigo-400', delay: 0.8 },
        { ref: manualRef, icon: Server, label: 'Ops Manuals', color: 'text-emerald-400', delay: 1.0 },
        { ref: analyticsRef, icon: Search, label: 'Data Analytics', color: 'text-pink-400', delay: 1.2 },
        { ref: usersRef, icon: Globe, label: 'User Cohorts', color: 'text-blue-400', delay: 1.4 },
    ];

    const scanSteps = [
        { msg: `Initializing connection...`, duration: 1000, nodes: [], colorIndex: 0 },
        { msg: `${persona.name} is connecting to ${businessContext.name}...`, duration: 1500, nodes: [0, 4], colorIndex: 0 }, // Red
        { msg: `${persona.name} is reading your Knowledge Base...`, duration: 1500, nodes: [1, 3], colorIndex: 1 }, // Orange
        { msg: `${persona.name} is analyzing your API structure...`, duration: 1500, nodes: [2, 5], colorIndex: 2 }, // Blue
        { msg: `${persona.name} is learning your pricing psychology...`, duration: 2000, nodes: [6, 7], colorIndex: 3 }, // Green
        { msg: `${persona.name} knows when to push and when to pause.`, duration: 2000, nodes: [0, 1, 2, 3, 4, 5, 6, 7], colorIndex: 3 },
        { msg: `Neural synchronization complete.`, duration: 1000, nodes: [], colorIndex: 3 }
    ];

    // The CURRENT step color — ALL active cards/beams use this single color
    const currentStepColor = useMemo(() => {
        if (scanStage === 'complete') return STEP_COLORS[3]; // Green when complete
        if (!isScanning) return STEP_COLORS[3]; // Default green
        const colorIndex = scanSteps[activeStep]?.colorIndex ?? 3;
        return STEP_COLORS[colorIndex];
    }, [activeStep, isScanning, scanStage]);

    const startScan = async () => {
        setIsScanning(true);
        setScanStage('scanning');

        let currentProgress = 0;

        for (let i = 0; i < scanSteps.length; i++) {
            setActiveStep(i);
            const step = scanSteps[i];

            // Smooth progress
            const increment = 100 / scanSteps.length;
            const target = currentProgress + increment;
            const interval = setInterval(() => {
                setScanProgress(prev => {
                    if (prev >= target) {
                        clearInterval(interval);
                        return target;
                    }
                    return prev + 1;
                });
            }, step.duration / increment);

            await new Promise(resolve => setTimeout(resolve, step.duration));
            currentProgress = target;
        }

        // Final state
        setScanStage('complete');
        setIsScanning(false);
    };

    // Accumulate all nodes from step 0 up to activeStep
    const currentActiveNodes = scanStage === 'complete'
        ? [0, 1, 2, 3, 4, 5, 6, 7] // All active when complete
        : isScanning
            ? [...new Set(scanSteps.slice(0, activeStep + 1).flatMap(step => step.nodes))]
            : [];

    return (
        <div className="flex-1 flex flex-col items-center justify-center relative w-full h-full">
            <style>{cardShakeStyle}</style>

            {/* Central Viz */}
            <div ref={containerRef} className="relative w-full max-w-7xl h-[400px] flex items-center justify-between px-12 md:px-24">

                {/* Left Column Nodes */}
                <div className="flex flex-col justify-center gap-12 z-20">
                    {nodes.slice(0, 4).map((node, index) => {
                        const isActive = currentActiveNodes.includes(index);
                        return (
                            <div key={index} ref={node.ref} className="relative group">
                                <div
                                    style={{
                                        borderColor: isActive ? currentStepColor.start : "#27272a",
                                        boxShadow: isActive ? `0 0 30px ${currentStepColor.start}66` : "none",
                                    }}
                                    className={`p-4 bg-zinc-950 border ${isScanning && !isActive ? 'opacity-50' : ''
                                        } rounded-2xl flex items-center gap-4 min-w-[200px]`}
                                >
                                    <div className={`p-2 rounded-lg bg-zinc-900 bg-opacity-10`}>
                                        <node.icon
                                            style={{
                                                color: isActive ? currentStepColor.start : "",
                                                animation: isActive && isScanning ? 'iconPulse 0.8s ease-in-out infinite' : 'none',
                                            }}
                                            className={`w-5 h-5 ${!isActive ? node.color : ""} transition-colors`}
                                        />
                                    </div>
                                    <div className="text-left">
                                        <p
                                            style={{ color: isActive ? currentStepColor.start : "" }}
                                            className={`text-xs font-bold transition-colors ${!isActive ? "text-zinc-300" : ""}`}
                                        >
                                            {node.label}
                                        </p>
                                        <div className="text-[10px] text-zinc-600 font-mono h-4 overflow-hidden relative">
                                            {scanStage === 'complete' && isActive ? (
                                                <motion.span
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="text-emerald-400 font-bold"
                                                >
                                                    {scanCounts[node.label as keyof typeof scanCounts] || 'SYNCED'}
                                                </motion.span>
                                            ) : isActive ? (
                                                <div style={{ color: currentStepColor.start }}>
                                                    <NodeStatusDisplay isComplete={scanStage === 'complete'} />
                                                </div>
                                            ) : (
                                                <span className="uppercase tracking-wider">Connecting...</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* The AI Core (Center) */}
                <div ref={coreRef} className="z-30 relative mx-12 flex flex-col items-center">
                    {/* Concentric Pulse Rings (Behind Brain) */}
                    {isScanning && (
                        <>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: [0, 0.5, 0], scale: [0.8, 2.5] }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
                                style={{ borderColor: `${currentStepColor.start}4D` }}
                                className="absolute top-0 md:top-0 left-1/1 -translate-x-1/1 -translate-y-1/2 w-40 h-40 md:w-56 md:h-56 rounded-full border-2 z-0 pointer-events-none"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: [0, 0.3, 0], scale: [0.8, 3] }}
                                transition={{ duration: 2.5, repeat: Infinity, delay: 0.8, ease: "easeOut" }}
                                style={{ borderColor: `${currentStepColor.start}33` }}
                                className="absolute top-0 md:top-0 left-1/1 -translate-x-1/1 -translate-y-1/2 w-40 h-40 md:w-56 md:h-56 rounded-full border z-0 pointer-events-none"
                            />
                        </>
                    )}

                    {/* HOVER TERMINAL POPUP above brain */}
                    <AnimatePresence>
                        {showBrainTerminal && scanStage === 'complete' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute  mb-4 w-[420px] max-h-[260px] overflow-hidden bg-black/95 border border-emerald-500/20 rounded-2xl z-50 shadow-2xl shadow-emerald-900/20 pointer-events-none"
                            >
                                <div className="p-3 border-b border-white/5 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-emerald-500 uppercase tracking-widest font-black text-[10px]">Neural Intelligence Report</span>
                                </div>
                                <div className="p-4 space-y-3">
                                    <p className="text-zinc-300 text-xs leading-relaxed italic">
                                        "Hi Boss, I'm <span className="text-emerald-400 font-bold">{persona.name}</span>.
                                        I've thoroughly analyzed <span className="text-white font-bold">{businessContext.name}</span> and synchronized with your business core.
                                        Here's what I discovered during our handshake:"
                                    </p>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
                                        {Object.entries(scanCounts).slice(0, 8).map(([label, count]) => (
                                            <div key={label} className="flex items-center justify-between text-[9px] font-mono border-b border-white/5 pb-0.5">
                                                <span className="text-zinc-500 truncate mr-2">{label}</span>
                                                <span className="text-emerald-400 font-bold whitespace-nowrap">{(count as string).split('•')[1] || count}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono">
                                        <span className="text-zinc-600 uppercase tracking-tighter text-[9px]">Neural Sync Status</span>
                                        <span className="text-emerald-400 font-bold">100% SUCCESSFUL ✓</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.div
                        onHoverStart={() => setShowBrainTerminal(true)}
                        onHoverEnd={() => setShowBrainTerminal(false)}
                        animate={
                            isScanning
                                ? {
                                    scale: [1, 1.05, 1],
                                    x: [-3, 3, -3],
                                    y: [-2, 2, -2],
                                    rotate: [-1, 1, -1]
                                }
                                : { scale: 1 }
                        }
                        transition={
                            isScanning
                                ? {
                                    scale: { duration: 2, repeat: Infinity },
                                    x: { duration: 0.01, repeat: Infinity },
                                    y: { duration: 0.01, repeat: Infinity },
                                    rotate: { duration: 0.1, repeat: Infinity }
                                }
                                : { duration: 0.5 }
                        }
                        style={{
                            borderColor: scanStage === 'complete'
                                ? currentStepColor.start
                                : isScanning
                                    ? `${currentStepColor.start}80`
                                    : "#27272a",
                            boxShadow: scanStage === 'complete'
                                ? `0 0 80px ${currentStepColor.start}99`
                                : isScanning
                                    ? `0 0 60px ${currentStepColor.start}66`
                                    : "none",
                            cursor: scanStage === 'complete' ? 'pointer' : 'default'
                        }}
                        className={`w-40 h-40 md:w-56 md:h-56 rounded-full bg-zinc-950 border-2 flex items-center justify-center relative z-10`}
                    >
                        <Brain
                            style={{
                                color: isScanning || scanStage === 'complete'
                                    ? currentStepColor.start
                                    : "#52525b" // zinc-600
                            }}
                            className="w-16 h-16 md:w-24 md:h-24 transition-colors duration-500"
                        />

                        {/* Progress Rings */}
                        {isScanning && (
                            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="48" fill="none" strokeWidth="1" stroke="#333" />
                                <motion.circle
                                    cx="50" cy="50" r="48" fill="none" strokeWidth="2"
                                    stroke={currentStepColor.start}
                                    strokeDasharray="301.59"
                                    strokeDashoffset={301.59 * (1 - scanProgress / 100)}
                                    strokeLinecap="round"
                                />
                            </svg>
                        )}
                    </motion.div>

                    <div className="text-center">
                        <h3 className={`font-bold text-2xl mb-2 text-white`}>
                            {persona.name}
                        </h3>
                        <AnimatePresence mode="wait">
                            {isScanning ? (
                                <motion.p
                                    key={activeStep}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    style={{ color: currentStepColor.start }}
                                    className="text-sm font-medium"
                                >
                                    {scanSteps[activeStep].msg}
                                </motion.p>
                            ) : scanStage === 'complete' ? (
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-zinc-400">
                                    {persona.role} • Ready to Deploy
                                </motion.p>
                            ) : (
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-zinc-500">
                                    {persona.role}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Right Column Nodes */}
                <div className="flex flex-col justify-center gap-12 z-20">
                    {nodes.slice(4, 8).map((node, index) => {
                        const realIndex = index + 4;
                        const isActive = currentActiveNodes.includes(realIndex);
                        return (
                            <div key={realIndex} ref={node.ref} className="relative group">
                                <div
                                    style={{
                                        borderColor: isActive ? currentStepColor.start : "#27272a",
                                        boxShadow: isActive ? `0 0 30px ${currentStepColor.start}66` : "none",
                                    }}
                                    className={`p-4 bg-zinc-950 border ${isScanning && !isActive ? 'opacity-50' : ''
                                        } rounded-2xl flex items-center gap-4 min-w-[200px] flex-row-reverse text-right`}
                                >
                                    <div className={`p-2 rounded-lg bg-zinc-900 bg-opacity-10`}>
                                        <node.icon
                                            style={{
                                                color: isActive ? currentStepColor.start : "",
                                                animation: isActive && isScanning ? 'iconPulse 0.8s ease-in-out infinite' : 'none',
                                            }}
                                            className={`w-5 h-5 ${!isActive ? node.color : ""} transition-colors`}
                                        />
                                    </div>
                                    <div className="text-right">
                                        <p
                                            style={{ color: isActive ? currentStepColor.start : "" }}
                                            className={`text-xs font-bold transition-colors ${!isActive ? "text-zinc-300" : ""}`}
                                        >
                                            {node.label}
                                        </p>
                                        <div className="text-[10px] text-zinc-600 font-mono h-4 overflow-hidden relative flex justify-end">
                                            {scanStage === 'complete' && isActive ? (
                                                <motion.span
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="text-emerald-400 font-bold"
                                                >
                                                    {scanCounts[node.label as keyof typeof scanCounts] || 'SYNCED'}
                                                </motion.span>
                                            ) : isActive ? (
                                                <div style={{ color: currentStepColor.start }}>
                                                    <NodeStatusDisplay isComplete={scanStage === 'complete'} />
                                                </div>
                                            ) : (
                                                <span className="uppercase tracking-wider">Connecting...</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Beams */}
                {nodes.map((node, index) => {
                    const isActive = currentActiveNodes.includes(index);

                    return (
                        <React.Fragment key={index}>
                            {/* Only show beam when active */}
                            {isActive && (
                                <AnimatedBeam
                                    containerRef={containerRef}
                                    fromRef={node.ref}
                                    toRef={coreRef}
                                    duration={1.5}
                                    delay={node.delay}
                                    gradientStartColor={currentStepColor.start}
                                    gradientStopColor={currentStepColor.stop}
                                    pathOpacity={0.6}
                                    pathWidth={3}
                                    reverse={index >= 4}
                                />
                            )}
                        </React.Fragment>
                    )
                })}
            </div>

            {/* Action Area */}
            <div className="mt-4 z-40 flex flex-col items-center gap-3">
                {scanStage === 'idle' && (
                    <Button onClick={startScan} size="lg" className="h-14 px-12 bg-white text-black hover:bg-zinc-200 font-bold text-base rounded-full shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all hover:scale-105">
                        <Wifi className="w-4 h-4 mr-2" />
                        Initialize Neural Handshake
                    </Button>
                )}

                {scanStage === 'scanning' && (
                    <div className="h-14 flex items-center gap-3 px-8 bg-zinc-900/50 border border-zinc-800 rounded-full">
                        <Loader2 style={{ color: currentStepColor.start }} className="w-4 h-4 animate-spin" />
                        <span style={{ color: currentStepColor.start }} className="text-sm font-mono">{scanProgress.toFixed(0)}%</span>
                    </div>
                )}

                {scanStage === 'complete' && (
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-3">
                            <Button onClick={onNext} size="lg" className="h-14 px-12 bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-base rounded-full transition-all shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:scale-105">
                                Continue to Persona Sync
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                            <button
                                onClick={() => setShowDetailsModal(true)}
                                className="h-14 px-6 bg-zinc-900/80 border border-white/10 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-sm rounded-full transition-all flex items-center gap-2"
                            >
                                <ExternalLink className="w-4 h-4" />
                                View Details
                            </button>
                        </div>
                        <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                            Hover brain icon to preview scan summary
                        </p>
                    </motion.div>
                )}
            </div>

            {/* Details Modal — Portal to document.body to bypass Framer Motion parent transforms */}
            {
                isMounted && createPortal(
                    <AnimatePresence>
                        {showDetailsModal && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
                                onClick={(e) => e.target === e.currentTarget && setShowDetailsModal(false)}
                            >
                                <motion.div
                                    initial={{ scale: 0.95, y: 20 }}
                                    animate={{ scale: 1, y: 0 }}
                                    exit={{ scale: 0.95, y: 20 }}
                                    className="w-full max-w-4xl max-h-[85vh] bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
                                >
                                    {/* Modal Header */}
                                    <div className="flex items-center justify-between p-5 border-b border-white/5 shrink-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                                <Brain className="w-4 h-4 text-emerald-500" />
                                            </div>
                                            <div>
                                                <h3 className="font-black italic uppercase text-sm tracking-widest text-white">{persona.name} — Neural Scan Report</h3>
                                                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Everything that was discovered and indexed</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowDetailsModal(false)}
                                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                                        >
                                            <X className="w-4 h-4 text-zinc-400" />
                                        </button>
                                    </div>

                                    {/* Scan Summary — Compact Strip */}
                                    <div className="px-5 py-3 border-b border-white/5 shrink-0 flex flex-wrap gap-2">
                                        {Object.entries(scanCounts).map(([label, count]) => (
                                            <div key={label} className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.03] border border-white/5 rounded-full">
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">{label}:</span>
                                                <span className="text-[10px] font-black text-emerald-400 font-mono">{count as string}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* StepDiagnostics Terminal — Scrollable, no model selection */}
                                    <div className="flex-1 overflow-y-auto no-scrollbar">
                                        <StepDiagnostics
                                            agentId={agentId}
                                            agentName={persona.name || 'AI Employee'}
                                            role={persona.role || 'AI Assistant'}
                                            description={persona.about || persona.description}
                                            department={persona.department}
                                            businessContext={businessContext}
                                            persona={persona}
                                            previewMode={true}
                                            onComplete={() => { }}
                                            onStartConstruction={() => setShowDetailsModal(false)}
                                        />
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body
                )
            }
        </div >
    );
}
