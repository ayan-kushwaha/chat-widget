import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bot, Target, ChevronRight, Plus, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { agents } from '@/lib/agents-data';

interface AIWorkforceSidebarProps {
    activeTab: 'hired' | 'hire_new';
    setActiveTab: (tab: 'hired' | 'hire_new') => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    filteredList: typeof agents;
    selectedAgentId: string | null;
    setSelectedAgentId: (id: string) => void;
    hiredAgentsCount: number;
    unhiredAgentsCount: number;
}

export function AIWorkforceSidebar({
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    filteredList,
    selectedAgentId,
    setSelectedAgentId,
    hiredAgentsCount,
    unhiredAgentsCount,
}: AIWorkforceSidebarProps) {
    return (
        <div className="w-full h-full bg-white dark:bg-[#050505] border-r border-neutral-200 dark:border-[#1a1a1a] relative flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-neutral-200 dark:border-[#1a1a1a] flex flex-col gap-6 shrink-0 bg-white dark:bg-[#0a0a0a]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black italic uppercase tracking-tighter text-neutral-900 dark:text-white">
                                {activeTab === 'hired' ? 'AI Workforces' : 'Deploy Agents'}
                            </h1>
                            <p className="text-[10px] text-neutral-500 dark:text-neutral-500 font-bold uppercase tracking-[0.2em]">Neural Fleet Index</p>
                        </div>
                    </div>

                    {/* Deploy / Back Action */}
                    {activeTab === 'hired' ? (
                        unhiredAgentsCount > 0 && (
                            <button
                                onClick={() => setActiveTab('hire_new')}
                                title="Deploy New Workforce"
                                className="w-10 h-10 rounded-xl bg-white dark:bg-gray-900/50 border border-neutral-200 dark:border-gray-800/30 flex items-center justify-center text-neutral-500 hover:text-emerald-500 hover:bg-emerald-50 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors group"
                            >
                                <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </button>
                        )
                    ) : (
                        <button
                            onClick={() => setActiveTab('hired')}
                            title="Back to Fleet"
                            className="w-10 h-10 rounded-xl bg-white dark:bg-gray-900/50 border border-neutral-200 dark:border-gray-800/30 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:text-gray-400 dark:hover:text-white transition-colors group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </button>
                    )}
                </div>

                {/* Search */}
                <div className="relative h-10 flex items-center gap-3 px-4 bg-white dark:bg-[#111] border border-neutral-200 dark:border-[#222] rounded-xl focus-within:border-emerald-500/50 transition-all shadow-sm dark:shadow-none">
                    <Search className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                    <input
                        placeholder="Locate unit..."
                        className="bg-transparent border-none outline-none text-sm font-bold placeholder:text-neutral-400 dark:placeholder:text-[#333] w-full text-neutral-900 dark:text-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* List Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <AnimatePresence mode="popLayout">
                    {filteredList.map((agent, i) => {
                        const isSelected = selectedAgentId === agent.id;
                        const accentColor = 'emerald';
                        const isSales = agent.department === 'Sales'; // Kept for logic if needed elsewhere
                        const isSupport = agent.department === 'Support';

                        return (
                            <motion.button
                                key={agent.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2, delay: i * 0.05 }}
                                onClick={() => setSelectedAgentId(agent.id)}
                                className={cn(
                                    "w-full text-left p-4 rounded-xl border transition-all duration-300 group flex items-start gap-4 shadow-sm dark:shadow-none",
                                    isSelected
                                        ? `bg-neutral-50 dark:bg-[#1a1a1a] border-${accentColor}-500/30 dark:border-${accentColor}-500/30`
                                        : "bg-white dark:bg-[#0a0a0a] border-neutral-200 dark:border-[#1a1a1a] hover:bg-neutral-50/50 dark:hover:bg-[#111] hover:border-neutral-300 dark:hover:border-[#333]"
                                )}
                            >
                                <div className="w-12 h-12 rounded-lg bg-neutral-50 dark:bg-[#050505] flex-shrink-0 border border-neutral-200 dark:border-[#222] flex items-center justify-center overflow-hidden relative">
                                    <img src={agent.profile_pic || `https://api.dicebear.com/7.x/notionists/svg?seed=${agent.name}&backgroundColor=000000,1a1a1a`} alt={agent.name} className="w-full h-full object-cover" />
                                    {isSelected && (
                                        <div className={`absolute inset-0 ring-2 ring-inset ring-${accentColor}-500 rounded-lg`} />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-sm text-neutral-800 dark:text-gray-200 truncate group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">{agent.name}</h3>
                                    <p className="text-[10px] font-black text-neutral-500 dark:text-gray-500 uppercase tracking-widest mt-1 truncate">{agent.role}</p>

                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={cn(
                                            "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md",
                                            isSelected ? `bg-${accentColor}-50 dark:bg-${accentColor}-500/20 text-${accentColor}-700 dark:text-${accentColor}-400` : "bg-neutral-50 dark:bg-[#161616] text-neutral-600 dark:text-gray-400"
                                        )}>
                                            {agent.department}
                                        </span>
                                        {activeTab === 'hired' && (
                                            <div className="flex items-center gap-1">
                                                <div className={`w-1.5 h-1.5 rounded-full bg-${accentColor}-500 animate-pulse`} />
                                                <span className={`text-[9px] font-bold text-${accentColor}-600 dark:text-${accentColor}-500/70`}>LIVE</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <ChevronRight className={cn(
                                    "w-4 h-4 transition-all opacity-0 group-hover:opacity-100 group-hover:translate-x-1 shrink-0 mt-4",
                                    isSelected ? `text-${accentColor}-500 opacity-100 translate-x-1` : "text-neutral-400 dark:text-gray-600"
                                )} />
                            </motion.button>
                        );
                    })}
                </AnimatePresence>

                {filteredList.length === 0 && (
                    <div className="h-40 flex flex-col items-center justify-center text-gray-500 space-y-3">
                        <Target className="w-8 h-8 opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-widest">No matching units found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
