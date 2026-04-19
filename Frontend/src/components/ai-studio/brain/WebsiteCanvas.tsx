"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Globe,
    Loader2,
    Search,
    CheckCircle2,
    Clock,
    ArrowRight,
    Trash2,
    Layers,
    ChevronRight,
    SearchCode,
    Network
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/lib/api";
import { toast } from "sonner";

interface WebsiteCanvasProps {
    url: string;
    onUrlChange: (url: string) => void;
    discoveredUrls: string[];
    onDiscoveredUrlsChange: (urls: string[]) => void;
    selectedUrls: string[];
    onSelectedUrlsChange: (urls: string[]) => void;
    crawlFrequency: string;
    onCrawlFrequencyChange: (freq: string) => void;
    isDiscovering: boolean;
    setIsDiscovering: (val: boolean) => void;
    onDiscoveryData?: (data: { description?: string; title?: string }) => void;
}

export function WebsiteCanvas({
    url,
    onUrlChange,
    discoveredUrls,
    onDiscoveredUrlsChange,
    selectedUrls,
    onSelectedUrlsChange,
    crawlFrequency,
    onCrawlFrequencyChange,
    isDiscovering,
    setIsDiscovering,
    onDiscoveryData
}: WebsiteCanvasProps) {

    // Ensure crawlFrequency is "never" (Manual) by default if not set
    React.useEffect(() => {
        if (!crawlFrequency) {
            onCrawlFrequencyChange("never");
        }
    }, [crawlFrequency, onCrawlFrequencyChange]);

    const handleDiscover = async () => {
        if (!url) return;
        setIsDiscovering(true);
        try {
            const res = await api.post('/knowledge/discover', { url });
            if (res.data.success) {
                const urls = res.data.urls || [];
                onDiscoveredUrlsChange(urls);
                onSelectedUrlsChange(urls); // Select all by default as requested
                if (onDiscoveryData) {
                    onDiscoveryData({
                        description: res.data.data?.description,
                        title: res.data.data?.title
                    });
                }
                toast.success(`Explored site: Found ${urls.length} pages`);
            }
        } catch (error) {
            toast.error("Discovery failed. Please continue manually.");
        } finally {
            setIsDiscovering(false);
        }
    };

    const toggleUrl = (targetUrl: string) => {
        if (selectedUrls.includes(targetUrl)) {
            onSelectedUrlsChange(selectedUrls.filter(u => u !== targetUrl));
        } else {
            onSelectedUrlsChange([...selectedUrls, targetUrl]);
        }
    };

    const toggleAll = () => {
        if (selectedUrls.length === discoveredUrls.length) {
            onSelectedUrlsChange([]);
        } else {
            onSelectedUrlsChange([...discoveredUrls]);
        }
    };

    const getUrlCategory = (targetUrl: string) => {
        if (targetUrl.endsWith('.xml')) return { label: "XML", color: "text-orange-500 bg-orange-500/10" };
        if (targetUrl.includes('sitemap')) return { label: "Sitemap", color: "text-purple-500 bg-purple-500/10" };
        if (targetUrl.split('/').length > 4) return { label: "Page", color: "text-blue-500 bg-blue-500/10" };
        return { label: "Link", color: "text-emerald-500 bg-emerald-500/10" };
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-12 py-10">
            {/* 🌐 Premium URL Input Section */}
            <div className="text-center space-y-6">
                <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                    <Globe className="w-3.5 h-3.5" />
                    Website Crawler
                </div>
                <h2 className="text-5xl font-black text-neutral-900 dark:text-white tracking-tight">
                    Index any <span className="text-blue-600">Website.</span>
                </h2>
                <p className="text-neutral-500 max-w-xl mx-auto text-sm leading-relaxed">
                    Enter a domain or specific URL to crawl. Cluiaz will automatically extract and index knowledge for your AI brain.
                </p>

                <div className="relative max-w-3xl mx-auto mt-12 group px-4">
                    <div className="absolute inset-0 bg-blue-500/20 blur-[80px] opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />
                    <div className="relative flex items-center gap-2 p-2 rounded-2xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-2 border-neutral-200 dark:border-neutral-800 shadow-2xl group-focus-within:border-blue-500 group-focus-within:ring-4 group-focus-within:ring-blue-500/10 transition-all duration-500">
                        <div className="pl-4">
                            <SearchCode className="w-6 h-6 text-neutral-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                            value={url}
                            onChange={(e) => onUrlChange(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleDiscover()}
                            placeholder="https://docs.cluaiz.com"
                            className="flex-1 bg-transparent border-none shadow-none focus:ring-0 text-xl font-bold text-neutral-900 dark:text-white placeholder:text-neutral-300 outline-none px-2"
                        />
                        <Button
                            onClick={handleDiscover}
                            disabled={isDiscovering || !url}
                            className="rounded-xl px-8 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black transition-all active:scale-95 shadow-xl shadow-blue-500/30 flex items-center gap-3 border-none"
                        >
                            {isDiscovering ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Explore Site
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* ⚙️ Crawl Settings & Stats Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
                <div className="relative group overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8 space-y-5 transition-all hover:shadow-xl hover:-translate-y-1">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Clock className="w-20 h-20 -rotate-12" />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                            <Clock className="w-5 h-5 text-orange-500" />
                        </div>
                        <h4 className="font-black text-xs uppercase tracking-wider text-neutral-500">Crawl Frequency</h4>
                    </div>
                    <Select value={crawlFrequency} onValueChange={onCrawlFrequencyChange}>
                        <SelectTrigger className="w-full bg-neutral-100 dark:bg-neutral-800/50 border-none h-12 rounded-xl text-sm font-bold shadow-inner">
                            <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent className="border-neutral-200 dark:border-neutral-800 rounded-xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl">
                            <SelectItem value="never" className="font-bold">Manual (Recommended)</SelectItem>
                            <SelectItem value="weekly" className="font-bold">Weekly Update</SelectItem>
                            <SelectItem value="monthly" className="font-bold">Monthly Update</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-[10px] text-neutral-400 font-medium leading-relaxed italic">Recurring crawls help keep your AI brain context up to date automatically.</p>
                </div>

                <div className="relative group overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8 space-y-6 transition-all hover:shadow-xl hover:-translate-y-1">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Layers className="w-20 h-20 rotate-12" />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                            <Layers className="w-5 h-5 text-blue-500" />
                        </div>
                        <h4 className="font-black text-xs uppercase tracking-wider text-neutral-500">Pages Found</h4>
                    </div>
                    <div className="flex items-end justify-between">
                        <span className="text-5xl font-black tracking-tighter text-neutral-900 dark:text-white">{discoveredUrls.length}</span>
                        <div className="flex flex-col items-end">
                            <Badge variant="secondary" className="bg-blue-500/5 text-blue-500 border-none text-[9px] font-black uppercase">Active Scan</Badge>
                            <span className="text-[9px] uppercase font-bold text-neutral-400 mt-1">Auto-detected</span>
                        </div>
                    </div>
                </div>

                <div className="relative group overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8 space-y-6 transition-all hover:shadow-xl hover:-translate-y-1 border-emerald-500/10">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <CheckCircle2 className="w-20 h-20 -rotate-6" />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </div>
                        <h4 className="font-black text-xs uppercase tracking-wider text-neutral-500">Selected</h4>
                    </div>
                    <div className="flex items-end justify-between">
                        <span className="text-5xl font-black tracking-tighter text-emerald-500">{selectedUrls.length}</span>
                        <div className="flex flex-col items-end">
                            <Badge variant="secondary" className="bg-emerald-500/5 text-emerald-500 border-none text-[9px] font-black uppercase">Ready</Badge>
                            <span className="text-[9px] uppercase font-bold text-neutral-400 mt-1">To index</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 📄 Discovered Pages List (Sitemap Style) */}
            <AnimatePresence>
                {discoveredUrls.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-6 px-4"
                    >
                        <div className="flex items-center justify-between p-6 rounded-2xl bg-neutral-100/50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 backdrop-blur-sm">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={toggleAll}
                                    className={cn(
                                        "h-9 px-4 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2",
                                        selectedUrls.length === discoveredUrls.length
                                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/20"
                                            : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                                    )}
                                >
                                    {selectedUrls.length === discoveredUrls.length ? "Unselect All" : "Select All Pages"}
                                    {selectedUrls.length === discoveredUrls.length && <CheckCircle2 className="w-3.5 h-3.5" />}
                                </Button>
                                <div className="h-4 w-[1px] bg-neutral-300 dark:bg-neutral-700" />
                                <h3 className="font-black text-neutral-400 uppercase tracking-[0.2em] text-[10px]">Site Structure & Insights</h3>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDiscoveredUrlsChange([])}
                                className="h-9 px-4 rounded-xl text-[10px] font-black uppercase text-neutral-400 hover:text-red-500 hover:bg-red-500/5 transition-all"
                            >
                                <Trash2 className="w-3.5 h-3.5 mr-2" />
                                Clear Sitemap
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {discoveredUrls.map((discoveredUrl, idx) => {
                                const cat = getUrlCategory(discoveredUrl);
                                const isSelected = selectedUrls.includes(discoveredUrl);
                                return (
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.02 }}
                                        key={discoveredUrl}
                                        onClick={() => toggleUrl(discoveredUrl)}
                                        className={cn(
                                            "group flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden",
                                            isSelected
                                                ? "bg-blue-600/5 border-blue-500/30 ring-1 ring-blue-500/10 shadow-lg shadow-blue-500/5"
                                                : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-blue-500/30 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-5 w-full">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 shadow-sm",
                                                isSelected
                                                    ? "bg-blue-600 text-white scale-110 shadow-blue-500/20"
                                                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700"
                                            )}>
                                                {isSelected ? <CheckCircle2 className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                            </div>
                                            <div className="flex flex-col gap-1 min-w-0 flex-1">
                                                <div className="flex items-center gap-3">
                                                    <Badge className={cn("text-[9px] font-black uppercase tracking-wider h-5 px-2 border-none rounded-md", cat.color)}>
                                                        {cat.label}
                                                    </Badge>
                                                    <span className={cn(
                                                        "text-sm font-bold truncate transition-colors",
                                                        isSelected ? "text-neutral-900 dark:text-white" : "text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300"
                                                    )}>
                                                        {discoveredUrl}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="hidden group-hover:flex items-center gap-4 transition-all pr-4">
                                            <Badge variant="outline" className="text-[10px] font-bold uppercase opacity-60 border-neutral-300 dark:border-neutral-700">
                                                Ready to Save
                                            </Badge>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Empty State */}
            {discoveredUrls.length === 0 && !isDiscovering && (
                <div className="py-32 text-center space-y-8 px-4">
                    <div className="relative inline-block">
                        <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full" />
                        <div className="relative w-32 h-32 rounded-3xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center shadow-2xl">
                            <Network className="w-12 h-12 text-blue-500/40 animate-pulse" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-xl font-black text-neutral-900 dark:text-white">Ready to Map your Knowledge?</h3>
                        <p className="text-sm text-neutral-500 max-w-sm mx-auto font-medium">
                            Enter a URL above and click <span className="text-blue-600 font-bold">Explore Site</span> to automatically discover and map out the entire domain structure.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
