"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Brain, Clock, Search, ChevronRight, MessageSquare, StickyNote, Filter } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { InboxService } from '@/services/inbox.service';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface NeuralLogsSlideoverProps {
    isOpen: boolean;
    onClose: () => void;
    orgId: string;
}

export const NeuralLogsSlideover: React.FC<NeuralLogsSlideoverProps> = ({ isOpen, onClose, orgId }) => {
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'ai' | 'manual'>('all');

    useEffect(() => {
        if (isOpen && orgId) {
            fetchLogs();
        }
    }, [isOpen, orgId]);

    const fetchLogs = async () => {
        setIsLoading(true);
        const data = await InboxService.getNeuralLogs(orgId);
        setLogs(data);
        setIsLoading(false);
    };

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.title?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'all' ||
            (activeTab === 'ai' && log.source !== 'manual') ||
            (activeTab === 'manual' && log.source === 'manual');
        return matchesSearch && matchesTab;
    });

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60]"
                    />

                    {/* Slideover */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-[#0a0a0b] border-l border-white/5 z-[61] shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 bg-[#0f0f11]">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                        <Sparkles size={20} className="text-purple-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-white tracking-tight">Neural Logs</h2>
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Business Intelligence Stream</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Search & Tabs */}
                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search logs, insights or notes..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-white/[0.03] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-zinc-600"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    {(['all', 'ai', 'manual'] as const).map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={cn(
                                                "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                                                activeTab === tab
                                                    ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20"
                                                    : "bg-white/5 text-zinc-500 hover:text-zinc-300 hover:bg-white/10"
                                            )}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <ScrollArea className="flex-1">
                            <div className="p-6">
                                {isLoading ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="h-24 bg-white/[0.02] rounded-2xl animate-pulse border border-white/5" />
                                        ))}
                                    </div>
                                ) : filteredLogs.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                                        <Brain size={48} className="text-zinc-600 mb-4" />
                                        <h3 className="text-white font-bold mb-1">No Logs Found</h3>
                                        <p className="text-xs text-zinc-500">Add an internal note or let AI generate insights.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {filteredLogs.map((log) => (
                                            <motion.div
                                                layout
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                key={log._id}
                                                className={cn(
                                                    "p-5 rounded-2xl transition-all group relative overflow-hidden",
                                                    log.source === 'manual'
                                                        ? "bg-amber-400/90 text-zinc-900 shadow-xl shadow-amber-500/10 border-none rotate-1"
                                                        : "bg-white/[0.02] border border-white/5 hover:bg-white/[0.04]"
                                                )}
                                            >
                                                {/* Sticky Note Pin Effect */}
                                                {log.source === 'manual' && (
                                                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-2 bg-white/20 rounded-full blur-[1px]" />
                                                )}

                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn(
                                                            "w-7 h-7 rounded-lg flex items-center justify-center",
                                                            log.source === 'manual' ? "bg-white/20 text-zinc-900" : "bg-purple-500/10 text-purple-400"
                                                        )}>
                                                            {log.source === 'manual' ? <StickyNote size={14} /> : <Brain size={14} />}
                                                        </div>
                                                        <span className={cn(
                                                            "text-[10px] font-black uppercase tracking-widest",
                                                            log.source === 'manual' ? "text-zinc-800" : "text-zinc-500"
                                                        )}>
                                                            {log.source === 'manual' ? 'Internal Note' : 'Neural Insight'}
                                                        </span>
                                                    </div>
                                                    <span className={cn(
                                                        "text-[10px] font-medium flex items-center gap-1",
                                                        log.source === 'manual' ? "text-zinc-700" : "text-zinc-600"
                                                    )}>
                                                        <Clock size={10} />
                                                        {format(new Date(log.createdAt), 'MMM dd, HH:mm')}
                                                    </span>
                                                </div>
                                                <h4 className={cn(
                                                    "text-sm font-bold mb-2 transition-colors",
                                                    log.source === 'manual' ? "text-zinc-900" : "text-white group-hover:text-purple-400"
                                                )}>
                                                    {log.title}
                                                </h4>
                                                <p className={cn(
                                                    "text-xs leading-relaxed",
                                                    log.source === 'manual' ? "text-zinc-800" : "text-zinc-400"
                                                )}>
                                                    {log.content}
                                                </p>
                                                {log.confidence && (
                                                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Confidence: {Math.round(log.confidence * 100)}%</span>
                                                        </div>
                                                        <button className="text-[9px] font-black text-purple-400 uppercase tracking-widest hover:text-white transition-colors">
                                                            Apply Logic
                                                        </button>
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </ScrollArea>

                        {/* Footer Overlay */}
                        <div className="p-4 bg-gradient-to-t from-[#0a0a0b] to-transparent pointer-events-none absolute bottom-0 left-0 right-0 h-20" />
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
