"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, BadgeCheck, Layers, CheckCircle2, Zap, Brain, Cpu } from 'lucide-react';

interface IdentityCoreProps {
    agentName: string;
    role: string;
    orgName: string;
    editableConstitution: any;
    setEditableConstitution: (val: any) => void;
}

export function IdentityCore({ agentName, role, orgName, editableConstitution, setEditableConstitution }: IdentityCoreProps) {
    const constitution = editableConstitution.employee_constitution || editableConstitution;

    // Helper to update nested constitution fields
    const updateConstitution = (path: string[], value: any) => {
        const newConst = { ...editableConstitution };
        let current = newConst.employee_constitution || newConst;

        for (let i = 0; i < path.length - 1; i++) {
            current = current[path[i]];
        }
        current[path[path.length - 1]] = value;
        setEditableConstitution(newConst);
    };

    return (
        <div className="w-full">
            <div className="p-20">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity duration-1000">
                    <Brain size={400} className="text-emerald-500" />
                </div>
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-white/5 pb-8 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)] group-hover:scale-110 transition-transform duration-700">
                            <BadgeCheck className="text-emerald-400 w-10 h-10" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-500/60 flex items-center gap-2">
                                <Cpu size={12} /> Personnel Architecture
                            </h3>
                            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter italic">Operating Constitution</h2>
                        </div>
                    </div>
                    <div className="hidden xl:block">
                        <div className="px-5 py-2.5 rounded-full bg-black/40 border border-white/10 flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20" />
                            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Protocol Sync Locked</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 relative z-10">
                    {/* Left Column: Vision & Identity */}
                    <div className="xl:col-span-4 space-y-10">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 block px-1 flex items-center gap-2">
                                <div className="w-1 h-1 bg-emerald-500 rounded-full" /> Mission Definition
                            </label>
                            <div className="bg-zinc-900/40 border border-white/5 rounded-[24px] p-6 group-hover:border-emerald-500/20 transition-all">
                                <textarea
                                    value={constitution.identity_core?.role_definition || ""}
                                    onChange={(e) => updateConstitution(['identity_core', 'role_definition'], e.target.value)}
                                    className="w-full bg-transparent text-sm text-zinc-300 leading-relaxed font-mono outline-none min-h-[140px] resize-none"
                                    placeholder="Synthesizing Agent Mission..."
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 block px-1 flex items-center gap-2">
                                <div className="w-1 h-1 bg-blue-500 rounded-full" /> Neural Resonance (Tone)
                            </label>
                            <div className="bg-zinc-900/40 border border-white/5 rounded-[24px] p-6 group-hover:border-blue-500/20 transition-all">
                                <textarea
                                    value={constitution.identity_core?.tone_voice || ""}
                                    onChange={(e) => updateConstitution(['identity_core', 'tone_voice'], e.target.value)}
                                    className="w-full bg-transparent text-xs text-blue-100/60 font-mono italic outline-none min-h-[100px] resize-none"
                                    placeholder="Calibrating Neural Tone..."
                                />
                            </div>
                        </div>

                        {/* Hard Constraints / Capabilities Manifest */}
                        <div className="space-y-5">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 border-b border-white/5 pb-3">Hard Constraints</h3>
                            <div className="space-y-2.5">
                                {['Cannot authorize refunds without manager', 'Strictly follow brand tone guidelines', 'Protect organizational data integrity'].map((c, i) => (
                                    <div key={i} className="flex items-center gap-3 bg-red-500/5 px-4 py-3 rounded-2xl border border-red-500/10">
                                        <ShieldCheck className="w-3 h-3 text-red-500/50" />
                                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-tighter">{c}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Protocols & Mandates */}
                    <div className="xl:col-span-8 space-y-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 border-b border-white/5 pb-3">Operational Mandates</h3>
                                <div className="space-y-3">
                                    {(constitution.protocols?.responsibilities || ["Synthesizing Mandates..."]).map((r: string, i: number) => (
                                        <div key={i} className="flex items-start gap-4 bg-zinc-900/20 p-4 rounded-[20px] border border-white/5 hover:border-blue-500/20 transition-all group/item shadow-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500/30 mt-1.5 group-hover/item:bg-blue-400" />
                                            <input
                                                value={r}
                                                onChange={(e) => {
                                                    const newR = [...constitution.protocols.responsibilities];
                                                    newR[i] = e.target.value;
                                                    updateConstitution(['protocols', 'responsibilities'], newR);
                                                }}
                                                className="w-full bg-transparent text-[11px] text-zinc-400 font-mono outline-none group-hover/item:text-white"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 border-b border-white/5 pb-3">Neural Benchmarks</h3>
                                <div className="space-y-3">
                                    {(constitution.protocols?.performance_metrics || ["Synthesizing Benchmarks..."]).map((m: string, i: number) => (
                                        <div key={i} className="flex items-start gap-4 bg-zinc-900/20 p-4 rounded-[20px] border border-white/5 hover:border-emerald-500/20 transition-all group/item shadow-sm">
                                            <Zap className="w-3 h-3 text-emerald-500/20 group-hover/item:text-emerald-500 mt-1" />
                                            <input
                                                value={m}
                                                onChange={(e) => {
                                                    const newM = [...constitution.protocols.performance_metrics];
                                                    newM[i] = e.target.value;
                                                    updateConstitution(['protocols', 'performance_metrics'], newM);
                                                }}
                                                className="w-full bg-transparent text-[11px] text-zinc-400 font-mono outline-none group-hover/item:text-zinc-200"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 border-b border-white/5 pb-3 ml-1">Personnel Integrity Protocol</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    { label: 'Confidentiality', icon: ShieldCheck, color: 'text-blue-400' },
                                    { label: 'Data Ethics', icon: BadgeCheck, color: 'text-emerald-400' },
                                    { label: 'Rule Adherence', icon: Zap, color: 'text-amber-400' }
                                ].map((p, i) => (
                                    <div key={i} className="bg-black/50 border border-white/5 p-5 rounded-3xl flex items-center gap-4 group/p hover:bg-zinc-900 transition-colors">
                                        <p.icon size={20} className={`${p.color} opacity-40 group-hover/p:opacity-100 transition-opacity`} />
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{p.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// NeuralMapping removed as it is now part of the Audit Step

interface ConstructionMatrixProps {
    agent: any;
    constitution: any;
    sources: any[];
    onUpdateConstitution: (val: any) => void;
    onUpdateSources?: (val: any[]) => void;
    onComplete: () => void;
    isDeploying: boolean;
}

export function ConstructionMatrix({
    agent,
    constitution,
    sources,
    onUpdateConstitution,
    onUpdateSources,
    onComplete,
    isDeploying
}: ConstructionMatrixProps) {
    if (!agent || !constitution) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[1600px] mx-auto flex flex-col gap-14 pb-40 pt-16 px-6"
        >
            <div className="flex flex-col items-center text-center space-y-5 shrink-0 px-4">
                <div className="inline-flex items-center gap-4 px-6 py-2.5 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-white/10 rounded-full backdrop-blur-md">
                    <Zap size={14} className="text-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/80">Neural Synthesis Interface</span>
                </div>
                <h2 className="text-5xl md:text-7xl font-black bg-gradient-to-b from-white via-white to-white/30 bg-clip-text text-transparent uppercase tracking-tighter italic">
                    CONSTRUCTION MATRIX
                </h2>
                <div className="w-32 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                <div className="lg:col-span-4 space-y-10 order-2 lg:order-1">
                    <AgentProfileCard agent={agent} />

                    <div className="pt-4 space-y-6">
                        <button
                            onClick={onComplete}
                            disabled={isDeploying}
                            className={`group relative w-full py-8 rounded-[40px] font-black uppercase tracking-[0.3em] text-sm transition-all overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.4)] ${isDeploying
                                ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed border border-white/5'
                                : 'bg-white text-black hover:scale-[1.02] active:scale-[0.98]'
                                }`}
                        >
                            {!isDeploying && (
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            )}
                            <span className="relative z-10 flex items-center justify-center gap-4 group-hover:text-black">
                                {isDeploying ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
                                        Finalizing Neural Link...
                                    </>
                                ) : (
                                    <>
                                        Deploy AI Personnel
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </span>
                        </button>
                        <p className="text-[9px] text-zinc-600 text-center font-bold uppercase tracking-widest px-10 leading-loose opacity-60">
                            Neural alignment parameters will be hardcoded into the workforce brain upon deployment.
                        </p>
                    </div>
                </div>

                <div className="lg:col-span-8 h-full order-1 lg:order-2">
                    <IdentityCore
                        agentName={agent.name}
                        role={agent.role}
                        orgName="Cluaiz Global"
                        editableConstitution={constitution}
                        setEditableConstitution={onUpdateConstitution}
                    />
                </div>
            </div>
        </motion.div>
    );
}

function ArrowRight({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
    );
}

function AgentProfileCard({ agent }: { agent: any }) {
    return (
        <div className="bg-white/[0.03] border border-white/10 rounded-[54px] p-10 space-y-10 backdrop-blur-3xl relative overflow-hidden group shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

            <div className="aspect-square rounded-[42px] overflow-hidden border border-white/10 relative shadow-2xl group-hover:border-emerald-500/30 transition-colors duration-700">
                <img
                    src={agent.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${agent.name}`}
                    alt={agent.name}
                    className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000 scale-[1.1] group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute bottom-10 left-10 right-10 space-y-1">
                    <div className="flex items-center gap-3">
                        <h3 className="text-3xl font-black text-white tracking-tighter">{agent.name}</h3>
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center border border-white/20 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                            <CheckCircle2 size={12} className="text-white" />
                        </div>
                    </div>
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] italic">{agent.role}</p>
                </div>
            </div>

            <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between p-5 bg-black/40 rounded-3xl border border-white/5 hover:border-white/10 transition-all">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Personnel ID</span>
                    <span className="text-[10px] font-mono text-emerald-500/80 font-bold">{agent.id}</span>
                </div>
                <div className="flex items-center justify-between p-5 bg-black/40 rounded-3xl border border-white/5 hover:border-emerald-500/10 transition-all">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Neural Link</span>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black text-white uppercase tracking-widest">High Integrity</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
