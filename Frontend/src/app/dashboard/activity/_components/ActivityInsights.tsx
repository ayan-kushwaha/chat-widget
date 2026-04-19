
"use client";

import React from "react";
import {
    Cpu,
    PieChart as PieChartIcon,
    Activity as ActivityIcon,
    Brain,
    Gauge,
    Server,
    Zap,
    TrendingUp,
    Clock
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Brush,
    Cell,
    PieChart,
    Pie,
    Legend,
    ComposedChart,
    Bar
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// --- 🎨 MASTER CATEGORY CONFIG (Matching UI Icons) ---
const CATEGORY_CONFIG: Record<string, { color: string, infra: string, ai: string, icon: any }> = {
    'File Synchronization': {
        color: '#22c55e', // Green
        infra: '#15803d',
        ai: '#4ade80',
        icon: Server
    },
    'Web Knowledge Crawling': {
        color: '#3b82f6', // Blue
        infra: '#1d4ed8',
        ai: '#60a5fa',
        icon: ActivityIcon
    },
    'AI Chatbot Conversations': {
        color: '#6366f1', // Indigo
        infra: '#4338ca',
        ai: '#818cf8',
        icon: Brain
    },
    'Manual Logic Training': {
        color: '#9333ea', // Purple
        infra: '#6b21a8',
        ai: '#a855f7',
        icon: Cpu
    },
    'WhatsApp Automations': {
        color: '#10b981', // Emerald
        infra: '#047857',
        ai: '#34d399',
        icon: Zap
    },
    'Voice & Speech Synthesis': {
        color: '#f43f5e', // Rose
        infra: '#be123c',
        ai: '#fb7185',
        icon: TrendingUp
    },
    'General System Processes': {
        color: '#64748b', // Slate
        infra: '#334155',
        ai: '#94a3b8',
        icon: Gauge
    }
};

const getMasterCategory = (desc: string) => {
    const text = (desc || "").toLowerCase();
    if (text.includes('file sync') || text.includes('file upload') || text.includes('for file')) return 'File Synchronization';
    if (text.includes('web crawl') || text.includes('website') || text.includes('for website')) return 'Web Knowledge Crawling';
    if (text.includes('chat') || text.includes('conversation')) return 'AI Chatbot Conversations';
    if (text.includes('manual') || text.includes('training')) return 'Manual Logic Training';
    if (text.includes('whatsapp') || text.includes('twilio')) return 'WhatsApp Automations';
    if (text.includes('voice') || text.includes('speech')) return 'Voice & Speech Synthesis';
    return 'General System Processes';
};

interface ActivityInsightsProps {
    logs: any[];
    stats: any;
    TYPE_CONFIG: any;
}

export function ActivityInsights({ logs, stats, TYPE_CONFIG }: ActivityInsightsProps) {
    // 🏛️ DUAL-BUCKET ANALYTICS MAPPING
    const chartData = React.useMemo(() => {
        if (logs.length === 0) return [];
        const groupedMap = new Map<string, any>();

        // Logs come most-recent first. Reverse to chronologically plot left-to-right.
        const sortedLogs = [...logs].reverse();

        sortedLogs.forEach(log => {
            const isLLM = log.type === 'AI_MODEL' || log.type === 'AI_CHAT' || log.bucket === 'AI_MODEL';
            const burned = log.b || log.tokensBurned || 0;
            const ts = (log.t ? log.t * 1000 : log.timestamp) || Date.now();
            const timeStr = new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const actionText = log.details || log.d || log.action || 'Monitoring Trace';

            // Group purely by time for the AreaChart so multiple actions in the same minute combine their tokens!
            const groupKey = timeStr;

            if (!groupedMap.has(groupKey)) {
                groupedMap.set(groupKey, {
                    time: timeStr,
                    fullTime: new Date(ts).toLocaleString(),
                    computeVal: 0,
                    llmVal: 0,
                    actionsSet: new Set<string>()
                });
            }

            const existing = groupedMap.get(groupKey);
            if (isLLM) {
                existing.llmVal += burned;
            } else {
                existing.computeVal += burned;
            }
            // Add action text, ensuring we only capture unique short names
            const shortAction = actionText.split(':')[0] || actionText;
            existing.actionsSet.add(shortAction);
        });

        // Convert Map to Array and format the action strings
        return Array.from(groupedMap.values())
            .map(d => ({
                ...d,
                action: Array.from(d.actionsSet).join(' & ')
            }))
            .filter(d => d.computeVal > 0 || d.llmVal > 0);
    }, [logs]);

    // 📊 DONUT DATA: Now showing Functional Categories (Where tokens went)
    const serviceData = React.useMemo(() => {
        const catMap: Record<string, number> = {};

        logs.forEach(log => {
            const rawName = log.details || log.d || log.action || 'System Process';
            const masterName = getMasterCategory(rawName);
            const value = log.tokensBurned || log.b || 0;
            catMap[masterName] = (catMap[masterName] || 0) + value;
        });

        return Object.entries(catMap)
            .map(([name, value]) => ({
                name,
                value,
                color: CATEGORY_CONFIG[name]?.color || '#64748b'
            }))
            .filter(d => d.value > 0)
            .sort((a, b) => b.value - a.value);
    }, [logs]);

    // 📊 GRANULAR ACTION BREAKDOWN (Grouped by Master Categories)
    const actionBreakdown = React.useMemo(() => {
        const breakdown: Record<string, { infra: number, ai: number }> = {};
        logs.forEach(log => {
            const rawName = log.details || log.d || log.action || 'System Process';
            const masterName = getMasterCategory(rawName);
            const value = log.tokensBurned || log.b || 0;
            const isLLM = log.type === 'AI_MODEL' || log.type === 'AI_CHAT';

            if (!breakdown[masterName]) breakdown[masterName] = { infra: 0, ai: 0 };

            if (isLLM) breakdown[masterName].ai += value;
            else breakdown[masterName].infra += value;
        });

        return Object.entries(breakdown)
            .map(([name, data]) => ({
                name,
                infra: data.infra,
                ai: data.ai,
                total: data.infra + data.ai
            }))
            .sort((a, b) => b.total - a.total);
    }, [logs]);

    return (
        <div className="space-y-10">
            <div className="flex flex-col gap-12">
                {/* 🛡️ MAIN MONITORING CHART (FULL WIDTH TOP) */}
                <Card id="activity-card-1" className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0a0a0a] shadow-sm overflow-hidden flex flex-col h-[600px]">
                    <CardHeader className="p-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-900/10">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-bold flex items-center gap-3 uppercase tracking-tighter  ">Resource Execution Trace <TrendingUp className="h-4 w-4 text-emerald-500" /></CardTitle>
                                <CardDescription className="text-xs text-neutral-500 font-medium  ">Consolidated infrastructure & model performance pulse</CardDescription>
                            </div>
                            <Badge variant="outline" className="h-6 rounded-full font-bold text-[10px] uppercase px-3 py-0 bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 shadow-sm">
                                <div className="h-1.5 w-1.5 rounded-full bg-rose-500 mr-2 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.5)]" /> Monitoring Live
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className=" flex-1 flex flex-col min-h-0">
                        <div className="flex-1 w-full min-h-0 min-w-0 mt-4 overflow-hidden">
                            <ResponsiveContainer width="99%" height="100%">
                                <AreaChart data={chartData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }} className="focus:outline-none" style={{ outline: 'none' }}>
                                    <defs>
                                        <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="llmGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888815" />
                                    <XAxis
                                        dataKey="time"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#666', fontSize: 10, fontWeight: 500 }}
                                        dy={10}
                                        minTickGap={40}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#666', fontSize: 10, fontWeight: 500 }}
                                        tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
                                        domain={['auto', 'auto']} // FIX: Auto-scale for visibility
                                    />
                                    <Tooltip
                                        isAnimationActive={false}
                                        cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                        wrapperStyle={{ zIndex: 100 }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const d = payload[0].payload;
                                                return (
                                                    <div className="bg-white dark:bg-[#0d0d0d] border border-neutral-200 dark:border-neutral-800 p-5 rounded-xl shadow-2xl min-w-[280px] backdrop-blur-xl">
                                                        <div className="flex items-center justify-between mb-4 border-b border-neutral-100 dark:border-neutral-800 pb-2">
                                                            <p className="text-[10px] font-bold text-neutral-400 font-mono uppercase tracking-widest">{d.fullTime}</p>
                                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                        </div>
                                                        <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 mb-5 leading-tight uppercase  ">{d.action}</p>
                                                        <div className="space-y-3">
                                                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                                                                <span className="flex items-center gap-2.5 text-[10px] font-bold text-rose-500 uppercase tracking-wide"><Cpu className="h-3.5 w-3.5" /> Infrastructure</span>
                                                                <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">{(d.computeVal || 0).toLocaleString()} tokens</span>
                                                            </div>
                                                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                                                <span className="flex items-center gap-2.5 text-[10px] font-bold text-indigo-500 uppercase tracking-wide"><Brain className="h-3.5 w-3.5" /> AI Model Cluster</span>
                                                                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">{(d.llmVal || 0).toLocaleString()} tokens</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Legend
                                        verticalAlign="top"
                                        align="right"
                                        height={40}
                                        iconType="circle"
                                        formatter={(v) => <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 ml-1.5 capitalize tracking-tight">{v}</span>}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="computeVal"
                                        name="Infrastructure"
                                        stroke="#f43f5e"
                                        strokeWidth={2.5}
                                        fillOpacity={1}
                                        fill="url(#compGrad)"
                                        activeDot={{ r: 5, strokeWidth: 0, fill: '#f43f5e' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="llmVal"
                                        name="AI Model"
                                        stroke="#6366f1"
                                        strokeWidth={2.5}
                                        fillOpacity={1}
                                        fill="url(#llmGrad)"
                                        activeDot={{ r: 5, strokeWidth: 0, fill: '#6366f1' }}
                                    />
                                    <Brush
                                        dataKey="time"
                                        height={30}
                                        stroke="#88888830"
                                        fill="transparent"
                                        travellerWidth={10}
                                        gap={1}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* 🛰️ RESOURCE PANEL - FULL WIDTH BOTTOM */}
                <Card id="activity-card-2" className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#060606] shadow-xl rounded-3xl overflow-hidden flex flex-col border-t-8 border-t-rose-500">
                    <CardHeader className=" pb-4 shrink-0">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-xl font-bold flex items-center gap-4 uppercase tracking-tighter  ">Log Cluster Mix <PieChartIcon className="h-5 w-5 text-rose-500" /></CardTitle>
                            <Badge className="bg-black text-white dark:bg-white dark:text-black border-none font-bold text-[10px] px-4 h-7 rounded-full uppercase tracking-widest shadow-md">CONSOLIDATED</Badge>
                        </div>
                        <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-[0.2em] mt-2">Resource share by core engine</p>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {/* LEFT: PIE CHART */}
                        <div className="h-[300px] w-full relative min-w-0 min-h-0 overflow-hidden lg:col-span-1">
                            <ResponsiveContainer width="99%" height="100%">
                                <PieChart className="focus:outline-none" style={{ outline: 'none' }}>
                                    <Pie
                                        data={serviceData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={90}
                                        outerRadius={125}
                                        paddingAngle={10}
                                        dataKey="value"
                                        stroke="none"
                                        cornerRadius={5}
                                    >
                                        {serviceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        isAnimationActive={false}
                                        wrapperStyle={{ zIndex: 100 }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                const color = payload[0].color || '#64748b';
                                                return (
                                                    <div className="bg-white dark:bg-[#0d0d0d] border border-neutral-200 dark:border-neutral-800 px-5 py-4 rounded-xl shadow-2xl backdrop-blur-xl flex items-center gap-4">
                                                        <div className="h-3 w-3 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)]" style={{ backgroundColor: color }} />
                                                        <div>
                                                            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{data.name}</p>
                                                            <p className="text-lg font-black text-neutral-900 dark:text-white mt-1 leading-none">
                                                                {data.value.toLocaleString()}
                                                                <span className="text-[10px] font-bold text-neutral-500 uppercase ml-1 tracking-widest">tokens</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <p className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Total Exhaust</p>
                                <p className="text-4xl font-black text-neutral-900 dark:text-white tabular-nums tracking-tighter  ">{(serviceData.reduce((a, b) => a + b.value, 0) / 1000).toFixed(1)}k</p>
                            </div>
                        </div>

                        {/* RIGHT: DETAILED BREAKDOWN LIST */}
                        <div className="w-full flex flex-col space-y-4 h-[300px] lg:col-span-2">
                            <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Top Exhaust Contributors</h4>
                            <div className="flex-1 w-full min-h-0 min-w-0 overflow-hidden">
                                <ResponsiveContainer width="99%" height="100%">
                                    <ComposedChart data={actionBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} className="focus:outline-none" style={{ outline: 'none' }}>
                                        <defs>
                                            <linearGradient id="areaBg" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#88888820" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#888' }} tickLine={false} axisLine={false} tickFormatter={(val) => val.length > 10 ? val.substring(0, 10) + '...' : val} />
                                        <YAxis tick={{ fontSize: 9, fill: '#888' }} tickLine={false} axisLine={false} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                                        <Tooltip
                                            isAnimationActive={false}
                                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                            wrapperStyle={{ zIndex: 100 }}
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="bg-white dark:bg-[#0d0d0d] border border-neutral-200 dark:border-neutral-800 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-xl min-w-[240px]">
                                                            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3 border-b border-neutral-100 dark:border-neutral-800 pb-2">{data.name.length > 30 ? data.name.substring(0, 30) + '...' : data.name}</p>
                                                            <div className="space-y-2">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest"><Cpu className="h-3 w-3 inline mr-1" /> Infra</span>
                                                                    <span className="text-sm font-black text-neutral-900 dark:text-white tabular-nums">{data.infra.toLocaleString()}</span>
                                                                </div>
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest"><Brain className="h-3 w-3 inline mr-1" /> AI Model</span>
                                                                    <span className="text-sm font-black text-neutral-900 dark:text-white tabular-nums">{data.ai.toLocaleString()}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Area type="monotone" dataKey="total" fill="url(#areaBg)" stroke="#888888" strokeWidth={1} opacity={0.1} />
                                        <Bar dataKey="infra" stackId="a" maxBarSize={40}>
                                            {actionBreakdown.map((entry, index) => (
                                                <Cell key={`cell-infra-${index}`} fill={CATEGORY_CONFIG[entry.name]?.infra || '#334155'} />
                                            ))}
                                        </Bar>
                                        <Bar dataKey="ai" stackId="a" maxBarSize={40} radius={[4, 4, 0, 0]}>
                                            {actionBreakdown.map((entry, index) => (
                                                <Cell key={`cell-ai-${index}`} fill={CATEGORY_CONFIG[entry.name]?.ai || '#94a3b8'} />
                                            ))}
                                        </Bar>
                                        <Brush
                                            dataKey="name"
                                            height={25}
                                            stroke="#88888850"
                                            fill="transparent"
                                            tickFormatter={() => ''}
                                            travellerWidth={10}
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
