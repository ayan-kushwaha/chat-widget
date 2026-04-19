'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Sparkles, Fingerprint, ScanFace, Layers, Radio, Shield, Award } from 'lucide-react';
import { Stage, STAGES } from './constants';
import { useRouter } from 'next/navigation';

interface OnboardingHeaderProps {
    currentStage: Stage;
    persona: any;
    onSave?: () => void;
}

export function OnboardingHeader({ currentStage, persona }: OnboardingHeaderProps) {
    const router = useRouter();

    return (
        <header className="relative z-20 flex items-center justify-between p-6 border-b border-white/5 bg-black/40 backdrop-blur-2xl">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="hover:bg-white/5 text-zinc-400" onClick={() => router.back()}>
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                            Employee Onboarding
                        </span>
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                    </h2>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                        <span className="text-zinc-300">{persona.name}</span>
                        <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                        <span className="text-emerald-500">{currentStage}</span>
                    </div>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="hidden lg:flex items-center gap-2">
                {STAGES.map((s, i) => {
                    const isActive = STAGES.findIndex(st => st.key === currentStage) === i;
                    const isCompleted = STAGES.findIndex(st => st.key === currentStage) > i;

                    const Icon = {
                        'handshake': Fingerprint,
                        'persona': ScanFace,
                        'audit': Layers,
                        'simulation': Radio,
                        'constitution': Shield,
                        'evolution': Award
                    }[s.key] || Fingerprint;

                    return (
                        <div key={s.key} className="flex items-center">
                            <div className={`flex flex-col items-center gap-1 min-w-[100px] p-2 rounded-xl transition-all ${isActive ? 'bg-white/5 border border-white/10' : ''
                                }`}>
                                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400 animate-pulse' :
                                        isCompleted ? 'text-emerald-500' : 'text-zinc-600'
                                    }`} />
                                <span className={`text-[9px] font-bold tracking-tighter uppercase ${isActive ? 'text-white' : isCompleted ? 'text-zinc-400' : 'text-zinc-600'
                                    }`}>{s.label}</span>
                            </div>
                            {i < STAGES.length - 1 && (
                                <div className={`w-6 h-[2px] mx-1 rounded-full ${isCompleted ? 'bg-emerald-500/50' : 'bg-zinc-800'
                                    }`} />
                            )}
                        </div>
                    );
                })}
            </div>

            <Button variant="outline" className="border-zinc-800 text-xs font-medium text-zinc-400 hover:bg-white/5 rounded-xl">
                Save Draft
            </Button>
        </header>
    );
}
