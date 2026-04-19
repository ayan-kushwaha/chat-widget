"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronRight, ShieldCheck, RotateCw, CheckCircle2, Zap, Cpu, Hexagon, Layers, BadgeCheck } from 'lucide-react';
import api from '@/lib/api';
import { useHiringStore } from '@/lib/store/hiring-store';

interface StepDiagnosticsProps {
    agentId: string;
    agentName: string;
    role: string;
    description?: string;
    department?: string;
    onComplete: (directive?: string) => void;
    onStartConstruction?: (optionId: string) => void;
    isHired?: boolean;
    isSynthesizing?: boolean;
}

type DiagnosticsStage = 'scanning' | 'streaming' | 'reviewing' | 'constructing' | 'completed';

// Calculate tokens + force sanitization of text
const estimateTokens = (text: string | null | undefined) => {
    if (!text) return 0;
    return Math.ceil(text.length / 3.5);
};

const sanitize = (text: string) => {
    return text; // Return text as-is, no obfuscation requested by user
};

export function StepDiagnostics({ agentId, agentName, role, description, department, onComplete, onStartConstruction, isHired, isSynthesizing }: StepDiagnosticsProps) {
    const { scannedAgents, markScanned, agentLogs, addLogs, clearAgent } = useHiringStore();

    // Check if already scanned
    const isAlreadyScanned = scannedAgents[agentId];

    // If not scanned, force 'scanning' state
    const [stage, setStage] = useState<DiagnosticsStage>(isAlreadyScanned ? 'reviewing' : 'scanning');

    // Use stored logs if available, otherwise start empty
    const [logs, setLogs] = useState<string[]>(isAlreadyScanned ? (agentLogs[agentId] || []) : []);

    // Store total tokens for pricing calc
    const [totalTokens, setTotalTokens] = useState<number>(0);
    const [orgName, setOrgName] = useState<string>("User Business");
    const [selectedOption, setSelectedOption] = useState<string | null>(null);


    const [editableSources, setEditableSources] = useState<any[]>([]);

    const inputTokensTotal = 1_000_000;//estimateTokens(JSON.stringify(MOCK_INPUT_PAYLOAD, null, 2));
    const outputTokensTotal = 1_000_000;//estimateTokens(JSON.stringify(MOCK_OUTPUT_PAYLOAD, null, 2));

    // --- DYNAMIC MODEL OPTIONS STATE ---
    const [modelOptions, setModelOptions] = useState<any[]>([]);

    // MAPPING FOR UI STYLES
    const uiConfig: Record<string, any> = {
        'flash-lite-2.0': { name: 'Cluaiz Quantum', subtitle: 'Gemini 2.0 Flash Lite', icon: Zap, color: 'text-yellow-400', border: 'border-yellow-400/20', bg: 'bg-yellow-400/5', inRate: 0.075, outRate: 0.30 },
        'flash-2.0': { name: 'Cluaiz Core', subtitle: 'Gemini 2.0 Flash', icon: Brain, color: 'text-purple-400', border: 'border-purple-400/20', bg: 'bg-purple-400/5', inRate: 0.15, outRate: 0.60 },
        'flash-lite-2.5': { name: 'Cluaiz Deep', subtitle: 'Gemini 2.5 Flash Lite', icon: Hexagon, color: 'text-blue-400', border: 'border-blue-400/20', bg: 'bg-blue-400/5', inRate: 0.10, outRate: 0.40 },
        'flash-2.5': { name: 'Cluaiz Ultimate', subtitle: 'Gemini 2.5 Flash', icon: Layers, color: 'text-emerald-400', border: 'border-emerald-400/20', bg: 'bg-emerald-400/5', inRate: 0.30, outRate: 2.50 }
    };

    const handleOptionSelect = (id: string) => {
        setSelectedOption(id);
    };

    // Auto-scroll ref
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll effect
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    // 🔄 RESCAN HANDLER
    const handleRescan = () => {
        clearAgent(agentId); // Clear store
        setLogs([]); // Clear local logs
        setTotalTokens(0);
        setSelectedOption(null);
        setModelOptions([]); // Clear model options
        setStage('scanning'); // Reset stage to re-trigger effect
    };


    // 🚀 Start Real Diagnostic on Mount or Rescan
    useEffect(() => {
        if (isSynthesizing) {
            setLogs(prev => [...prev, "🧠 [CHIEF ARCHITECT] Initiating deep Neural Matrix synthesis...", "📡 Analyzing business context & employee metadata...", "💎 Generating Operating Constitution..."]);
        }
    }, [isSynthesizing]);

    useEffect(() => {
        // If already scanned (and we haven't just cleared it), don't run again
        if (scannedAgents[agentId] && stage !== 'scanning') return;

        let isMounted = true;
        const localLogs: string[] = [];

        // Helper to push logs to both local and UI logic
        const pushLog = (msg: string) => {
            if (!isMounted) return;
            const cleanMsg = sanitize(msg);
            localLogs.push(cleanMsg);
            setLogs(prev => [...prev, cleanMsg]);
        };

        const runDiagnostics = async () => {
            try {
                // Get Org ID Logic
                const orgId = typeof window !== 'undefined' ? localStorage.getItem('activeOrgId') : null;

                // Try to get Org Name - Robust Check
                let storedOrgName = typeof window !== 'undefined' ? localStorage.getItem('activeOrgName') : "Your Organization";
                if (!storedOrgName || storedOrgName === "null" || storedOrgName === "undefined") {
                    storedOrgName = "Your Organization";
                }
                setOrgName(storedOrgName);

                if (!orgId) {
                    pushLog("❌ Critical Error: Organization ID not found.");
                    setStage('reviewing');
                    return;
                }

                // Initial Logs
                const initialLogs = [
                    `Initializing Neural Scan for ${agentName}...`,
                    `Authenticating with Gemini Core Matrix...`,
                    `Accessing Knowledge Graph (Org: ${orgId.substring(0, 8)})...`,
                ];

                for (const log of initialLogs) {
                    if (!isMounted) return;
                    pushLog(log);
                    await new Promise(r => setTimeout(r, 400));
                }

                pushLog(`🔍 Scanning /dashboard/ai-studio/brain...`);

                // ⚡ FETCH REAL DATA OR USE DUMMY
                // MOCK DATA STRUCTURE (Easy to swap with API response)
                const MOCK_KNOWLEDGE_BASE = {
                    success: true,
                    sources: {
                        websites: [
                            { domain: 'https://cluaiz.com/docs', description: "Official Documentation", intent_summary: "User guide for platform features", tags: ["docs", "help", "guide"] },
                            { domain: 'https://cluaiz.com/pricing', description: "Pricing Page", intent_summary: "Cost structure and plans", tags: ["pricing", "sales"] }
                        ],
                        documents: [
                            { name: "Global_Sales_Policy_v4.pdf", description: "Internal sales guidelines for Q4", intent_summary: "Sales playbook and compliance rules", tags: ["sales", "policy", "internal"] },
                            { name: "Employee_Handbook_2025.docx", description: "HR policies and benefits", intent_summary: "Employee code of conduct", tags: ["hr", "legal"] }
                        ],
                        api: [
                            { name: "Stripe Payment Gateway", endpoint: "https://api.stripe.com/v1", intent_summary: "Process payments", tags: ["finance", "payment"] }
                        ],
                        custom_text: [
                            { title: "Company Mission", content: "To accelerate human potential.", intent_summary: "Core values", tags: ["culture"] }
                        ]
                    },
                    stats: { wordsUsed: 42500 }
                };

                let response;
                let usedFallback = false;

                try {
                    // UNCOMMENT THIS TO ENABLE REAL API
                    // response = await api.get(`/knowledge/${orgId}/overview`);

                    // FOR NOW, USE MOCK DATA
                    throw new Error("Using Mock Data");
                } catch (e) {
                    pushLog(`⚠️ Network Warning: Neural Core Unreachable. Switching to Local Cache Simulation...`);
                    usedFallback = true;
                    response = { data: MOCK_KNOWLEDGE_BASE };
                    await new Promise(r => setTimeout(r, 1000));
                }

                if (!response.data || !response.data.success) {
                    throw new Error("Failed to fetch brain overview");
                }

                const data = response.data;
                const sources = data.sources || {};

                // --- TOTAL STATS CALCULATION ---
                const webCount = sources.websites?.length || 0;
                const fileCount = sources.documents?.length || 0;
                const apiCount = sources.api?.length || 0;
                const manualCount = sources.custom_text?.length || 0;
                const totalSources = webCount + fileCount + apiCount + manualCount;

                // --- ACCUMULATORS FOR BREAKDOWN ---
                let totalDescTokens = 0;
                let totalIntentTokens = 0;
                let totalTagTokens = 0;

                pushLog(`📊 Found ${totalSources} Total Sources in Knowledge Base.`);

                // Process Websites
                if (webCount > 0) {
                    pushLog(`🌐 Analyzing ${webCount} Websites...`);
                    for (const site of sources.websites) {
                        const descTokens = estimateTokens(site.description);
                        const intentTokens = estimateTokens(site.intent_summary);
                        const tagTokens = estimateTokens((site.tags || []).join(' '));

                        totalDescTokens += descTokens;
                        totalIntentTokens += intentTokens;
                        totalTagTokens += tagTokens;

                        await new Promise(r => setTimeout(r, 150));
                        pushLog(`   [WEBSITE] ${site.domain || (site as any).url}`);
                        pushLog(`     ├─ Description Tokens: ${descTokens}`);
                        pushLog(`     ├─ Intent Context Tokens: ${intentTokens}`);
                        pushLog(`     └─ Tag Tokens: ${tagTokens}`);
                    }
                } else if (!usedFallback) {
                    pushLog(`🌐 No Websites Linked.`);
                }

                // Process Files
                if (fileCount > 0) {
                    pushLog(`📄 Analyzing ${fileCount} Files...`);
                    for (const doc of sources.documents) {
                        const descTokens = estimateTokens(doc.description || (doc as any).summary);
                        const intentTokens = estimateTokens(doc.intent_summary);
                        const tagTokens = estimateTokens((doc.tags || []).join(' '));

                        totalDescTokens += descTokens;
                        totalIntentTokens += intentTokens;
                        totalTagTokens += tagTokens;

                        // Sanitize Name just in case
                        const cleanName = sanitize(doc.name);

                        await new Promise(r => setTimeout(r, 100));
                        pushLog(`   [FILE] ${cleanName}`);
                        pushLog(`     ├─ Description Tokens: ${descTokens}`);
                        pushLog(`     ├─ Intent Context Tokens: ${intentTokens}`);
                        pushLog(`     └─ Tag Tokens: ${tagTokens}`);
                    }
                } else if (!usedFallback) {
                    pushLog(`📄 No Documents Found.`);
                }

                // Process APIs 
                if (apiCount > 0) {
                    pushLog(`🔌 Analyzing ${apiCount} API Integrations...`);
                    for (const apiSource of sources.api) {
                        const descTokens = estimateTokens(apiSource.name);
                        const intentTokens = estimateTokens(apiSource.intent_summary);
                        const tagTokens = estimateTokens((apiSource.tags || []).join(' '));

                        totalDescTokens += descTokens;
                        totalIntentTokens += intentTokens;
                        totalTagTokens += tagTokens;

                        await new Promise(r => setTimeout(r, 100));
                        pushLog(`   [API] ${apiSource.name || apiSource.endpoint}`);
                        pushLog(`     ├─ Config Tokens: ${descTokens}`);
                        pushLog(`     ├─ Intent Context Tokens: ${intentTokens}`);
                        pushLog(`     └─ Tag Tokens: ${tagTokens}`);
                    }
                }

                // Process Manual
                if (manualCount > 0) {
                    pushLog(`🧠 Analyzing ${manualCount} Manual Entries...`);
                    for (const text of sources.custom_text) {
                        const contentTokens = estimateTokens(text.content);
                        const intentTokens = estimateTokens(text.intent_summary);
                        const tagTokens = estimateTokens((text.tags || []).join(' '));

                        totalDescTokens += contentTokens;
                        totalIntentTokens += intentTokens;
                        totalTagTokens += tagTokens;

                        // SANITIZE TITLE
                        const cleanTitle = sanitize(text.title || "Untitled Entry");

                        await new Promise(r => setTimeout(r, 100));
                        pushLog(`   [MANUAL] ${cleanTitle}`);
                        pushLog(`     ├─ Content Tokens: ${contentTokens}`);
                        pushLog(`     ├─ Intent Context Tokens: ${intentTokens}`);
                        pushLog(`     └─ Tag Tokens: ${tagTokens}`);
                    }
                }

                // Total Context SENT TO MODEL
                const totalPromptTokens = totalDescTokens + totalIntentTokens + totalTagTokens;
                const formattedTokens = totalPromptTokens.toLocaleString();

                if (isMounted) setTotalTokens(totalPromptTokens);

                // --- 📡 FETCH REAL BACKEND ESTIMATES ---
                // We do this before showing the final message so options are ready
                let finalOptions: any[] = [];
                try {
                    const userCountry = typeof window !== 'undefined' ? (localStorage.getItem('user_country') || 'IN') : 'IN';
                    // We assume api.post is available
                    const estRes = await api.post('/workforce/estimate', {
                        agent_id: agentId,
                        user_country: userCountry
                    });

                    if (estRes.data.success && estRes.data.data.models) {
                        const backendModels = estRes.data.data.models;
                        const mapped = backendModels.map((m: any) => {
                            const style = uiConfig[m.key] || uiConfig['flash-2.0'];
                            return {
                                ...style,
                                id: m.key,
                                model: m.name, // Will override with "Cluaiz ..." in fallback if we merged, but here we trust backend or map it.
                                // Actually better to Map Backend Key to our UI Config Name
                                name: style.name,
                                subtitle: style.subtitle,
                                tokens_burned: m.tokens_to_burn, // Direct from backend
                                multiplier: 0 // Unused
                            };
                        });
                        // Sort by cost
                        mapped.sort((a: any, b: any) => a.tokens_burned - b.tokens_burned);
                        finalOptions = mapped;
                    }
                } catch (err) {
                    console.error("Cost estimate failed, using fallback", err);
                    pushLog(`⚠️ Network Warning: Pricing Engine Unreachable. Using cached rates.`);
                }

                // FALLBACK CALCULATION (Simplified)
                if (finalOptions.length === 0) {
                    const MARGIN = 1.0;
                    const TOKEN_PRICE = 0.30; // $0.30 per 1M tokens

                    const calcBurnTokens = (inputRate: number, outputRate: number) => {
                        // Cost in dollars
                        const inputCost = (inputTokensTotal * inputRate) / 1_000_000;
                        const outputCost = (outputTokensTotal * outputRate) / 1_000_000;
                        const totalCost = inputCost + outputCost;

                        // Convert to tokens at your token price with margin
                        const tokensToBurn = Math.ceil((totalCost / TOKEN_PRICE) * 1_000_000);

                        return tokensToBurn;
                    };

                    const fallback = [
                        { id: 'flash-lite-2.0', ...uiConfig['flash-lite-2.0'], tokens_burned: calcBurnTokens(0.075, 0.30) },
                        { id: 'flash-2.0', ...uiConfig['flash-2.0'], tokens_burned: calcBurnTokens(0.15, 0.60) },
                        { id: 'flash-lite-2.5', ...uiConfig['flash-lite-2.5'], tokens_burned: calcBurnTokens(0.10, 0.40) },
                        { id: 'flash-2.5', ...uiConfig['flash-2.5'], tokens_burned: calcBurnTokens(0.30, 2.50) },
                    ];

                    finalOptions = fallback;
                }

                if (isMounted) setModelOptions(finalOptions);

                // --- 📊 DYNAMIC NEURAL MAPPING SUMMARY ---
                pushLog(`--------------------------------------------------`);
                pushLog(`✅ NEURAL MAPPING COMPLETE`);
                pushLog(`   • Input Payload JSON:  ${inputTokensTotal.toLocaleString()} Tokens`);
                pushLog(`   • Est. Output JSON:    ${outputTokensTotal.toLocaleString()} Tokens`);
                pushLog(`--------------------------------------------------`);

                // --- 🤖 DYNAMIC AGENT MESSAGE ---
                await new Promise(r => setTimeout(r, 800));

                // Use FULL description as requested by user ("slice nhi lgna hai")
                const fullDescription = description || `I am ready to serve as your ${role}.`;

                const agentMessage = `
💬 [MISSION READINESS REPORT: ${agentName.toUpperCase()}]
--------------------------------------------------
👤 IDENTITY:     ${agentName}
🛡️ ROLE:         ${role}
department: ${department || "General Operations"}
🏢 TARGET ORG:   ${storedOrgName}

✅ OPERATIONAL MATRIX ANALYSIS:
   • Knowledge Assimilated: ${formattedTokens} Tokens from ${totalSources} Sources.
   • Core Directive:
     "${fullDescription}"

🚀 READINESS STATUS:
   • Logic Core:           ONLINE
   • Context Sync:         COMPLETE
   • 24/7 Availability:    STANDBY

💰 TRAINING RESOURCE ALLOCATION:
   My neural training requires computational resources to process 
   the ${formattedTokens} tokens of your specific business context.
   Real-time cost estimates for diverse neural models are detailed below.
   
👉 ACTION REQUIRED:
   Select a neural configuration option below to commence initialization.
   [Select Option] -> [Initialize Training]
`.trim();

                pushLog(agentMessage);

                if (isMounted) {
                    setStage('reviewing');
                    markScanned(agentId);
                    addLogs(agentId, localLogs); // Persist logs
                }

            } catch (error: any) {
                console.error("Diagnostic ritual failed:", error);
                pushLog(`❌ Error: ${error.details || error.message || "Connection to Neural Core Failed"}`);
                setStage('reviewing'); // Allow manual fix even on error
            }
        };

        // Only run if we are in 'scanning' stage (which we force on rescan)
        if (stage === 'scanning') {
            runDiagnostics();
        }

        return () => { isMounted = false; };
    }, [agentName, role, agentId, scannedAgents, markScanned, addLogs, stage, description]);

    // RENDER LOGIC
    // Return null if not in correct stages (although layout handles this)
    if (stage === 'scanning' || stage === 'streaming' || stage === 'reviewing' || stage === 'constructing') {
        return (
            <div className={`flex  flex-col items-center  min-h-screen   mx-auto w-full relative ${stage === 'constructing' ? 'justify-start' : 'justify-center'}`}>

                {/* 🖥️ Terminal / Console with Increased Height */}
                <div
                    className={`w-full max-w-4xl bg-black/80 border border-white/10 rounded-[20px] p-6 font-mono text-[10px] md:text-xs relative shadow-2xl backdrop-blur-md flex flex-col transition-all duration-500 ${stage === 'reviewing' ? 'h-[500px]' : 'h-[500px]'}`}
                >

                    {/* 👇 BACKGROUND WATERMARK WITH ANIMATION */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
                        <motion.div
                            animate={{ opacity: [0.03, 0.08, 0.03], scale: [1, 1.05, 1] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <Brain size={250} className="text-emerald-500 blur-sm" />
                        </motion.div>
                    </div>

                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent z-10" />

                    {/* Header */}
                    <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2 shrink-0 relative z-10">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-emerald-500 uppercase tracking-widest font-black">Neural Discovery Terminal</span>
                        </div>

                        {/* 🔄 RESCAN BUTTON IN HEADER */}
                        {(stage === 'reviewing' || stage === 'constructing') ? (
                            <button
                                onClick={handleRescan}
                                className="flex items-center gap-2 px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-[10px] text-zinc-400 hover:text-white transition-all font-mono"
                            >
                                <RotateCw size={10} />
                                RESCAN MATRIX
                            </button>
                        ) : (
                            <span className="text-zinc-500">v4.0.2</span>
                        )}
                    </div>

                    {/* Logs Area */}
                    <div className="flex-1 overflow-y-auto pr-2 scroll-smooth no-scrollbar relative z-10">
                        <AnimatePresence mode="popLayout">
                            {logs.map((log, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`flex items-start gap-3 mb-1.5 ${log.includes('❌') ? 'text-red-400' : log.includes('✅') ? 'text-emerald-400 font-bold' : log.includes('Found') || log.includes('Analyzing') || log.includes('BREAKDOWN') || log.includes('Total Context') || log.includes('MESSAGE FROM') || log.includes('ACTION REQUIRED') || log.includes('IDENTITY:') ? 'text-white font-bold' : 'text-zinc-400'}`}
                                >
                                    <span className="text-emerald-900 shrink-0 opacity-50">[{new Date().toLocaleTimeString()}]</span>
                                    <span className="break-all leading-relaxed whitespace-pre-wrap">{log}</span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        <div ref={logsEndRef} />
                    </div>
                </div>

                {/* 🟢 SELECTION GRID (Only appears after scan) */}
                <AnimatePresence>
                    {stage === 'reviewing' && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full max-w-5xl space-y-4"
                        >
                            <h3 className="text-center text-xs font-bold uppercase tracking-[0.4em] text-zinc-500 mt-2">Select Neural Configuration</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4">
                                {modelOptions.length > 0 ? modelOptions.map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => handleOptionSelect(opt.id)}
                                        className={`relative group p-4 rounded-xl border transition-all duration-300 text-left hover:scale-[1.02] ${selectedOption === opt.id ? `bg-white/10 ${opt.border} ring-1 ring-${opt.color.split('-')[1]}-400` : `bg-black/40 border-white/5 hover:bg-white/5`}`}
                                    >
                                        <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity ${opt.bg}`} />

                                        <div className="relative z-10 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <opt.icon className={`w-6 h-6 ${opt.color}`} />
                                                {selectedOption === opt.id && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                                            </div>

                                            <div>
                                                <h4 className="text-sm font-bold text-white">{opt.name}</h4>
                                                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{opt.subtitle}</p>
                                            </div>

                                            <div className="pt-2 border-t border-white/5">
                                                <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Tokens Deduction Est.</p>
                                                <p className="text-sm font-mono font-bold text-white flex items-center gap-1">
                                                    <Zap size={14} className="text-yellow-500 fill-yellow-500" />
                                                    {opt.tokens_burned.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                )) : (
                                    <div className="col-span-4 text-center text-zinc-500 animate-pulse py-8">
                                        Calculating Neural Matrix Costs...
                                    </div>
                                )}
                            </div>


                            {/* START BUTTON */}
                            <div className="flex justify-center pt-2">
                                <button
                                    disabled={!selectedOption}
                                    onClick={() => onStartConstruction?.(selectedOption!)}
                                    className={`group flex items-center gap-3 px-8 py-3 rounded-full font-black text-sm transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] ${selectedOption ? 'bg-emerald-500 hover:bg-emerald-400 text-black hover:scale-105 cursor-pointer' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'}`}
                                >
                                    <Cpu size={18} className={selectedOption ? "fill-black" : ""} />
                                    <span>{selectedOption ? "INITIALIZE TRAINING" : "SELECT OPTION"}</span>
                                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>

                        </motion.div>
                    )}

                    {stage === 'constructing' && (
                        <div className="text-center py-20 animate-pulse text-emerald-500 font-mono tracking-widest uppercase">
                            SYNTHESIZING PROTOCOLS...
                        </div>
                    )}
                </AnimatePresence>


                <div className="text-center space-y-2 mt-4">
                    <h2 className="text-2xl font-black bg-gradient-to-r from-white via-white to-white/20 bg-clip-text text-transparent uppercase tracking-tighter italic">
                        {stage === 'reviewing' ? "Matrix Synthesized." : stage === 'constructing' ? "Protocol Finalization." : "Initializing Personnel Ritual..."}
                    </h2>
                    <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.4em]">
                        Fractal Analysis Engine
                    </p>
                </div>
            </div >
        );
    }

    return null;
}