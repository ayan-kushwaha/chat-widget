import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Briefcase, Brain, Activity, Target, Shield, Sparkles, Loader2, Terminal, BarChart3, Settings, Play, CheckCircle2, Award, Zap, Database, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { agents } from '@/lib/agents-data';
import { NeuralVoicePlayer } from '@/components/browser-voice/NeuralVoicePlayer';
import { AutoResizeTextarea } from '@/app/dashboard/settings/org/components/AutoResizeTextarea';

interface AIWorkforceDetailProps {
    selectedAgent: typeof agents[0] | null;
    activeTab: 'hired' | 'hire_new';
    isHiring: boolean;
    handleHire: (id: string, reason: string) => void;
}

export function AIWorkforceDetail({
    selectedAgent,
    activeTab,
    isHiring,
    handleHire
}: AIWorkforceDetailProps) {
    if (!selectedAgent) {
        return (
            <div className="h-full flex items-center justify-center flex-col text-neutral-400 dark:text-gray-600 space-y-4">
                <Users className="w-16 h-16 opacity-40 dark:opacity-20" />
                <h2 className="text-2xl font-black italic uppercase tracking-widest text-neutral-600 dark:text-gray-500">Select an Agent</h2>
            </div>
        );
    }

    const [activeSubTab, setActiveSubTab] = useState<'overview' | 'performance' | 'settings'>('overview');
    const [currentWordIndex, setCurrentWordIndex] = useState(-1);
    const [bossReason, setBossReason] = useState("");
    const [deployedData, setDeployedData] = useState<any>(null);
    const [isLoadingDeployed, setIsLoadingDeployed] = useState(false);
    const [isHireModalOpen, setIsHireModalOpen] = useState(false);

    const isDeployed = activeTab === 'hired';
    const accentColorClass = 'emerald';

    // Calculate full speech text and offsets
    const { fullSpeechText, textOffsets } = useMemo(() => {
        let text = "";
        let currentOffset = 0;

        const countWords = (str: string) => {
            const words = str.split(/(\s+)/);
            let c = 0;
            for (let w of words) {
                if (!/\s+/.test(w) && w.length > 0) c++;
            }
            return c;
        };

        const offsets = {
            description: 0,
            skills: [] as { name: number, description: number, explanation: number | null }[]
        };

        const descText = selectedAgent.description + " ... ";
        text += descText;
        currentOffset += countWords(descText);

        selectedAgent.skills.forEach((skill) => {
            const sNameText = skill.name + ". ";
            const sNameOffset = currentOffset;
            text += sNameText;
            currentOffset += countWords(sNameText);

            const sDescText = skill.description + " ";
            const sDescOffset = currentOffset;
            text += sDescText;
            currentOffset += countWords(sDescText);

            let sExpOffset = null;
            if ((skill as any).explanation) {
                const sExpText = (skill as any).explanation + " ... ";
                sExpOffset = currentOffset;
                text += sExpText;
                currentOffset += countWords(sExpText);
            }

            offsets.skills.push({
                name: sNameOffset,
                description: sDescOffset,
                explanation: sExpOffset
            });
        });

        return { fullSpeechText: text, textOffsets: offsets };
    }, [selectedAgent]);

    useEffect(() => {
        setActiveSubTab('overview');
        setBossReason("");
        setDeployedData(null);

        if (isDeployed && selectedAgent?.id) {
            fetchDeployedData();
        }
    }, [selectedAgent.id, isDeployed]);

    const fetchDeployedData = async () => {
        if (!selectedAgent?.id) return;
        setIsLoadingDeployed(true);
        try {
            const response = await fetch(`/api/workforce/by-agent/${selectedAgent.id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setDeployedData(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch deployed agent data:', error);
        } finally {
            setIsLoadingDeployed(false);
        }
    };

    // Helper to render text with the currently spoken word highlighted
    const renderHighlightedText = (text: string, startIndexOffset: number) => {
        if (currentWordIndex === -1) {
            return text;
        }

        const words = text.split(/(\s+)/); // Split keeping whitespace
        let actualWordCount = startIndexOffset;

        return words.map((word, index) => {
            if (/\s+/.test(word)) {
                // Return whitespace as is
                return <span key={index}>{word}</span>;
            }

            const isCurrent = actualWordCount === currentWordIndex;
            actualWordCount++;

            return (
                <span key={index} className="relative inline-block">
                    {isCurrent && (
                        <motion.span
                            layoutId="word-highlight"
                            className={`absolute inset-0 bg-${accentColorClass}-500/20 rounded-[2px] shadow-[0_0_10px_rgba(16,185,129,0.2)] dark:shadow-[0_0_10px_rgba(16,185,129,0.2)] z-0`}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 20,
                                mass: 0.8
                            }}
                        />
                    )}
                    <span
                        className={`relative z-10 transition-colors duration-200 ${isCurrent ? `text-${accentColorClass}-400 font-bold` : ''}`}
                    >
                        {word}
                    </span>
                </span>
            );
        });
    };

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={selectedAgent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="p-8 md:p-12 max-w-5xl mx-auto space-y-8 pb-32"
            >
                {/* Detail Header - EXACT MATCH TO REFERENCE */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-4">
                    <div className="flex items-center gap-8">
                        {/* Profile Image */}
                        <div className="w-32 h-32 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 shadow-xl dark:shadow-2xl overflow-hidden shrink-0 relative">
                            <img
                                src={selectedAgent.profile_pic || `https://api.dicebear.com/7.x/notionists/svg?seed=${selectedAgent.name}&backgroundColor=000000,1a1a1a`}
                                alt={selectedAgent.name}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Name, Role & Audio Player Stack */}
                        <div className="flex flex-col gap-2">
                            <div>
                                <h2 className="text-5xl font-black tracking-tight uppercase text-neutral-900 dark:text-white leading-none">
                                    {selectedAgent.name}
                                </h2>
                                <p className="text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-widest text-[10px] mt-2 flex items-center gap-2">
                                    <Briefcase className="w-3 h-3" />
                                    {selectedAgent.role}
                                </p>
                            </div>

                            <div className="pt-2">
                                <NeuralVoicePlayer
                                    text={fullSpeechText}
                                    gender={selectedAgent.gender as 'male' | 'female'}
                                    lang={(selectedAgent as any).lang || 'en-US'}
                                    accentColor={accentColorClass}
                                    onWordChange={(index) => setCurrentWordIndex(index)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Deploy Button - FAR RIGHT */}
                    <div className="shrink-0 pt-4 md:pt-0">
                        {!isDeployed ? (
                            <Button
                                onClick={() => setIsHireModalOpen(true)}
                                disabled={isHiring}
                                className="h-14 px-10 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white dark:text-black font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all overflow-hidden relative group border-none"
                            >
                                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                                {isHiring ? (
                                    <div className="flex items-center gap-3">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        DEPLOYING...
                                    </div>
                                ) : (
                                    "Deploy Agent"
                                )}
                            </Button>
                        ) : (
                            <Button
                                disabled
                                className="h-14 px-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20 dark:border-emerald-500/30 font-black uppercase tracking-[0.2em] cursor-default"
                            >
                                Active Duty
                            </Button>
                        )}
                    </div>
                </div>

                {/* Main Content: Bio Card - EXACT MATCH TO CARD STYLE */}
                <section className="bg-white dark:bg-[#0c0c0c] border border-neutral-200 dark:border-white/5 p-8 md:p-10 rounded-[28px] relative overflow-hidden group shadow-md dark:shadow-xl transition-shadow hover:shadow-lg dark:hover:shadow-2xl">
                    <div className="flex items-center gap-3 mb-8 relative z-10">
                        <Brain className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 dark:text-neutral-400">
                            Agent Profile & Capabilities
                        </h3>
                    </div>

                    <div className="relative z-10">
                        <div className="text-neutral-800 dark:text-neutral-400 font-medium text-sm leading-relaxed text-justify whitespace-pre-wrap">
                            {deployedData?.constitution?.identity_core?.role_definition
                                ? renderHighlightedText(deployedData.constitution.identity_core.role_definition, textOffsets.description)
                                : renderHighlightedText(selectedAgent.description, textOffsets.description)}
                        </div>
                    </div>

                    {isHiring && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-8 p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10"
                        >
                            <div className="flex items-center gap-4 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                <Activity className="w-4 h-4 animate-pulse" />
                                Relaying organizational context via neural bridge...
                            </div>
                        </motion.div>
                    )}
                </section>

                {/* Integrated Skill Vectors - VERTICAL STACK MATCHING CARD STYLE */}
                <section className="bg-white dark:bg-[#0c0c0c] border border-neutral-200 dark:border-white/5 p-8 md:p-10 rounded-[28px] shadow-md dark:shadow-xl">
                    <div className="flex items-center gap-3 mb-10">
                        <Zap className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 dark:text-neutral-400">
                            Integrated Skill Vectors
                        </h3>
                    </div>

                    <div className="space-y-6">
                        {selectedAgent.skills.map((skill, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="group relative p-6 rounded-2xl bg-neutral-50 dark:bg-black/40 border border-neutral-200 dark:border-white/[0.03] hover:border-emerald-500/20 transition-all duration-300"
                            >
                                <div className="flex gap-6 items-start">
                                    <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-500/10 transition-colors">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] group-hover:animate-pulse" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-black text-neutral-900 dark:text-neutral-200 mb-2 uppercase tracking-wide group-hover:text-emerald-500 transition-colors">
                                            {renderHighlightedText(skill.name, textOffsets.skills[i].name)}
                                        </h4>
                                        <p className="text-xs font-mono text-neutral-700 dark:text-neutral-400 leading-relaxed truncate md:whitespace-normal">
                                            {deployedData?.constitution?.protocols?.responsibilities?.[i]?.description
                                                ? renderHighlightedText(deployedData.constitution.protocols.responsibilities[i].description, textOffsets.skills[i].description)
                                                : renderHighlightedText(skill.description, textOffsets.skills[i].description)}
                                        </p>

                                        {(deployedData?.constitution?.protocols?.responsibilities?.[i]?.explanation || (skill as any).explanation) && (
                                            <div className="mt-6 p-5 rounded-xl bg-neutral-100/50 dark:bg-black/60 border border-neutral-200 dark:border-white/[0.02] text-[10px] font-mono text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                                <div className="flex items-center gap-2 mb-3 opacity-30">
                                                    <Terminal className="w-3 h-3" />
                                                    <span className="tracking-widest font-black uppercase">LOGIC_NUCLEUS</span>
                                                </div>
                                                {renderHighlightedText(
                                                    deployedData?.constitution?.protocols?.responsibilities?.[i]?.explanation || (skill as any).explanation, 
                                                    textOffsets.skills[i].explanation!
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            </motion.div>

            {/* Hiring Modal - REFINED LIGHT/DARK SUPPORT */}
            <AnimatePresence>
                {isHireModalOpen && (
                    <div className="absolute inset-0 z-[100] flex items-center justify-center p-4   backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
                        >
                            <div className="p-8 md:p-10">
                                <div className="flex items-center justify-between mb-10">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 overflow-hidden relative shadow-lg">
                                            <img src={selectedAgent.profile_pic} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black uppercase tracking-tight text-neutral-900 dark:text-white leading-none mb-1">{selectedAgent.name}</h3>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Initiating Neural Deployment</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsHireModalOpen(false)}
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-all"
                                    >
                                        <Plus className="w-6 h-6 rotate-45" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400">Mission Statement / Objectives</label>
                                        <span className={`text-[10px] font-bold ${bossReason.length > 350 ? 'text-amber-500' : 'text-neutral-400 dark:text-neutral-500'}`}>
                                            {bossReason.length}/800
                                        </span>
                                    </div>
                                    <AutoResizeTextarea
                                        value={bossReason}
                                        onChange={(val) => setBossReason(val.slice(0, 800))}
                                        placeholder="Describe the role in your business... e.g. Sell high-ticket SaaS for Cluaiz in the US market."
                                        className="w-full border border-neutral-200 dark:border-white/5   text-neutral-900 dark:text-neutral-200 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all text-sm min-h-[160px]"
                                    />
                                    <p className="px-1 text-[10px] text-neutral-400 dark:text-neutral-500 font-medium leading-relaxed italic">
                                        * This prompt will calibrate the agent's cognitive engine for your specific business goals.
                                    </p>
                                </div>

                                <div className="mt-10">
                                    <Button
                                        onClick={() => {
                                            setIsHireModalOpen(false);
                                            handleHire(selectedAgent.id, bossReason);
                                        }}
                                        disabled={!bossReason.trim() || isHiring}
                                        className="w-full h-16 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white dark:text-black font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:grayscale transition-all"
                                    >
                                        Establish Neural Bridge & Deploy
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AnimatePresence>
    );
}
