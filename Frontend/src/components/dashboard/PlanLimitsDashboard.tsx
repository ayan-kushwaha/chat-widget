"use client";

import { motion } from "framer-motion";
import {
    Cpu, AlertTriangle, Database, Zap, FileText, Globe, Search,
    CheckCircle, TrendingUp, Server, MoreVertical, Loader2, ArrowRight,
    MessageSquare, FileCode, FileSpreadsheet // Imported
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NumberTicker } from "../ui/number-ticker";
import { Marquee } from "../ui/marquee";

interface ResourceLimit {
    limit: number;
    current: number;
    exceeded: number;
    percentage: number;
}

interface PlanUsageData {
    overall: number;
    websites: ResourceLimit;
    pages: ResourceLimit;
    files: ResourceLimit;
    manual: ResourceLimit;
}

interface BrainStats {
    totalSources: number;
    tokensUsed: number;
    tokenLimit: number;
    lastSynced: string;
    totalConversations: number;
    iq: {
        level: string;
        title: string;
        progress: number;
        capabilities: string[];
    };
    trends: { tag: string; score: number; type: string }[]; // 🔥 Global Trends
}

interface TokensBySource {
    websites: number;
    files: number;
    manual: number;
    api: number;
    total: number;
    knowledgeUnits: number;
}

interface PlanLimitsDashboardProps {
    planUsage: PlanUsageData | null;
    stats: BrainStats | null;
    tokensBySource: TokensBySource;
    apiCount: number;
    fileList?: any[]; // Optional prop for client-side counting
}

export function PlanLimitsDashboard({ planUsage, stats, tokensBySource, apiCount, fileList = [] }: PlanLimitsDashboardProps) {
    if (!planUsage || !stats) return null;

    const totalExceeded =
        planUsage.websites.exceeded +
        planUsage.pages.exceeded +
        planUsage.files.exceeded +
        planUsage.manual.exceeded;

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="w-full max-w-7xl mx-auto relative rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-black/40 backdrop-blur-xl shadow-md dark:shadow-2xl transition-all duration-300"
        >
            {/* Ambient Background Glow (Dark Only) */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none hidden dark:block">
                <div className="absolute top-[-50%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-50%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white shadow-sm border border-gray-100 dark:bg-white/5 dark:border-white/10 dark:shadow-none">
                        <Cpu className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Brain Studio Dashboard
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-muted-foreground flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Active • Synced just now
                        </p>
                    </div>
                </div>

                {totalExceeded > 0 && (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium"
                    >
                        <AlertTriangle className="w-4 h-4" />
                        {totalExceeded} items over limit
                    </motion.div>
                )}
            </div>

            {/* Main Merged Content */}
            <div className="p-4">
                {/* Top Level Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-white/5 rounded-xl p-4 border border-gray-200 dark:border-white/5 flex flex-col justify-between shadow-sm dark:shadow-none">
                        <div className="flex items-center gap-2 text-gray-500 dark:text-muted-foreground mb-2">
                            <Database className="w-4 h-4" />
                            <span className="text-xs uppercase tracking-wider font-semibold">Total Sources</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                            <NumberTicker value={stats.totalSources} />
                        </div>
                        <div className="text-xs text-gray-500 dark:text-muted-foreground mt-1 font-mono">
                            <NumberTicker value={tokensBySource.knowledgeUnits} /> Knowledge Units
                        </div>
                    </div>

                    <div className="bg-white dark:bg-white/5 rounded-xl p-4 border border-gray-200 dark:border-white/5 flex flex-col justify-between shadow-sm dark:shadow-none">
                        <div className="flex items-center gap-2 text-gray-500 dark:text-muted-foreground mb-2">
                            <Zap className="w-4 h-4" />
                            <span className="text-xs uppercase tracking-wider font-semibold">AI Memory (Total Tokens)</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                            <NumberTicker value={stats.tokensUsed} />
                        </div>
                        <div className="text-xs text-gray-500 dark:text-muted-foreground mt-1 font-mono">
                            Capacity of Ai  Knowledge Parameters
                        </div>
                    </div>

                    <div className="bg-white dark:bg-white/5 rounded-xl p-4 border border-gray-200 dark:border-white/5 flex flex-col justify-between shadow-sm dark:shadow-none">
                        <div className="flex items-center gap-2 text-gray-500 dark:text-muted-foreground mb-2">
                            <MessageSquare className="w-4 h-4" />
                            <span className="text-xs uppercase tracking-wider font-semibold">Used in Chats</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                            <NumberTicker value={stats.totalConversations} />
                        </div>
                        <div className="text-xs text-gray-500 dark:text-muted-foreground mt-1 font-mono">
                            Real-time
                        </div>
                    </div>

                    <div className="bg-white dark:bg-white/5 rounded-xl p-4 border border-gray-200 dark:border-white/5 flex flex-col justify-between shadow-sm dark:shadow-none">
                        <div className="flex items-center gap-2 text-gray-500 dark:text-muted-foreground mb-2">
                            <FileText className="w-4 h-4" />
                            <span className="text-xs uppercase tracking-wider font-semibold">Human Knowledge</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                            ~<NumberTicker value={Math.round(stats.tokensUsed / 400)} />
                        </div>
                        <div className="text-xs text-gray-500 dark:text-muted-foreground mt-1 font-mono">
                            Cognitive Density
                        </div>
                    </div>
                </div>

                {/* Detailed Resource Breakdown (Merged Plan Limits + Token Stats) */}
                <div className="space-y-6">
                    <h3 className="text-sm font-semibold text-muted-foreground tracking-wider uppercase mb-4 flex items-center gap-2">
                        <Server className="w-4 h-4" /> Resource Capacity & Distribution
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 ">
                        {/* Websites & Pages Group */}
                        <div className="bg-white dark:bg-white/5 rounded-lg p-4 border border-gray-200 dark:border-white/5 space-y-4 shadow-sm dark:shadow-none">
                            <div className="flex items-center gap-3 mb-2 l">
                                <div className="p-2 rounded-md bg-white/5 text-blue-400">
                                    <Globe className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900 dark:text-white">Websites & Pages</div>
                                    <div className="text-xs text-gray-500 dark:text-muted-foreground font-mono">
                                        <NumberTicker value={tokensBySource.websites} /> tokens
                                    </div>
                                </div>
                            </div>

                            {/* Websites Limit */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-600 dark:text-white/70">Active Websites</span>
                                    <span className={cn("font-mono", planUsage.websites.exceeded > 0 ? "text-red-500 dark:text-red-400" : "text-gray-900 dark:text-white")}>
                                        {planUsage.websites.current} / {planUsage.websites.limit}
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(planUsage.websites.percentage, 100)}%` }}
                                        className="h-full rounded-full bg-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Pages Limit */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-600 dark:text-white/70">Total Pages Capacity</span>
                                    <span className={cn("font-mono", planUsage.pages.exceeded > 0 ? "text-red-500 dark:text-red-400" : "text-gray-900 dark:text-white")}>
                                        {planUsage.pages.current} / {planUsage.pages.limit}
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(planUsage.pages.percentage, 100)}%` }}
                                        className="h-full rounded-full bg-indigo-500"
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground italic">
                                    * Total pages allowed across all connected websites.
                                </p>
                            </div>
                        </div>

                        {/* Files */}
                        <ResourceRow
                            icon={FileText}
                            label="Files"
                            limitData={planUsage.files}
                            tokenCount={tokensBySource.files}
                            color="bg-emerald-500"
                            textColor="text-emerald-600 dark:text-emerald-400"
                            bgColor="bg-emerald-50 dark:bg-white/5"
                        >
                            {/* File Types Breakdown to Fill Space */}
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
                                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Storage Distribution</h4>
                                <div className="flex flex-wrap items-center gap-2">
                                    {(() => {
                                        // Real distribution based on REAL file list passed from parent
                                        const counts = { pdf: 0, docx: 0, txt: 0, csv: 0, json: 0, md: 0 };

                                        // Iterate over the real file list and count extensions
                                        if (fileList && fileList.length > 0) {
                                            fileList.forEach((file: any) => {
                                                const name = (file.name || file.title || "").toLowerCase();

                                                if (name.endsWith('.pdf')) counts.pdf++;
                                                else if (name.endsWith('.docx') || name.endsWith('.doc')) counts.docx++;
                                                else if (name.endsWith('.txt')) counts.txt++;
                                                else if (name.endsWith('.csv')) counts.csv++;
                                                else if (name.endsWith('.json')) counts.json++;
                                                else if (name.endsWith('.md') || name.endsWith('.markdown')) counts.md++;
                                            });
                                        }

                                        return (
                                            <>
                                                {/* PDF */}
                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-50/50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10">
                                                    <FileText className="w-3 h-3 text-red-500" />
                                                    <span className="text-[10px] text-gray-700 dark:text-gray-300 font-medium">PDF</span>
                                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono pl-1">{counts.pdf}</span>
                                                </div>

                                                {/* DOCX */}
                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10">
                                                    <FileText className="w-3 h-3 text-blue-500" />
                                                    <span className="text-[10px] text-gray-700 dark:text-gray-300 font-medium">DOCX</span>
                                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono pl-1">{counts.docx}</span>
                                                </div>

                                                {/* TXT */}
                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50/50 dark:bg-slate-500/5 border border-slate-100 dark:border-slate-500/10">
                                                    <FileText className="w-3 h-3 text-slate-500" />
                                                    <span className="text-[10px] text-gray-700 dark:text-gray-300 font-medium">TXT</span>
                                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono pl-1">{counts.txt}</span>
                                                </div>

                                                {/* CSV */}
                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-orange-50/50 dark:bg-orange-500/5 border border-orange-100 dark:border-orange-500/10">
                                                    <FileSpreadsheet className="w-3 h-3 text-orange-500" />
                                                    <span className="text-[10px] text-gray-700 dark:text-gray-300 font-medium">CSV</span>
                                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono pl-1">{counts.csv}</span>
                                                </div>

                                                {/* JSON */}
                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10">
                                                    <FileCode className="w-3 h-3 text-emerald-500" />
                                                    <span className="text-[10px] text-gray-700 dark:text-gray-300 font-medium">JSON</span>
                                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono pl-1">{counts.json}</span>
                                                </div>

                                                {/* MD */}
                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-50/50 dark:bg-purple-500/5 border border-purple-100 dark:border-purple-500/10">
                                                    <FileCode className="w-3 h-3 text-purple-500" />
                                                    <span className="text-[10px] text-gray-700 dark:text-gray-300 font-medium">MD</span>
                                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono pl-1">{counts.md}</span>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </ResourceRow>

                        {/* Manual Training */}
                        <ResourceRow
                            icon={CheckCircle}
                            label="Manual Training"
                            limitData={planUsage.manual}
                            tokenCount={tokensBySource.manual}
                            color="bg-orange-500"
                            textColor="text-orange-600 dark:text-orange-400"
                            bgColor="bg-orange-50 dark:bg-white/5"
                        />

                        {/* API (New) */}
                        <div className="bg-white dark:bg-white/5 rounded-lg p-4 border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-md bg-purple-50 dark:bg-white/5 text-purple-600 dark:text-purple-400">
                                        <Zap className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-900 dark:text-white">API Connections</div>
                                        <div className="text-xs text-gray-500 dark:text-muted-foreground font-mono">
                                            <NumberTicker value={tokensBySource.api} /> tokens
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-mono font-bold text-gray-900 dark:text-white">
                                        {apiCount} <span className="text-gray-500 dark:text-muted-foreground text-xs font-normal">Active</span>
                                    </div>
                                </div>
                            </div>

                            {/* No limit bar for API currently, just visual or infinite */}
                            <div className="h-2 w-full bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden relative">
                                <div className="absolute inset-0 bg-purple-500/20 striped-bar" />
                                {/* Just a visual indicator that it's active/unlimited */}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Cognitive Stream (Ticker) */}
            <CognitiveStream fileList={fileList} trends={stats.trends || []} />

            {/* Footer Actions */}
            {totalExceeded > 0 && (
                <div className="bg-gray-50 dark:bg-white/5 px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-gray-200 dark:border-white/5">
                    <div className="text-sm text-yellow-600 dark:text-yellow-500/90 flex items-center gap-2">
                        {totalExceeded > 0 && (
                            <>
                                <AlertTriangle className="w-4 h-4" />
                                <span>Action Required: You have exceeded your plan limits.</span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {totalExceeded > 0 && (
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-500/10">
                                Manage Excess
                            </Button>
                        )}
                        <Button
                            variant="default"
                            size="sm"
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 border-0 shadow-lg shadow-purple-500/20 text-white"
                        >
                            Upgrade Plan
                        </Button>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

// Sub-components for cleaner code
function ResourceRow({
    icon: Icon,
    label,
    limitData,
    tokenCount,
    color,
    textColor,
    bgColor = "bg-white/5",
    hideTokens = false,
    children
}: {
    icon: any,
    label: string,
    limitData: ResourceLimit,
    tokenCount: number,
    color: string,
    textColor: string,
    bgColor?: string,
    hideTokens?: boolean,
    children?: React.ReactNode
}) {
    const isExceeded = limitData.exceeded > 0;

    return (
        <div className="bg-white  dark:bg-white/5 rounded-lg p-4 border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none h-full flex flex-col justify-between">
            <div className="flex-1">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-md", bgColor, textColor)}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-semibold text-gray-900 dark:text-white">{label}</div>
                            {!hideTokens && (
                                <div className="text-xs text-gray-500 dark:text-muted-foreground font-mono">
                                    <NumberTicker value={tokenCount} /> tokens
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={cn("text-sm font-mono font-bold", isExceeded ? "text-red-500 dark:text-red-400" : "text-gray-900 dark:text-white")}>
                            {limitData.current} <span className="text-gray-500 dark:text-muted-foreground text-xs font-normal">/ {limitData.limit}</span>
                        </div>
                        {isExceeded && (
                            <div className="text-[10px] text-red-500 bg-red-100 dark:text-red-400 dark:bg-red-500/10 px-1.5 py-0.5 rounded inline-block mt-1">
                                +{limitData.exceeded} Over
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden mt-auto">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(limitData.percentage, 100)}%` }}
                        className={cn(
                            "h-full rounded-full",
                            isExceeded ? "bg-red-500" : color
                        )}
                    />
                </div>

                {/* Render Children (Context Content) */}
                {children}
            </div>
        </div>
    );
}

// Cognitive Stream Component (Ticker)
function CognitiveStream({ fileList = [], trends = [] }: { fileList?: any[]; trends?: { tag: string; score: number; type: string }[] }) {
    // 1. Generate Tags Helpers (Zero-Cost / Client-Side)
    const generateTags = (files: any[]) => {
        const tags: { tag: string; type: 'tech' | 'finance' | 'legal' | 'creative' | 'general' }[] = [];
        const seen = new Set<string>();

        // Heuristics Map
        const keywords = {
            finance: ['invoice', 'bill', 'receipt', 'tax', 'budget', 'finance', 'statement', 'price', 'cost'],
            legal: ['agreement', 'contract', 'nda', 'legal', 'compliance', 'term', 'policy', 'audit'],
            creative: ['logo', 'brand', 'design', 'ui', 'ux', 'sketch', 'art', 'mockup', 'video', 'image'],
            tech: ['api', 'code', 'script', 'react', 'node', 'python', 'config', 'env', 'json', 'xml', 'yml']
        };

        files.forEach(file => {
            // 🔥 REAL BACKEND TAGS (100% Accuracy from Python)
            if (file.tags && Array.isArray(file.tags) && file.tags.length > 0) {
                file.tags.forEach((t: string) => {
                    const tag = t; // Python already Title Cased it
                    if (!seen.has(tag)) {
                        // Category Inference for Color
                        let type: any = 'general';
                        const lower = tag.toLowerCase();
                        if (keywords.finance.some(k => lower.includes(k))) type = 'finance';
                        else if (keywords.legal.some(k => lower.includes(k))) type = 'legal';
                        else if (keywords.creative.some(k => lower.includes(k))) type = 'creative';
                        else if (keywords.tech.some(k => lower.includes(k))) type = 'tech';

                        tags.push({ tag, type });
                        seen.add(tag);
                    }
                });
                return; // Skip heuristics for this file
            }

            const name = (file.name || file.title || "").toLowerCase();

            // Extension Check
            if (name.endsWith('.tsx') || name.endsWith('.ts') || name.endsWith('.js') || name.endsWith('.py')) {
                const tag = "Code Logic";
                if (!seen.has(tag)) { tags.push({ tag, type: 'tech' }); seen.add(tag); }
            }

            // Keyword Check
            let found = false;
            // Short circuit common finance terms
            if (name.includes('invoice') || name.includes('bill')) {
                const tag = "Financial Record";
                if (!seen.has(tag)) { tags.push({ tag, type: 'finance' }); seen.add(tag); found = true; }
            }

            // General Loop for defined keywords
            if (!found) {
                Object.entries(keywords).forEach(([type, words]) => {
                    words.forEach(word => {
                        if (name.includes(word)) {
                            const tag = word.charAt(0).toUpperCase() + word.slice(1); // Capitalize
                            if (!seen.has(tag)) {
                                tags.push({ tag, type: type as any });
                                seen.add(tag);
                            }
                        }
                    });
                });
            }
        });

        // Default Fallbacks (if no tags found or few tags)
        if (tags.length < 5) {
            tags.push({ tag: "Knowledge Base", type: 'general' });
            tags.push({ tag: "Pattern Recognition", type: 'tech' });
            tags.push({ tag: "Data Analysis", type: 'finance' });
            tags.push({ tag: "Semantic Search", type: 'creative' });
            tags.push({ tag: "Neural Link", type: 'tech' });
        }

        return tags;
    };

    // 🔥 SMART WEIGHTING LOGIC: Prioritize Global Trends over Client-Side Tags
    const skills = trends && trends.length > 0
        ? trends.map(t => ({ tag: t.tag, type: t.type as any }))
        : generateTags(fileList);

    return (
        <div className="relative flex w-full flex-col items-center justify-center overflow-hidden bg-gray-50/50 dark:bg-black/40 border-t border-gray-200 dark:border-white/5 py-2 mt-0">
            {/* Background Gradient for Fade Effect */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white dark:from-black/90 via-transparent to-transparent z-10"></div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-white dark:from-black/90 via-transparent to-transparent z-10"></div>

            <Marquee pauseOnHover className="[--duration:30s]">
                {skills.map((skill, idx) => (
                    <div
                        key={`${skill.tag}-${idx}`}
                        className={cn(
                            "mx-2 px-3 py-1 rounded-full border text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md",
                            skill.type === 'tech' && "border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400",
                            skill.type === 'finance' && "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400",
                            skill.type === 'legal' && "border-purple-200 bg-purple-50 text-purple-600 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-400",
                            skill.type === 'creative' && "border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-400",
                            skill.type === 'general' && "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-500/30 dark:bg-gray-500/10 dark:text-gray-400"
                        )}
                    >
                        <span className="opacity-50">#</span> {skill.tag}
                    </div>
                ))}
            </Marquee>
        </div>
    );
}
