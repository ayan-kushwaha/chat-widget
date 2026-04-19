"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    Bot,
    TrendingUp,
    CheckCircle2,
    Package,
    Receipt,
    ClipboardList,
    Sparkles,
    MessageSquare,
    Calculator,
    Video,
    Phone,
    MessageCircle,
    Calendar,
    Zap
} from 'lucide-react';
import { useOrg } from '@/context/OrgContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface MissionControlProps {
    onStartAI: () => void;
    onPostStatus: () => void;
    onFilter: (mode: string) => void;
}

const PulseStat = ({ icon: Icon, label, value, colorClass, onClick, delay = 0 }: { icon: any, label: string, value: string, colorClass: string, onClick?: () => void, delay?: number }) => (
    <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        transition={{ delay }}
        className="flex flex-col gap-2 p-5 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/[0.08] hover:border-white/20 transition-all text-left group"
    >
        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center mb-2 shadow-lg transition-transform duration-500 group-hover:rotate-6", colorClass)}>
            <Icon size={20} className="text-black" />
        </div>
        <div className="text-3xl font-black text-white tracking-tighter group-hover:text-emerald-500 transition-colors">{value}</div>
        <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-zinc-400 transition-colors">
            {label}
        </div>
    </motion.button>
);

const ActionCard = ({ icon: Icon, label, description, onClick, colorClass }: { icon: any, label: string, description: string, onClick: () => void, colorClass: string }) => (
    <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="flex flex-col gap-3 p-6 bg-zinc-900 border border-white/5 rounded-[2rem] text-left hover:border-white/20 hover:bg-white/[0.02] transition-all group"
    >
        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transition-transform duration-500 group-hover:rotate-12", colorClass)}>
            <Icon size={24} className="text-black" />
        </div>
        <div>
            <h4 className="text-base font-bold text-white mb-1 group-hover:text-emerald-500 transition-colors">{label}</h4>
            <p className="text-xs text-zinc-500 font-medium leading-relaxed">{description}</p>
        </div>
    </motion.button>
);

const ToolCard = ({ icon: Icon, label, description, onClick, colorClass }: any) => (
    <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className="flex flex-col items-center justify-center gap-3 p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem] hover:bg-white/[0.08] hover:border-white/20 transition-all group relative overflow-hidden h-40"
    >
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-1 shadow-xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3", colorClass)}>
            <Icon size={24} className="text-black" strokeWidth={2.5} />
        </div>
        <div className="text-center">
            <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-1">{label}</h4>
            <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-tight group-hover:text-zinc-400 transition-colors">{description}</p>
        </div>
    </motion.button>
);

export const MissionControl: React.FC<MissionControlProps> = ({ onStartAI, onPostStatus, onFilter }) => {
    const { activeOrg } = useOrg();
    const [greeting, setGreeting] = useState("Good Morning");

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 12 && hour < 17) setGreeting("Good Afternoon");
        else if (hour >= 17) setGreeting("Good Evening");
        else setGreeting("Good Morning");
    }, []);

    return (
        <ScrollArea className="flex-1 bg-[#121212]">
            <div className="flex flex-col items-center justify-center p-8 min-h-full">
                <div className="max-w-4xl w-full">
                    {/* 1. Hero Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="mb-12"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                Agency Command Center
                            </div>
                            <div className="w-1.5 h-1.5 bg-zinc-800 rounded-full"></div>
                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">v3.0 Stable</span>
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter mb-4">
                            {greeting}, <span className="text-emerald-500">Aryan</span> 👋
                        </h1>
                        <p className="text-sm text-zinc-500 font-medium max-w-md leading-relaxed">
                            Welcome back to Cluaiz Relationship OS. Here's a snapshot of your business pulse for today.
                        </p>
                    </motion.div>

                    {/* 2. Pulse Statistics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        <PulseStat
                            icon={Phone}
                            label="Recent Calls"
                            value="03"
                            colorClass="bg-red-500 shadow-red-500/20"
                            onClick={() => onFilter('Calls')}
                            delay={0.1}
                        />
                        <PulseStat
                            icon={MessageCircle}
                            label="Unread Chats"
                            value="05"
                            colorClass="bg-emerald-500 shadow-emerald-500/20"
                            onClick={() => onFilter('Unread')}
                            delay={0.2}
                        />
                        <PulseStat
                            icon={Calendar}
                            label="Meetings Info"
                            value="02"
                            colorClass="bg-blue-500 shadow-blue-500/20"
                            onClick={() => onFilter('Meetings')}
                            delay={0.3}
                        />
                    </div>

                    {/* 3. Quick Action Grid */}
                    {/* 3. Business Command Center (The User Requested Grid) */}
                    <div className="mb-12">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-[1px] flex-1 bg-white/5"></div>
                            <span className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.4em]">Business Command Center</span>
                            <div className="h-[1px] flex-1 bg-white/5"></div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <ToolCard
                                icon={Users}
                                label="Groups"
                                description="Filter collectives"
                                onClick={() => onFilter('Groups')}
                                colorClass="bg-emerald-500 shadow-emerald-500/20"
                            />
                            <ToolCard
                                icon={Sparkles}
                                label="AI Notes"
                                description="View neural logs"
                                onClick={() => onFilter('AI')}
                                colorClass="bg-purple-500 shadow-purple-500/20"
                            />
                            <ToolCard
                                icon={Phone}
                                label="Calls"
                                description="Voice interactions"
                                onClick={() => onFilter('Calls')}
                                colorClass="bg-blue-500 shadow-blue-500/20"
                            />
                            <ToolCard
                                icon={MessageSquare}
                                label="SMS / Chat"
                                description="Direct signals"
                                onClick={() => onFilter('SMS')}
                                colorClass="bg-sky-500 shadow-sky-500/20"
                            />
                            <ToolCard
                                icon={Video}
                                label="Meetings"
                                description="Video conferences"
                                onClick={() => onFilter('Meetings')}
                                colorClass="bg-orange-500 shadow-orange-500/20"
                            />
                            <ToolCard
                                icon={ClipboardList}
                                label="Forms"
                                description="Data collection"
                                onClick={() => onFilter('Forms')}
                                colorClass="bg-yellow-500 shadow-yellow-500/20"
                            />
                            <ToolCard
                                icon={Package}
                                label="Products"
                                description="Inventory stream"
                                onClick={() => onFilter('Products')}
                                colorClass="bg-pink-500 shadow-pink-500/20"
                            />
                            <ToolCard
                                icon={Receipt}
                                label="Invoices"
                                description="Transaction ledger"
                                onClick={() => onFilter('Invoices')}
                                colorClass="bg-indigo-500 shadow-indigo-500/20"
                            />
                            <ToolCard
                                icon={Bot}
                                label="Discovery"
                                description="Neural exploration"
                                onClick={() => onFilter('Discovery')}
                                colorClass="bg-teal-500 shadow-teal-500/20"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <ActionCard
                            icon={TrendingUp}
                            label="Post Weekly Status"
                            description="Share 7-day offers or updates with your business contacts."
                            onClick={onPostStatus}
                            colorClass="bg-white"
                        />
                        <ActionCard
                            icon={Zap}
                            label="Broadcast Engine"
                            description="Push high-priority announcements to your entire audience."
                            onClick={() => { }}
                            colorClass="bg-zinc-800 text-white"
                        />
                        <ActionCard
                            icon={Bot}
                            label="Talk to Assistant"
                            description="Chat with Cluaiz Intelligence about your business data."
                            onClick={onStartAI}
                            colorClass="bg-emerald-500"
                        />
                    </div>

                    {/* 4. Footer Utility */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4"
                    >
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Database Engine</span>
                                <span className="text-xs font-bold text-zinc-400">Infinity Spine Active</span>
                            </div>
                            <div className="w-px h-8 bg-white/5"></div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Neural Connection</span>
                                <span className="text-xs font-bold text-emerald-500">Latency 0.1ms</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 opacity-50 group hover:opacity-100 transition-all cursor-default">
                            <CheckCircle2 size={12} className="text-emerald-500" />
                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em]">Relationship OS Secure</span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </ScrollArea>
    );
};
