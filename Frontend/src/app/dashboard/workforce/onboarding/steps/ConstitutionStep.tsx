'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
    Heart, Lock, Eye, AlertCircle, Shield, ArrowRight,
    RefreshCw, MessageSquare, Sparkles, Scale, Info, Check,
    Fingerprint, Gavel, Globe, Zap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { BorderBeam } from '@/components/ui/border-beam';
import { workforceAPI } from '@/lib/api';
import { generateInputPayload, synthesizeAgentProtocol } from '@/lib/protocol-engine';
import { toast } from 'sonner';

interface ConstitutionStepProps {
    persona: any;
    businessContext: any;
    orgData: any;
    brainConfig: any;
    knowledgeSources: any[];
    bossMandates?: Record<string, string>;
    constitution: any;
    simulationResults?: any;
    onUpdateConstitution: (constitution: any) => void;
    onUpdatePrinciples?: (principles: string[]) => void;
    onNext: () => void;
}

export function ConstitutionStep({
    persona,
    businessContext,
    orgData,
    brainConfig,
    knowledgeSources,
    bossMandates = {},
    constitution,
    simulationResults,
    onUpdateConstitution,
    onUpdatePrinciples,
    onNext
}: ConstitutionStepProps) {
    const [isSynthesizing, setIsSynthesizing] = useState(false);
    const [interviewStep, setInterviewStep] = useState<0 | 1 | 2 | 3>(0); // 0: None, 1: Q1, 2: Q2, 3: Fusing
    const [userAnswers, setUserAnswers] = useState<string[]>([]);
    const [currentAnswer, setCurrentAnswer] = useState("");

    const interviewQuestions = [
        {
            q: `How should I handle a customer who's being aggressive but has a valid technical complaint?`,
            icon: Heart,
            color: 'text-pink-400'
        },
        {
            q: `What is our absolute 'Golden Rule' when a competitor is mentioned by a prospect?`,
            icon: Gavel,
            color: 'text-blue-400'
        }
    ];

    useEffect(() => {
        if (!constitution && !isSynthesizing) {
            handleSynthesize();
        }
    }, [constitution, isSynthesizing]);

    const handleSynthesize = async () => {
        setIsSynthesizing(true);
        try {
            const dossier = generateInputPayload(persona, orgData, brainConfig, knowledgeSources, bossMandates);
            const response = await workforceAPI.synthesize(dossier);
            if (response.data.success && response.data.data) {
                onUpdateConstitution(response.data.data.employee_constitution || response.data.data);
            }
        } catch (err) {
            const dossier = generateInputPayload(persona, orgData, brainConfig, knowledgeSources, bossMandates);
            const localResult = synthesizeAgentProtocol(dossier);
            onUpdateConstitution(localResult.employee_constitution);
        } finally {
            setIsSynthesizing(false);
            // After synthesis, start reverse interview
            setTimeout(() => setInterviewStep(1), 1000);
        }
    };

    const handleAnswer = () => {
        if (!currentAnswer.trim()) return;
        setUserAnswers(prev => [...prev, currentAnswer]);
        setCurrentAnswer("");

        if (interviewStep < interviewQuestions.length) {
            setInterviewStep((prev: any) => prev + 1);
        } else {
            setInterviewStep(3); // Fusing
            if (onUpdatePrinciples) {
                onUpdatePrinciples([...userAnswers, currentAnswer]);
            }
            setTimeout(() => {
                setInterviewStep(0); // Complete
                toast.success("Manual overrides fused into Neural Matrix");
            }, 3000);
        }
    };

    return (
        <motion.div
            key="constitution"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="flex-1 flex flex-col p-6 md:p-8 max-w-7xl mx-auto w-full overflow-hidden"
        >
            {/* Reverse Interview / Critical Alignment UI */}
            <AnimatePresence mode="wait">
                {interviewStep > 0 && interviewStep <= interviewQuestions.length ? (
                    <motion.div
                        key="interview"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="flex-1 flex flex-col items-center justify-center space-y-8 max-w-3xl mx-auto"
                    >
                        <div className="text-center">
                            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 mb-4 px-4 py-1 font-mono uppercase tracking-[0.2em] text-[10px]">
                                Neural Alignment Phase
                            </Badge>
                            <h3 className="text-4xl font-black italic uppercase tracking-tighter text-white">
                                {persona.name} is <span className="text-blue-500">Interviewing You</span>
                            </h3>
                            <p className="text-zinc-500 text-sm mt-3 font-medium">To achieve 100% philosophical sync, {persona.name} needs your guidance on an edge case.</p>
                        </div>

                        <Card className="w-full bg-zinc-900/40 border-white/5 backdrop-blur-3xl p-8 rounded-[3rem] relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 bg-blue-500/10 rounded-2xl">
                                        {React.createElement(interviewQuestions[interviewStep - 1].icon, { className: "w-8 h-8 text-blue-400" })}
                                    </div>
                                    <p className="text-xl font-bold text-white italic leading-tight">
                                        "{interviewQuestions[interviewStep - 1].q}"
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    <textarea
                                        autoFocus
                                        value={currentAnswer}
                                        onChange={(e) => setCurrentAnswer(e.target.value)}
                                        placeholder="Type your directive here..."
                                        className="w-full h-32 bg-black/40 border border-white/5 rounded-2xl p-6 text-white focus:outline-none focus:border-blue-500/50 transition-all font-medium placeholder:text-zinc-700 resize-none no-scrollbar"
                                    />
                                    <Button
                                        onClick={handleAnswer}
                                        disabled={!currentAnswer.trim()}
                                        className="w-full h-16 bg-white text-black hover:bg-zinc-200 rounded-2xl font-black italic uppercase tracking-tighter text-lg disabled:opacity-50"
                                    >
                                        Seal Directive
                                        <ArrowRight className="w-6 h-6 ml-2" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ) : interviewStep === 3 ? (
                    <motion.div
                        key="fusing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex-1 flex flex-col items-center justify-center space-y-6"
                    >
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full border-[3px] border-emerald-500/20 animate-pulse" />
                            <motion.div
                                className="absolute inset-0 flex items-center justify-center"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            >
                                <Sparkles className="w-12 h-12 text-emerald-400" />
                            </motion.div>
                        </div>
                        <div className="text-center">
                            <h4 className="text-2xl font-black italic uppercase tracking-tighter text-white">Fusing Human Directives</h4>
                            <p className="text-xs font-mono text-emerald-500/60 uppercase tracking-widest mt-2 animate-pulse">Recursive Weight Rebalancing...</p>
                        </div>
                    </motion.div>
                ) : isSynthesizing ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full border-t-2 border-primary animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Fingerprint className="w-12 h-12 text-primary animate-pulse" />
                            </div>
                        </div>
                        <div className="text-center">
                            <h4 className="text-2xl font-black italic uppercase tracking-tighter text-white font-mono">NEURAL SYNTHESIS</h4>
                            <p className="text-xs font-mono text-primary/60 uppercase tracking-widest mt-2">Constructing Operating Protocols...</p>
                        </div>
                    </div>
                ) : (
                    <motion.div
                        key="main"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1"
                    >
                        {/* 1. The Operating Constitution (Left 7) */}
                        <div className="lg:col-span-12 flex flex-col gap-8">
                            <div className="flex items-end justify-between">
                                <div>
                                    <h3 className="text-4xl font-black italic uppercase tracking-tighter text-white">
                                        Operating <span className="text-primary">Constitution</span>
                                    </h3>
                                    <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest mt-1">
                                        Moral & Operational Guardrails for {persona.name}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-mono text-[9px] py-1">
                                        NEURAL INTEGRITY: 100%
                                    </Badge>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="rounded-full border-white/5 bg-white/5 hover:bg-white/10"
                                        onClick={() => setInterviewStep(1)}
                                    >
                                        <RefreshCw className="w-4 h-4 text-zinc-400" />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {(constitution?.protocols?.responsibilities || []).slice(0, 4).map((principle: any, i: number) => {
                                    const colors = [
                                        'from-pink-500/20 to-rose-500/20 border-pink-500/20',
                                        'from-emerald-500/20 to-teal-500/20 border-emerald-500/20',
                                        'from-blue-500/20 to-cyan-500/20 border-blue-500/20',
                                        'from-orange-500/20 to-amber-500/20 border-orange-500/20',
                                    ];
                                    const icons = [Heart, Lock, Eye, AlertCircle];
                                    const Icon = icons[i % icons.length];
                                    const isProtocol = typeof principle === 'string';
                                    const title = isProtocol ? principle.split(' ').slice(2, 5).join(' ') : principle.title;
                                    const desc = isProtocol ? principle : principle.desc;

                                    return (
                                        <Card key={i} className={`p-6 bg-gradient-to-br ${colors[i % colors.length]} backdrop-blur-xl border rounded-[2rem] relative overflow-hidden group`}>
                                            <div className="relative z-10">
                                                <div className="p-3 bg-black/40 rounded-xl w-fit mb-4">
                                                    <Icon className="w-5 h-5 text-white" />
                                                </div>
                                                <h5 className="font-black italic text-white uppercase text-xs tracking-widest mb-2">{title}</h5>
                                                <p className="text-[10px] text-zinc-400 leading-relaxed font-medium line-clamp-3">
                                                    "{desc}"
                                                </p>
                                            </div>
                                            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
                                        </Card>
                                    );
                                })}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Safety Protocols */}
                                <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-3xl p-8 rounded-[2.5rem] relative overflow-hidden">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="p-3 bg-red-500/10 rounded-2xl">
                                            <Shield className="w-8 h-8 text-red-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-black italic uppercase text-lg text-white tracking-tighter">Safety Overrides</h4>
                                            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Hard Stops & Human Gatekeeping</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {(constitution?.protocols?.compliance_safety || []).slice(0, 4).map((item: string, i: number) => (
                                            <div key={i} className="flex items-start gap-4 p-4 bg-black/30 rounded-2xl border border-white/5">
                                                <div className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                                                    <Scale className="w-3 h-3 text-red-400" />
                                                </div>
                                                <p className="text-[11px] text-zinc-400 font-medium italic">{item}</p>
                                            </div>
                                        ))}
                                    </div>
                                </Card>

                                {/* Performance Alignment */}
                                <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-3xl p-8 rounded-[2.5rem] relative overflow-hidden flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="p-3 bg-emerald-500/10 rounded-2xl">
                                                <Zap className="w-8 h-8 text-emerald-400" />
                                            </div>
                                            <div>
                                                <h4 className="font-black italic uppercase text-lg text-white tracking-tighter">Neural Mandate</h4>
                                                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Performance Metrics & Success Logic</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            {(constitution?.protocols?.performance_metrics || []).slice(0, 3).map((metric: string, i: number) => (
                                                <div key={i} className="flex items-center gap-4 group">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                                                    <p className="text-xs font-bold text-white italic group-hover:translate-x-1 transition-transform">{metric}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mt-8">
                                        <Button
                                            onClick={onNext}
                                            className="w-full h-20 bg-white text-black hover:bg-zinc-200 rounded-[2rem] font-black italic uppercase tracking-tighter text-xl shadow-[0_20px_40px_rgba(255,255,255,0.05)] flex items-center justify-center gap-4 transition-all hover:scale-[1.02]"
                                        >
                                            Finalize Protocol
                                            <ArrowRight className="w-6 h-6" />
                                        </Button>
                                    </div>
                                    <BorderBeam size={300} duration={12} colorFrom="#10b981" colorTo="#3b82f6" />
                                </Card>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
