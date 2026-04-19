
"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { useOrg } from "@/context/OrgContext";
import { 
    TrendingUp, 
    Cpu, 
    Brain, 
    RefreshCw, 
    Download, 
    Calendar, 
    ShieldCheck,
    Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// --- MODULAR COMPONENTS ---
import { ActivityInsights } from "./_components/ActivityInsights";

// --- PROFESSIONAL CONFIG ---
const TYPE_CONFIG: Record<string, any> = {
    'COMPUTE': { label: 'Infrastructure', icon: Cpu, color: 'text-neutral-600', bg: 'bg-neutral-100' },
    'LLM': { label: 'AI Models', icon: Brain, color: 'text-indigo-600', bg: 'bg-indigo-50' },
};

interface ActivityLog {
    // Define the structure of your activity log objects here
    // Example:
    // id: string;
    // type: string;
    // message: string;
    // timestamp: string;
    // ...
}

export default function ActivityFeedPage() {
    const { activeOrgId } = useOrg();
    
    // Core State
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [dualStats, setDualStats] = useState<Record<string, number>>({ COMPUTE: 0, LLM: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    
    // Filters
    const [dateRange, setDateRange] = useState("ALL");
    const [customDate, setCustomDate] = useState<string | undefined>();

    const fetchLogs = async () => {
        if (!activeOrgId) return;
        setIsLoading(true);
        try {
            let startDate, endDate;
            const now = new Date();

            if (dateRange === "CUSTOM" && customDate) {
                startDate = new Date(customDate).toISOString();
                endDate = startDate;
            } else if (dateRange === "7D") {
                startDate = new Date(now.setDate(now.getDate() - 7)).toISOString();
            } else if (dateRange === "30D") {
                startDate = new Date(now.setDate(now.getDate() - 30)).toISOString();
            } else if (dateRange === "TODAY") {
                startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
            }

            const response = await api.get('/organizations/activity', {
                params: {
                    page: 1,
                    limit: 100, 
                    startDate,
                    endDate: dateRange === "CUSTOM" ? startDate : undefined
                }
            });

            if (response.data.success) {
                const rawLogs = response.data.logs;
                const rawStats = response.data.stats || {};
                
                setLogs(rawLogs);
                const summarized = { INFRASTRUCTURE: 0, AI_MODEL: 0 };
                Object.entries(rawStats).forEach(([type, val]: [string, any]) => {
                    const isLLM = type === 'AI_MODEL' || type === 'AI_CHAT' || type === 'LLM';
                    if (isLLM) summarized.AI_MODEL += val;
                    else summarized.INFRASTRUCTURE += val;
                });
                setDualStats(summarized);
            }
        } catch (error: any) {
            console.error("❌ Failed to fetch monitoring data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [dateRange, customDate, activeOrgId]);

    const handleExport = async () => {
        const card1 = document.getElementById('activity-card-1');
        const card2 = document.getElementById('activity-card-2');
        
        if (!card1 || !card2) return;

        try {
            setIsExporting(true);
            
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });
            const pdfWidth = pdf.internal.pageSize.getWidth();

            // First Page (Top Card)
            const canvas1 = await html2canvas(card1, { 
                scale: 2, 
                useCORS: true,
                backgroundColor: null
            } as any);
            const imgData1 = canvas1.toDataURL('image/png');
            const pdfHeight1 = (canvas1.height * pdfWidth) / canvas1.width;
            pdf.addImage(imgData1, 'PNG', 0, 0, pdfWidth, pdfHeight1);

            // Second Page (Bottom Card)
            pdf.addPage();
            const canvas2 = await html2canvas(card2, { 
                scale: 2, 
                useCORS: true,
                backgroundColor: null
            } as any);
            const imgData2 = canvas2.toDataURL('image/png');
            const pdfHeight2 = (canvas2.height * pdfWidth) / canvas2.width;
            pdf.addImage(imgData2, 'PNG', 0, 0, pdfWidth, pdfHeight2);

            pdf.save(`activity_report_${dateRange}.pdf`);
        } catch (error) {
            console.error('Failed to export PDF:', error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="min-h-screen pb-20 bg-neutral-50 dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-100">
            {/* 💎 MINIMAL PROFESSIONAL HEADER */}
            <div className="border-b border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-black/20 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center">
                            <Activity className="h-5 w-5 text-white dark:text-black" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Audit Infrastructure</h1>
                            <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck className="h-3 w-3" /> Real-time resource monitoring
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center bg-neutral-100 dark:bg-neutral-900 p-1 rounded-lg border border-neutral-200 dark:border-neutral-800">
                             <Select value={dateRange} onValueChange={(val) => { setDateRange(val); if (val !== 'CUSTOM') setCustomDate(undefined); }}>
                                <SelectTrigger className="w-[160px] h-8 border-none bg-transparent font-semibold text-[11px] focus:ring-0">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-3.5 w-3.5 text-neutral-500" />
                                        <SelectValue placeholder="Period" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-lg">
                                    <SelectItem value="ALL" className="text-[11px]">All-Time</SelectItem>
                                    <SelectItem value="TODAY" className="text-[11px]">Last 24h</SelectItem>
                                    <SelectItem value="7D" className="text-[11px]">Last 7 Days</SelectItem>
                                    <SelectItem value="30D" className="text-[11px]">Last 30 Days</SelectItem>
                                    <SelectItem value="CUSTOM" className="text-[11px]">Custom Date</SelectItem>
                                </SelectContent>
                            </Select>

                            {dateRange === 'CUSTOM' && (
                                <Input
                                    type="date"
                                    className="h-8 border-none bg-transparent font-medium px-2 w-[130px] focus-visible:ring-0 text-[11px]"
                                    value={customDate || ''}
                                    onChange={(e) => setCustomDate(e.target.value)}
                                />
                            )}
                        </div>

                        <Button onClick={fetchLogs} variant="outline" size="icon" className="h-9 w-9 rounded-lg border-neutral-200 dark:border-neutral-800">
                            <RefreshCw className={cn("h-4 w-4 text-neutral-500", isLoading && "animate-spin")} />
                        </Button>
                        <Button 
                            onClick={handleExport} 
                            disabled={isExporting}
                            variant="outline" 
                            size="sm" 
                            className="h-9 px-4 rounded-lg bg-black text-white dark:bg-white dark:text-black hover:opacity-80 font-semibold text-xs tracking-wide disabled:opacity-50"
                        >
                            {isExporting ? <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-2" />}
                            {isExporting ? 'Exporting...' : 'Export PDF'}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 pt-10 space-y-10">
                <ActivityInsights 
                    logs={logs} 
                    stats={dualStats} 
                    TYPE_CONFIG={TYPE_CONFIG} 
                />
            </div>
        </div>
    );
}
