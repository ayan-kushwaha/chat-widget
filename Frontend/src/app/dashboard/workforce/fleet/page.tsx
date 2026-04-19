'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Search,
    Filter,
    ArrowRight,
    ChevronLeft,
    Sparkles,
    Shield,
    Zap,
    Plus,
    BarChart3,
    Activity,
    Target,
    Terminal,
    ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BackgroundBeams } from '@/components/ui/background-beams';
import Link from 'next/link';
import { cn } from '@/lib/utils';

import { agents } from '@/lib/agents-data';
import { DeployedAgentCard } from '@/components/workforce/fleet/DeployedAgentCard';

// Enhanced registry with operational metrics
const FLEET_AGENTS = agents.map(agent => ({
    ...agent,
    status: 'active',
    synchronization: Math.floor(Math.random() * (99 - 85 + 1)) + 85,
    uptime: `${Math.floor(Math.random() * 20) + 1}d ${Math.floor(Math.random() * 24)}h`,
    last_task: agent.skills[0]?.name || "Monitoring neural pathways for optimization...",
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${agent.name}&backgroundColor=000000,1a1a1a`,
    color: agent.department === 'Sales' ? '#10b981' : agent.department === 'Support' ? '#3b82f6' : '#a855f7',
    earnings: `$${(Math.random() * 10000 + 5000).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
}));

export default function FleetOperations() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDept, setSelectedDept] = useState('All'); // Added missing state variable
    const [isFilterOpen, setIsFilterOpen] = useState(false); // Added missing state variable
    const [isMobilizeMode, setIsMobilizeMode] = useState(false);

    const departments = ['All', ...new Set(FLEET_AGENTS.map(a => a.department))]; // Added missing constant

    const availableAgentsCount = useMemo(() => agents.filter(a => a.status !== 'hired').length, []);

    const filteredFleet = useMemo(() => {
        const pool = isMobilizeMode
            ? agents.filter(a => a.status !== 'hired').map(a => ({
                ...a,
                status: 'available',
                synchronization: 0,
                uptime: '0d 0h',
                last_task: 'Ready for Deployment',
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${a.name}&backgroundColor=000000,1a1a1a`,
                color: a.department === 'Sales' ? '#10b981' : a.department === 'Support' ? '#3b82f6' : '#a855f7',
                earnings: '$0.00'
            }))
            : FLEET_AGENTS;

        return pool.filter(agent =>
            (selectedDept === 'All' || agent.department === selectedDept) &&
            (agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                agent.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                agent.id.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [searchQuery, selectedDept, isMobilizeMode]);

    return (
        <div className="relative w-full bg-black text-white min-h-screen overflow-x-hidden">
            <BackgroundBeams className="opacity-20" />

            <div className="relative z-10 max-w-7xl mx-auto p-6 md:p-10 space-y-12 pb-32">
                {/* 🧭 Navigation & Stats Header */}
                <div className="flex flex-col space-y-8">
                    <div className="flex items-center justify-between">
                        <Link href="/dashboard/workforce"
                            className="group flex items-center gap-3 px-4 py-2 bg-gray-900/40 border border-gray-800/50 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all">
                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Return to Command
                        </Link>

                        <div className="flex items-center gap-6">
                            <div className="hidden md:flex flex-col items-end">
                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Fleet ROI</span>
                                <span className="text-purple-400 font-black text-sm italic">$124.8K Total Generated</span>
                            </div>
                            <div className="w-px h-8 bg-gray-800" />
                            <Button
                                onClick={() => setIsMobilizeMode(!isMobilizeMode)}
                                className={cn(
                                    "font-black text-[10px] uppercase tracking-widest px-6 h-12 rounded-xl group gap-3 transition-all",
                                    isMobilizeMode
                                        ? "bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:bg-purple-400"
                                        : "bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:bg-emerald-400 shadow-emerald-500/30"
                                )}
                            >
                                {isMobilizeMode ? <Plus className="w-4 h-4 rotate-45" /> : <Plus className="w-4 h-4" />}
                                {isMobilizeMode ? 'Abort Mobilization' : `Mobilize Units (${availableAgentsCount})`}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-7xl font-black italic uppercase tracking-tighter bg-gradient-to-r from-white via-neutral-300 to-neutral-600 bg-clip-text text-transparent">
                            Fleet Operations
                        </h1>
                        <p className="text-gray-500 text-[11px] font-bold uppercase tracking-[0.4em] max-w-2xl">
                            Strategic Deployment Monitoring & Real-time Neural Oversight
                        </p>
                    </div>
                </div>

                {/* 📊 High-Latency Metrics Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Active Manifest', val: '20', icon: Users, col: 'text-white' },
                        { label: 'Intelligence Sync', val: '98.4%', icon: Activity, col: 'text-emerald-400' },
                        { label: 'Neural Stability', val: '92%', icon: Target, col: 'text-blue-400' },
                        { label: 'Operational Uptime', val: '100%', icon: Sparkles, col: 'text-purple-400' },
                    ].map(s => (
                        <div key={s.label} className="bg-gray-900/30 border border-gray-800/50 p-6 rounded-[20px] flex items-center justify-between group hover:border-emerald-500/20 transition-all">
                            <div className="space-y-1">
                                <p className={`text-4xl font-black italic tracking-tighter ${s.col}`}>{s.val}</p>
                                <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">{s.label}</p>
                            </div>
                            <s.icon className="w-8 h-8 text-gray-800/50 group-hover:text-emerald-500/20 transition-colors" />
                        </div>
                    ))}
                </div>

                <div className="relative w-full group z-20">
                    <div className="absolute inset-0 bg-emerald-500/5 rounded-[20px] blur-2xl group-hover:bg-emerald-500/10 transition-all duration-700" />
                    <div className="relative h-16 flex items-center gap-4 px-6 bg-gray-900/10 backdrop-blur-3xl border border-gray-800/40 rounded-[20px] group-focus-within:border-emerald-500/30 transition-all">
                        {/* Protocol Badge */}
                        <div className="flex items-center gap-2 px-3 h-10 bg-emerald-500/11 border border-emerald-500/20 rounded-xl flex-shrink-0">
                            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">CMD</span>
                        </div>

                        {/* Separator */}
                        <div className="w-px h-6 bg-gray-800/50 flex-shrink-0" />

                        {/* Search Icon */}
                        <Search className="w-5 h-5 text-gray-500 group-focus-within:text-emerald-500 transition-colors flex-shrink-0" />

                        {/* Flex-grow Input Container */}
                        <div className="flex-1 h-full flex items-center">
                            <input
                                placeholder="ACCESS_PROTOCOLS: Locate specific elite unit by ID, Name, or Specialty..."
                                className="w-full bg-transparent border-none outline-none focus:ring-0 text-lg font-bold placeholder:text-gray-700 p-0 text-white"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Integrated Filter Dropdown Container */}
                        <div className="relative flex-shrink-0">
                            <Button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={cn(
                                    "h-10 px-6 rounded-xl border border-gray-800 bg-black text-gray-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all flex items-center gap-3 font-black uppercase text-[10px] tracking-widest shadow-2xl",
                                    isFilterOpen && "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                                )}
                            >
                                <Filter className="w-4 h-4" />
                                {selectedDept}
                                <ChevronDown className={cn("w-4 h-4 transition-transform duration-500", isFilterOpen && "rotate-180")} />
                            </Button>

                            <AnimatePresence>
                                {isFilterOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setIsFilterOpen(false)}
                                        />
                                        <motion.div
                                            initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 15, scale: 0.95 }}
                                            className="absolute right-0 top-full mt-4 w-72 bg-black/95 backdrop-blur-3xl border border-white/10 rounded-[20px] p-2 shadow-[0_0_50px_rgba(0,0,0,0.5)] z-[100] overflow-hidden select-none"
                                        >
                                            <div className="p-4 border-b border-white/5 mb-2">
                                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                                    <Shield className="w-3 h-3" />
                                                    Sector Selection
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 gap-1 max-h-[320px] overflow-y-auto no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                                <style dangerouslySetInnerHTML={{ __html: '.no-scrollbar::-webkit-scrollbar { display: none; }' }} />
                                                {departments.map((dept) => (
                                                    <button
                                                        key={dept}
                                                        onClick={() => {
                                                            setSelectedDept(dept);
                                                            setIsFilterOpen(false);
                                                        }}
                                                        className={cn(
                                                            "w-full px-5 py-4 rounded-xl text-left text-[11px] font-black tracking-widest transition-all flex items-center justify-between group/item uppercase",
                                                            selectedDept === dept
                                                                ? "bg-emerald-500 text-black shadow-lg"
                                                                : "text-gray-400 hover:bg-white/5 hover:text-white"
                                                        )}
                                                    >
                                                        {dept}
                                                        {selectedDept === dept && <Activity className="w-4 h-4 animate-pulse" />}
                                                        {selectedDept !== dept && <div className="w-2 h-2 rounded-full bg-gray-900 group-hover/item:bg-emerald-500/50" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* 🚢 Elite Manifest Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16">
                    <AnimatePresence mode="popLayout">
                        {filteredFleet.length > 0 ? (
                            filteredFleet.map((agent, i) => (
                                <motion.div
                                    key={agent.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.5, delay: i * 0.05 }}
                                >
                                    <DeployedAgentCard
                                        agent={agent}
                                        variant={isMobilizeMode ? 'market' : 'deployed'}
                                    />
                                </motion.div>
                            ))
                        ) : (
                            <div className="col-span-full py-40 text-center space-y-6">
                                <div className="w-24 h-24 rounded-full bg-gray-900 inline-flex items-center justify-center border border-gray-800">
                                    <BarChart3 className="w-10 h-10 text-gray-700" />
                                </div>
                                <h2 className="text-2xl font-black italic uppercase tracking-widest text-gray-500">Manifest Zero</h2>
                                <p className="text-gray-700 text-sm font-bold uppercase tracking-widest">No deployed units matching these parameters found in sector.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 🔚 Footer Descriptor */}
                <div className="pt-24 border-t border-gray-900 text-center">
                    <p className="text-[10px] font-black text-gray-800 tracking-[0.6em] uppercase">
                        End of Active Sector Manifest — All Units Synced
                    </p>
                </div>
            </div>
        </div>
    );
}
