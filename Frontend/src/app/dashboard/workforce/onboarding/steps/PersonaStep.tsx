'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Zap, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

// Custom Components (Restored)
import { StepDiagnostics } from './StepDiagnostics';
import { IdentityCore } from '@/components/workforce/onboarding/ConstructionMatrix';

// Utils & API
import { generateInputPayload } from '@/lib/protocol-engine';
import { workforceAPI } from '@/lib/api';

interface PersonaStepProps {
    persona: any;
    agentId: string;
    businessContext: any;
    orgData: any;
    brainConfig: any;
    knowledgeSources: any[];
    bossMandates?: Record<string, string>;
    constitution: any;
    onUpdateConstitution: (val: any) => void;
    onSetModel: (model: string) => void;
    onNext: () => void;
}

export function PersonaStep({
    persona,
    agentId,
    businessContext,
    orgData,
    brainConfig,
    knowledgeSources,
    bossMandates = {},
    constitution,
    onUpdateConstitution,
    onSetModel,
    onNext
}: PersonaStepProps) {
    // Flow Management: 'diagnostics' -> 'constructing'
    const [diagStage, setDiagStage] = useState<'diagnostics' | 'constructing'>(
        constitution?.employee_constitution?.identity_core?.role_definition ||
            constitution?.identity_core?.role_definition
            ? 'constructing'
            : 'diagnostics'
    );
    const [isSynthesizing, setIsSynthesizing] = useState(false);

    // 🔄 SYNC: If constitution data arrives from parent (DB fetch), skip diagnostics
    React.useEffect(() => {
        const hasData = constitution?.employee_constitution?.identity_core?.role_definition ||
            constitution?.identity_core?.role_definition;
        if (hasData && diagStage === 'diagnostics') {
            console.log("📂 Valid constitution found in props. Bypassing Neural Scan...");
            setDiagStage('constructing');
        }
    }, [constitution, diagStage]);

    // 🧪 THE CHIEF AI ARCHITECT RITUAL (Spec Compliant)
    const handleStartConstruction = async (optionId: string) => {
        setIsSynthesizing(true);
        onSetModel(optionId);

        // 📡 1. Prepare Input Dossier
        const dossier = generateInputPayload(
            persona,
            orgData,
            brainConfig,
            knowledgeSources,
            bossMandates
        );

        console.log("📡 Persona Sync Dossier:", dossier);

        // 🧠 2. NEURAL ENRICHMENT
        try {
            console.log("🧠 Initiating Neural Enrichment via AI Engine...");
            const response = await workforceAPI.synthesize(dossier);

            if (response.data.success && response.data.data) {
                const llmResult = response.data.data;
                const resultConst = llmResult.employee_constitution || llmResult;

                if (resultConst && resultConst.identity_core) {
                    console.log("✅ Deep Intelligence Received. Updating Matrix...");
                    onUpdateConstitution(resultConst);

                    // 💾 PERSIST TO DB IMMEDIATELY
                    try {
                        await workforceAPI.saveProtocol({
                            agent_id: agentId,
                            protocol: resultConst,
                            name: persona.name,
                            role: persona.role
                        });
                        console.log("💾 Neural Protocol persisted to Database.");
                    } catch (saveErr) {
                        console.error("⚠️ Failed to persist protocol to DB:", saveErr);
                        // We don't block the UI, but log the error
                    }

                    // Transition to construction view
                    setDiagStage('constructing');
                } else {
                    console.error("⚠️ Invalid response structure:", llmResult);
                    toast.error("Synthesis failed to return valid protocols.");
                }
            }
        } catch (err) {
            console.error("❌ Neural Enrichment failed:", err);
            toast.error("Deep Synthesis failed. Check AI Engine connectivity.");
        } finally {
            setIsSynthesizing(false);
        }
    };

    const isConstructing = diagStage === 'constructing';

    return (
        <div className="flex-1 flex flex-col w-full relative h-full">

            {/* 🧬 NEURAL SYNTHESIS OVERLAY */}
            <AnimatePresence>
                {isSynthesizing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center gap-8"
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
                            <p className="text-[10px] font-mono text-emerald-500/60 uppercase tracking-widest animate-pulse">Constructing Personnel Protocol Matrix...</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 🧬 MAIN CONTENT: SWITCHER */}
            <div className="">
                <AnimatePresence mode="wait">
                    {!isConstructing ? (
                        <motion.div
                            key="diagnostics"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                        >
                            <StepDiagnostics
                                agentId={agentId}
                                agentName={persona.name}
                                role={persona.role}
                                description={persona.description}
                                department={persona.department || "Operations"}
                                onComplete={() => { }} // Not used in this step flow
                                onStartConstruction={handleStartConstruction}
                                isHired={false}
                                isSynthesizing={isSynthesizing}
                                businessContext={businessContext}
                                constitution={constitution}
                                persona={persona}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="constructing"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col gap-12 pt-16"
                        >
                            {/* Header for Construction Mode */}
                            <div className="text-center space-y-4 shrink-0 pb-4">
                                <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Personnel Protocol Synthesis Complete</span>
                                </div>
                                <h2 className="text-3xl md:text-6xl font-black bg-gradient-to-r from-white via-white to-white/20 bg-clip-text text-transparent uppercase tracking-tighter italic leading-none">
                                    Neural Construction Matrix
                                </h2>
                            </div>

                            <IdentityCore
                                agentName={persona.name}
                                role={persona.role}
                                orgName={orgData?.name || businessContext.name}
                                editableConstitution={constitution}
                                setEditableConstitution={onUpdateConstitution}
                            />

                            {/* Final Action to Proceed */}
                            <div className="flex justify-center mb-20">
                                <button
                                    onClick={onNext}
                                    className="group flex items-center gap-4 px-16 py-6 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm rounded-full transition-all shadow-[0_30px_60px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 uppercase tracking-widest"
                                >
                                    <CheckCircle2 size={24} fill="black" />
                                    <span>Assemble Final Protocol</span>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
