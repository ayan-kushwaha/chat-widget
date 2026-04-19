'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    Plus,
    Users,
    Brain,
    Zap,
    ArrowRight,
    TrendingUp,
    Activity,
    Cpu,
    Globe,
    LayoutDashboard,
    ListFilter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BorderBeam } from '@/components/ui/border-beam';
import { BackgroundBeams } from '@/components/ui/background-beams';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar
} from 'recharts';
import { agents } from '@/lib/agents-data';
import { AgentCard } from '@/components/workforce/marketplace/AgentCard';

// Mock Analytics Data
const ANALYTICS_DATA = [
    { name: 'Mon', tasks: 120, performance: 85, load: 40 },
    { name: 'Tue', tasks: 150, performance: 88, load: 45 },
    { name: 'Wed', tasks: 180, performance: 92, load: 50 },
    { name: 'Thu', tasks: 140, performance: 90, load: 42 },
    { name: 'Fri', tasks: 210, performance: 95, load: 55 },
    { name: 'Sat', tasks: 90, performance: 98, load: 30 },
    { name: 'Sun', tasks: 110, performance: 97, load: 35 },
];

const SKILL_DISTRIBUTION = [
    { name: 'Cognitive Reasoning', value: 45, color: '#10b981' },
    { name: 'Logical Execution', value: 30, color: '#3b82f6' },
    { name: 'Creative Synthesis', value: 25, color: '#a855f7' },
];

const RADAR_DATA = [
    { subject: 'Speed', A: 120, fullMark: 150 },
    { subject: 'Accuracy', A: 98, fullMark: 150 },
    { subject: 'Reliability', A: 86, fullMark: 150 },
    { subject: 'Security', A: 99, fullMark: 150 },
    { subject: 'Learning', A: 85, fullMark: 150 },
    { subject: 'Context', A: 65, fullMark: 150 },
];

export default function WorkforceDashboard() {
    return (
        <div className="relative w-full bg-transparent text-white overflow-x-hidden">
            <BackgroundBeams className="opacity-20 pointer-events-none" />
            <div className="relative z-10 max-w-7xl mx-auto p-8 space-y-12 pb-24">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-[10px] font-bold tracking-widest uppercase"
                        >
                            <Activity className="w-3 h-3 animate-pulse" />
                            Neural Intelligence Interface
                        </motion.div>
                        <div className="space-y-2">
                            <h1 className="text-6xl font-black tracking-tight bg-gradient-to-b from-white via-gray-200 to-gray-500 bg-clip-text text-transparent leading-[1.1]">
                                Operations <br />
                                Fleet Command
                            </h1>
                            <p className="text-gray-500 text-lg max-w-2xl font-medium">
                                A bird's-eye view of your global AI workforce. Monitoring 12 specialized neural processes in real-time.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <Link href="/dashboard/workforce/fleet">
                            <Button variant="outline" className="border-gray-800 bg-gray-900/40 hover:bg-gray-800 h-14 px-8 rounded-2xl font-bold flex items-center gap-2 group backdrop-blur-xl">
                                <ListFilter className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                Fleet Operations
                            </Button>
                        </Link>
                        <Link href="/dashboard/workforce/hire">
                            <Button className="bg-white text-black hover:bg-gray-200 h-14 px-10 rounded-2xl font-extrabold flex items-center gap-2 group shadow-[0_0_40px_rgba(255,255,255,0.15)] transition-all active:scale-95">
                                <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                                Deploy New Agent
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Dashboard Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Active Fleet', value: '12/12', icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/5', trend: 'MAXED' },
                        { label: 'Neural Sync', value: '98.2%', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/5', trend: '+1.8%' },
                        { label: 'Task Throughput', value: '14.2k', icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/5', trend: 'Optimum' },
                        { label: 'Brain Uptime', value: '99.9%', icon: Activity, color: 'text-purple-400', bg: 'bg-purple-500/5', trend: 'Stable' },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <Card className={`p-6 border-gray-800/50 flex flex-col justify-between h-32 relative overflow-hidden group bg-gray-900/10`}>
                                <div className="flex justify-between items-start mb-2">
                                    <stat.icon className={`w-6 h-6 ${stat.color} opacity-60 group-hover:opacity-100 transition-opacity`} />
                                    <span className={`text-[10px] font-bold ${stat.color} font-mono tracking-tighter`}>{stat.trend}</span>
                                </div>
                                <div>
                                    <p className="text-3xl font-black">{stat.value}</p>
                                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">{stat.label}</p>
                                </div>
                                <div className={`absolute bottom-0 right-0 w-16 h-16 ${stat.bg} rounded-tl-full blur-2xl opacity-50`} />
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Main Analytical Core */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Primary Efficiency Plot */}
                    <Card className="lg:col-span-2 bg-gray-900/5 backdrop-blur-md border-gray-800 p-8 rounded-[2.5rem] relative overflow-hidden group">
                        <BorderBeam size={400} duration={12} colorFrom="#10b981" colorTo="#3b82f6" />
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-2xl font-bold flex items-center gap-3 italic">
                                    <Cpu className="w-6 h-6 text-emerald-500" />
                                    Neural Performance Loop
                                </h3>
                                <p className="text-sm text-gray-500 font-medium">Real-time telemetry across cognitive nodes.</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Efficiency</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={ANALYTICS_DATA}>
                                    <defs>
                                        <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="10 10" stroke="#1f2937" vertical={false} opacity={0.3} />
                                    <XAxis dataKey="name" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                                    <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #1f2937', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                                        itemStyle={{ fontSize: '10px', color: '#fff', fontWeight: 'bold', textTransform: 'uppercase' }}
                                    />
                                    <Area type="monotone" dataKey="performance" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorArea)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* Skill Distribution (Pie) */}
                    <Card className="bg-gray-900/5 backdrop-blur-md border-gray-800 p-8 rounded-[2.5rem] flex flex-col">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                            <Brain className="w-5 h-5 text-purple-400" />
                            Skill Synthesis
                        </h3>
                        <div className="flex-1 w-full min-h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={SKILL_DISTRIBUTION}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {SKILL_DISTRIBUTION.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '8px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-3 mt-6">
                            {SKILL_DISTRIBUTION.map((s) => (
                                <div key={s.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{s.name}</span>
                                    </div>
                                    <span className="text-xs font-mono font-bold">{s.value}%</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Advanced Intelligence Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Top Performers Leaderboard */}
                    <Card className="bg-gray-900/10 border-gray-800/50 p-8 rounded-[2.5rem] flex flex-col relative overflow-hidden group">
                        <div className="flex justify-between items-center mb-8 relative z-10">
                            <div>
                                <h3 className="text-2xl font-bold flex items-center gap-3 italic text-white/90">
                                    <TrendingUp className="w-6 h-6 text-emerald-500" />
                                    Neural Leaders
                                </h3>
                                <p className="text-sm text-gray-500 font-medium">Top performing units by ROI generation.</p>
                            </div>
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-bold uppercase tracking-widest">Global Ranking</Badge>
                        </div>

                        <div className="space-y-4 relative z-10">
                            {agents.slice(0, 3).map((node, i) => (
                                <div key={i} className="flex items-center gap-6 p-4 rounded-2xl bg-black/40 border border-gray-800/50 group/item hover:border-emerald-500/30 transition-all">
                                    <div className="relative">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${node.name}`} className="w-12 h-12 rounded-xl bg-gray-800 p-0.5 border border-gray-700" alt={node.name} />
                                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center text-[10px] font-black text-black shadow-[0_0_10px_rgba(234,179,8,0.3)]">#{i + 1}</div>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-black uppercase italic text-white/90">{node.name}</h4>
                                        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">{node.role}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-white">${(15000 - (i * 2000)).toLocaleString()}</p>
                                        <div className="flex items-center gap-2 justify-end">
                                            <div className="w-12 h-1 bg-gray-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500" style={{ width: `${98 - (i * 2)}%` }} />
                                            </div>
                                            <span className="text-[10px] font-mono text-emerald-400 font-bold">{98 - (i * 2)}%</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl" />
                    </Card>

                    {/* Revenue/Value Evolution */}
                    <Card className="bg-gray-900/10 border-gray-800/50 p-8 rounded-[2.5rem] flex flex-col group relative overflow-hidden">
                        <h3 className="text-2xl font-bold mb-8 flex items-center gap-3 italic text-white/90">
                            <Zap className="w-6 h-6 text-blue-500" />
                            Economic Impact
                        </h3>
                        <div className="flex-1 w-full min-h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={ANALYTICS_DATA}>
                                    <CartesianGrid strokeDasharray="5 5" stroke="#1f2937" vertical={false} opacity={0.2} />
                                    <XAxis dataKey="name" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                                    <RechartsTooltip
                                        cursor={{ fill: '#ffffff05' }}
                                        contentStyle={{ backgroundColor: '#000', border: '1px solid #1f2937', borderRadius: '12px' }}
                                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                    <Bar dataKey="tasks" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="mt-4 text-[10px] text-gray-500 text-center font-bold tracking-[0.2em] uppercase">Projected growth for next cycle: +18.5%</p>
                    </Card>
                </div>

                {/* Bottom Intelligence Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Radar Analysis */}
                    <Card className="bg-gray-900/10 border-gray-800/50 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8">
                        <div className="w-full md:w-1/2 h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={RADAR_DATA}>
                                    <PolarGrid stroke="#1f2937" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 8 }} />
                                    <Radar name="Fleet" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="w-full md:w-1/2 space-y-4">
                            <h4 className="text-xl font-bold tracking-tight">Neural Resilience</h4>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Overall fleet stability score is <strong>9.1/10</strong>. Accuracy remains high while Context understanding is currently in "Learning Phase".
                            </p>
                            <div className="pt-4 grid grid-cols-2 gap-4">
                                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                    <p className="text-lg font-bold">12ms</p>
                                    <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">Inference Latency</p>
                                </div>
                                <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                                    <p className="text-lg font-bold text-emerald-400">98%</p>
                                    <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">Semantic Accuracy</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Recent Deployments / Activity */}
                    <Card className="bg-gray-900/10 border-gray-800/50 p-8 rounded-[2.5rem] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-3">
                                <Globe className="w-5 h-5 text-emerald-400" />
                                Live Feed
                            </h3>
                            <Badge variant="outline" className="border-emerald-500/20 text-emerald-500 text-[10px] animate-pulse uppercase">Real-time Stream</Badge>
                        </div>
                        <div className="space-y-4 flex-1">
                            {[
                                { msg: `Agent ${agents[0].name} completed neural audit with 98% clarity.`, time: '2m ago', type: 'success' },
                                { msg: `${agents[1].name} deployed to ${agents[1].role} architecture.`, time: '14m ago', type: 'info' },
                                { msg: `Neural handshake established with ${agents[2].name} node.`, time: '1h ago', type: 'system' },
                                { msg: 'New knowledge domain "Enterprise Sales Policy" synced.', time: '2h ago', type: 'success' },
                            ].map((log, i) => (
                                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-black/40 border border-gray-900 hover:border-gray-800 transition-all cursor-default group">
                                    <div className={`mt-1.5 w-1.5 h-1.5 rounded-full ${log.type === 'success' ? 'bg-emerald-500' : log.type === 'info' ? 'bg-blue-500' : 'bg-purple-500 shadow-[0_0_10px_purple]'} shrink-0`} />
                                    <div className="space-y-1">
                                        <p className="text-[13px] text-gray-300 group-hover:text-white font-medium transition-colors">{log.msg}</p>
                                        <span className="text-[10px] text-gray-600 font-mono tracking-tighter">{log.time}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
                {/* The Personnel Manifest (Restored Master List) */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-black italic uppercase bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">Integrated Personnel</h2>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em]">Direct oversight of all 12 active cognitive nodes.</p>
                        </div>
                        <Link href="/dashboard/workforce/fleet">
                            <Button variant="ghost" className="text-emerald-500 hover:text-emerald-400 font-bold text-xs uppercase tracking-widest gap-2">
                                Extended Fleet <ArrowRight className="w-3 h-3" />
                            </Button>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 w-full max-w-full overflow-hidden">
                        {agents.map((agent, index) => (
                            <motion.div
                                key={agent.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.02 }}
                            >
                                <AgentCard agent={agent} />
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Bottom Footer Indicator */}
                <div className="pt-20 pb-10 text-center border-t border-gray-800/30">
                    <p className="text-[10px] font-bold text-gray-700 tracking-[0.5em] uppercase">--- END OF COMMAND INTERFACE ---</p>
                </div>
            </div>
        </div>
    );
}

// Global Custom Scrollbar logic is handled by UI/ScrollArea
