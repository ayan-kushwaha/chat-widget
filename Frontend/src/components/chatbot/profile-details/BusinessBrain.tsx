import React, { useState } from 'react';
import { Lock, Plus, TrendingUp, AlertCircle, ChevronsUp, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export const BusinessBrain: React.FC = () => {
    // Mock Data
    const trustScore = 92;
    const [note, setNote] = useState("Client prefers calls after 2 PM. Avoid weekends.");
    const [isEditingNote, setIsEditingNote] = useState(false);

    return (
        <div className="flex flex-col gap-6 w-full">
            <SectionHeader title="Business Intelligence" icon={TrendingUp} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. TRUST SCORE CARD */}
                <div className="bg-zinc-900/40 dark:bg-black/20 border border-zinc-800/50 rounded-[2.5rem] p-8 relative overflow-hidden flex flex-col justify-between min-h-[200px] group transition-all hover:bg-zinc-800/40">
                    <div className="flex justify-between items-start z-10">
                        <div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Trust Score</h3>
                            <div className="flex items-baseline gap-1 mt-2">
                                <span className={cn(
                                    "text-5xl font-black",
                                    trustScore > 80 ? "text-emerald-500" : (trustScore > 50 ? "text-amber-500" : "text-red-500")
                                )}>{trustScore}</span>
                                <span className="text-sm font-bold text-zinc-700">/100</span>
                            </div>
                        </div>
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12",
                            trustScore > 80 ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        )}>
                            <AlertCircle size={24} />
                        </div>
                    </div>

                    <div className="w-full z-10 mt-6 px-1">
                        <Progress value={trustScore} className="h-1.5 bg-zinc-800" />
                        <p className="text-[10px] font-bold text-zinc-600 mt-3 uppercase tracking-widest">
                            High Reliability Index
                        </p>
                    </div>

                    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                </div>

                {/* 2. INTERNAL SECRET NOTES */}
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-[2.5rem] p-8 relative group min-h-[200px] flex flex-col transition-all hover:bg-amber-500/[0.08]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600/80 flex items-center gap-2">
                            <Lock size={12} strokeWidth={3} /> Internal Note
                        </h3>
                        {isEditingNote ? (
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-amber-500 hover:bg-amber-500/10 rounded-full" onClick={() => setIsEditingNote(false)}>
                                <X size={16} />
                            </Button>
                        ) : (
                            <Button variant="ghost" size="sm" onClick={() => setIsEditingNote(true)} className="h-8 px-4 text-[11px] font-black uppercase tracking-widest text-amber-500 hover:bg-amber-500/10 rounded-full border border-amber-500/20">Edit</Button>
                        )}
                    </div>

                    {isEditingNote ? (
                        <textarea
                            className="w-full bg-transparent border-none outline-none text-sm font-bold text-amber-900/90 dark:text-amber-100/90 resize-none flex-1 placeholder:text-amber-900/30"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            autoFocus
                        />
                    ) : (
                        <p className="text-sm font-bold text-amber-900 dark:text-amber-100/80 leading-relaxed italic">
                            "{note}"
                        </p>
                    )}

                    <div className="absolute inset-x-8 bottom-0 h-[1px] bg-amber-500/20" />
                </div>

                {/* 3. CONVERSION INSIGHTS */}
                <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-[2.5rem] p-8 relative group overflow-hidden flex flex-col justify-between min-h-[200px] hover:bg-indigo-500/[0.08] transition-all">
                    <div className="flex justify-between items-start z-10">
                        <div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Lead Quality</h3>
                            <div className="flex items-center gap-2 mt-2">
                                <ChevronsUp className="text-indigo-500" size={24} />
                                <span className="text-2xl font-black text-white italic tracking-tighter uppercase">High Intent</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 transition-transform group-hover:scale-110">
                            <TrendingUp size={20} />
                        </div>
                    </div>

                    <div className="z-10 mt-auto">
                        <div className="flex gap-1.5 mb-2">
                            <span className="w-6 h-1 bg-indigo-500 rounded-full" />
                            <span className="w-6 h-1 bg-indigo-500 rounded-full" />
                            <span className="w-6 h-1 bg-zinc-800 rounded-full" />
                        </div>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                            Ready for Conversion
                        </p>
                    </div>

                    <div className="absolute -top-10 -left-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                </div>
            </div>
        </div>
    );
};

// Helper Header
const SectionHeader = ({ title, icon: Icon }: any) => (
    <div className="flex items-center gap-3 opacity-80 mt-4 mb-2">
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <Icon size={12} /> {title}
        </span>
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
    </div>
);
