"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';

// Types (Mirroring Backend)
type StepType = 'ask_question' | 'show_message' | 'show_ui' | 'api_request';

interface WorkflowStep {
    id: string;
    step_type: StepType;
    field?: {
        label_default: string;
        type: string;
        options?: string[];
    };
    message_default?: string;
    ui_component?: {
        type: string;
        data: any;
    };
    next_step_id?: string;
}

interface DynamicRendererProps {
    industry: string; // "clinic" | "ecommerce"
    intent: string; // "book_appointment"
    onComplete: (data: any) => void;
}

export function DynamicRenderer({ industry, intent, onComplete }: DynamicRendererProps) {
    const [workflow, setWorkflow] = useState<any>(null);
    const [currentStepId, setCurrentStepId] = useState<string>("");
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);

    // 1. Fetch Template from Backend
    useEffect(() => {
        const fetchTemplate = async () => {
            try {
                // In real app: fetch(`/api/v1/templates/${industry}`)
                // For now, using mock fetch to demonstrate immediately
                const res = await fetch(`http://localhost:4000/v1/templates/${industry}`);
                const json = await res.json();
                if (json.success && json.data.workflows[intent]) {
                    setWorkflow(json.data.workflows[intent]);
                    setCurrentStepId(json.data.workflows[intent].steps[0].id);
                }
            } catch (err) {
                console.error("Failed to load template", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTemplate();
    }, [industry, intent]);

    const handleNext = (val: any) => {
        const currentStep = workflow.steps.find((s: any) => s.id === currentStepId);

        // Save Answer
        if (currentStep.field?.id) {
            setAnswers(prev => ({ ...prev, [currentStep.field.id]: val }));
        }

        // Move Logic
        if (currentStep.next_step_id) {
            setCurrentStepId(currentStep.next_step_id);
        } else {
            onComplete(answers);
        }
    };

    if (loading) return <div>Loading AI Brain...</div>;
    if (!workflow) return <div>Template not found for {industry}</div>;

    const step = workflow.steps.find((s: any) => s.id === currentStepId);
    if (!step) return <div>Flow Complete</div>;

    return (
        <div className="w-full max-w-md mx-auto p-4">
            <AnimatePresence mode='wait'>
                <motion.div
                    key={step.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                >
                    <Card className="p-6 bg-slate-900 border-indigo-500/20 shadow-xl">
                        {/* CASE 1: ASK QUESTION */}
                        {step.step_type === 'ask_question' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-white">{step.field?.label_default}</h3>

                                {step.field?.type === 'text' && (
                                    <Input
                                        autoFocus
                                        placeholder="Type here..."
                                        onKeyDown={(e) => e.key === 'Enter' && handleNext(e.currentTarget.value)}
                                        className="bg-slate-800 border-slate-700"
                                    />
                                )}

                                {step.field?.type === 'select' && (
                                    <div className="grid gap-2">
                                        {step.field.options?.map((opt: string) => (
                                            <Button
                                                key={opt}
                                                variant="outline"
                                                className="justify-start hover:bg-indigo-500/20 hover:text-indigo-300"
                                                onClick={() => handleNext(opt)}
                                            >
                                                {opt}
                                            </Button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* CASE 2: SHOW MESSAGE */}
                        {step.step_type === 'show_message' && (
                            <div className="text-center space-y-4">
                                <div className="text-xl">✨</div>
                                <p className="text-slate-300">{step.message_default}</p>
                            </div>
                        )}

                        {/* CASE 3: RICH UI (Product Carousel) */}
                        {step.step_type === 'show_ui' && step.ui_component?.type === 'product_carousel' && (
                            <div className="space-y-3">
                                <h3 className="text-sm uppercase tracking-wider text-slate-400">{step.ui_component.data.title}</h3>
                                <div className="flex gap-4 overflow-x-auto pb-2">
                                    {step.ui_component.data.items.map((item: any, i: number) => (
                                        <div key={i} className="min-w-[140px] bg-slate-800 p-3 rounded-lg border border-slate-700">
                                            <div className="h-24 bg-slate-700 rounded-md mb-2"></div>
                                            <div className="font-bold text-white">{item.name}</div>
                                            <div className="text-indigo-400">{item.price}</div>
                                        </div>
                                    ))}
                                </div>
                                <Button onClick={() => handleNext('browsing')} className="w-full mt-2">
                                    Continue
                                </Button>
                            </div>
                        )}

                    </Card>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
