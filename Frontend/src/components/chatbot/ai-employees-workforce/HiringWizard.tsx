"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

// Import Steps
// Import Steps
// import { Step1_Scan } from '@/components/chatbot/ai-employees-workforce/steps/Step1_Scan';
// import { Step2_Interview } from '@/components/chatbot/ai-employees-workforce/steps/Step2_Interview';
// import { Step3_Contract } from '@/components/chatbot/ai-employees-workforce/steps/Step3_Contract';
// import { Step4_Welcome } from '@/components/chatbot/ai-employees-workforce/steps/Step4_Welcome';

// Types
export type HiringStep = 'scan' | 'interview' | 'contract' | 'welcome';

interface HiringWizardProps {
    agentId: string;
}

export const HiringWizard: React.FC<HiringWizardProps> = ({ agentId }) => {
    const [currentStep, setCurrentStep] = useState<HiringStep>('scan');
    const [knowledgeBase, setKnowledgeBase] = useState<File | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [agentData, setAgentData] = useState<any>(null); // To store backend validation results
    const router = useRouter();
    const { toast } = useToast();

    // 🔄 Step Transitions
    const nextStep = (step: HiringStep) => {
        setCurrentStep(step);
    };

    const handleExit = () => {
        router.push('/dashboard/communication/inbox');
    };

    return (
        <div className="relative w-full h-full flex flex-col bg-white dark:bg-black text-neutral-900 dark:text-white overflow-hidden">

            {/* 1. Header (Sticky) */}
            <div className="absolute top-0 left-0 w-full z-50 p-6 flex justify-between items-start pointer-events-none">
                <button
                    onClick={handleExit}
                    className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all text-sm font-bold shadow-lg text-white"
                >
                    <ChevronLeft size={16} /> Exit Ritual
                </button>

                {/* Step Indicator */}
                <div className="flex gap-2 pointer-events-auto">
                    {['scan', 'interview', 'contract', 'welcome'].map((s, i) => (
                        <div
                            key={s}
                            className={`h-1.5 rounded-full transition-all duration-500 ${s === currentStep ? 'bg-emerald-500 w-8' : 'bg-neutral-800 w-2'
                                }`}
                        />
                    ))}
                </div>
            </div>

            

        </div>
    );
};
