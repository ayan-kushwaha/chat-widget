"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyStateCard } from "@/components/ui/EmptyStateCard";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useOrg } from "@/context/OrgContext";
import { useToast } from "@/components/ui/use-toast";
import {
    getMemories,
    approveMemory,
    rejectMemory,
    deleteMemory,
    mergeMemories,
    LearningMemory,
    updateMemory,
    triggerMissedLearning
} from "@/api/learningMemory.api";
// import { MOCK_INSIGHTS } from "@/data/mockNeuralData"; // Removed Mocks
import {
    Loader2, Check, ChevronDown, Trash2, Zap, BrainCircuit, Calendar, Pencil, Clock, Sparkles, Search, Filter, MoreVertical, Edit, TrendingUp, ShieldAlert, Archive, SlidersHorizontal, Infinity as InfinityIcon, Scale, Book,
    X,
    AlertTriangle,
    Database,
    Layers,
    RefreshCw
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

const timeAgo = (dateStr: string) => {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
};

const getBadgeColor = (type: string) => {
    switch (type) {
        case 'pattern': return 'bg-purple-600 hover:bg-purple-600';
        case 'rule': return 'bg-amber-600 hover:bg-amber-600';
        case 'fact': return 'bg-blue-600 hover:bg-blue-600';
        case 'gap': return 'bg-red-600 hover:bg-red-600';
        default: return 'bg-slate-600 hover:bg-slate-600';
    }
};

const getTypeLabel = (type: string) => {
    return type === 'gap' ? 'Knowledge Gap' : type;
};

// Learned Memory Interface - now using API type directly
type Insight = LearningMemory;

// Mock Learned Memories Data - Removed
const MOCK_LEARNED_MEMORIES: LearningMemory[] = [];


export function AutoLearningTab() {
    const { activeOrg } = useOrg();
    const { toast } = useToast();
    const [insights, setInsights] = useState<LearningMemory[]>([]);
    const [learnedMemories, setLearnedMemories] = useState<LearningMemory[]>([]); // New state for Learned tab
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");
    const [processingIds, setProcessingIds] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState("new_learning");

    const handleScanMissing = async () => {
        toast({ title: "Scanning for missing insights...", description: "Analyzing past 24h chats..." });
        try {
            await triggerMissedLearning(activeOrg?.id || "demo");
            toast({ title: "Scan Complete", description: "Refreshed learning queue." });
            loadInsights();
        } catch (e) {
            toast({ title: "Scan Failed", variant: "destructive" });
        }
    };

    // Learned Tab State
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState({
        pattern: false,
        fact: false,
        rule: false,
        gap: false,
        active: false,
        expired: false,
        expiringSoon: false,
        permanent: false,
        duplicates: false,
        dateFrom: "",
        dateTo: ""
    });
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ open: boolean, type: 'single' | 'bulk' | 'expired', ids: string[] }>({ open: false, type: 'single', ids: [] });

    // --- NEW LEARNING TAB STATE ---
    const [nlSearchQuery, setNlSearchQuery] = useState("");
    const [nlFilters, setNlFilters] = useState({
        pattern: false, fact: false, rule: false, gap: false,
        dateFrom: "", dateTo: ""
    });
    const [nlCurrentPage, setNlCurrentPage] = React.useState(1);
    const [nlRowsPerPage, setNlRowsPerPage] = React.useState(10);
    const [nlSelectedIds, setNlSelectedIds] = React.useState<Set<string>>(new Set());

    // Filtered New Learning
    const filteredInsights = React.useMemo(() => {
        setNlCurrentPage(1); // Reset page on filter change
        setNlSelectedIds(new Set()); // Reset selection
        return insights.filter(insight => {
            const searchLower = nlSearchQuery.toLowerCase();
            const content = insight.content || "";
            const matchesSearch = !nlSearchQuery ||
                content.toLowerCase().includes(searchLower) ||
                insight.title?.toLowerCase().includes(searchLower) ||
                insight.type.toLowerCase().includes(searchLower);

            const hasTypeFilter = nlFilters.pattern || nlFilters.fact || nlFilters.rule || nlFilters.gap;
            const matchesType = !hasTypeFilter ||
                (nlFilters.pattern && insight.type === 'pattern') ||
                (nlFilters.fact && insight.type === 'fact') ||
                (nlFilters.rule && insight.type === 'rule') ||
                (nlFilters.gap && insight.type === 'gap');

            // Date logic
            let matchesDate = true;
            if (insight.createdAt) {
                const date = new Date(insight.createdAt).toISOString().split('T')[0];
                if (nlFilters.dateFrom) matchesDate = matchesDate && date >= nlFilters.dateFrom;
                if (nlFilters.dateTo) matchesDate = matchesDate && date <= nlFilters.dateTo;
            }

            return matchesSearch && matchesType && matchesDate;
        });
    }, [insights, nlSearchQuery, nlFilters]);

    const nlTotalPages = Math.ceil(filteredInsights.length / nlRowsPerPage);
    const nlPaginatedInsights = filteredInsights.slice((nlCurrentPage - 1) * nlRowsPerPage, nlCurrentPage * nlRowsPerPage);

    const handleNlSelect = (id: string, select: boolean) => {
        const newSet = new Set(nlSelectedIds);
        if (select) newSet.add(id); else newSet.delete(id);
        setNlSelectedIds(newSet);
    };

    const toggleNlSelectAll = () => {
        if (nlSelectedIds.size === filteredInsights.length) setNlSelectedIds(new Set());
        else setNlSelectedIds(new Set(filteredInsights.map(i => i._id)));
    };

    const handleNlBulkApprove = async () => {
        const ids = Array.from(nlSelectedIds);
        setProcessingIds(prev => [...prev, ...ids]);

        try {
            const promises = ids.map(id => {
                const insight = insights.find(i => i._id === id);
                return approveMemory(id, activeOrg?.id || "demo", "user"); // simplified for now
            });
            await Promise.all(promises);

            toast({ title: "Bulk Approval Complete", description: `Approved ${ids.length} insights.` });
            setInsights(prev => prev.filter(i => !nlSelectedIds.has(i._id)));
            setNlSelectedIds(new Set());
        } catch (error) {
            toast({ title: "Error", variant: "destructive", description: "Some items failed to approve." });
        } finally {
            setProcessingIds(prev => prev.filter(pid => !ids.includes(pid)));
        }
    };

    const handleNlBulkDiscard = async () => {
        const ids = Array.from(nlSelectedIds);
        setProcessingIds(prev => [...prev, ...ids]);

        try {
            await Promise.all(ids.map(id => rejectMemory(id, activeOrg?.id || "demo")));
            toast({ title: "Bulk Discard Complete", description: `Discarded ${ids.length} insights.` });
            setInsights(prev => prev.filter(i => !nlSelectedIds.has(i._id)));
            setNlSelectedIds(new Set());
        } catch (error) {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setProcessingIds(prev => prev.filter(pid => !ids.includes(pid)));
        }
    };

    // --- LEARNED TAB STATE ---
    // Pagination & Selection State
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Learned Memory Editing State
    const [learnedEditingId, setLearnedEditingId] = useState<string | null>(null);
    const [learnedEditContent, setLearnedEditContent] = useState("");

    // Expiry Update State
    const [expiryDialog, setExpiryDialog] = useState<{ open: boolean, memory: LearningMemory | null, date: string }>({ open: false, memory: null, date: "" });

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
        setSelectedIds(new Set()); // Optional: clear selection on filter change?
    }, [filters, searchQuery]);

    // Filtered Learned Memories
    // Moved up to avoid hoisting issues with toggleSelectAll
    const filteredMemories = React.useMemo(() => {
        return learnedMemories.filter(memory => {
            // Calculate expiry status helper
            const isExpired = memory.expiresAt && new Date(memory.expiresAt) < new Date();

            if (isExpired && !filters.expired) return false;

            // Search filter
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = !searchQuery ||
                memory.content?.toLowerCase().includes(searchLower) ||
                memory.title?.toLowerCase().includes(searchLower) ||
                memory.category?.toLowerCase().includes(searchLower) ||
                memory.type.toLowerCase().includes(searchLower);

            // Type filters
            const hasTypeFilter = filters.pattern || filters.fact || filters.rule || filters.gap;
            const matchesType = !hasTypeFilter ||
                (filters.pattern && memory.type === 'pattern') ||
                (filters.fact && memory.type === 'fact') ||
                (filters.rule && memory.type === 'rule') ||
                (filters.gap && memory.type === 'gap');

            const hasStatusFilter = filters.active || filters.duplicates || filters.expiringSoon || filters.permanent;
            // Calculate expiring soon: < 7 days?
            const daysUntilExpiry = memory.expiresAt ? (new Date(memory.expiresAt).getTime() - Date.now()) / (86400000) : 999;
            const isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 7;
            const isDuplicate = memory.isDuplicate || !!memory.duplicateOf;

            const matchesStatus = !hasStatusFilter ||
                (filters.active && !isExpired && !isExpiringSoon) || // Active means not expired and not expiring soon (optional definition)
                (filters.duplicates && isDuplicate) ||
                (filters.expiringSoon && isExpiringSoon) ||
                (filters.permanent && memory.isPermanent);

            // Date range filter
            let matchesDate = true;
            if (filters.dateFrom) {
                const memoryDate = new Date(memory.approvedAt || memory.createdAt).toISOString().split('T')[0];
                matchesDate = matchesDate && memoryDate >= filters.dateFrom;
            }
            if (filters.dateTo) {
                const memoryDate = new Date(memory.approvedAt || memory.createdAt).toISOString().split('T')[0];
                matchesDate = matchesDate && memoryDate <= filters.dateTo;
            }

            return matchesSearch && matchesType && matchesStatus && matchesDate;
        });
    }, [learnedMemories, searchQuery, filters]);

    const handleSelect = (id: string, checked: boolean) => {
        const newSelected = new Set(selectedIds);
        if (checked) {
            newSelected.add(id);
        } else {
            newSelected.delete(id);
        }
        setSelectedIds(newSelected);
    };

    const handleBulkDelete = () => {
        setDeleteConfirmation({ open: true, type: 'bulk', ids: Array.from(selectedIds) });
    };

    const handleConfirmDelete = () => {
        const isBulk = deleteConfirmation.type === 'bulk';
        toast({
            title: isBulk ? "Memories Deleted" : "Memory Deleted",
            description: isBulk
                ? `Successfully deleted ${deleteConfirmation.ids.length} memories.`
                : "Memory has been permanently removed.",
        });

        if (isBulk) {
            setSelectedIds(new Set());
        }

        // Call API to delete
        // For visual update:
        setLearnedMemories(prev => prev.filter(m => !deleteConfirmation.ids.includes(m._id)));
        setDeleteConfirmation(prev => ({ ...prev, open: false }));
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredMemories.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredMemories.map(m => m._id)));
        }
    };

    // Count active filters
    const activeFilterCount = [
        filters.pattern, filters.fact, filters.rule, filters.gap,
        filters.active, filters.duplicates, filters.expiringSoon, filters.permanent,
        !!filters.dateFrom, !!filters.dateTo
    ].filter(Boolean).length;

    const expiryOptions = [
        { label: "Forever (Permanent)", value: "forever", icon: Check },
        { label: "1 Year", value: "year", icon: Calendar },
        { label: "1 Month", value: "month", icon: Calendar },
        { label: "7 Days (Temporary)", value: "week", icon: Calendar },
    ];

    const loadInsights = async () => {
        try {
            setLoading(true);
            // Fetch Pending Insights (New Learning)
            const pendingData = await getMemories({
                organizationId: activeOrg?.id || "demo",
                status: 'pending'
            });
            setInsights(pendingData.memories || []);

            // Fetch Approved Memories (Learned)
            const approvedData = await getMemories({
                organizationId: activeOrg?.id || "demo",
                status: 'approved' // We might need to handle 'merged' here too if we want to show duplicates separately or they are included
            });
            setLearnedMemories(approvedData.memories || []);

        } catch (error) {
            console.error("Failed to fetch memories", error);
            // setInsights(MOCK_INSIGHTS); // Fallback removed
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeOrg?.id) {
            loadInsights();
        }
    }, [activeOrg]);

    const handleCommit = async (id: string, duration: 'forever' | 'year' | 'month' | 'week') => {
        setProcessingIds(prev => [...prev, id]);
        await new Promise(r => setTimeout(r, 600));

        try {
            const insight = insights.find(i => i._id === id);
            const finalContent = (editingId === id) ? editContent : insight?.content;

            // TODO: Pass content update if changed? API `approveMemory` doesn't take content arg in interface currently?
            // If content changed, we might need updateMemory first or update backend to accept content on approve.
            // For now assuming just approve:
            await approveMemory(id, activeOrg?.id || "demo", "user");

            // If we edited content, we should update it. 
            if (editingId === id && editContent !== insight?.content) {
                await updateMemory(id, { content: editContent });
            }
            toast({
                title: "🧠 Memory Synced",
                description: `Saved to Chats Master List (${duration === 'forever' ? 'Permanent' : 'Expires in ' + duration}).`,
            });
            setInsights(prev => prev.filter(i => i._id !== id));
        } catch (error) {
            console.error(error);
            toast({ title: "Error saving memory", variant: "destructive" });
        } finally {
            setProcessingIds(prev => prev.filter(pid => pid !== id));
            setEditingId(null);
        }
    };

    const handleDiscard = async (id: string, blacklist: boolean) => {
        setProcessingIds(prev => [...prev, id]);
        await new Promise(r => setTimeout(r, 500));
        try {
            await rejectMemory(id, activeOrg?.id || "demo");
            toast({
                title: blacklist ? "⛔ Topic Blacklisted" : "🗑️ Insight Discarded",
                description: blacklist ? "AI will ignore similar patterns in future." : "Removed from queue.",
            });
            setInsights(prev => prev.filter(i => i._id !== id));
        } catch (error) {
            console.error(error);
        } finally {
            setProcessingIds(prev => prev.filter(pid => pid !== id));
        }
    };

    const startEdit = (insight: LearningMemory) => {
        setEditingId(insight._id);
        setEditContent(insight.content || "");
    };

    // Learned Tab Functions
    const handleKeepExpired = (memory: LearningMemory) => {
        toast({
            title: "✅ Memory Retained",
            description: "Expiry date has been extended permanently.",
        });
        // Logic to update backend would go here
    };

    const handleDeleteExpired = (memory: LearningMemory) => {
        toast({
            title: "🗑️ Memory Deleted",
            description: "Expired memory has been removed from the system.",
        });
        // Logic to update backend would go here
    };

    const handleMergeDuplicate = (duplicateId: string, originalId: string) => {
        toast({
            title: "🔀 Memories Merged",
            description: "Duplicate memory has been merged with the original.",
        });
    };

    const startLearnedEdit = (memory: LearningMemory) => {
        setLearnedEditingId(memory._id);
        setLearnedEditContent(memory.content || "");
    };

    const saveLearnedEdit = (id: string) => {
        toast({
            title: "✅ Changes Saved",
            description: "Memory content has been updated successfully.",
        });
        setLearnedEditingId(null);
        // Update mock data or recall backend here
    };

    const openExpiryDialog = (memory: LearningMemory) => {
        const currentDate = memory.expiresAt ? new Date(memory.expiresAt) : null;
        setExpiryDialog({
            open: true,
            memory: memory,
            date: currentDate ? currentDate.toISOString().split('T')[0] : ""
        });
    };

    const handleUpdateExpiry = () => {
        const message = expiryDialog.date ? `Expiry set to ${expiryDialog.date}` : "Memory set to never expire";
        toast({
            title: "📅 Expiry Updated",
            description: message,
        });
        setExpiryDialog(prev => ({ ...prev, open: false }));
    };

    // Removed duplicate filteredMemories definition

    return (
        <div className="w-full  flex flex-col">

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
                <div className=" z-30 bg-slate-50 dark:bg-slate-950 ">
                    {/* Tabs Header */}
                    <div className="flex items-center justify-between px-1 mb-4">
                        <div>
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <Zap className="h-6 w-6 text-amber-500 fill-amber-500" />
                                <span className="bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent">
                                    Ai Chats Memory Studio
                                </span>
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">Manage your AI's knowledge base, approve learned insights, and track performance.</p>
                        </div>
                        <div className="flex gap-4">
                            <Badge className="h-10 px-5 text-sm font-bold bg-blue-600 hover:bg-blue-600">
                                {insights.length} Active Signals
                            </Badge>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    {/* Tab Navigation */}
                    <TabsList className="bg-slate-100/50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-800 p-1 w-fit">
                        <TabsTrigger
                            value="new_learning"
                            className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:border-slate-200 dark:data-[state=active]:border-slate-700 data-[state=active]:shadow-sm data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400"
                        >
                            <Sparkles className="h-4 w-4" />
                            New Learning
                        </TabsTrigger>
                        <TabsTrigger
                            value="learned"
                            className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:border-slate-200 dark:data-[state=active]:border-slate-700 data-[state=active]:shadow-sm data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400"
                        >
                            <Archive className="h-4 w-4" />
                            Learned
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Tab 1: New Learning (Current Content) */}
                <TabsContent value="new_learning" className="flex-1 m-0">

                    <div className="flex-1 px-1 pb-10 scrollbar-hide">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                            </div>
                        ) : (
                            <div className="flex-1 px-1 pb-10">
                                <div className="sticky pt-4 pb-4 z-10 -top-7  bg-slate-50 dark:bg-slate-950/40 backdrop-blur-md">
                                    {/* Filter Bar */}
                                    <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm dark:shadow-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 relative">
                                                <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                                                <Input
                                                    placeholder="Search insights..."
                                                    value={nlSearchQuery}
                                                    onChange={(e) => setNlSearchQuery(e.target.value)}
                                                    className="h-11 pl-10 bg-white dark:bg-slate-800/50 backdrop-blur-sm border-slate-200 dark:border-slate-700/50 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800/70 transition-all text-sm text-slate-900 dark:text-slate-100 shadow-sm"
                                                />
                                            </div>
                                            <div className="flex items-center px-2 gap-2 border-r border-slate-300/50 dark:border-slate-700/50 pr-4">
                                                <Checkbox
                                                    checked={filteredInsights.length > 0 && nlSelectedIds.size === filteredInsights.length}
                                                    onCheckedChange={toggleNlSelectAll}
                                                    className="h-5 w-5 border-slate-600 data-[state=checked]:bg-blue-600 mr-1"
                                                />
                                                <span className="text-sm text-slate-400 dark:text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap select-none w-[85px] inline-block">
                                                    {filteredInsights.length > 0 && nlSelectedIds.size === filteredInsights.length
                                                        ? 'Deselect All'
                                                        : nlSelectedIds.size > 0
                                                            ? `${nlSelectedIds.size} Selected`
                                                            : 'Select All'}
                                                </span>
                                            </div>
                                            {nlSelectedIds.size > 0 && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button className="h-11 px-4 gap-2 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30">
                                                            <Layers className="h-4 w-4" />
                                                            Actions ({nlSelectedIds.size})
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800">
                                                        <DropdownMenuItem onClick={handleNlBulkApprove} className="gap-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 hover:text-green-700 dark:hover:text-green-300 cursor-pointer">
                                                            <Check className="h-4 w-4" /> Approve All
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={handleNlBulkDiscard} className="gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300 cursor-pointer">
                                                            <Trash2 className="h-4 w-4" /> Discard All
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}

                                            <Button
                                                variant="outline"
                                                onClick={async () => {
                                                    toast({ title: "Scanning for missing insights...", description: "Analyzing past 24h chats..." });
                                                    try {
                                                        await triggerMissedLearning(activeOrg?.id || "demo");
                                                        toast({ title: "Scan Complete", description: "Refreshed learning queue." });
                                                        loadInsights();
                                                    } catch (e) {
                                                        toast({ title: "Scan Failed", variant: "destructive" });
                                                    }
                                                }}
                                                className="gap-2 h-11 px-4 bg-white dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700/50"
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                                <span className="hidden sm:inline">Scan Missing</span>
                                            </Button>

                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        className={`gap-2 h-11 px-5 hover:bg-slate-100 dark:hover:bg-slate-800 relative ${nlFilters.pattern || nlFilters.fact || nlFilters.rule || nlFilters.gap ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-slate-800/50 border border-blue-200 dark:border-blue-500/30' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/50'}`}
                                                    >
                                                        <SlidersHorizontal className="h-4 w-4" />
                                                        Filters
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-80 bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 p-4" align="end">
                                                    <div className="grid gap-4">
                                                        <div className="flex items-center justify-between pb-2 border-b border-slate-300 dark:border-slate-800">
                                                            <h4 className="font-medium leading-none text-slate-900 dark:text-slate-200">Filter Options</h4>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setNlFilters({ pattern: false, fact: false, rule: false, gap: false, dateFrom: "", dateTo: "" })}
                                                                className="h-6 px-2 text-[10px] text-slate-400 dark:text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center"
                                                            >
                                                                <X className="h-3 w-3 mr-1" />
                                                                Reset All
                                                            </Button>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <h4 className="font-medium leading-none text-slate-900 dark:text-slate-200 text-sm flex items-center gap-2">
                                                                <Filter className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600 dark:text-slate-400" />
                                                                Insight Type
                                                            </h4>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div className="flex items-center space-x-2">
                                                                    <Checkbox
                                                                        id="nl_pattern"
                                                                        checked={nlFilters.pattern}
                                                                        onCheckedChange={(checked) => setNlFilters(prev => ({ ...prev, pattern: !!checked }))}
                                                                        className="border-slate-300 dark:border-slate-700 data-[state=checked]:bg-blue-600"
                                                                    />
                                                                    <label htmlFor="nl_pattern" className="text-xs font-medium text-slate-400 dark:text-slate-600 dark:text-slate-400 capitalize cursor-pointer select-none flex items-center gap-1">
                                                                        Pattern <BrainCircuit className="h-3 w-3 text-purple-500" />
                                                                    </label>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <Checkbox
                                                                        id="nl_fact"
                                                                        checked={nlFilters.fact}
                                                                        onCheckedChange={(checked) => setNlFilters(prev => ({ ...prev, fact: !!checked }))}
                                                                        className="border-slate-300 dark:border-slate-700 data-[state=checked]:bg-blue-600"
                                                                    />
                                                                    <label htmlFor="nl_fact" className="text-xs font-medium text-slate-400 dark:text-slate-600 dark:text-slate-400 capitalize cursor-pointer select-none flex items-center gap-1">
                                                                        Fact <Database className="h-3 w-3 text-emerald-500" />
                                                                    </label>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <Checkbox
                                                                        id="nl_rule"
                                                                        checked={nlFilters.rule}
                                                                        onCheckedChange={(checked) => setNlFilters(prev => ({ ...prev, rule: !!checked }))}
                                                                        className="border-slate-300 dark:border-slate-700 data-[state=checked]:bg-blue-600"
                                                                    />
                                                                    <label htmlFor="nl_rule" className="text-xs font-medium text-slate-400 dark:text-slate-600 dark:text-slate-400 capitalize cursor-pointer select-none flex items-center gap-1">
                                                                        Rule <Scale className="h-3 w-3 text-blue-400" />
                                                                    </label>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <Checkbox
                                                                        id="nl_gap"
                                                                        checked={nlFilters.gap}
                                                                        onCheckedChange={(checked) => setNlFilters(prev => ({ ...prev, gap: !!checked }))}
                                                                        className="border-slate-300 dark:border-slate-700 data-[state=checked]:bg-blue-600"
                                                                    />
                                                                    <label htmlFor="nl_gap" className="text-xs font-medium text-slate-400 dark:text-slate-600 dark:text-slate-400 capitalize cursor-pointer select-none flex items-center gap-1">
                                                                        Gap <AlertTriangle className="h-3 w-3 text-amber-500" />
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {/* Date Range */}
                                                        <div className="space-y-2">
                                                            <h4 className="font-medium leading-none text-slate-900 dark:text-slate-200 text-sm flex items-center gap-2">
                                                                <Calendar className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600 dark:text-slate-400" />
                                                                Date Range
                                                            </h4>
                                                            <div className="flex gap-2">
                                                                <div className="flex-1 relative">
                                                                    <Calendar className="absolute left-2 top-2.5 h-3.5 w-3.5 text-slate-500 dark:text-slate-500" />
                                                                    <Input
                                                                        type="date"
                                                                        value={nlFilters.dateFrom}
                                                                        onChange={(e) => setNlFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                                                                        className="h-8 w-fit text-[10px] bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                                                                    />
                                                                </div>
                                                                <span className="text-slate-400 dark:text-slate-600 self-center">-</span>
                                                                <div className="flex-1 relative">
                                                                    <Calendar className="absolute left-2 top-2.5 h-3.5 w-3.5 text-slate-500 dark:text-slate-500" />
                                                                    <Input
                                                                        type="date"
                                                                        value={nlFilters.dateTo}
                                                                        onChange={(e) => setNlFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                                                                        className="h-8 w-fit text-[10px] bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    {nlPaginatedInsights.length === 0 ? (
                                        <EmptyStateCard
                                            icon={Sparkles}
                                            title="No new insights found"
                                            description="Your AI hasn't detected any new learning patterns yet. Try scanning past conversations."
                                            actionLabel="Scan For Insights"
                                            onAction={handleScanMissing}
                                            className="mt-8"
                                        />
                                    ) : (
                                        nlPaginatedInsights.map((insight) => (
                                            <div
                                                key={insight._id}
                                                onClick={() => nlSelectedIds.size > 0 && handleNlSelect(insight._id, !nlSelectedIds.has(insight._id))}
                                                className={`group relative bg-white dark:bg-slate-900/60 backdrop-blur-sm border rounded-xl p-5 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-0.5 cursor-pointer ${nlSelectedIds.has(insight._id) ? 'border-blue-500/50 bg-blue-50/50 dark:bg-blue-500/5' : 'border-slate-200 dark:border-slate-800/80 hover:border-blue-300 dark:hover:border-blue-500/20'}`}
                                            >
                                                <div className={`absolute top-4 left-4 z-20 transition-opacity duration-200 ${nlSelectedIds.has(insight._id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                    <Checkbox
                                                        checked={nlSelectedIds.has(insight._id)}
                                                        onCheckedChange={(checked) => handleNlSelect(insight._id, !!checked)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="h-5 w-5 border-slate-500/50 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 bg-white dark:bg-slate-900/80 backdrop-blur-sm"
                                                    />
                                                </div>

                                                <div className="flex items-start justify-between mb-3 pl-8">
                                                    <div className="flex gap-2">
                                                        <Badge variant="outline" className={`uppercase text-[11px] font-bold px-3 py-1.5 tracking-wider rounded-md ${getBadgeColor(insight.type)}`}>
                                                            {getTypeLabel(insight.type)}
                                                        </Badge>
                                                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-mono">
                                                            {(insight.confidence * 100).toFixed(0)}% Confidence
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-500 uppercase tracking-widest">{insight.source}</span>
                                                    </div>
                                                </div>

                                                {/* Title / Question */}
                                                {insight.title && (
                                                    <div className="mb-4 pl-8">
                                                        <p className="text-base font-medium text-slate-900 dark:text-slate-200 leading-relaxed">
                                                            "{insight.title}"
                                                        </p>
                                                    </div>
                                                )}

                                                {/* AI Proposal */}
                                                <div className="bg-slate-50 dark:bg-slate-800/70 rounded-lg p-4 mb-5 border border-slate-200 dark:border-slate-700/60 group-hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors relative group/edit ml-8">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <BrainCircuit className="h-4 w-4 text-blue-400" />
                                                            <span className="text-xs uppercase tracking-wider font-bold text-blue-400">AI Proposal</span>
                                                        </div>
                                                        {editingId !== insight._id && (
                                                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); startEdit(insight); }} className="h-6 px-2 text-[10px] text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white opacity-0 group-hover/edit:opacity-100 transition-opacity">
                                                                <Pencil className="h-3 w-3 mr-1" /> Edit
                                                            </Button>
                                                        )}
                                                    </div>

                                                    {editingId === insight._id ? (
                                                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                                                            <Textarea
                                                                value={editContent}
                                                                onChange={(e) => setEditContent(e.target.value)}
                                                                className="text-sm min-h-[90px] font-normal leading-relaxed bg-slate-100/50 dark:bg-slate-900/50 resize-none border-slate-600 focus:border-blue-500 transition-colors"
                                                                placeholder="Refine this insight..."
                                                                autoFocus
                                                            />
                                                            <div className="absolute bottom-2 right-2 flex gap-1">
                                                                <Badge variant="secondary" className="text-[10px] bg-slate-800 text-slate-400 dark:text-slate-600 dark:text-slate-400">markdown supported</Badge>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-slate-700 dark:text-slate-50 leading-relaxed font-normal">
                                                            {insight.content}
                                                        </p>
                                                    )}

                                                    {insight.category && editingId !== insight._id && (
                                                        <div className="flex items-center gap-2 mt-3 text-xs font-semibold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-md w-fit border border-amber-500/20">
                                                            <Sparkles className="h-3 w-3" />
                                                            <span>{insight.category}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center justify-between gap-3 ml-8" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center shadow-sm rounded-md border border-slate-200 dark:border-slate-700">
                                                        {editingId === insight._id ? (
                                                            <>
                                                                <Button variant="outline" className="h-11 px-5 bg-slate-800/50 border-slate-300 dark:border-slate-700 hover:bg-slate-700/50 font-medium text-sm" onClick={() => setEditingId(null)}>Cancel</Button>
                                                                <Button className="h-11 px-5 bg-green-500 hover:bg-green-600 text-white font-bold text-sm shadow-[0_0_15px_rgba(34,197,94,0.3)]" onClick={() => handleCommit(insight._id, 'forever')}><Check className="h-4 w-4 mr-2" /> Save Changes</Button>
                                                            </>
                                                        ) : (
                                                            <div className="flex items-center shadow-sm rounded-md border border-slate-200 dark:border-slate-700">
                                                                <Button className="h-11 px-6 bg-slate-50 text-slate-900 dark:bg-white dark:text-black hover:bg-slate-100 dark:hover:bg-slate-200 font-bold text-sm rounded-r-none border-r border-slate-200 dark:border-slate-300" onClick={() => handleCommit(insight._id, 'forever')}><Check className="h-4 w-4 mr-2 text-blue-600" /> Save Memory</Button>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button className="h-11 px-2.5 bg-slate-50 text-slate-900 dark:bg-white dark:text-black hover:bg-slate-100 dark:hover:bg-slate-200 rounded-l-none border-l-0"><ChevronDown className="h-4 w-4" /></Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="start" className="w-60 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-200">
                                                                        <DropdownMenuLabel className="text-xs font-semibold text-slate-500 dark:text-slate-500">EXPIRY OPTIONS</DropdownMenuLabel>
                                                                        <DropdownMenuSeparator className="bg-slate-800" />
                                                                        {expiryOptions.map(opt => (
                                                                            <DropdownMenuItem key={opt.value} onClick={() => handleCommit(insight._id, opt.value as any)} className="gap-3 py-3 focus:bg-slate-800 focus:text-white cursor-pointer group">
                                                                                <div className="p-1 rounded bg-slate-800 group-hover:bg-slate-700 transition-colors"><opt.icon className="h-3.5 w-3.5 text-blue-400" /></div>
                                                                                <div className="flex flex-col gap-0.5"><span className="font-medium text-sm">{opt.label}</span><span className="text-[10px] text-muted-foreground leading-none">{opt.value === 'forever' ? 'Does not auto-delete' : 'Auto-archives'}</span></div>
                                                                            </DropdownMenuItem>
                                                                        ))}
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 dark:text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800">
                                                                <DropdownMenuItem onClick={() => handleDiscard(insight._id, false)} className="gap-2 py-2.5 focus:bg-slate-800 focus:text-white cursor-pointer"><Trash2 className="h-4 w-4" /> Discard Insight</DropdownMenuItem>
                                                                <DropdownMenuSeparator className="bg-slate-800" />
                                                                <DropdownMenuItem onClick={() => handleDiscard(insight._id, true)} className="text-red-400 gap-2 py-2.5 focus:bg-red-500/10 focus:text-red-400 cursor-pointer"><ShieldAlert className="h-4 w-4" /> Blacklist Topic</DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Pagination Footer */}
                                <div className="flex items-center justify-between border-t border-slate-300 dark:border-slate-800 pt-4 mt-6 px-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-slate-400 dark:text-slate-600 dark:text-slate-400">Rows per page:</span>
                                        <Select value={nlRowsPerPage.toString()} onValueChange={(val) => setNlRowsPerPage(Number(val))}>
                                            <SelectTrigger className="h-8 w-[70px] bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="10">10</SelectItem>
                                                <SelectItem value="20">20</SelectItem>
                                                <SelectItem value="50">50</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-slate-400 dark:text-slate-600 dark:text-slate-400">
                                            {(nlCurrentPage - 1) * nlRowsPerPage + 1}-{Math.min(nlCurrentPage * nlRowsPerPage, filteredInsights.length)} of {filteredInsights.length}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <Button variant="outline" size="icon" className="h-8 w-8 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-400 dark:text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-50" onClick={() => setNlCurrentPage(prev => Math.max(1, prev - 1))} disabled={nlCurrentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                                            <Button variant="outline" size="icon" className="h-8 w-8 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-400 dark:text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-50" onClick={() => setNlCurrentPage(prev => Math.min(nlTotalPages, prev + 1))} disabled={nlCurrentPage >= nlTotalPages}><ChevronRight className="h-4 w-4" /></Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        )}
                    </div>


                </TabsContent>

                {/* Tab 2: Learned (Committed Data) */}
                <TabsContent value="learned" className="flex-1 m-0 ">
                    <div className="flex-1 px-1 ">
                        {/* Stats Cards */}
                        <div className="grid mt-4 grid-cols-5 gap-3 mb-1">
                            <div
                                onClick={() => setFilters({ pattern: false, fact: false, rule: false, gap: false, active: false, expired: false, expiringSoon: false, permanent: false, duplicates: false, dateFrom: "", dateTo: "" })}
                                className={`group p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border rounded-xl transition-all hover:scale-[1.02] cursor-pointer ${activeFilterCount === 0 ? 'border-blue-500 ring-1 ring-blue-500/50 shadow-lg shadow-blue-500/10' : 'border-blue-500/30 hover:border-blue-500/50 hover:shadow-md'}`}
                            >
                                <div className="text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-wider font-bold mb-2 flex items-center gap-2">
                                    <TrendingUp className="h-3 w-3" />
                                    Total Learned
                                </div>
                                <div className="text-3xl font-bold bg-gradient-to-br from-blue-400 to-blue-600 bg-clip-text text-transparent">
                                    {filteredMemories.length}
                                </div>
                            </div>
                            <div
                                onClick={() => setFilters({ pattern: false, fact: false, rule: false, gap: false, active: true, expired: false, expiringSoon: false, permanent: false, duplicates: false, dateFrom: "", dateTo: "" })}
                                className={`group p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border rounded-xl transition-all hover:scale-[1.02] cursor-pointer ${filters.active ? 'border-emerald-500 ring-1 ring-emerald-500/50 shadow-lg shadow-emerald-500/10' : 'border-emerald-500/30 hover:border-emerald-500/50 hover:shadow-md'}`}
                            >
                                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-bold mb-2 flex items-center gap-2">
                                    <Check className="h-3 w-3" />
                                    Active
                                </div>
                                <div className="text-3xl font-bold bg-gradient-to-br from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                                    {learnedMemories.filter(m => {
                                        const isExpired = m.expiresAt ? new Date(m.expiresAt) < new Date() : false;
                                        const daysUntilExpiry = m.expiresAt ? (new Date(m.expiresAt).getTime() - Date.now()) / (86400000) : 999;
                                        const isExpiringSoon = !isExpired && daysUntilExpiry > 0 && daysUntilExpiry <= 7;
                                        return m.status === 'approved' && !isExpired && !isExpiringSoon;
                                    }).length}
                                </div>
                            </div>
                            <div
                                onClick={() => setFilters({ pattern: false, fact: false, rule: false, gap: false, active: false, expired: false, expiringSoon: false, permanent: false, duplicates: true, dateFrom: "", dateTo: "" })}
                                className={`group p-4 bg-gradient-to-br from-amber-500/10 to-orange-600/5 border rounded-xl transition-all hover:scale-[1.02] cursor-pointer ${filters.duplicates ? 'border-amber-500 ring-1 ring-amber-500/50 shadow-lg shadow-amber-500/10' : 'border-amber-500/30 hover:border-amber-500/50 hover:shadow-md'}`}
                            >
                                <div className="text-[10px] text-amber-600 dark:text-amber-400 uppercase tracking-wider font-bold mb-2 flex items-center gap-2">
                                    <TrendingUp className="h-3 w-3" />
                                    Duplicates
                                </div>
                                <div className="text-3xl font-bold bg-gradient-to-br from-amber-400 to-orange-600 bg-clip-text text-transparent">
                                    {learnedMemories.filter(m => !!m.duplicateOf).length}
                                </div>
                            </div>
                            <div
                                onClick={() => setFilters({ pattern: false, fact: false, rule: false, gap: false, active: false, expired: false, expiringSoon: true, permanent: false, duplicates: false, dateFrom: "", dateTo: "" })}
                                className={`group p-4 bg-gradient-to-br from-red-500/10 to-red-600/5 border rounded-xl transition-all hover:scale-[1.02] cursor-pointer ${filters.expiringSoon ? 'border-red-500 ring-1 ring-red-500/50 shadow-lg shadow-red-500/10' : 'border-red-500/30 hover:border-red-500/50 hover:shadow-md'}`}
                            >
                                <div className="text-[10px] text-red-600 dark:text-red-400 uppercase tracking-wider font-bold mb-2 flex items-center gap-2">
                                    <Clock className="h-3 w-3" />
                                    EXPIRING SOON
                                </div>
                                <div className="text-3xl font-bold bg-gradient-to-br from-red-400 to-red-600 bg-clip-text text-transparent">
                                    {learnedMemories.filter(m => {
                                        const isExpired = m.expiresAt ? new Date(m.expiresAt) < new Date() : false;
                                        const daysUntilExpiry = m.expiresAt ? (new Date(m.expiresAt).getTime() - Date.now()) / (86400000) : 999;
                                        return !isExpired && daysUntilExpiry > 0 && daysUntilExpiry <= 7;
                                    }).length}
                                </div>
                            </div>
                            <div
                                onClick={() => setFilters({ pattern: false, fact: false, rule: false, gap: false, active: false, expired: false, expiringSoon: false, permanent: true, duplicates: false, dateFrom: "", dateTo: "" })}
                                className={`group p-4 bg-gradient-to-br from-indigo-500/10 to-purple-600/5 border rounded-xl transition-all hover:scale-[1.02] cursor-pointer ${filters.permanent ? 'border-indigo-500 ring-1 ring-indigo-500/50 shadow-lg shadow-indigo-500/10' : 'border-indigo-500/30 hover:border-indigo-500/50 hover:shadow-md'}`}
                            >
                                <div className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase tracking-wider font-bold mb-2 flex items-center gap-2">
                                    <InfinityIcon className="h-3 w-3" />
                                    Permanent
                                </div>
                                <div className="text-3xl font-bold bg-gradient-to-br from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                    {learnedMemories.filter(m => !m.expiresAt).length}
                                </div>
                            </div>
                        </div>
                        <div className="sticky pt-4 pb-4 z-10 -top-8  bg-slate-50 dark:bg-slate-950/40 backdrop-blur-md">
                            {/* Advanced Search & Filter Bar */}
                            <div className=" bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm dark:shadow-lg">
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 relative">
                                        <Input
                                            placeholder="Search by content, tags, type..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="h-11 bg-white dark:bg-slate-800/50 backdrop-blur-sm border-slate-200 dark:border-slate-700/50 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800/70 transition-all text-sm px-4 text-slate-900 dark:text-slate-100 shadow-sm"
                                        />
                                    </div>

                                    <div className="flex items-center px-2 gap-2 border-r border-slate-300/50 dark:border-slate-700/50 pr-4">
                                        <Checkbox
                                            checked={filteredMemories.length > 0 && selectedIds.size === filteredMemories.length}
                                            onCheckedChange={toggleSelectAll}
                                            className="h-5 w-5 border-slate-600 data-[state=checked]:bg-blue-600 mr-1"
                                        />
                                        <span className="text-sm text-slate-400 dark:text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap select-none w-[85px] inline-block">
                                            {filteredMemories.length > 0 && selectedIds.size === filteredMemories.length
                                                ? 'Deselect All'
                                                : selectedIds.size > 0
                                                    ? `${selectedIds.size} Selected`
                                                    : 'Select All'}
                                        </span>
                                    </div>
                                    {selectedIds.size > 0 && (
                                        <Button
                                            onClick={handleBulkDelete}
                                            className="h-11 px-4 gap-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete ({selectedIds.size})
                                        </Button>
                                    )}
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                className={`gap-2 h-11 px-5 hover:bg-slate-200 dark:hover:bg-slate-800 relative ${activeFilterCount > 0 ? 'text-blue-400 bg-slate-800/50 border border-blue-500/30' : 'text-slate-400 dark:text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-300/50 dark:border-slate-700/50'}`}
                                            >
                                                <SlidersHorizontal className="h-4 w-4" />
                                                Filters
                                                {activeFilterCount > 0 && (
                                                    <Badge variant="secondary" className="ml-2 h-5 min-w-[20px] px-1 flex items-center justify-center rounded-full bg-blue-500 text-white font-bold text-[10px] shadow-sm">
                                                        {activeFilterCount}
                                                    </Badge>
                                                )}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80 bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 p-4" align="end">
                                            <div className="grid gap-4">
                                                {/* Header with Reset Button */}
                                                <div className="flex items-center justify-between pb-2 border-b border-slate-300 dark:border-slate-800">
                                                    <h4 className="font-semibold text-slate-900 dark:text-slate-200 text-sm flex items-center gap-2">
                                                        <SlidersHorizontal className="h-4 w-4 text-blue-400" />
                                                        Filter Options
                                                    </h4>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 text-[10px] text-slate-400 dark:text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 px-2"
                                                        onClick={() => setFilters({ pattern: false, fact: false, rule: false, gap: false, active: false, expired: false, expiringSoon: false, permanent: false, duplicates: false, dateFrom: "", dateTo: "" })}
                                                    >
                                                        <X className="h-3 w-3 mr-1" />
                                                        Reset All
                                                    </Button>
                                                </div>

                                                {/* Type Filters */}
                                                <div className="space-y-2">
                                                    <h4 className="font-medium leading-none text-slate-900 dark:text-slate-200 text-sm flex items-center gap-2">
                                                        <Filter className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600 dark:text-slate-400" />
                                                        Memory Type
                                                    </h4>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id="pattern"
                                                                checked={filters.pattern}
                                                                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, pattern: !!checked }))}
                                                                className="border-slate-300 dark:border-slate-700 data-[state=checked]:bg-blue-600"
                                                            />
                                                            <label htmlFor="pattern" className="text-xs font-medium text-slate-400 dark:text-slate-600 dark:text-slate-400 capitalize cursor-pointer select-none flex items-center gap-1">
                                                                Pattern
                                                                <BrainCircuit className="h-3 w-3 text-purple-500" />
                                                            </label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id="fact"
                                                                checked={filters.fact}
                                                                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, fact: !!checked }))}
                                                                className="border-slate-300 dark:border-slate-700 data-[state=checked]:bg-blue-600"
                                                            />
                                                            <label htmlFor="fact" className="text-xs font-medium text-slate-400 dark:text-slate-600 dark:text-slate-400 capitalize cursor-pointer select-none flex items-center gap-1">
                                                                Fact
                                                                <Database className="h-3 w-3 text-emerald-500" />
                                                            </label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id="rule"
                                                                checked={filters.rule}
                                                                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, rule: !!checked }))}
                                                                className="border-slate-300 dark:border-slate-700 data-[state=checked]:bg-blue-600"
                                                            />
                                                            <label htmlFor="rule" className="text-xs font-medium text-slate-400 dark:text-slate-600 dark:text-slate-400 capitalize cursor-pointer select-none flex items-center gap-1">
                                                                Rule
                                                                <Scale className="h-3 w-3 text-blue-400" />
                                                            </label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id="knowledge_gap"
                                                                checked={filters.gap}
                                                                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, gap: !!checked }))}
                                                                className="border-slate-300 dark:border-slate-700 data-[state=checked]:bg-blue-600"
                                                            />
                                                            <label htmlFor="knowledge_gap" className="text-xs font-medium text-slate-400 dark:text-slate-600 dark:text-slate-400 capitalize cursor-pointer select-none flex items-center gap-1">
                                                                Gap
                                                                <AlertTriangle className="h-3 w-3 text-amber-500" />
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Status Filters */}
                                                <div className="space-y-2">
                                                    <h4 className="font-medium leading-none text-slate-900 dark:text-slate-200 text-sm flex items-center gap-2">
                                                        <Clock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600 dark:text-slate-400" />
                                                        Status
                                                    </h4>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id="active"
                                                                checked={filters.active}
                                                                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, active: !!checked }))}
                                                                className="border-slate-300 dark:border-slate-700 data-[state=checked]:bg-blue-600"
                                                            />
                                                            <label htmlFor="active" className="text-xs font-medium text-slate-400 dark:text-slate-600 dark:text-slate-400 capitalize cursor-pointer select-none flex items-center gap-1">
                                                                Active
                                                                <Check className="h-3 w-3 text-emerald-500" />
                                                            </label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id="expiringSoon"
                                                                checked={filters.expiringSoon}
                                                                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, expiringSoon: !!checked }))}
                                                                className="border-slate-300 dark:border-slate-700 data-[state=checked]:bg-blue-600"
                                                            />
                                                            <label htmlFor="expiringSoon" className="text-xs font-medium text-slate-400 dark:text-slate-600 dark:text-slate-400 capitalize cursor-pointer select-none flex items-center gap-1">
                                                                Expiring
                                                                <Clock className="h-3 w-3 text-amber-500" />
                                                            </label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id="duplicates"
                                                                checked={filters.duplicates}
                                                                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, duplicates: !!checked }))}
                                                                className="border-slate-300 dark:border-slate-700 data-[state=checked]:bg-blue-600"
                                                            />
                                                            <label htmlFor="duplicates" className="text-xs font-medium text-slate-400 dark:text-slate-600 dark:text-slate-400 capitalize cursor-pointer select-none flex items-center gap-1">
                                                                Duplicates
                                                                <TrendingUp className="h-3 w-3 text-orange-500" />
                                                            </label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id="permanent"
                                                                checked={filters.permanent}
                                                                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, permanent: !!checked }))}
                                                                className="border-slate-300 dark:border-slate-700 data-[state=checked]:bg-blue-600"
                                                            />
                                                            <label htmlFor="permanent" className="text-xs font-medium text-slate-400 dark:text-slate-600 dark:text-slate-400 capitalize cursor-pointer select-none flex items-center gap-1">
                                                                Permanent
                                                                <InfinityIcon className="h-3 w-3 text-indigo-500" />
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Date Range */}
                                                <div className="space-y-2">
                                                    <h4 className="font-medium leading-none text-slate-900 dark:text-slate-200 text-sm flex items-center gap-2">
                                                        <Calendar className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600 dark:text-slate-400" />
                                                        Learned Date Range
                                                    </h4>
                                                    <div className="flex gap-2">
                                                        <div className="flex-1 relative">
                                                            <Calendar className="absolute left-2 top-2.5 h-3.5 w-3.5 text-slate-500 dark:text-slate-500" />
                                                            <Input
                                                                type="date"
                                                                value={filters.dateFrom}
                                                                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                                                                className="h-8 w-fit text-[10px] bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                                                            />
                                                        </div>
                                                        <span className="text-slate-400 dark:text-slate-600 self-center">-</span>
                                                        <div className="flex-1 relative">
                                                            <Calendar className="absolute left-2 top-2.5 h-3.5 w-3.5 text-slate-500 dark:text-slate-500" />
                                                            <Input
                                                                type="date"
                                                                value={filters.dateTo}
                                                                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                                                                className="h-8 w-fit  text-[10px] bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </div>
                        {/* 2-Column Card Grid */}
                        <div className="grid mt-2 grid-cols-1 lg:grid-cols-2 gap-4 auto-rows-max">

                            {filteredMemories.length === 0 ? (
                                <EmptyStateCard
                                    icon={BrainCircuit}
                                    title="No learned memories found"
                                    description={Object.values(filters).some(Boolean) ? "No memories match your active filters. Try resetting them." : "Your AI knowledge base is empty. Approve some insights to build memory."}
                                    actionLabel={Object.values(filters).some(Boolean) ? "Reset Filters" : "Go to New Learning"}
                                    onAction={Object.values(filters).some(Boolean) ? () => setFilters({ pattern: false, fact: false, rule: false, gap: false, active: false, expired: false, expiringSoon: false, permanent: false, duplicates: false, dateFrom: "", dateTo: "" }) : () => setActiveTab("new_learning")}
                                    className="col-span-1 mt-8"
                                />
                            ) : (
                                filteredMemories.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map(memory => {
                                    const isDuplicate = !!memory.duplicateOf;
                                    const isExpired = memory.expiresAt ? new Date(memory.expiresAt) < new Date() : false;
                                    const daysUntilExpiry = memory.expiresAt ? (new Date(memory.expiresAt).getTime() - Date.now()) / (86400000) : 999;
                                    const isExpiringSoon = !isExpired && daysUntilExpiry > 0 && daysUntilExpiry <= 7;
                                    const duplicateOriginal = isDuplicate ? learnedMemories.find(m => m._id === memory.duplicateOf) : null;

                                    return (
                                        <div
                                            key={memory._id}
                                            onClick={() => selectedIds.size > 0 && handleSelect(memory._id, !selectedIds.has(memory._id))}
                                            className={`group relative bg-slate-100/60 dark:bg-slate-900/60 backdrop-blur-sm border rounded-xl p-4 transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-0.5 cursor-pointer ${isExpired
                                                ? 'border-red-500/30 hover:border-red-500/50'
                                                : isDuplicate
                                                    ? 'border-amber-500/30 hover:border-amber-500/50'
                                                    : selectedIds.has(memory._id)
                                                        ? 'border-blue-500/50 bg-blue-500/5'
                                                        : 'border-slate-200 dark:border-slate-800/80 hover:border-slate-400 dark:hover:border-slate-700/90'
                                                }`}
                                        >
                                            <div className={`absolute top-4 left-4 z-20 transition-opacity duration-200 ${selectedIds.has(memory._id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                <Checkbox
                                                    checked={selectedIds.has(memory._id)}
                                                    onCheckedChange={(checked) => handleSelect(memory._id, !!checked)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="h-5 w-5 border-slate-500/50 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 bg-slate-900/80 backdrop-blur-sm"
                                                />
                                            </div>
                                            {/* NO EXPIRED OVERLAY - Expired memories are hidden */}

                                            {/* Duplicate Badge */}
                                            {isDuplicate && !duplicateOriginal && (
                                                <div className="absolute top-3 right-3 z-10">
                                                    <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30 flex items-center gap-1">
                                                        <TrendingUp className="h-3 w-3" />
                                                        MERGED
                                                    </Badge>
                                                </div>
                                            )}

                                            {/* Top Row: Badge + Time + Confidence */}
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <Badge className={`uppercase text-[11px] font-bold px-3 py-1.5 tracking-wider rounded-md ${getBadgeColor(memory.type)}`}>
                                                            {getTypeLabel(memory.type)}
                                                        </Badge>
                                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                            <Calendar className="h-3 w-3 opacity-60" />
                                                            <span className="font-medium">
                                                                {memory.approvedAt ? new Date(memory.approvedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pending'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-3xl font-bold bg-gradient-to-br from-green-400 to-emerald-600 bg-clip-text text-transparent leading-none">
                                                        {memory.confidence}%
                                                    </div>
                                                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-1">Confidence</div>
                                                </div>
                                            </div>

                                            {/* Title (if exists) */}
                                            {memory.title && (
                                                <div className="mb-4">
                                                    <p className="text-base font-medium text-slate-900 dark:text-slate-200 leading-relaxed">
                                                        "{memory.title}"
                                                    </p>
                                                </div>
                                            )}

                                            {/* Content */}
                                            <div className="bg-slate-100 dark:bg-slate-800/70 rounded-lg p-4 mb-4 border border-slate-200 dark:border-slate-700/60 group-hover:bg-slate-200 dark:hover:bg-slate-800/80 transition-colors">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <BrainCircuit className="h-4 w-4 text-emerald-400" />
                                                        <span className="text-xs uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400">Learned Memory</span>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-slate-700 dark:text-slate-50 leading-relaxed font-normal">
                                                    {memory.content}
                                                </p>

                                                {/* Category */}
                                                {memory.category && (
                                                    <div className="flex gap-1.5 mt-3 flex-wrap">
                                                        <Badge variant="outline" className="text-[10px] border-slate-600/50 text-slate-400 dark:text-slate-600 dark:text-slate-400 bg-slate-800/50">
                                                            #{memory.category}
                                                        </Badge>
                                                    </div>
                                                )}

                                                {/* Context */}
                                            </div>

                                            {/* Merged Duplicate Data Section */}
                                            {isDuplicate && duplicateOriginal && (
                                                <div className="mb-4 p-4 bg-amber-50 dark:bg-gradient-to-br dark:from-amber-950/40 dark:to-orange-950/20 border border-amber-500/30 rounded-lg">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <TrendingUp className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                                        <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Merged From 2 Similar Memories</span>
                                                    </div>

                                                    {/* Original Memory */}
                                                    <div className="mb-3">
                                                        <p className="text-[10px] text-amber-700 dark:text-amber-400 mb-1 font-semibold">Original Memory:</p>
                                                        <div className="bg-white dark:bg-slate-900/50 p-2 rounded border border-slate-300 dark:border-slate-700/50">
                                                            <p className="text-xs text-slate-700 dark:text-slate-300">{duplicateOriginal.content}</p>
                                                            {duplicateOriginal.category && (
                                                                <div className="flex gap-1 mt-2">
                                                                    <Badge variant="outline" className="text-[9px] border-slate-600/50 text-slate-500 dark:text-slate-500">#{duplicateOriginal.category}</Badge>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* This Memory */}
                                                    <div>
                                                        <p className="text-[10px] text-amber-700 dark:text-amber-400 mb-1 font-semibold">Additional Learning:</p>
                                                        <div className="bg-white dark:bg-slate-900/50 p-2 rounded border border-slate-300 dark:border-slate-700/50">
                                                            <p className="text-xs text-slate-700 dark:text-slate-300">{memory.content}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Status Badge & Expiry Info */}
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        className={`text-[10px] font-bold ${memory.status === 'approved' && !isExpired && !isExpiringSoon
                                                            ? 'bg-emerald-600 hover:bg-emerald-600'
                                                            : isExpired
                                                                ? 'border-red-500/50 bg-red-950/30 text-red-400'
                                                                : isExpiringSoon
                                                                    ? 'bg-red-600 hover:bg-red-600'
                                                                    : 'bg-amber-600 hover:bg-amber-600'
                                                            }`}
                                                    >
                                                        {isExpiringSoon ? '⚠️ EXPIRING SOON' : isExpired ? 'EXPIRED' : memory.status.toUpperCase()}
                                                    </Badge>
                                                    {memory.expiresAt && (
                                                        <span className="text-[10px] text-slate-500 dark:text-slate-500">
                                                            Expires: {new Date(memory.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions - Three Dot Menu */}
                                            <div className="flex items-center justify-end gap-2">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-9 w-9 p-0 hover:bg-slate-200 dark:hover:bg-slate-800 hover:border-slate-300 dark:border-slate-700 border border-transparent transition-all"
                                                        >
                                                            <MoreVertical className="h-4 w-4 text-slate-400 dark:text-slate-600 dark:text-slate-400" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-52 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800">
                                                        <DropdownMenuLabel className="text-xs font-bold text-slate-400 dark:text-slate-600 dark:text-slate-400">ACTIONS</DropdownMenuLabel>
                                                        <DropdownMenuSeparator className="bg-slate-800" />
                                                        <DropdownMenuItem
                                                            className="text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer gap-2 py-2.5"
                                                            onClick={() => startLearnedEdit(memory)}
                                                        >
                                                            <Edit className="h-3.5 w-3.5 text-blue-400" />
                                                            <span className="text-sm">Edit Memory</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer gap-2 py-2.5"
                                                            onClick={() => openExpiryDialog(memory)}
                                                        >
                                                            <Calendar className="h-3.5 w-3.5 text-amber-400" />
                                                            <span className="text-sm">Update Expiry</span>
                                                        </DropdownMenuItem>
                                                        {isDuplicate && (
                                                            <DropdownMenuItem className="text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer gap-2 py-2.5">
                                                                <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
                                                                <span className="text-sm">Merge Duplicate</span>
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator className="bg-slate-800" />
                                                        <DropdownMenuItem
                                                            className="text-red-400 hover:bg-red-950/20 cursor-pointer gap-2 py-2.5"
                                                            onClick={() => setDeleteConfirmation({ open: true, type: 'single', ids: [memory._id] })}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                            <span className="text-sm font-semibold">Delete Memory</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    );
                                })
                            )}

                        </div>
                    </div>

                    {/* Pagination Footer */}
                    <div className="flex items-center justify-between border-t border-slate-300 dark:border-slate-800 pt-4 mt-6 px-1">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-400 dark:text-slate-600 dark:text-slate-400">Rows per page:</span>
                            <Select value={rowsPerPage.toString()} onValueChange={(val) => setRowsPerPage(Number(val))}>
                                <SelectTrigger className="h-8 w-[70px] bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="60">60</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-sm text-slate-400 dark:text-slate-600 dark:text-slate-400">
                                {(currentPage - 1) * rowsPerPage + 1}-{Math.min(currentPage * rowsPerPage, filteredMemories.length)} of {filteredMemories.length}
                            </span>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-400 dark:text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-50"
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-400 dark:text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-50"
                                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredMemories.length / rowsPerPage), prev + 1))}
                                    disabled={currentPage >= Math.ceil(filteredMemories.length / rowsPerPage)}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
            {/* Delete Confirmation Dialog */}
            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmation.open} onOpenChange={(open) => setDeleteConfirmation({ ...deleteConfirmation, open })}>
                <DialogContent className="bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-red-400" />
                            {deleteConfirmation.type === 'bulk' ? 'Bulk Delete' : 'Delete Memory'}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 dark:text-slate-600 dark:text-slate-400">
                            {deleteConfirmation.type === 'bulk'
                                ? `Are you sure you want to delete ${deleteConfirmation.ids.length} selected memories? This action cannot be undone.`
                                : "This memory will be permanently removed from the system. This action cannot be undone."}
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => setDeleteConfirmation({ ...deleteConfirmation, open: false })}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={handleConfirmDelete}
                        >
                            Delete {deleteConfirmation.type === 'bulk' ? `(${deleteConfirmation.ids.length})` : ''}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Expiry Update Dialog */}
            <Dialog open={expiryDialog.open} onOpenChange={(open) => setExpiryDialog(prev => ({ ...prev, open }))}>
                <DialogContent className="bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-amber-500" />
                            Update Expiry Date
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 dark:text-slate-600 dark:text-slate-400">
                            Choose a new expiry date for this memory.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-3 rounded-md border border-slate-300 dark:border-slate-800">
                            <Checkbox
                                id="permanent"
                                checked={!expiryDialog.date}
                                onCheckedChange={(checked) => setExpiryDialog(prev => ({ ...prev, date: checked ? "" : new Date().toISOString().split('T')[0] }))}
                                className="border-slate-600 data-[state=checked]:bg-blue-600"
                            />
                            <label htmlFor="permanent" className="text-sm font-medium leading-none text-slate-900 dark:text-slate-200 cursor-pointer select-none flex-1">
                                Permanent Memory (No Expiry)
                            </label>
                        </div>

                        <div className={`space-y-2 transition-opacity duration-200 ${!expiryDialog.date ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                            <label className="text-xs text-slate-400 dark:text-slate-600 dark:text-slate-400 font-medium ml-1">Or select expiry date</label>
                            <Input
                                type="date"
                                value={expiryDialog.date}
                                onChange={(e) => setExpiryDialog(prev => ({ ...prev, date: e.target.value }))}
                                className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setExpiryDialog(prev => ({ ...prev, open: false }))}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                            onClick={handleUpdateExpiry}
                        >
                            Update Date
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
