"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { agents } from "@/lib/agents-data";
import Image from "next/image";
import { getAgentAvatar } from "@/lib/utils";
import { ArrowLeft, Sparkles, Zap } from "lucide-react";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { StepDiagnostics } from "@/components/workforce/onboarding/StepDiagnostics";
import { ConstructionMatrix } from "@/components/workforce/onboarding/ConstructionMatrix";

export default function HiringRitualPage() {
    const params = useParams();
    const router = useRouter();
    const [agent, setAgent] = useState<any>(null);
    const [step, setStep] = useState<'diagnostics' | 'construction' | 'complete'>('diagnostics');
    const [selectedModel, setSelectedModel] = useState<string | null>(null);
    const [isDeploying, setIsDeploying] = useState(false);

    const [constitution, setConstitution] = useState<any>({
        identity_core: {
            role_definition: "",
            tone_voice: ""
        },
        protocols: {
            performance_metrics: ["Response Accuracy > 98%", "Neural Sync Stability", "Task Completion Velocity"],
            responsibilities: ["Autonomous Decision Making", "Continuous Learning Protocol", "Cross-department Collaboration"],
            compliance_safety: ["Data Privacy Standard v2.1", "Ethical Logic Constraints", "Operational Transparency"]
        }
    });

    const [sources, setSources] = useState<any[]>([]);

    useEffect(() => {
        if (params.agentId) {
            const found = agents.find(a => a.id === params.agentId);
            if (found) {
                setAgent({
                    ...found,
                    // Ensure full data for onboarding components
                    avatar_url: getAgentAvatar(found.gender, found.id),
                    department: found.department || "General Operations"
                });

                // Set initial role definition based on description
                setConstitution((prev: any) => ({
                    ...prev,
                    identity_core: {
                        ...prev.identity_core,
                        role_definition: found.description || `Specialized AI Node optimized for ${found.role} functions.`
                    }
                }));

                // Mock neural anchors for mapping
                setSources([
                    { name: "Company_Mission.txt", source_type: "manual", guidance: "Follow global strategic alignment." },
                    { name: "Sales_Script_v2.pdf", source_type: "file", guidance: "Prioritize customer empathy and retention." },
                    { name: "Process_API_Docs", source_type: "api", guidance: "Optimize for high-throughput data processing." }
                ]);
            }
        }
    }, [params.agentId]);

    if (!agent) return <div className="p-10 text-white font-mono bg-black min-h-screen">Initializing Neural Link... [SEARCHING_DATA]</div>;

    const handleDeploy = async () => {
        setIsDeploying(true);
        // Simulate neural finalization
        await new Promise(r => setTimeout(r, 2500));
        router.push('/dashboard/workforce/fleet');
    };

    const avatarUrl = getAgentAvatar(agent.gender, agent.id);

    return (
        <div className="min-h-screen w-full bg-black text-white relative flex overflow-hidden">
            {/* Background Atmosphere */}
            <BackgroundBeams />

            {/* Back Navigation */}
            <button
                onClick={() => router.back()}
                className="absolute top-8 left-8 z-50 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
                <ArrowLeft className="w-5 h-5" />
                <span>Abort Protocol</span>
            </button>

            {/* Split Layout / Full Flow Integration */}
            <div className="relative z-10 w-full h-full pt-20 px-6 overflow-y-auto no-scrollbar">

                <AnimatePresence mode="wait">
                    {step === 'diagnostics' && (
                        <motion.div
                            key="diagnostics"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full flex flex-col items-center"
                        >
                            <StepDiagnostics
                                agentId={agent.id}
                                agentName={agent.name}
                                role={agent.role}
                                description={agent.description}
                                department={agent.department}
                                onStartConstruction={(modelId) => {
                                    setSelectedModel(modelId);
                                    setStep('construction');
                                }}
                                onComplete={() => setStep('construction')}
                            />
                        </motion.div>
                    )}

                    {step === 'construction' && (
                        <motion.div
                            key="construction"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="w-full"
                        >
                            <ConstructionMatrix
                                agent={agent}
                                constitution={constitution}
                                sources={sources}
                                onUpdateConstitution={setConstitution}
                                onUpdateSources={setSources}
                                onComplete={handleDeploy}
                                isDeploying={isDeploying}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Status Indicator Floating */}
                <div className="fixed bottom-8 right-8 z-50">
                    <div className="px-6 py-3 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-2xl flex items-center gap-4 transition-all hover:border-emerald-500/30">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Protocol Version</span>
                            <span className="text-[10px] font-mono font-bold text-white">v4.0.2-Neural</span>
                        </div>
                        <div className="w-px h-6 bg-white/10" />
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none">Matrix Active</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
