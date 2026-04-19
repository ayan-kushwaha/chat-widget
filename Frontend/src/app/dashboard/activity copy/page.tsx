"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Activity,
    MessageSquare,
    Globe,
    FileText,
    Brain,
    Database,
    Download,
    Search,
    RefreshCw,
    Filter,
    Calendar,
    Zap,
    TrendingUp,
    Mic,
    Image as ImageIcon
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import api from "@/lib/api";
import { useOrg } from "@/context/OrgContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner"; // Assuming sonner is used for toasts

interface ActivityLog {
    _id: string;
    type: string;
    tokensBurned: number;
    rawAmount: number;
    multiplier: number;
    input_multiplier?: number;
    output_multiplier?: number;
    details: string;
    metadata: any;
    timestamp: string;
}

const TYPE_CONFIG: Record<string, any> = {
    AI_CHAT: { icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-500/10", border: "border-blue-200 dark:border-blue-500/20", label: "Conversation" },
    BRAIN_CRAWL: { icon: Globe, color: "text-cyan-500", bg: "bg-cyan-100 dark:bg-cyan-500/10", border: "border-cyan-200 dark:border-cyan-500/20", label: "Web Knowledge" },
    BRAIN_UPLOAD: { icon: FileText, color: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-500/10", border: "border-orange-200 dark:border-orange-500/20", label: "OCR Training" },
    MANUAL_TRAINING: { icon: Brain, color: "text-purple-500", bg: "bg-purple-100 dark:bg-purple-500/10", border: "border-purple-200 dark:border-purple-500/20", label: "Knowledge Patch" },
    STORAGE_RENT: { icon: Database, color: "text-neutral-500", bg: "bg-neutral-100 dark:bg-neutral-500/10", border: "border-neutral-200 dark:border-neutral-500/20", label: "Storage Rent" },
    IMAGE_GENERATION: { icon: ImageIcon, color: "text-pink-500", bg: "bg-pink-100 dark:bg-pink-500/10", border: "border-pink-200 dark:border-pink-500/20", label: "Creative Gen" },
    VOICE_SYNTHESIS: { icon: Mic, color: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/20", label: "Voice AI" },
};

// ... existing component code ...
export default function ActivityFeedPage() {
    const { activeOrgId } = useOrg();
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [stats, setStats] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [dateRange, setDateRange] = useState("ALL"); // ALL, 7D, 30D, CUSTOM, TODAY
    const [customDate, setCustomDate] = useState<string | undefined>();

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1); // Reset page on search
            fetchLogs();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, typeFilter, dateRange, customDate]); // Added customDate dependency

    const fetchLogs = async (specificDate?: string) => {
        if (!activeOrgId) return;

        setIsLoading(true);
        try {
            console.log('🔍 Fetching activity logs:', { orgId: activeOrgId, page, filters: { searchQuery, typeFilter, dateRange, specificDate: specificDate || customDate } });

            // Calculate Dates based on Range
            let startDate, endDate;
            const now = new Date();

            // Use specific date if provided (from input change) or stored custom date
            const targetCustomDate = specificDate || customDate;

            if (dateRange === "CUSTOM" && targetCustomDate) {
                // Specific Day Logic
                startDate = new Date(targetCustomDate).toISOString();
                endDate = new Date(targetCustomDate).toISOString(); // Backend handles end-of-day expansion if we send same date? 
                // Actually backend logic expands endDate to 23:59:59.999
                // So we send the same date for both start and end, and backend will treat end as end-of-that-day
            } else if (dateRange === "7D") {
                startDate = new Date(now.setDate(now.getDate() - 7)).toISOString();
            } else if (dateRange === "30D") {
                startDate = new Date(now.setDate(now.getDate() - 30)).toISOString();
            } else if (dateRange === "TODAY") {
                startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
            }

            const response = await api.get('/organizations/activity', {
                params: {
                    page,
                    limit: 15,
                    search: searchQuery,
                    type: typeFilter === "ALL" ? undefined : typeFilter,
                    startDate,
                    endDate: dateRange === "CUSTOM" ? startDate : undefined // Send endDate only for custom range logic
                }
            });

            if (response.data.success) {
                setLogs(response.data.logs);
                setStats(response.data.stats || {}); // ✅ Set Stats
                setTotal(response.data.pagination.total);
            }
        } catch (error: any) {
            console.error("❌ Failed to fetch logs:", error);
            // toast.error("Failed to load activity logs");
        } finally {
            setIsLoading(false);
        }
    };

    // Effect for Page Change only (Search handled by debounce effect)
    useEffect(() => {
        if (activeOrgId) fetchLogs();
    }, [page, activeOrgId]);

    const handleExport = () => {
        window.open(`${process.env.NEXT_PUBLIC_API_URL}/v1/organizations/activity/export`, '_blank');
    };

    // Calculate Dashboard Stats (Client-side estimation from current view/api)
    // Note: For real total stats, we'd need a separate API. For now, we can show "Total Events" from pagination.
    const totalEvents = total;
    const itemsPerPage = 15;
    const totalPages = Math.ceil(total / itemsPerPage);

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
                        Activity & Usage <Activity className="h-6 w-6 text-primary" />
                    </h2>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        Track your organization's AI consumption and audit logs.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={() => fetchLogs()} variant="outline" size="sm" className="gap-2 h-9">
                        <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                        Refresh
                    </Button>
                    <Button onClick={handleExport} variant="default" size="sm" className="gap-2 h-9 bg-neutral-900 dark:bg-white dark:text-black hover:bg-neutral-800">
                        <Download className="h-4 w-4" />
                        Export Audit
                    </Button>
                </div>
            </div>

            {/* 📊 Mini Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="group"
                >
                    <Card className="bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-950 border-neutral-200 dark:border-neutral-800 shadow-sm md:col-span-1 h-full relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Activity className="h-24 w-24 text-primary rotate-12" />
                        </div>
                        <CardContent className="p-2 flex flex-col justify-between h-full relative z-10">
                            <div>
                                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Total Burned</p>
                                <h3 className="text-3xl font-bold mt-1 dark:text-white tracking-tight">
                                    {Object.values(stats).reduce((a, b) => a + b, 0).toLocaleString()}
                                </h3>
                                <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                                    <Zap className="h-3 w-3 text-yellow-500 fill-yellow-500" /> Tokens consumed
                                </p>
                            </div>
                            <div className="mt-4">
                                <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: '100%' }}
                                        transition={{ duration: 1, delay: 0.5 }}
                                        className="h-full bg-primary/80"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Consumption Breakdown */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="md:col-span-3"
                >
                    <Card className="bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm border-neutral-200 dark:border-neutral-800 shadow-sm h-full">
                        <CardContent className="p-2">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Usage Breakdown by Service</p>
                                <Badge variant="outline" className="text-[10px] h-5 font-normal bg-white dark:bg-neutral-900">
                                    {dateRange === 'ALL' ? 'All Time' : dateRange === 'CUSTOM' ? 'Custom Range' : dateRange === 'TODAY' ? 'Today' : 'Last ' + dateRange}
                                </Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {Object.entries(TYPE_CONFIG).map(([type, config], index) => {
                                    const amount = stats[type] || 0;
                                    // if (amount === 0) return null; 

                                    return (
                                        <motion.div
                                            key={type}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.2 + (index * 0.05) }}
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200",
                                                amount > 0
                                                    ? "bg-white dark:bg-neutral-800 border-neutral-100 dark:border-neutral-700 shadow-sm hover:shadow-md hover:border-neutral-200 dark:hover:border-neutral-600"
                                                    : "opacity-50 grayscale border-transparent"
                                            )}
                                        >
                                            <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm", config.bg)}>
                                                <config.icon className={cn("h-4 w-4", config.color)} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider truncate">{config.label}</p>
                                                <p className="text-sm font-bold text-neutral-900 dark:text-white">
                                                    {amount.toLocaleString()}
                                                    <span className="text-[10px] text-neutral-400 font-normal ml-0.5">tks</span>
                                                </p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* 🔍 Filter Bar */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.2 }}
            >
                <Card className="border-neutral-200 dark:border-neutral-800 shadow-sm bg-neutral-50/80 dark:bg-neutral-900/80 backdrop-blur">
                    <CardContent className=" flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute z-10 left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                            <Input
                                placeholder="Search logs..."
                                className="pl-9 h-9 bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-1 w-full md:w-auto">
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-full sm:w-[160px] h-9 bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-3.5 w-3.5 text-neutral-500" />
                                        <SelectValue placeholder="All Types" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Activity</SelectItem>
                                    {Object.keys(TYPE_CONFIG).map(type => (
                                        <SelectItem key={type} value={type}>{TYPE_CONFIG[type].label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={dateRange}
                                onValueChange={(val) => {
                                    setDateRange(val);
                                    if (val !== 'CUSTOM') setCustomDate(undefined);
                                }}
                            >
                                <SelectTrigger className="w-full  h-9 bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-3.5 w-3.5 text-neutral-500" />
                                        <SelectValue placeholder="Date" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Time</SelectItem>
                                    <SelectItem value="TODAY">Today</SelectItem>
                                    <SelectItem value="7D">Last 7 Days</SelectItem>
                                    <SelectItem value="30D">Last 30 Days</SelectItem>
                                    <SelectItem value="CUSTOM">Specific Date</SelectItem>
                                </SelectContent>
                            </Select>

                            {dateRange === 'CUSTOM' && (
                                <motion.div
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: 'auto' }}
                                    className="overflow-hidden"
                                >
                                    <Input
                                        type="date"
                                        className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 h-9 text-sm"
                                        value={customDate || ''}
                                        onChange={(e) => {
                                            const date = e.target.value;
                                            setCustomDate(date);
                                            if (date) fetchLogs(date);
                                        }}
                                    />
                                </motion.div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* 📜 Clean List Feed */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden"
            >
                {isLoading && logs.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center gap-3">
                        <RefreshCw className="h-8 w-8 animate-spin text-neutral-400" />
                        <p className="text-neutral-500 text-sm">Syncing feed...</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-16 text-center text-neutral-500">
                        <div className="bg-neutral-100 dark:bg-neutral-800 h-10 w-10 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Activity className="h-5 w-5 text-neutral-400" />
                        </div>
                        <h3 className="text-sm font-medium text-neutral-900 dark:text-white">No activity found</h3>
                        <p className="text-xs mt-1">Adjust filters to see history.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        <div className="bg-neutral-50/50 dark:bg-neutral-900/50 p-2 px-4 text-[10px] font-medium text-neutral-500 uppercase tracking-widest flex items-center">
                            <span className="w-12">Time</span>
                            <span className="flex-1 ml-4">Activity Detail</span>
                            <span className="w-24 text-right">Usage</span>
                        </div>
                        <AnimatePresence initial={false}>
                            {logs.map((log, i) => {
                                const config = TYPE_CONFIG[log.type] || { icon: Activity, color: "text-neutral-500", bg: "bg-neutral-100", border: 'border-neutral-200', label: log.type };
                                const Icon = config.icon;
                                return (
                                    <motion.div
                                        key={log._id}
                                        initial={{ opacity: 0, x: -5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="group p-2 px-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors flex items-center gap-4 text-sm"
                                    >
                                        {/* Time & Icon */}
                                        <div className="flex items-center gap-3 w-32 shrink-0">
                                            <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center border shrink-0", config.bg, config.border)}>
                                                <Icon className={cn("h-4 w-4", config.color)} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-neutral-900 dark:text-white text-xs">
                                                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: true, hour: 'numeric', minute: '2-digit' })}
                                                </span>
                                                <span className="text-[10px] text-neutral-400">
                                                    {new Date(log.timestamp).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Main Content */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <Badge variant="outline" className={cn("text-[8px] px-1.5 py-0 h-4 font-bold border-0 bg-transparent p-0", config.color)}>
                                                    {config.label}
                                                </Badge>
                                            </div>

                                            {/* 🟢 CUSTOM DETAIL RENDERING */}
                                            {/* 1. AI CHAT - SPLIT BILLING */}
                                            {log.type === "AI_CHAT" && (log.metadata?.input_tokens || log.metadata?.output_tokens) ? (
                                                <div className="flex flex-col text-xs space-y-0.5 mt-0.5">
                                                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 text-neutral-600 dark:text-neutral-400">
                                                        {/* INPUT */}
                                                        <span className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="md:hidden text-orange-500 font-mono font-bold">In:</span>
                                                            <span className="hidden md:inline text-orange-500 font-medium whitespace-nowrap">Chat Cost Input Token:</span>

                                                            <span className="font-mono font-bold text-neutral-900 dark:text-white">{log.metadata.input_tokens || 0}</span>
                                                            <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-500 border border-neutral-200 dark:border-neutral-700 whitespace-nowrap">
                                                                × {log.input_multiplier || 0.3}
                                                                <span className="hidden md:inline ml-1 opacity-70">(burn rate)</span>
                                                            </span>
                                                        </span>

                                                        {/* Separator */}
                                                        <span className="hidden md:block w-px h-3 bg-neutral-300 dark:bg-neutral-600"></span>
                                                        <span className="md:hidden text-neutral-300 dark:text-neutral-700 mx-1">|</span>

                                                        {/* OUTPUT */}
                                                        <span className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="md:hidden text-blue-500 font-mono font-bold">Out:</span>
                                                            <span className="hidden md:inline text-blue-500 font-medium whitespace-nowrap">Out Token:</span>

                                                            <span className="font-mono font-bold text-neutral-900 dark:text-white">{log.metadata.output_tokens || 0}</span>
                                                            <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-500 border border-neutral-200 dark:border-neutral-700 whitespace-nowrap">
                                                                × {log.output_multiplier || 1.0}
                                                                <span className="hidden md:inline ml-1 opacity-70">(burn rate)</span>
                                                            </span>
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                                /* 2. VOICE SYNTHESIS */
                                                : log.type === "VOICE_SYNTHESIS" ? (
                                                    <div className="flex flex-col text-xs space-y-0.5 mt-0.5">
                                                        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 text-neutral-600 dark:text-neutral-400">
                                                            <span className="flex items-center gap-1.5 flex-wrap">
                                                                <span className="md:hidden text-emerald-500 font-mono font-bold">Voice:</span>
                                                                <span className="hidden md:inline text-emerald-500 font-medium whitespace-nowrap">Voice Synthesis Cost:</span>

                                                                <span className="font-mono font-bold text-neutral-900 dark:text-white">{log.rawAmount}</span>
                                                                <span className="md:hidden text-neutral-500">chars</span>
                                                                <span className="hidden md:inline text-neutral-500">Characters</span>

                                                                <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-500 border border-neutral-200 dark:border-neutral-700 whitespace-nowrap">
                                                                    × {log.multiplier}
                                                                    <span className="hidden md:inline ml-1 opacity-70">Rate</span>
                                                                </span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                )
                                                    /* 3. WEB CRAWL (Knowledge) */
                                                    : log.type === "BRAIN_CRAWL" ? (
                                                        <div className="flex flex-col text-xs space-y-0.5 mt-0.5">
                                                            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 text-neutral-600 dark:text-neutral-400">
                                                                <span className="flex items-center gap-1.5 flex-wrap">
                                                                    <span className="md:hidden text-cyan-500 font-mono font-bold">Web:</span>
                                                                    <span className="hidden md:inline text-cyan-500 font-medium whitespace-nowrap">Web Crawl Cost:</span>

                                                                    <span className="font-mono font-bold text-neutral-900 dark:text-white">{log.rawAmount}</span>
                                                                    <span className="md:hidden text-neutral-500">tks</span>
                                                                    <span className="hidden md:inline text-neutral-500">Tokens</span>

                                                                    <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-500 border border-neutral-200 dark:border-neutral-700 whitespace-nowrap">
                                                                        × {log.multiplier}
                                                                        <span className="hidden md:inline ml-1 opacity-70">Rate</span>
                                                                    </span>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )
                                                        /* 4. BRAIN UPLOAD (OCR) */
                                                        : log.type === "BRAIN_UPLOAD" ? (
                                                            <div className="flex flex-col text-xs space-y-0.5 mt-0.5">
                                                                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 text-neutral-600 dark:text-neutral-400">
                                                                    <span className="flex items-center gap-1.5 flex-wrap">
                                                                        <span className="md:hidden text-orange-500 font-mono font-bold">OCR:</span>
                                                                        <span className="hidden md:inline text-orange-500 font-medium whitespace-nowrap">OCR Processing Cost:</span>

                                                                        <span className="font-mono font-bold text-neutral-900 dark:text-white">{log.rawAmount}</span>
                                                                        <span className="md:hidden text-neutral-500">tks</span>
                                                                        <span className="hidden md:inline text-neutral-500">Tokens</span>

                                                                        <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-500 border border-neutral-200 dark:border-neutral-700 whitespace-nowrap">
                                                                            × {log.multiplier}
                                                                            <span className="hidden md:inline ml-1 opacity-70">Rate</span>
                                                                        </span>
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )
                                                            /* DEFAULT FALLBACK */
                                                            : (
                                                                <div className="flex flex-col text-xs space-y-0.5 mt-0.5">
                                                                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 text-neutral-600 dark:text-neutral-400">
                                                                        <span className="hidden md:inline font-medium text-neutral-500">Activity Cost:</span>
                                                                        <p className="text-xs text-neutral-600 dark:text-neutral-300 truncate">
                                                                            {log.details}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            )}

                                            {/* 🟢 RESOURCE BREAKDOWN (Energy Model) */}
                                            {log.metadata?.energy_metrics && (
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 p-1.5 px-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/30 border border-neutral-100 dark:border-neutral-800 w-fit">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="h-4 w-4 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                                            <Zap className="h-2.5 w-2.5 text-yellow-500 fill-yellow-500" />
                                                        </div>
                                                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                                                            Energy BreakDown
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        {log.metadata.energy_metrics.cpu_secs > 0 && (
                                                            <span className="text-[10px] text-neutral-500 font-medium">
                                                                CPU: <span className="text-neutral-900 dark:text-neutral-100 font-bold">{log.metadata.energy_metrics.cpu_secs.toFixed(3)}s</span>
                                                            </span>
                                                        )}
                                                        {log.metadata.energy_metrics.net_mb > 0 && (
                                                            <span className="text-[10px] text-neutral-500 font-medium whitespace-nowrap">
                                                                Network: <span className="text-neutral-900 dark:text-neutral-100 font-bold">{log.metadata.energy_metrics.net_mb.toFixed(2)}MB</span>
                                                            </span>
                                                        )}
                                                        {log.metadata.energy_metrics.task_density !== undefined && (
                                                            <div className="flex items-center gap-1 lg:ml-2">
                                                                <span className="text-[10px] text-neutral-400 font-bold">Density:</span>
                                                                <div className="flex items-center h-2 w-12 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                                                                    <motion.div
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${log.metadata.energy_metrics.task_density * 100}%` }}
                                                                        className="h-full bg-indigo-500"
                                                                    />
                                                                </div>
                                                                <span className="text-[9px] font-black text-indigo-500 tabular-nums">
                                                                    {(log.metadata.energy_metrics.task_density * 10).toFixed(0)}/10
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Cost */}
                                        <div className="shrink-0 text-right w-24">
                                            <div className="text-xs font-bold text-neutral-900 dark:text-white font-mono bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded inline-block">
                                                {log.tokensBurned > 0 ? `-${log.tokensBurned.toLocaleString()}` : '0'}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}

                {/* Pagination Footer */}
                {total > 0 && (
                    <div className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-3 px-6 flex items-center justify-between">
                        <p className="text-xs text-neutral-500">
                            Showing {((page - 1) * 15) + 1}-{Math.min(page * 15, total)} of {total} events
                        </p>
                        <div className="flex gap-2">
                            <Button
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                            >
                                Previous
                            </Button>
                            <Button
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </motion.div >
        </div>
    );
}
