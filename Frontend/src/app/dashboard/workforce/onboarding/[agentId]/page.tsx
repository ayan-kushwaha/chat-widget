'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { BackgroundBeams } from '@/components/ui/background-beams';
import { toast } from 'sonner';

import { AGENT_PERSONAS, INITIAL_BUSINESS_CONTEXT, Stage, STAGES } from '@/app/dashboard/workforce/onboarding/steps/constants';
import { OnboardingHeader } from '@/app/dashboard/workforce/onboarding/steps/OnboardingHeader';
import { HandshakeStep } from '@/app/dashboard/workforce/onboarding/steps/HandshakeStep';
import { PersonaStep } from '@/app/dashboard/workforce/onboarding/steps/PersonaStep';
import { AuditStep } from '@/app/dashboard/workforce/onboarding/steps/AuditStep';
import { SimulationStep } from '@/app/dashboard/workforce/onboarding/steps/SimulationStep';
import { ConstitutionStep } from '@/app/dashboard/workforce/onboarding/steps/ConstitutionStep';
import { EvolutionStep } from '@/app/dashboard/workforce/onboarding/steps/EvolutionStep';
import { knowledgeAPI, workforceAPI } from '@/lib/api';
import { generateInputPayload } from '@/lib/protocol-engine';
import { useHiringStore } from '@/lib/store/hiring-store';

export default function NeuralOnboardingWizard() {
    const params = useParams();
    const router = useRouter();
    const agentId = (params.agentId as string) || 'sales_manager';
    // Persona: try constants.ts first (key match), will be overridden by DB data in fetchData
    const [persona, setPersona] = useState<any>(AGENT_PERSONAS[agentId] || AGENT_PERSONAS['sales_manager']);

    const [currentStage, setCurrentStage] = useState<Stage>('handshake');
    const [businessContext, setBusinessContext] = useState(INITIAL_BUSINESS_CONTEXT);
    const [orgData, setOrgData] = useState<any>(null);
    const [brainConfig, setBrainConfig] = useState<any>(null);
    const [knowledgeSources, setKnowledgeSources] = useState<any[]>([]);
    const [editableConstitution, setEditableConstitution] = useState<any>({
        employee_constitution: {
            identity_core: { role_definition: "", tone_voice: "" },
            protocols: {
                responsibilities: ["Awaiting synthesis..."],
                performance_metrics: ["Awaiting synthesis..."],
                compliance_safety: ["Awaiting synthesis..."],
            }
        }
    });
    const [selectedModel, setSelectedModel] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const { markScanned, onboardingData, updateOnboardingData } = useHiringStore();

    const currentOnboardingData = onboardingData[agentId as string] || {
        bossMandates: {},
        simulationResults: null,
        principles: null,
        finalConstitution: null
    };

    const bossMandates = currentOnboardingData.bossMandates;
    const setBossMandates = (mandates: Record<string, string>) => {
        updateOnboardingData(agentId as string, { bossMandates: mandates });
    };

    useEffect(() => {
        const fetchData = async () => {
            const orgId = localStorage.getItem('activeOrgId');
            if (!orgId) {
                setLoading(false);
                return;
            }

            try {
                const [overviewRes, personalityRes] = await Promise.all([
                    knowledgeAPI.getOverview(orgId),
                    knowledgeAPI.getPersonality(orgId)
                ]);

                const src = overviewRes.data.sources || {};
                const rawSources = [
                    ...(src.websites || overviewRes.data.sites || []),
                    ...(src.documents || overviewRes.data.docs || []),
                    ...(src.api || overviewRes.data.apiSources || []),
                    ...(src.custom_text || [])
                ];

                setKnowledgeSources(rawSources);
                setBrainConfig(personalityRes.data.config || {});
                setOrgData({
                    name: localStorage.getItem('orgName') || "Cluaiz Global",
                    industry: localStorage.getItem('orgIndustry') || "Enterprise SaaS"
                });

                // Construct initial business context for UI from real data
                setBusinessContext({
                    ...INITIAL_BUSINESS_CONTEXT,
                    name: localStorage.getItem('orgName') || INITIAL_BUSINESS_CONTEXT.name,
                    industry: localStorage.getItem('orgIndustry') || INITIAL_BUSINESS_CONTEXT.industry,
                });

                // 3. Fetch any existing/draft workforce personnel for this agent
                try {
                    const workforceRes = await workforceAPI.getByAgentId(agentId);
                    if (workforceRes.data.success && workforceRes.data.data) {
                        const existing = workforceRes.data.data;
                        // ✅ LOAD persona from DB if available
                        if (existing.name || existing.role || existing.persona) {
                            setPersona((prev: Record<string, any>) => ({
                                ...prev,
                                name: existing.name || prev.name,
                                role: existing.role || prev.role,
                                personality: existing.persona || prev.personality,
                                employee_type: existing.employee_type || prev.employee_type,
                            }));
                        }
                        console.log("📂 Existing Personnel Blueprint found:", existing);

                        if (existing.constitution) {
                            // ✅ MARK AS SCANNED TO SKIP TERMINAL RITUAL
                            markScanned(agentId);
                            setEditableConstitution({
                                employee_constitution: existing.constitution
                            });
                        }
                    }
                } catch (wErr) {
                    console.warn("No existing blueprint found, starting fresh.");
                }

            } catch (err) {
                console.error("Failed to fetch onboarding context:", err);
                toast.error("Failed to load real-time business context.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const nextStage = () => {
        const currentIndex = STAGES.findIndex(s => s.key === currentStage);
        if (currentIndex < STAGES.length - 1) {
            const next = STAGES[currentIndex + 1].key;
            setCurrentStage(next);
        } else {
            router.push(`/dashboard/workforce/${agentId}`);
        }
    };

    return (
        <div className="h-[calc(100vh-100px)]  text-white relative flex flex-col  font-sans">
            <BackgroundBeams className="opacity-10" />

            {/* Ambient Glow */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px]" />
            </div>

            <OnboardingHeader currentStage={currentStage} persona={persona} />

            {/* Main Content */}
            <main className="flex-1  relative z-10 flex flex-col ">
                <AnimatePresence mode="wait">
                    {currentStage === 'handshake' && (
                        <HandshakeStep
                            key="handshake"
                            persona={persona}
                            businessContext={businessContext}
                            knowledgeSources={knowledgeSources}
                            agentId={agentId as string}
                            onNext={nextStage}
                        />
                    )}
                    {currentStage === 'audit' && (
                        <AuditStep
                            key="audit"
                            persona={persona}
                            businessContext={businessContext}
                            knowledgeSources={knowledgeSources}
                            bossMandates={bossMandates}
                            onUpdateMandates={setBossMandates}
                            onNext={nextStage}
                        />
                    )}
                    {currentStage === 'simulation' && (
                        <SimulationStep
                            key="simulation"
                            persona={persona}
                            businessContext={businessContext}
                            bossMandates={bossMandates}
                            onUpdateResults={(results: any) => updateOnboardingData(agentId as string, { simulationResults: results })}
                            onNext={nextStage}
                        />
                    )}
                    {currentStage === 'constitution' && (
                        <ConstitutionStep
                            key="constitution"
                            persona={persona}
                            businessContext={businessContext}
                            orgData={orgData}
                            brainConfig={brainConfig}
                            knowledgeSources={knowledgeSources}
                            bossMandates={bossMandates}
                            constitution={editableConstitution}
                            simulationResults={currentOnboardingData.simulationResults}
                            onUpdateConstitution={setEditableConstitution}
                            onUpdatePrinciples={(principles: string[]) => updateOnboardingData(agentId as string, { principles })}
                            onNext={nextStage}
                        />
                    )}
                    {currentStage === 'persona' && (
                        <PersonaStep
                            key="persona"
                            persona={persona}
                            agentId={agentId}
                            businessContext={businessContext}
                            orgData={orgData}
                            brainConfig={brainConfig}
                            knowledgeSources={knowledgeSources}
                            bossMandates={bossMandates}
                            constitution={editableConstitution}
                            onUpdateConstitution={setEditableConstitution}
                            onSetModel={setSelectedModel}
                            onNext={nextStage}
                        />
                    )}
                    {currentStage === 'evolution' && (
                        <EvolutionStep
                            key="evolution"
                            persona={persona}
                            businessContext={businessContext}
                            constitution={editableConstitution}
                            selectedModel={selectedModel}
                            knowledgeSources={knowledgeSources}
                            onNext={nextStage}
                        />
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
