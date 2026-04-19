'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BorderBeam } from '@/components/ui/border-beam';
import {
    Target, MessageSquare, Heart, Users, Briefcase,
    Layers, Lightbulb, RefreshCw, CheckCircle2, ArrowRight,
    Search, AlertTriangle, ShieldCheck, Zap, GitBranch
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// =============================================================================
// 🤖 AI ORACLE CHIP (Local LLM Simulation)
// =============================================================================

const SuggestionChip = ({ text, onSelect }: { text: string; onSelect: () => void }) => (
    <button
        onClick={onSelect}
        className="group flex items-center gap-2 px-3 py-1.5 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 hover:border-emerald-500/30 rounded-full transition-all text-left"
    >
        <Lightbulb className="w-3 h-3 text-emerald-500 group-hover:text-emerald-400 group-hover:scale-110 transition-transform" />
        <span className="text-[10px] text-emerald-400/80 group-hover:text-emerald-400 font-mono tracking-tight leading-none">
            {text}
        </span>
    </button>
);

// Mock Local LLM Generator (Ollama qwen2.5:1.5b)
const getAiSuggestions = (skill: string, industry: string) => {
    const commonRules: Record<string, string[]> = {
        'Negotiation': ['Max 10% discount without approval', 'Only offer discount on annual plans'],
        'refund': ['Refund only within 14 days', 'No refund on used software licenses'],
        'Marketing': ['Focus on LinkedIn B2B output', 'Use professional/formal tone only'],
        'default': [`Standard ${industry} procedure applies`, 'Escalate to manager if unresolved']
    };
    // Fuzzy match or default
    const key = Object.keys(commonRules).find(k => skill.toLowerCase().includes(k.toLowerCase())) || 'default';
    return commonRules[key];
};

// =============================================================================
// 🧠 BUSINESS DNA VISUALIZER
// =============================================================================

const BusinessDNAHelix = ({ business, isAnimating }: { business: any, isAnimating: boolean }) => {
    const dnaStrands = [
        { label: 'Mission', value: business.goal || "Scale through AI", icon: Target, color: 'text-emerald-400' },
        { label: 'Voice', value: business.communication_style || "Professional & Direct", icon: MessageSquare, color: 'text-blue-400' },
        { label: 'Values', value: (business.keywords || ["Efficiency", "Quality"]).slice(0, 3).join(', '), icon: Heart, color: 'text-pink-400' },
        { label: 'Market', value: business.target_audience || "Global Enterprise", icon: Users, color: 'text-purple-400' },
        { label: 'Model', value: business.business_model || "SaaS / Digital", icon: Briefcase, color: 'text-orange-400' },
    ];

    return (
        <div className="relative w-full h-96 perspective-1000">
            <div className="absolute inset-0 flex items-center justify-center">
                {dnaStrands.map((strand, i) => (
                    <motion.div
                        key={strand.label}
                        initial={{ opacity: 0, rotateY: -90, z: -200 }}
                        animate={isAnimating ? {
                            opacity: 1,
                            rotateY: 0,
                            z: 0,
                            rotateX: [0, 360],
                        } : {}}
                        transition={{
                            delay: i * 0.3,
                            duration: 2,
                            rotateX: { duration: 20, repeat: Infinity, ease: "linear" }
                        }}
                        className="absolute"
                        style={{
                            transform: `rotateY(${i * 72}deg) translateZ(150px)`,
                        }}
                    >
                        <div className="bg-zinc-950/90 border border-white/10 p-4 rounded-2xl backdrop-blur-xl w-48">
                            <strand.icon className={`w-6 h-6 ${strand.color} mb-2`} />
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{strand.label}</p>
                            <p className="text-xs font-bold text-white leading-tight">{strand.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Central Core */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 flex items-center justify-center"
            >
                <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-emerald-500/20 via-blue-500/20 to-purple-500/20 blur-2xl" />
            </motion.div>
        </div>
    );
};

interface SkillMap {
    skill: string;
    status: 'gap' | 'connected';
    source: string;
    question: string | null;
    suggestions: string[];
}

interface AuditStepProps {
    persona: any;
    businessContext: any;
    knowledgeSources?: any[];
    bossMandates?: Record<string, string>;
    onUpdateMandates?: (mandates: Record<string, string>) => void;
    onNext: () => void;
}

export function AuditStep({
    persona,
    businessContext,
    knowledgeSources = [],
    bossMandates = {},
    onUpdateMandates,
    onNext
}: AuditStepProps) {
    const [activeInsight, setActiveInsight] = useState<string | null>(null);
    const [auditStatus, setAuditStatus] = useState<'analyzing' | 'mapping' | 'complete'>('analyzing');
    const [progress, setProgress] = useState(0);
    const [skippedGaps, setSkippedGaps] = useState<Set<string>>(new Set());

    const skills = persona.skills?.map((s: any) => s.name || s) || persona.capabilities?.map((c: any) => c.skill) || ['Communication', 'Strategy', 'Execution'];

    // Real Logic: Map skills to knowledge gaps by searching keywords in sources
    // This acts as the "SpaCy Spotter" - detecting presence/absence of topics
    const skillMapping = useMemo<SkillMap[]>(() => {
        return skills.map((skill: string, i: number) => {
            const relatedSource = knowledgeSources.find(s =>
                s.name?.toLowerCase().includes(skill.toLowerCase()) ||
                s.tags?.some((t: string) => t.toLowerCase().includes(skill.toLowerCase())) ||
                s.content?.toLowerCase().includes(skill.toLowerCase())
            );

            // Force some gaps for interactivity if none found or for demonstration
            const isGap = !relatedSource || (i % 3 === 0 && !bossMandates[skill]);

            // Local LLM (Ollama) Writer - generates suggestions if gap exists
            const suggestions = isGap ? getAiSuggestions(skill, businessContext.industry || 'Business') : [];

            return {
                skill,
                status: isGap ? 'gap' : 'connected',
                source: relatedSource ? relatedSource.name : 'Missing Context',
                question: isGap
                    ? `Boss, as your ${persona.role || 'AI Employee'}, I see the facts but I need your rules for ${skill}. What is my strict boundary here?`
                    : null,
                suggestions
            } as SkillMap;
        });
    }, [skills, knowledgeSources, bossMandates, businessContext.name, persona.role, businessContext.industry]);

    const handleSuggestion = (skill: string, text: string) => {
        if (onUpdateMandates) {
            onUpdateMandates({ ...bossMandates, [skill]: text });
            setSkippedGaps(prev => { const n = new Set(prev); n.delete(skill); return n; });
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setAuditStatus('complete');
                    return 100;
                }
                if (prev === 40) setAuditStatus('mapping');
                return prev + 1;
            });
        }, 15); // Faster progress for smoother feel

        const baseInsights = [
            `Detecting ${businessContext.industry} patterns...`,
            `Cross-referencing ${knowledgeSources.length} knowledge nodes...`,
            `Synthesizing ${businessContext.name} voice profile...`,
            `Deep Scan: Checking ${skills.length} core competencies...`
        ];

        baseInsights.forEach((text: string, i: number) => {
            setTimeout(() => setActiveInsight(text), (i + 1) * 800);
        });

        return () => clearInterval(interval);
    }, [businessContext, skills, knowledgeSources]);

    const activeGaps = skillMapping.filter((m: { status: string; skill: string }) => m.status === 'gap' && !bossMandates[m.skill]);
    const filledCount = skillMapping.filter((m: { status: string; skill: string }) => m.status === 'connected' || bossMandates[m.skill]).length;
    const canProceed = progress >= 100 && (filledCount === skillMapping.length || activeGaps.every((m: { skill: string }) => skippedGaps.has(m.skill)));

    return (
        <motion.div
            key="audit"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="flex-1 flex flex-col p-6 md:p-8 max-w-7xl mx-auto w-full overflow-hidden no-scrollbar"
        >
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-8 shrink-0">
                <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                            <Layers className="w-8 h-8 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white">
                                Neural <span className="text-emerald-500">Audit</span> Dashboard
                            </h3>
                            <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest mt-1">
                                Deep DNA Mapping: {businessContext.name}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Badge variant="outline" className="bg-zinc-900/50 border-white/5 text-zinc-400 font-mono text-[9px] py-1">
                            SOURCES: {knowledgeSources.length}
                        </Badge>
                        <Badge variant="outline" className="bg-zinc-900/50 border-white/5 text-emerald-400 font-mono text-[9px] py-1 uppercase italic">
                            Surgical RAG Mode: Active
                        </Badge>
                        <Badge variant="outline" className="bg-zinc-900/50 border-white/5 text-blue-400 font-mono text-[9px] py-1">
                            {filledCount}/{skillMapping.length} GAPS FILLED
                        </Badge>
                    </div>
                </div>

                {/* Audit Progress */}
                <Card className="bg-white/[0.02] border-white/5 backdrop-blur-md p-6 rounded-[32px] w-full md:w-80 shadow-2xl">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Audit Pulse</span>
                        <span className="text-xl font-black text-white italic">{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-white/5 mb-3">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-emerald-500 shadow-[0_0_15px_#10b981]"
                        />
                    </div>
                    <p className="text-[9px] font-mono text-emerald-500/60 uppercase tracking-widest animate-pulse">
                        {auditStatus === 'analyzing' ? 'Fractalizing Knowledge...' : auditStatus === 'mapping' ? 'Synthesizing Neural Gaps...' : 'Audit Synthesis Complete'}
                    </p>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 overflow-hidden">
                <div className="lg:col-span-8 flex flex-col gap-6 overflow-y-auto no-scrollbar pr-2 pb-20">
                    <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-xl p-8 rounded-[3rem] relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-8">
                            <h4 className="font-black italic uppercase text-lg tracking-tight text-white flex items-center gap-3">
                                <Zap className="w-5 h-5 text-yellow-500" />
                                Knowledge-Skill Mapping
                            </h4>
                            {skillMapping.some((m: { status: string }) => m.status === 'gap') && (
                                <div className="px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
                                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Gaps Identified</span>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {skillMapping.map((map: SkillMap, i: number) => (
                                <motion.div
                                    key={map.skill}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className={`p-6 rounded-[2rem] border transition-all relative overflow-hidden group/item ${map.status === 'connected' || bossMandates[map.skill]
                                        ? 'bg-emerald-500/[0.03] border-emerald-500/20'
                                        : 'bg-red-500/[0.03] border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.05)]'
                                        }`}
                                >
                                    <div className="flex items-start justify-between relative z-10 mb-4">
                                        <div className="flex items-center gap-5">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${map.status === 'connected' || bossMandates[map.skill] ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                                                {map.status === 'connected' || bossMandates[map.skill] ? (
                                                    <ShieldCheck className="w-7 h-7 text-emerald-400" />
                                                ) : (
                                                    <AlertTriangle className="w-7 h-7 text-red-400" />
                                                )}
                                            </div>
                                            <div>
                                                <h5 className="font-black text-lg text-white italic tracking-tight uppercase">{map.skill}</h5>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <GitBranch className="w-3 h-3 text-zinc-600" />
                                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{map.source}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <Badge className={`text-[10px] font-black uppercase italic ${map.status === 'connected' || bossMandates[map.skill] ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                            {map.status === 'connected' || bossMandates[map.skill] ? 'SECURED' : 'NEURAL GAP'}
                                        </Badge>
                                    </div>

                                    {(map.status === 'gap' && !bossMandates[map.skill]) ? (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="space-y-4 pt-4 border-t border-red-500/10"
                                        >
                                            <p className="text-xs text-zinc-400 italic leading-relaxed">
                                                {map.question}
                                            </p>
                                            <textarea
                                                placeholder="Type 2-3 lines of logic here..."
                                                className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-xs text-white placeholder:text-zinc-700 focus:border-red-500/30 outline-none transition-all resize-none h-24 font-mono shadow-inner"
                                                onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) => {
                                                    if (e.target.value.trim().length > 5 && onUpdateMandates) {
                                                        onUpdateMandates({ ...bossMandates, [map.skill]: e.target.value });
                                                        setSkippedGaps(prev => { const n = new Set(prev); n.delete(map.skill); return n; });
                                                    }
                                                }}
                                            />
                                            {/* AI Suggestion Chips */}
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                <div className="flex items-center gap-1.5 mr-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest">
                                                        Local AI Suggestions
                                                    </span>
                                                </div>
                                                {map.suggestions?.map((s: string, idx: number) => (
                                                    <SuggestionChip
                                                        key={idx}
                                                        text={s}
                                                        onSelect={() => handleSuggestion(map.skill, s)}
                                                    />
                                                ))}
                                            </div>

                                            {!skippedGaps.has(map.skill) && (
                                                <button
                                                    onClick={() => setSkippedGaps(prev => new Set([...prev, map.skill]))}
                                                    className="text-[10px] font-bold text-zinc-600 hover:text-zinc-400 uppercase tracking-widest transition-colors pt-2"
                                                >
                                                    Skip this gap →
                                                </button>
                                            )}
                                            {skippedGaps.has(map.skill) && (
                                                <p className="text-[10px] text-yellow-500/60 font-mono uppercase tracking-widest pt-2">
                                                    ⚡ Skipped — AI will use best judgement
                                                </p>
                                            )}
                                        </motion.div>
                                    ) : (
                                        <div className="mt-4 pt-4 border-t border-emerald-500/10">
                                            <p className="text-xs text-zinc-500 italic leading-relaxed">
                                                {bossMandates[map.skill]
                                                    ? `Boss's Mandate incorporated: "${bossMandates[map.skill].substring(0, 60)}..."`
                                                    : `Knowledge injection successful. ${persona.name} can now execute decisions regarding ${map.skill.toLowerCase()} with high fidelity.`}
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-8">
                    <Card className="flex-1 bg-zinc-900/40 border-white/5 backdrop-blur-xl rounded-[3rem] relative overflow-hidden flex flex-col items-center justify-center min-h-[450px] group shadow-2xl">
                        <BusinessDNAHelix business={businessContext} isAnimating={auditStatus !== 'complete'} />
                        <BorderBeam size={400} duration={8} colorFrom="#10b981" colorTo="#3b82f6" />

                        <div className="absolute top-10 left-10">
                            <h4 className="font-black italic uppercase text-[10px] tracking-[0.3em] text-zinc-600">Genetic Helix Synthesis</h4>
                        </div>

                        <AnimatePresence>
                            {activeInsight && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                                    className="absolute bottom-12 left-10 right-10 p-5 bg-emerald-500/5 border border-emerald-500/10 backdrop-blur-3xl rounded-3xl"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                                        <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-tight leading-relaxed">{activeInsight}</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Card>

                    <Button
                        onClick={onNext}
                        disabled={!canProceed}
                        className={`h-24 rounded-[2.5rem] font-black italic uppercase tracking-tighter text-2xl shadow-2xl flex items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 ${canProceed
                            ? "bg-white text-black hover:bg-zinc-200"
                            : "bg-zinc-900 text-zinc-600 border border-white/5 cursor-not-allowed"
                            }`}
                    >
                        {progress < 100 ? (
                            <>
                                Neural Audit Running...
                                <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
                            </>
                        ) : !canProceed ? (
                            <>
                                Reviewing Gaps...
                                <AlertTriangle className="w-6 h-6 text-yellow-500" />
                            </>
                        ) : (
                            <>
                                Proceed to Role Play
                                <ArrowRight className="w-8 h-8" />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}
