"use client";

import React, { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, Brain, ShieldAlert, BadgeCheck, X,
    Search, MessageSquare, Edit3, ChevronDown, ArrowRight,
    Info, CheckCircle2
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Custom Components
import { StepDiagnostics } from '@/components/workforce/onboarding/StepDiagnostics';
import { IdentityCore } from '@/components/workforce/onboarding/ConstructionMatrix';
import { AgentAudioIntro } from '@/components/workforce/onboarding/AgentAudioIntro';

// Utils & Data
import { getAgentAvatar, cn } from "@/lib/utils";
import { agents } from '@/lib/agents-data';
import { generateInputPayload, synthesizeAgentProtocol } from '@/lib/protocol-engine';
import { knowledgeAPI, workforceAPI } from '@/lib/api';
import { toast } from "sonner";

export default function HireAgentPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();

    // Core Agent State
    const [agent, setAgent] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Real Data State
    const [orgData, setOrgData] = useState<any>(null);
    const [brainConfig, setBrainConfig] = useState<any>(null);
    const [knowledgeSources, setKnowledgeSources] = useState<any[]>([]);

    // Flow Management
    const [ritualStarted, setRitualStarted] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'ritual'>('info');
    const [diagStage, setDiagStage] = useState<'scanning' | 'reviewing' | 'constructing' | 'completed'>('scanning');
    const [selectedModel, setSelectedModel] = useState<string | null>(null);
    const [isHired, setIsHired] = useState(false);
    const [isActivated, setIsActivated] = useState(true);
    const [isSynthesizing, setIsSynthesizing] = useState(false);
    const [isDeploying, setIsDeploying] = useState(false);

    // Construction Editable State (Lifted for split rendering)
    const [editableConstitution, setEditableConstitution] = useState<any>({
        employee_constitution: {
            identity_core: {
                role_definition: "",
                tone_voice: ""
            },
            protocols: {
                responsibilities: [],
                performance_metrics: [],
                compliance_safety: [],
                confidentiality_honesty: []
            }
        }
    });

    const [editableSources, setEditableSources] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const foundAgent = agents.find(a => a.id === resolvedParams.id);
            if (foundAgent) {
                setAgent(foundAgent);

                // Fetch Real Backend Context
                const orgId = localStorage.getItem('activeOrgId');
                if (orgId) {
                    try {
                        const [overviewRes, personalityRes, deployedRes] = await Promise.all([
                            knowledgeAPI.getOverview(orgId),
                            knowledgeAPI.getPersonality(orgId),
                            workforceAPI.getByAgentId(foundAgent.id) // Check if already deployed
                        ]);

                        // Normalize Knowledge Sources from Overview
                        // 🔥 FIX: Match Backend 2.0 Response Structure (Nested in 'sources' key)
                        console.log("🔍 DEBUG: Full Overview Response:", JSON.stringify(overviewRes, null, 2));
                        console.log("🔍 DEBUG: Overview Data:", JSON.stringify(overviewRes?.data, null, 2));

                        const src = overviewRes.data.sources || {};
                        const rawSources = [
                            ...(src.websites || overviewRes.data.sites || []),
                            ...(src.documents || overviewRes.data.docs || []),
                            ...(src.api || overviewRes.data.apiSources || []),
                            ...(src.custom_text || [])
                        ];

                        console.log(`📚 Fetched ${rawSources.length} knowledge sources from API:`, rawSources);
                        setKnowledgeSources(rawSources);
                        setBrainConfig(personalityRes.data.config || {});
                        setOrgData({
                            name: localStorage.getItem('orgName') || "Cluaiz Global",
                            industry: localStorage.getItem('orgIndustry') || "Enterprise SaaS"
                        });

                        // 🔥 AUTO-RESTORE: If agent is already deployed, load saved data
                        if (deployedRes.data.success && deployedRes.data.data) {
                            const deployed = deployedRes.data.data;
                            console.log("✅ Agent already deployed! Restoring saved data:", deployed);

                            setIsHired(true);
                            setIsActivated(deployed.status === 'active');
                            setSelectedModel(deployed.model_metadata?.model_id || null);
                            setEditableConstitution(deployed.constitution || {});
                            setEditableSources(deployed.knowledge_sources || []);

                            // 🔥 SHOW MATRIX: Even if deployed, show the construction view (Training Data)
                            setDiagStage('constructing');
                            setActiveTab('ritual');
                        }
                    } catch (err) {
                        console.error("Failed to fetch real context:", err);
                    }
                }
            } else {
                router.push('/dashboard/communication/employees');
            }
            setLoading(false);
        };

        fetchData();
    }, [resolvedParams.id, router]);

    if (loading || !agent) return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">Loading Personnel File...</div>;

    const avatarUrl = getAgentAvatar(agent.gender, agent.id);

    // 🧪 THE CHIEF AI ARCHITECT FLOW (Spec Compliant - Hybrid Intelligence)
    const handleStartConstruction = async (optionId: string) => {
        setIsSynthesizing(true);
        setSelectedModel(optionId);

        // 📡 1. Prepare Input Dossier
        const dossier = generateInputPayload(
            agent,
            orgData,
            brainConfig,
            knowledgeSources
        );

        console.log("📡 Chief AI Architect Input Dossier:", dossier);

        // 💎 2. NEURAL ENRICHMENT (Wait for AI Engine)
        // No dummy drafts. We stay in diagnostic stage until data arrives.
        try {
            console.log("🧠 Chief AI Architect: Initiating Neural Enrichment via AI Engine...");
            const response = await workforceAPI.synthesize(dossier);

            if (response.data.success && response.data.data) {
                const llmResult = response.data.data;
                const constitution = llmResult.employee_constitution || llmResult;

                if (constitution && constitution.identity_core) {
                    console.log("✅ Deep Intelligence Received. Mapping to Matrix Matrix...");
                    setEditableConstitution(constitution);
                    if (llmResult.knowledge_sources) {
                        setEditableSources(llmResult.knowledge_sources);
                    }
                    // ⚡ ONLY Now move to construction stage
                    setDiagStage('constructing');
                } else {
                    console.error("⚠️ LLM Response invalid structure:", llmResult);
                    toast.error("Deep Matrix Synthesis failed to return valid protocols.");
                }
            }
        } catch (err) {
            console.error("❌ Neural Enrichment failed:", err);
            toast.error("Deep Synthesis failed. Check AI Engine connectivity.");
        } finally {
            setIsSynthesizing(false);
        }
    };

    const handleHiringComplete = async () => {
        if (!selectedModel || !editableConstitution) {
            toast.error("Please select a model and generate the constitution first.");
            return;
        }

        setIsDeploying(true);
        try {
            const res = await workforceAPI.startDeployment({
                agent_id: agent.id,
                model_key: selectedModel,
                name: agent.name,
                role: agent.role,
                department: agent.department,
                avatar_url: avatarUrl,
                protocol: {
                    employee_constitution: editableConstitution
                },
                knowledge_sources: editableSources
            });

            if (res.data.success) {
                toast.success("Personnel Deployment Initiated!");
                setIsHired(true);
                setDiagStage('completed');
                setActiveTab('ritual');
                // Optional: Redirect to workforce dashboard after delay
                // setTimeout(() => router.push('/dashboard/communication/employees'), 2000);
            }
        } catch (err: any) {
            console.error("Deployment failed:", err);
            toast.error(err.response?.data?.error || "Failed to finalize deployment.");
        } finally {
            setIsDeploying(false);
        }
    };

    const startHiring = () => {
        setRitualStarted(true);
        setActiveTab('ritual');
    };

    // Layout flags
    const isConstructing = diagStage === 'constructing';

    return (
        <div className="h-screen overflow-hidden bg-neutral-950 text-white relative font-sans no-scrollbar">

            {/* 🟢 FIXED BACKGROUND */}
            <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] pointer-events-none" />

            {/* 🧬 NEURAL SYNTHESIS OVERLAY */}
            <AnimatePresence>
                {isSynthesizing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center gap-8"
                    >
                        <div className="relative">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                className="w-48 h-48 rounded-full border-t-2 border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.2)]"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Brain size={48} className="text-emerald-500 animate-pulse" />
                            </div>
                        </div>
                        <div className="text-center space-y-2">
                            <h2 className="text-xl font-black uppercase tracking-[0.5em] text-white italic">Neural Synthesis</h2>
                            <p className="text-[10px] font-mono text-emerald-500/60 uppercase tracking-widest animate-pulse">Constructing Agent Protocol Matrix...</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 🟢 NAVIGATION: Circular Close Button */}
            {!isConstructing && (
                <div className="fixed top-6 right-6 md:top-10 md:right-10 z-[70]">
                    <Link
                        href="/dashboard/communication/employees"
                        className="flex p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-neutral-500 hover:text-white transition-all group backdrop-blur-md shadow-2xl"
                    >
                        <X size={20} className="md:w-6 md:h-6 group-hover:rotate-90 transition-transform duration-300" />
                    </Link>
                </div>
            )}

            {/* 🟢 NAVIGATION: Tab Switcher / Hire Button */}
            {!isConstructing && (
                <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[70] max-w-[calc(100vw-3rem)]">
                    <div className="flex items-center bg-zinc-900/80 border border-white/10 p-1 md:p-1.5 rounded-full backdrop-blur-3xl shadow-2xl overflow-hidden">
                        <AnimatePresence mode="wait">
                            {!ritualStarted ? (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    onClick={startHiring}
                                    className="px-6 py-3 md:px-8 md:py-4 bg-white text-black font-black rounded-full shadow-[0_10px_40px_rgba(255,255,255,0.2)] hover:shadow-[0_15px_60px_rgba(255,255,255,0.4)] transition-all flex items-center gap-2 md:gap-3 group text-xs md:text-sm whitespace-nowrap"
                                >
                                    <Zap size={16} className="md:w-5 md:h-5 fill-black group-hover:scale-125 transition-transform" />
                                    HIRE NOW
                                    <ArrowRight size={16} className="md:w-5 md:h-5 group-hover:translate-x-1 transition-transform opacity-50" />
                                </motion.button>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex gap-1"
                                >
                                    <button
                                        onClick={() => setActiveTab('info')}
                                        className={cn(
                                            "px-4 py-3 md:px-6 md:py-3.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1 md:gap-2 whitespace-nowrap",
                                            activeTab === 'info'
                                                ? "bg-white text-black shadow-xl"
                                                : "text-zinc-500 hover:text-white hover:bg-white/5"
                                        )}
                                    >
                                        <Info size={14} className="md:w-4 md:h-4" /> Info
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('ritual')}
                                        className={cn(
                                            "px-4 py-3 md:px-6 md:py-3.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1 md:gap-2 whitespace-nowrap",
                                            activeTab === 'ritual'
                                                ? "bg-emerald-500 text-black shadow-xl"
                                                : "text-zinc-500 hover:text-white hover:bg-white/5"
                                        )}
                                    >
                                        {ritualStarted && activeTab === 'ritual' ? <Edit3 size={14} className="md:w-4 md:h-4" /> : <Zap size={14} className="md:w-4 md:h-4" />}
                                        {ritualStarted && activeTab === 'ritual' ? "Integration" : "Info"}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* 🟢 MAIN SHELL */}
            <main className="relative max-w-7xl overflow-y-auto pt-10 md:pt-16 no-scrollbar z-10 w-full h-full px-6 mx-auto scroll-smooth">
                {/* 🧬 HEADER: CONSTRUCTION STATUS (Only in Step 3) */}
                {isConstructing && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center space-y-4 shrink-0 pb-12"
                    >
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Personnel Protocol Synthesis</span>
                        </div>
                        <h2 className="text-3xl md:text-6xl font-black bg-gradient-to-r from-white via-white to-white/20 bg-clip-text text-transparent uppercase tracking-tighter italic leading-none">
                            Neural Construction Matrix
                        </h2>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-12 items-start w-full">

                    {/* LEFT COLUMN: Static Profile Column (Step 1, 2, 3) */}
                    <div className="lg:col-span-4 flex flex-col">
                        <motion.div
                            layoutId="agent-avatar"
                            className="relative w-full max-w-sm md:max-w-md lg:w-full lg:max-w-none mx-auto lg:mx-0 aspect-[3/3.5] rounded-[20px] overflow-hidden border border-white/10 shadow-2xl bg-gradient-to-b from-neutral-800 to-black group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                            <Image src={avatarUrl} alt={agent.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />

                            {/* Identity Overlay */}
                            <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 z-20 max-w-[80%]">
                                <h1 className="text-3xl md:text-5xl font-bold flex items-center gap-2 md:gap-3 leading-tight">
                                    {agent.name}
                                    <BadgeCheck className="text-blue-500 fill-white w-6 h-6 md:w-8 md:h-8" />
                                </h1>
                                <p className="text-emerald-500 text-base md:text-xl font-black uppercase tracking-widest mt-1 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                                    {agent.role}
                                </p>

                                {isHired && (
                                    <div className="mt-3 flex flex-col gap-1">
                                        <p className="text-white/60 text-xs font-bold uppercase tracking-widest italic">Working for Cluaiz Intelligence</p>
                                        <div className="flex items-center gap-2">
                                            <div className={cn("w-2 h-2 rounded-full animate-pulse", isActivated ? "bg-emerald-500 shadow-[0_0_10px_#10b981]" : "bg-zinc-500")} />
                                            <span className={cn("text-[10px] font-black uppercase tracking-tighter", isActivated ? "text-emerald-500" : "text-zinc-500")}>
                                                {isActivated ? "Available 24/7" : "On Hold"}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                <div className="mt-6 flex items-center gap-2 text-xs text-zinc-500 font-mono bg-black/40 backdrop-blur-sm w-fit px-3 py-1.5 rounded-full border border-white/5">
                                    <span className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]"></span>
                                    ID: {agent.id}
                                </div>
                            </div>

                            {/* Status Overlay */}
                            <div className="absolute bottom-10 right-10 z-20">
                                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/5">
                                    <span className={cn("w-2 h-2 rounded-full animate-pulse",
                                        agent.status === 'hired' ? "bg-red-500 shadow-red-500/50" : "bg-green-500 shadow-green-500/50"
                                    )}></span>
                                    <span className="text-[10px] uppercase tracking-widest text-white/80">
                                        {agent.status === 'hired' ? 'Deployed' : 'Available'}
                                    </span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Audio Introduction Component */}
                        <AgentAudioIntro />
                    </div>

                    {/* RIGHT COLUMN: Switching Content Area */}
                    <div className="lg:col-span-8 pb-10">
                        <AnimatePresence mode="wait">
                            {/* STEP 1: Info Phase */}
                            {activeTab === 'info' && !isConstructing && (
                                <motion.div
                                    key="dossier-info"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6 md:space-y-12"
                                >
                                    <div className="bg-white/5 border border-white/10 p-4 md:p-12 rounded-[40px] backdrop-blur-xl relative">
                                        <div className="text-base md:text-2xl leading-relaxed text-neutral-200 font-light space-y-4 md:space-y-8">
                                            <p className="first-letter:text-6xl first-letter:font-bold first-letter:text-emerald-500 first-letter:mr-3">{agent.description}</p>
                                            <p className="text-neutral-400 text-lg">
                                                Specialized in {agent.department} operations. Designed to integrate seamlessly with your existing team and escalate complex issues only when necessary. Pre-trained on enterprise-scale datasets for immediate tactical deployment.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <h3 className="text-neutral-500 text-xs font-bold uppercase tracking-[0.4em] ml-2">Operational Matrix</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {agent.skills.map((skill: any, index: number) => (
                                                <div key={index} className="px-4 py-3 md:px-6 md:py-5 rounded-2xl border border-white/10 bg-white/[0.03] text-neutral-300 flex flex-col md:flex-row md:items-center gap-3 md:gap-5 transition-all hover:bg-white/[0.08] hover:border-white/20">
                                                    <div className="flex items-center gap-3 shrink-0">
                                                       <BadgeCheck size={18} className="text-emerald-500 md:w-[22px] md:h-[22px]" />
                                                       <span className="text-sm md:text-lg font-medium whitespace-nowrap">{skill.name}</span>
                                                    </div>
                                                    <span className="text-xs text-neutral-500 md:ml-auto leading-relaxed">{skill.description}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 2: Diagnostic Phase */}
                            {activeTab === 'ritual' && !isConstructing && (
                                <motion.div
                                    key="hiring-ritual"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <StepDiagnostics
                                        agentId={agent.id}
                                        agentName={agent.name}
                                        role={agent.role}
                                        description={agent.description}
                                        department={agent.department}
                                        onComplete={handleHiringComplete}
                                        onStartConstruction={handleStartConstruction}
                                        isHired={isHired}
                                    />
                                </motion.div>
                            )}

                            {/* STEP 3: Construction Phase (TOP-RIGHT) */}
                            {isConstructing && (
                                <motion.div
                                    key="identity-core"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="h-full"
                                >
                                    <IdentityCore
                                        agentName={agent.name}
                                        role={agent.role}
                                        orgName={orgData?.name || "Your Business"}
                                        editableConstitution={editableConstitution}
                                        setEditableConstitution={setEditableConstitution}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* STEP 3: Full-Width Section (BOTTOM) */}
                {isConstructing && (
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-12 pb-24"
                    >

                        {/* Final Action */}
                        <div className="flex justify-center pt-16">
                            <button
                                onClick={handleHiringComplete}
                                disabled={isDeploying}
                                className={`group flex items-center gap-4 px-16 py-6 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm rounded-full transition-all shadow-[0_30px_60px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 uppercase tracking-widest ${isDeploying ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isDeploying ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                        <span>{isHired ? "Updating Protocol..." : "Deploying Virtual Personnel..."}</span>
                                    </div>
                                ) : (
                                    <>
                                        <CheckCircle2 size={24} fill="black" />
                                        <span>{isHired ? "Update Personnel Protocol" : "Finalize Personnel Deployment"}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}
            </main>

        </div>
    );
}
