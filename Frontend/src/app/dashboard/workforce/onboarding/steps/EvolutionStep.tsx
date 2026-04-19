'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
    Award, Brain, Target, Shield, ArrowRight,
    RefreshCw, Sparkles, CheckCircle2, User,
    Fingerprint, Globe, Zap, Cpu, Star
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { BorderBeam } from '@/components/ui/border-beam';
import { workforceAPI } from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface EvolutionStepProps {
    persona: any;
    businessContext: any;
    constitution: any;
    selectedModel: string | null;
    knowledgeSources: any[];
    onNext: () => void;
}


export function EvolutionStep({ persona, businessContext, constitution, selectedModel, knowledgeSources, onNext }: EvolutionStepProps) {
    const [isDeploying, setIsDeploying] = useState(false);
    const [isDeployed, setIsDeployed] = useState(false);
    const [launchProgress, setLaunchProgress] = useState(0);
    const router = useRouter();

    useEffect(() => {
        if (isDeploying) {
            const interval = setInterval(() => {
                setLaunchProgress(prev => {
                    if (prev >= 100) return 100;
                    return prev + (Math.random() * 5);
                });
            }, 100);
            return () => clearInterval(interval);
        }
    }, [isDeploying]);

    const handleDeploy = async () => {
        setIsDeploying(true);
        try {
            // Simulated delay for "Neural Finalization" visuals
            await new Promise(resolve => setTimeout(resolve, 3000));

            await workforceAPI.startDeployment({
                agent_id: persona.id || 'rocky-sales',
                model_key: selectedModel || 'gemini-1.5-flash',
                name: persona.name,
                role: persona.role,
                department: persona.role?.includes('Sales') ? 'Sales' : 'Operations',
                avatar_url: persona.avatar_gradient,
                protocol: {
                    employee_constitution: constitution
                },
                knowledge_sources: knowledgeSources
            });

            setIsDeployed(true);
            toast.success(`${persona.name} is now live!`);
        } catch (err) {
            console.error("Deployment failed:", err);
            toast.error("Deployment failed. Neural link unstable.");
        } finally {
            setIsDeploying(false);
        }
    };

    return (
        <motion.div
            key="evolution"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 max-w-5xl mx-auto w-full"
        >
            <AnimatePresence mode="wait">
                {!isDeployed ? (
                    <motion.div
                        key="deploying-state"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="flex-1 flex flex-col items-center justify-center text-center space-y-8 w-full"
                    >
                        {/* Status Header */}
                        <div className="space-y-3">
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-4 py-1 font-mono uppercase tracking-[0.2em] text-[10px]">
                                Final Evolution Stage
                            </Badge>
                            <h2 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter text-white">
                                {persona.name} is <span className="text-emerald-500">Ready</span>
                            </h2>
                            <p className="text-zinc-500 text-sm font-medium max-w-lg mx-auto leading-relaxed">
                                {persona.name} understands {businessContext.name} deeply and is philosophically aligned with your directives.
                            </p>
                        </div>

                        {/* Neural Synthesis Visualization */}
                        <div className="relative w-full max-w-sm aspect-square flex items-center justify-center">
                            {/* Outer Rings */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 border border-white/5 rounded-full"
                            />
                            <motion.div
                                animate={{ rotate: -360 }}
                                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-4 border border-dashed border-white/10 rounded-full"
                            />

                            {/* Center Avatar */}
                            <motion.div
                                animate={{
                                    scale: isDeploying ? [1, 1.05, 1] : [1, 1.02, 1],
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="relative z-10 w-48 h-48 rounded-full p-1 bg-gradient-to-br from-emerald-500 to-blue-500 shadow-[0_0_50px_rgba(16,185,129,0.2)]"
                            >
                                <div className="w-full h-full rounded-full bg-black overflow-hidden relative">
                                    <div className={`absolute inset-0 bg-gradient-to-br ${persona.avatar_gradient} opacity-40`} />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        {isDeploying ? (
                                            <Cpu className="w-20 h-20 text-white animate-pulse" />
                                        ) : (
                                            <Fingerprint className="w-20 h-20 text-white" />
                                        )}
                                    </div>

                                    {/* Data Stream Lines (Only while deploying) */}
                                    {isDeploying && (
                                        <div className="absolute inset-0">
                                            {[...Array(6)].map((_, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ y: "100%", opacity: 0 }}
                                                    animate={{ y: "-100%", opacity: [0, 1, 0] }}
                                                    transition={{
                                                        duration: 1 + Math.random(),
                                                        repeat: Infinity,
                                                        delay: i * 0.2
                                                    }}
                                                    className="absolute w-px h-12 bg-emerald-400/50"
                                                    style={{ left: `${15 + (i * 15)}%` }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Rotating Stats Nodes */}
                            {!isDeploying && (
                                <div className="absolute inset-0">
                                    {[
                                        { icon: Brain, label: '98% IQ', pos: 'top-0 left-1/2 -translate-x-1/2' },
                                        { icon: Target, label: '94% ACC', pos: 'bottom-8 left-0' },
                                        { icon: Shield, label: '100% SAFE', pos: 'bottom-8 right-0' }
                                    ].map((s, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.5 + (i * 0.1) }}
                                            className={`absolute ${s.pos} flex flex-col items-center gap-1`}
                                        >
                                            <div className="p-3 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl">
                                                <s.icon className="w-4 h-4 text-emerald-400" />
                                            </div>
                                            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{s.label}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Deploy Button */}
                        <div className="w-full max-w-sm">
                            {isDeploying ? (
                                <div className="space-y-4">
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-emerald-500 shadow-[0_0_15px_#10b981]"
                                            style={{ width: `${launchProgress}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] font-mono text-emerald-500 uppercase tracking-[0.3em] animate-pulse">
                                        Binding Neural Protocols: {Math.round(launchProgress)}%
                                    </p>
                                </div>
                            ) : (
                                <Button
                                    onClick={handleDeploy}
                                    className="w-full h-20 bg-white text-black hover:bg-zinc-200 rounded-[2.5rem] font-black italic uppercase tracking-tighter text-2xl flex items-center justify-center gap-4 group transition-all"
                                >
                                    Activate {persona.name}
                                    <Zap className="w-6 h-6 fill-current group-hover:scale-125 transition-transform" />
                                </Button>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="success-state"
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex-1 flex flex-col items-center justify-center space-y-12 w-full"
                    >
                        {/* Victory Celebration */}
                        <div className="text-center space-y-4">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", damping: 10 }}
                                className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(16,185,129,0.4)]"
                            >
                                <CheckCircle2 className="w-12 h-12 text-black" />
                            </motion.div>
                            <h2 className="text-6xl font-black italic uppercase tracking-tighter text-white">Deployment <span className="text-emerald-500">Successful</span></h2>
                            <p className="text-zinc-500 font-medium">Internal System Link established. {persona.name} is now available in your Workforce Fleet.</p>
                        </div>

                        {/* Employee Virtual Badge (The ID Card) */}
                        <Card className="relative w-full max-w-md bg-zinc-900 border-white/5 p-8 rounded-[3rem] overflow-hidden group shadow-2xl">
                            <div className="relative z-10 flex gap-8">
                                {/* Photo */}
                                <div className="w-24 h-24 rounded-2xl overflow-hidden relative border border-white/10 shrink-0">
                                    <div className={`absolute inset-0 bg-gradient-to-br ${persona.avatar_gradient}`} />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <User className="w-12 h-12 text-white" />
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1 flex flex-col justify-between py-1">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">{persona.name}</h3>
                                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[8px] font-mono px-2">ACTIVE</Badge>
                                        </div>
                                        <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">{persona.role}</p>
                                    </div>

                                    <div className="flex items-center gap-6 mt-4 opacity-50">
                                        <div>
                                            <p className="text-[8px] font-mono text-zinc-600 uppercase">Employee ID</p>
                                            <p className="text-[10px] font-mono text-zinc-400 uppercase">QA-509-NX</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-mono text-zinc-600 uppercase">Security</p>
                                            <p className="text-[10px] font-mono text-zinc-400 uppercase">LEVEL 4 ALPHA</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Holographic Decoration */}
                            <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6">
                                <div className="flex gap-1">
                                    {[...Array(3)].map((_, i) => (
                                        <Star key={i} className="w-3 h-3 text-emerald-500 fill-current" />
                                    ))}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-zinc-700" />
                                    <span className="text-[10px] font-mono text-zinc-700 uppercase tracking-tight italic">CLUAIZ QUANTUM INTELLIGENCE</span>
                                </div>
                            </div>

                            <BorderBeam size={200} duration={8} colorFrom="#10b981" colorTo="#3b82f6" />
                        </Card>

                        <Button
                            onClick={() => router.push('/dashboard/workforce/fleet')}
                            className="h-16 px-12 bg-white text-black hover:bg-zinc-200 rounded-2xl font-black italic uppercase tracking-tighter text-lg flex items-center gap-3 transition-transform hover:scale-105"
                        >
                            Go to Fleet Dashboard
                            <ArrowRight className="w-6 h-6" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            <p className="mt-12 text-[10px] font-mono text-zinc-600 uppercase tracking-[0.5em] text-center">
                Neural Learning is a continuous process. representative model current status: synchronized.
            </p>
        </motion.div>
    );
}
