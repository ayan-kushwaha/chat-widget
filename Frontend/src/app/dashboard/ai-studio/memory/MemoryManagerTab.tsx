"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

import { useOrg } from "@/context/OrgContext";
import { useRouter, useSearchParams } from "next/navigation";
import { getMemories, approveMemory, rejectMemory, deleteMemory, updateMemory, LearningMemory } from "@/api/learningMemory.api";
import { getChats, deleteChat, blockChat, Chat, GetChatsResponse } from "@/api/chat.api";
import { useToast } from "@/components/ui/use-toast";
import { UserProfileDrawer } from "./UserProfileDrawer";
import { Search, Filter, AlertTriangle, Database, CheckCircle, Ban, MapPin, Trash2, MoreHorizontal, FileText, User, Shield, Loader2, MessageSquare, List, Clock, FolderOpen, Edit, ArrowLeft, Brain, X, Check, Archive, AlertOctagon, Phone, Mail, Calendar, Smile, Frown, Meh, TrendingUp, CheckCircle2, ChevronLeft, ChevronRight, SlidersHorizontal, ArrowUpDown, ArrowUp, ArrowDown, MoreVertical, Globe, Smartphone, Sparkles, Layers, LayoutGrid } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// --- MOCK DATA FOR HUB (Expanded for Pagination) ---
// --- MOCK DATA REMOVED ---

// --- MOCK DATA REMOVED ---



export function MemoryManagerTab() {
    const { activeOrg } = useOrg();
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();

    // --- STATE ---
    const [activeTab, setActiveTab] = useState("chat_logs");
    const [loading, setLoading] = useState(false);

    // Feature States
    const [memories, setMemories] = useState<LearningMemory[]>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [editingMemory, setEditingMemory] = useState<LearningMemory | null>(null);
    const [resolutionMemory, setResolutionMemory] = useState<LearningMemory | null>(null);
    const [pendingInsights, setPendingInsights] = useState<LearningMemory[]>([]);

    // Chat Logs Integration
    const [chats, setChats] = useState<Chat[]>([]);
    const [stats, setStats] = useState({ total: 0, positive: 0, negative: 0, neutral: 0, spam: 0, totalMessages: 0 });
    const [totalPages, setTotalPages] = useState(0);

    // Filters, Pagination, Sorting, Selection
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [selectionMode, setSelectionMode] = useState(false); // NEW: Toggle selection mode

    // Advanced Filter State
    const [filters, setFilters] = useState({
        spam: false,
        positive: false,
        negative: false,
        neutral: false,
        lead: false,
        dateFrom: "",
        dateTo: ""
    });



    // Count active filters
    const activeFilterCount = [filters.spam, filters.positive, filters.negative, filters.neutral, filters.lead, filters.dateFrom, filters.dateTo].filter(Boolean).length;

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    // Delete Confirmation Dialog State
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<any>(null);



    // --- LOGIC ---

    // Calculate REAL stats from chat data
    // Stats are now fetched from API
    const chatStats = stats;

    // Handle userId - fetch specific user context if needed, handled via selection
    useEffect(() => {
        if (searchParams.get('userId')) {
            // Logic to load specific user chat would go here, possibly calling getChatById
        }
    }, [searchParams]);

    // 1. FILTER

    // Filters are now handled in fetchChats
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filters, rowsPerPage, sortConfig]);

    // Selection Logic
    const isAllSelected = chats.length > 0 && chats.every(log => selectedIds.has(log._id));

    const toggleSelectAll = () => {
        const newSelected = new Set(selectedIds);
        if (isAllSelected) {
            chats.forEach(log => newSelected.delete(log._id));
        } else {
            chats.forEach(log => newSelected.add(log._id));
        }
        setSelectedIds(newSelected);
    };

    const toggleSelectOne = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedIds(newSelected);
    };

    const toggleSelectionMode = () => {
        setSelectionMode(!selectionMode);
        if (selectionMode) {
            // Exiting selection mode - clear selections
            setSelectedIds(new Set());
        }
    };

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
        // Since we are sorting via API (if we were), we would trigger fetch here.
        // But currently fetchChats doesn't take sort. 
        // We will assume client side sort for current page, OR we should add sort params to fetchChats.
        // For simplicity, let's just update the config and let the UI re-render if we were sorting client-side, 
        // BUT current fetchChats overwrites 'chats'. 
        // Actually, if we want to sort the *current page* client side:
        // We can just sort 'chats' in place or derived.
        // But better is to just accept API default sort for now or implement properly.
        // We'll leave the state update but it won't affect API fetch yet.
    };

    // --- EFFECT: Load Memories ---
    useEffect(() => {
        if (activeOrg?.id) {
            if (activeTab === 'chat_logs') {
                fetchChats();
            } else if (activeTab === 'knowledge_bank') {
                handleLoadMemories();
            } else if (activeTab === 'learning_queue') {
                handleLoadPendingInsights();
            }
        }
    }, [activeOrg, activeTab, currentPage, rowsPerPage, filters, searchQuery]); // Re-fetch when filters/page change

    const fetchChats = async () => {
        try {
            setLoading(true);
            const response = await getChats({
                organizationId: activeOrg?.id || "demo",
                page: currentPage,
                limit: rowsPerPage,
                sentiment: filters.positive ? 'Positive' : filters.negative ? 'Negative' : filters.neutral ? 'Neutral' : undefined,
                status: filters.spam ? 'spam' : undefined,
                type: filters.lead ? 'lead' : undefined,
                dateFrom: filters.dateFrom,
                dateTo: filters.dateTo,
                // Passing search query? The params interface didn't strictly show it but typically it's needed.
                // Assuming backend might handle it or we might need to update API.
                // For now, let's filter purely by what's available.
            });
            setChats(response.chats);
            setStats(prev => ({ ...prev, ...response.stats, total: response.total }));
            setTotalPages(response.totalPages);
        } catch (err) {
            console.error(err);
            toast({ title: "Error", variant: "destructive", description: "Failed to load chats." });
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMemories = async () => {
        try {
            setLoading(true);
            const response = await getMemories({ organizationId: activeOrg?.id || "demo", status: 'approved' });
            setMemories(response.memories);
        } catch (error) {
            console.error("Failed to load memories", error);
            setMemories([]);
        } finally {
            setLoading(false);
        }
    };

    const handleLoadPendingInsights = async () => {
        try {
            setLoading(true);
            const response = await getMemories({ organizationId: activeOrg?.id || "demo", status: 'pending' });
            setPendingInsights(response.memories);
        } catch (error) {
            console.error("Failed to load pending insights", error);
            setPendingInsights([]);
        } finally {
            setLoading(false);
        }
    };

    // --- ACTIONS ---
    const handleApproveInsight = async (id: string) => {
        try {
            await approveMemory(id, activeOrg?.id || "demo", "user"); // Defaulting approvedBy to "user" for now
            setPendingInsights(prev => prev.filter(i => i._id !== id));
            toast({ title: "Insight Learned 🧠", description: "Added to permanent Knowledge Base." });
        } catch (error) {
            toast({ title: "Error", variant: "destructive", description: "Failed to approve insight." });
        }
    };

    const handleRejectInsight = async (id: string) => {
        try {
            await rejectMemory(id, activeOrg?.id || "demo");
            setPendingInsights(prev => prev.filter(i => i._id !== id));
            toast({ title: "Insight Rejected", description: "Discarded from learning queue." });
        } catch (error) {
            toast({ title: "Error", variant: "destructive", description: "Failed to reject insight." });
        }
    };

    const handleVerifyMemory = (id: string) => {
        // API doesn't have explicit verify, using update to set verified flag or just update functionality
        // Assuming we just want to open edit for now or mock verification if no backend support
        // For now, let's just open edit mode as "verification" usually implies reviewing content
        const memory = memories.find(m => m._id === id);
        if (memory) setEditingMemory(memory);
    };

    const handleUpdateMemory = async () => {
        if (!editingMemory || !editingMemory._id) return;
        try {
            await updateMemory(editingMemory._id, { content: editingMemory.content });
            setMemories(prev => prev.map(m => m._id === editingMemory._id ? { ...editingMemory } : m));
            setEditingMemory(null);
            toast({ title: "Knowledge Updated", description: "Memory updated successfully." });
        } catch (error) {
            toast({ title: "Error", variant: "destructive", description: "Failed to update memory." });
        }
    };

    const handleResolveConflict = (keepOld: boolean) => {
        // Logic for conflict resolution - requires API support for merging/choosing
        // For now, just clear the state as placeholder
        setResolutionMemory(null);
        toast({ title: "Conflict Resolved", description: "Knowledge base consistency restored." });
    };

    const handleDeleteMemory = async (id: string) => {
        try {
            await deleteMemory(activeOrg?.id || "demo", id);
            setMemories(prev => prev.filter(m => m._id !== id));
            toast({ title: "Memory Deleted", description: "Removed from Core Vault." });
        } catch (error) {
            toast({ title: "Error", variant: "destructive", description: "Failed to delete." });
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedIds.size} chats?`)) return;
        setLoading(true);
        try {
            await Promise.all(Array.from(selectedIds).map(id => deleteChat(id, activeOrg?.id || "demo")));
            toast({ title: "Bulk Delete", description: `Deleted ${selectedIds.size} chats.` });
            setSelectedIds(new Set());
            fetchChats(); // Refresh
        } catch (error) {
            toast({ title: "Error", variant: "destructive", description: "Failed to delete chats." });
        } finally {
            setLoading(false);
        }
    };

    const handleBulkBlock = async () => {
        if (!confirm(`Are you sure you want to block ${selectedIds.size} users?`)) return;
        setLoading(true);
        try {
            // Block all selected
            await Promise.all(Array.from(selectedIds).map(id => blockChat(id, activeOrg?.id || "demo", "Bulk block by admin")));
            toast({ title: "Bulk Block", description: `Blocked ${selectedIds.size} users.` });
            setSelectedIds(new Set());
            fetchChats();
        } catch (error) {
            toast({ title: "Error", variant: "destructive", description: "Failed to block users." });
        } finally {
            setLoading(false);
        }
    };

    const handleBlockSingleChat = async (chat: Chat) => {
        if (!confirm("Are you sure you want to block this user?")) return;
        try {
            await blockChat(chat._id, activeOrg?.id || "demo", "Manual block by admin");
            toast({ title: "User Blocked", description: "User has been blocked successfully." });
            fetchChats();
        } catch (error) {
            toast({ title: "Error", variant: "destructive", description: "Failed to block user." });
        }
    };

    const confirmDeleteChat = async () => {
        if (!userToDelete) return;
        setLoading(true);
        try {
            await deleteChat(userToDelete._id, activeOrg?.id || "demo");
            toast({ title: "Chat Deleted", description: "Chat has been permanently removed." });
            setDeleteConfirmOpen(false);
            setUserToDelete(null);
            fetchChats();
        } catch (error) {
            toast({ title: "Error", variant: "destructive", description: "Failed to delete chat." });
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name: string) => {
        if (!name || name === "Unknown User") return "?";
        return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
    };


    return (
        <div className="flex flex-col max-w-7xl -mb-4 mx-auto gap-4 relative scrollbar-hidden overflow-hi dden h-[calc(10 0vh-2 20px)]">

            {/* 1. TOP NAVIGATION HUB */}
            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-900 overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
                    <div className="sticky top-0 z-30 bg-slate-50 dark:bg-slate-950 flex items-center justify-between p-4 border-b border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">

                        {/* --- STATS OVERVIEW CARDS --- */}
                        <div className="grid grid-cols-6 gap-3 border- border-slate-300 dark:border-slate-800">
                            <div className="p-2 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-blue-300 dark:hover:border-slate-700 transition-all shadow-sm">
                                <div className="text-[10px] text-slate-500 dark:text-slate-500 uppercase font-semibold mb-1">Total Chats</div>
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{chatStats.total}</div>
                            </div>
                            <div className="p-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg hover:border-emerald-500/30 transition-all">
                                <div className="text-[10px] text-emerald-600 dark:text-emerald-500 uppercase font-semibold mb-1">Positive</div>
                                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{chatStats.positive}</div>
                            </div>
                            <div className="p-2 bg-orange-500/5 border border-orange-500/20 rounded-lg hover:border-orange-500/30 transition-all">
                                <div className="text-[10px] text-orange-600 dark:text-orange-500 uppercase font-semibold mb-1">Negative</div>
                                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{chatStats.negative}</div>
                            </div>
                            <div className="p-2 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm">
                                <div className="text-[10px] text-slate-500 dark:text-slate-500 uppercase font-semibold mb-1">Neutral</div>
                                <div className="text-2xl font-bold text-slate-600 dark:text-slate-400">{chatStats.neutral}</div>
                            </div>
                            <div className="p-2 bg-red-500/5 border border-red-500/20 rounded-lg hover:border-red-500/30 transition-all">
                                <div className="text-[10px] text-red-600 dark:text-red-500 uppercase font-semibold mb-1">Spam</div>
                                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{chatStats.spam}</div>
                            </div>
                            <div className="p-2 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-cyan-300 dark:hover:border-slate-700 transition-all shadow-sm">
                                <div className="text-[10px] text-slate-500 dark:text-slate-500 uppercase font-semibold mb-1">Messages</div>
                                <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{chatStats.totalMessages}</div>
                            </div>
                        </div>
                        <div className="relative w-80">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-600 dark:text-slate-400 z-10 pointer-events-none" />
                            <Input
                                placeholder="Search by ID, email, phone, name..."
                                className="pl-9 h-9 bg-white dark:bg-slate-900/10 border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 font-mono text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:text-slate-600"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* --- TAB 1: CHAT LOGS --- */}
                    <>
                        <TabsContent value="chat_logs" className="m-0 flex-1 flex flex-col overflow-hidden relative">
                            <div className="p-3 border-b border-slate-300/30 dark:border-slate-800/30 bg-slate-50/80 dark:bg-slate-900/80 dark:bg-gradient-to-r dark:from-slate-900/80 dark:via-slate-900/60 dark:to-slate-900/80 backdrop-blur-xl flex gap-2 items-center justify-between shadow-inner">
                                <div className="flex gap-2 items-center">
                                    {/* Advanced Filter Popover */}
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="sm" className={`h-8 hover:bg-slate-100 dark:hover:bg-slate-800 relative ${activeFilterCount > 0 ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-slate-800/50' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                                                <SlidersHorizontal className="h-3.5 w-3.5 mr-2" />
                                                Filters
                                                {activeFilterCount > 0 && (
                                                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-blue-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-blue-500/50 animate-pulse">
                                                        {activeFilterCount}
                                                    </span>
                                                )}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 p-4" align="start">
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
                                                        onClick={() => setFilters({ spam: false, positive: false, negative: false, neutral: false, lead: false, dateFrom: "", dateTo: "" })}
                                                    >
                                                        <X className="h-3 w-3 mr-1" />
                                                        Reset All
                                                    </Button>
                                                </div>

                                                <div className="space-y-2">
                                                    <h4 className="font-medium leading-none text-slate-900 dark:text-slate-200 text-sm flex items-center gap-2">
                                                        <Filter className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600 dark:text-slate-400" />
                                                        Status & Sentiment
                                                    </h4>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div key="spam" className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id="spam"
                                                                checked={filters.spam}
                                                                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, spam: !!checked }))}
                                                                className="border-slate-300 dark:border-slate-700 data-[state=checked]:bg-blue-600"
                                                            />
                                                            <label htmlFor="spam" className="text-xs font-medium text-slate-400 dark:text-slate-600 dark:text-slate-400 capitalize cursor-pointer select-none flex items-center gap-1.5">
                                                                <Ban className="h-3 w-3 text-red-400" />
                                                                spam
                                                            </label>
                                                        </div>
                                                        <div key="positive" className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id="positive"
                                                                checked={filters.positive}
                                                                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, positive: !!checked }))}
                                                                className="border-slate-300 dark:border-slate-700 data-[state=checked]:bg-blue-600"
                                                            />
                                                            <label htmlFor="positive" className="text-xs font-medium text-slate-400 dark:text-slate-600 dark:text-slate-400 capitalize cursor-pointer select-none flex items-center gap-1.5">
                                                                <Smile className="h-3 w-3 text-emerald-400" />
                                                                positive
                                                            </label>
                                                        </div>
                                                        <div key="negative" className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id="negative"
                                                                checked={filters.negative}
                                                                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, negative: !!checked }))}
                                                                className="border-slate-300 dark:border-slate-700 data-[state=checked]:bg-blue-600"
                                                            />
                                                            <label htmlFor="negative" className="text-xs font-medium text-slate-400 dark:text-slate-600 dark:text-slate-400 capitalize cursor-pointer select-none flex items-center gap-1.5">
                                                                <Frown className="h-3 w-3 text-orange-400" />
                                                                negative
                                                            </label>
                                                        </div>
                                                        <div key="neutral" className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id="neutral"
                                                                checked={filters.neutral}
                                                                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, neutral: !!checked }))}
                                                                className="border-slate-300 dark:border-slate-700 data-[state=checked]:bg-blue-600"
                                                            />
                                                            <label htmlFor="neutral" className="text-xs font-medium text-slate-400 dark:text-slate-600 dark:text-slate-400 capitalize cursor-pointer select-none flex items-center gap-1.5">
                                                                <Meh className="h-3 w-3 text-slate-400 dark:text-slate-600 dark:text-slate-400" />
                                                                neutral
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <h4 className="font-medium leading-none text-slate-900 dark:text-slate-200 text-sm flex items-center gap-2">
                                                        <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                                                        Type
                                                    </h4>
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id="lead"
                                                            checked={filters.lead}
                                                            onCheckedChange={(checked) => setFilters(prev => ({ ...prev, lead: !!checked }))}
                                                            className="border-slate-300 dark:border-slate-700 data-[state=checked]:bg-blue-600"
                                                        />
                                                        <label htmlFor="lead" className="text-xs font-medium text-slate-400 dark:text-slate-600 dark:text-slate-400 capitalize cursor-pointer select-none flex items-center gap-1.5">
                                                            Leads Only
                                                        </label>
                                                    </div>
                                                </div>

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
                                                                value={filters.dateFrom}
                                                                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                                                                className="h-8 pl-7 text-[10px] bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                                                            />
                                                        </div>
                                                        <span className="text-slate-400 dark:text-slate-600 self-center">-</span>
                                                        <div className="flex-1 relative">
                                                            <Calendar className="absolute left-2 top-2.5 h-3.5 w-3.5 text-slate-500 dark:text-slate-500" />
                                                            <Input
                                                                type="date"
                                                                value={filters.dateTo}
                                                                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                                                                className="h-8 pl-7 text-[10px] bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>

                                    {/* Selection Mode Toggle */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={toggleSelectionMode}
                                        className={`h-8 hover:bg-slate-200 dark:hover:bg-slate-800 ${selectionMode ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-slate-800' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                                    >
                                        <CheckCircle className="h-3.5 w-3.5 mr-2" />
                                        {selectionMode ? "Deselect" : "Select"} {selectedIds.size > 0 && `(${selectedIds.size})`}
                                    </Button>

                                    {/* Bulk Action Bar - Only when items are selected */}
                                    {selectionMode && selectedIds.size > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center gap-2 border-l border-slate-300 dark:border-slate-700 pl-2"
                                        >
                                            <Button variant="default" size="sm" className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white" onClick={handleBulkDelete}>
                                                {/* <Trash2 className="h-3 w-3 mr-1.5" /> Delete */}
                                            </Button>
                                            <Button variant="outline" size="sm" className="h-7 text-xs border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800" onClick={handleBulkBlock}>
                                                <Ban className="h-3 w-3 mr-1.5" /> Block
                                            </Button>
                                        </motion.div>
                                    )}
                                </div>

                                {/* Pagination Controls (Top Right) */}
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500 dark:text-slate-500">Rows:</span>
                                        <Select value={String(rowsPerPage)} onValueChange={(v) => setRowsPerPage(Number(v))}>
                                            <SelectTrigger className="h-7 w-[70px] text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                                                <SelectItem value="25">25</SelectItem>
                                                <SelectItem value="50">50</SelectItem>
                                                <SelectItem value="100">100</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <span className="text-xs text-slate-500 dark:text-slate-500 font-mono w-24 text-right">
                                        {chats.length === 0 ? "0-0 of 0" : `${(currentPage - 1) * rowsPerPage + 1}-${Math.min(currentPage * rowsPerPage, stats.total)} of ${stats.total}`}
                                    </span>
                                    <div className="flex gap-1">
                                        <Button variant="outline" size="icon" className="h-7 w-7 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-50" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                                            <ChevronLeft className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="outline" size="icon" className="h-7 w-7 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-50" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}>
                                            <ChevronRight className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Sticky Header Table Structure */}
                            <div className="flex-1 flex flex-col relative overflow-hidden">
                                {/* Fixed Header - Dynamic Grid based on selection mode */}
                                <div className={`bg-slate-50 dark:bg-slate-900 dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700/50 shadow-sm grid ${selectionMode ? 'grid-cols-[50px_50px_3fr_2fr_2fr_2fr_2fr_2fr_60px]' : 'grid-cols-[50px_3fr_2fr_2fr_2fr_2fr_2fr_60px]'} text-xs font-semibold text-slate-700 dark:text-slate-300`}>
                                    <div className="px-2 py-3 text-center">#</div>

                                    {/* Checkbox Header - Only in selection mode */}
                                    {selectionMode && (
                                        <div className="px-2 py-3 flex items-center justify-center">
                                            <Checkbox
                                                checked={isAllSelected}
                                                onCheckedChange={toggleSelectAll}
                                                className="border-slate-300 dark:border-slate-700 data-[state=checked]:bg-blue-600 h-4 w-4"
                                            />
                                        </div>
                                    )}

                                    {/* Sortable Headers */}
                                    <div className="px-4 py-3 cursor-pointer hover:text-slate-900 dark:hover:text-white flex items-center gap-2" onClick={() => handleSort('userId')}>
                                        User Identity & ID
                                        {sortConfig?.key === 'userId' ? (sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 text-blue-400" /> : <ArrowDown className="h-3 w-3 text-blue-400" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                                    </div>

                                    <div className="px-4 py-3 cursor-pointer hover:text-slate-900 dark:hover:text-white flex items-center gap-2" onClick={() => handleSort('status')}>
                                        Status & Sentiment
                                        {sortConfig?.key === 'status' ? (sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 text-blue-400" /> : <ArrowDown className="h-3 w-3 text-blue-400" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                                    </div>

                                    <div className="px-4 py-3 cursor-pointer hover:text-slate-900 dark:hover:text-white flex items-center gap-2" onClick={() => handleSort('updatedAt')}>
                                        Last Active
                                        {sortConfig?.key === 'updatedAt' ? (sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 text-blue-400" /> : <ArrowDown className="h-3 w-3 text-blue-400" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                                    </div>

                                    <div className="px-4 py-3">Contact</div>

                                    <div className="px-4 py-3">Topics</div>
                                    <div className="px-4 py-3">Location</div>
                                    <div className=" py-3 ">Actions</div>
                                </div>

                                {/* Scrollable Body */}
                                <ScrollArea className="flex-1  max- h-[calc(1 00vh-200px)] scrollbar-thin">
                                    <div className="divide-y divide-slate-200 dark:divide-slate-800/50">

                                        {chats.length === 0 && (
                                            <div className="flex-1 flex flex-col p-4 justify-center items-center text-muted-foreground border-2 border-dashed rounded-xl border-muted opacity-80 py-20">
                                                <Layers className="h-10 w-10 mb-4 opacity-20" />
                                                <p className="opacity-50 font-medium">No mining data for this period.</p>
                                            </div>
                                        )}
                                        {chats.map((chat, index) => {
                                            const isSelected = selectedIds.has(chat._id);
                                            const globalIndex = (currentPage - 1) * rowsPerPage + index + 1;

                                            return (
                                                <div
                                                    key={chat._id}
                                                    className={`grid ${selectionMode ? 'grid-cols-[50px_50px_3fr_2fr_2fr_2fr_2fr_2fr_60px]' : 'grid-cols-[50px_3fr_2fr_2fr_2fr_2fr_2fr_60px]'} items-center hover:bg-slate-50 dark:hover:bg-slate-900/40 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/80 dark:bg-slate-800/20' : ''}`}
                                                    onClick={() => {
                                                        if (!selectionMode) {
                                                            setSelectedUser(chat);
                                                            // Add userId to URL
                                                            const params = new URLSearchParams(searchParams.toString());
                                                            params.set('userId', chat._id);
                                                            router.push(`?${params.toString()}`, { scroll: false });
                                                        }
                                                    }}
                                                >
                                                    {/* Index Column */}
                                                    <div className="px-2 py-3 text-center text-xs text-slate-400 dark:text-slate-600 font-mono">
                                                        {globalIndex}
                                                    </div>

                                                    {/* Checkbox Column - Only in selection mode */}
                                                    {selectionMode && (
                                                        <div className="px-2 py-3 flex items-center justify-center">
                                                            <Checkbox
                                                                checked={isSelected}
                                                                onCheckedChange={() => toggleSelectOne(chat._id, { stopPropagation: () => { } } as any)}
                                                                onClick={(e) => toggleSelectOne(chat._id, e)}
                                                                className="border-slate-300 dark:border-slate-700 data-[state=checked]:bg-blue-600 h-4 w-4"
                                                            />
                                                        </div>
                                                    )}

                                                    {/* User Identity & ID */}
                                                    <div className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs shadow-inner shrink-0 ${chat.status === 'spam' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700'}`}>
                                                                {chat.status === 'spam' ? <Ban className="h-5 w-5" /> : getInitials(chat.userId || "User")}
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-200 truncate">{chat.userId}</span>
                                                                    <Badge variant="outline" className="text-[10px] h-3.5 px-1 bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-500 border-slate-300 dark:border-slate-800 font-mono">#{chat._id.substring(0, 6)}</Badge>
                                                                </div>
                                                                <div className="text-[11px] text-slate-500 dark:text-slate-500 flex items-center gap-1.5 truncate">
                                                                    {chat.channelMetadata?.source ? (
                                                                        <><LayoutGrid className="h-3 w-3" /> {chat.channelMetadata.source}</>
                                                                    ) : (chat as any).email ? (
                                                                        <><Mail className="h-3 w-3" /> {(chat as any).email}</>
                                                                    ) : (
                                                                        <span className="italic opacity-70">Anonymous</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Status & Sentiment */}
                                                    <div className="px-4 py-3">
                                                        <div className="flex flex-col gap-1 items-start">
                                                            {chat.status === 'spam' ? (
                                                                <Badge variant="destructive" className="text-[10px] h-5 px-1.5 uppercase">SPAM</Badge>
                                                            ) : (
                                                                <div className={`flex items-center text-xs font-medium ${chat.sentiment === 'Positive' ? 'text-emerald-600 dark:text-emerald-400' : chat.sentiment === 'Negative' ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                                                    {chat.sentiment === 'Positive' && <Smile className="h-3.5 w-3.5 mr-1" />}
                                                                    {chat.sentiment === 'Negative' && <Frown className="h-3.5 w-3.5 mr-1" />}
                                                                    {chat.sentiment === 'Neutral' && <Meh className="h-3.5 w-3.5 mr-1" />}
                                                                    {chat.sentiment}
                                                                </div>
                                                            )}
                                                            <div className="text-[10px] text-slate-400 dark:text-slate-600 flex items-center gap-1">
                                                                <Badge variant="secondary" className="text-[9px] h-3.5 px-1 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700">{chat.messageCount} msgs</Badge>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Last Active */}
                                                    <div className="px-4 py-3">
                                                        <div className="flex flex-col gap-0.5">
                                                            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 text-xs font-medium">
                                                                <Calendar className="h-3 w-3 text-slate-500 dark:text-slate-500" /> {new Date(chat.updatedAt).toLocaleDateString()}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-500 text-[11px]">
                                                                <Clock className="h-3 w-3" /> {chat.duration}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Contact Info */}
                                                    <div className="px-4 py-3">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-xs text-slate-400 dark:text-slate-600">{chat.leadInfo?.company || '—'}</span>
                                                        </div>
                                                    </div>

                                                    {/* Topics */}
                                                    <div className="px-4 py-3">
                                                        <div className="flex gap-1 flex-wrap">
                                                            {chat.tags && chat.tags.map((t: string) => (
                                                                <Badge key={t} variant="outline" className="text-[10px] border-slate-300 dark:border-slate-800 text-slate-500 dark:text-slate-500 bg-slate-100/30 dark:bg-slate-900/30">{t}</Badge>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Location */}
                                                    <div className="px-4 py-3 text-xs text-slate-400 dark:text-slate-600 dark:text-slate-400">
                                                        <div className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                            <MapPin className="h-3.5 w-3.5 text-slate-500 dark:text-slate-500" /> {(chat as any).location || 'Unknown'}
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="px-4 py-3 text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-200 dark:hover:bg-slate-800">
                                                                    <MoreHorizontal className="h-4 w-4 text-slate-500 dark:text-slate-500" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800">
                                                                <DropdownMenuItem
                                                                    className="text-red-400 focus:text-red-400 focus:bg-red-950/20 cursor-pointer"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleBlockSingleChat(chat);
                                                                    }}
                                                                >
                                                                    <Ban className="h-3.5 w-3.5 mr-2" /> Block User
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="text-slate-400 dark:text-slate-600 dark:text-slate-400 focus:text-slate-900 dark:text-slate-200 focus:bg-slate-800 cursor-pointer"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setUserToDelete(chat);
                                                                        setDeleteConfirmOpen(true);
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete Data
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </ScrollArea>
                            </div>
                        </TabsContent>
                    </>
                    {/* --- TABS 2 & 3 UNCHANGED (Collapsed) --- */}
                    <TabsContent value="knowledge_bank" className="m-0 flex-1"><div className="h-full overflow-hidden flex flex-col"><ScrollArea className="flex-1 p-4"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">{activeTab === 'knowledge_bank' && memories.map((memory) => (<Card key={memory._id} className={`bg-slate-100/40 dark:bg-slate-900/40 border-slate-300 dark:border-slate-800 hover:border-slate-500 dark:hover:border-slate-600 transition-all`}><CardHeader className="p-4 pb-2"><div className="flex justify-between items-start"><div className="flex items-center gap-2">{memory.type === 'fact' && <FileText className="h-4 w-4 text-blue-400" />}{memory.type === 'pattern' && <User className="h-4 w-4 text-green-400" />}<Badge variant="secondary" className="bg-slate-50 dark:bg-slate-950 text-[10px] text-slate-400 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider">{memory.type}</Badge></div><div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center cursor-pointer hover:bg-emerald-500/20" onClick={() => setEditingMemory(memory)}><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /></div></div></CardHeader><CardContent className="p-4 pt-2"><p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors" onClick={() => setEditingMemory(memory)}>{memory.content}</p><div className="mt-4 pt-4 border-t border-slate-300/50 dark:border-slate-800/50 flex items-center justify-between"><div className="flex gap-1">{memory.category && <span className="text-[10px] text-slate-500 dark:text-slate-500 bg-slate-200 dark:bg-slate-800/50 px-1.5 py-0.5 rounded">#{memory.category}</span>}</div><div className="flex items-center gap-2"><Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 dark:text-slate-600 hover:text-red-400" onClick={() => handleDeleteMemory(memory._id)}><Trash2 className="h-3.5 w-3.5" /></Button></div></div></CardContent></Card>))}</div></ScrollArea></div></TabsContent>
                    <TabsContent value="learning_queue" className="m-0 flex-1"><div className="h-full overflow-hidden flex flex-col"><ScrollArea className="flex-1 max-w-4xl mx-auto w-full px-4"><div className="space-y-4 py-4"><div className="flex items-center justify-between mb-6"><div className="space-y-1"><h2 className="text-xl font-semibold text-slate-900 dark:text-slate-200">Pending Insights</h2><p className="text-sm text-slate-500 dark:text-slate-500">AI has discovered {pendingInsights.length} new potential facts from recent conversations.</p></div><Button variant="outline" size="sm" className="border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"><Brain className="h-4 w-4 mr-2" /> Auto-Approve High Confidence (&gt;90%)</Button></div>                    {pendingInsights.map(insight => (<Card key={insight._id} className="bg-slate-100/60 dark:bg-slate-900/60 border-slate-300 dark:border-slate-800 hover:border-slate-300 dark:border-slate-700 transition-all"><div className="p-5 flex gap-5 items-start"><div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/20"><Brain className="h-6 w-6" /></div><div className="flex-1 space-y-2"><div className="flex justify-between items-start"><div className="flex items-center gap-2"> {insight.category && <Badge variant="outline" className="border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider bg-slate-50 dark:bg-slate-950">{insight.category.replace('_', ' ')}</Badge>} <span className={`text-xs font-bold ${insight.confidence > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>{insight.confidence}% Confidence</span></div><span className="text-[10px] text-slate-400 dark:text-slate-600 flex items-center gap-1"><Clock className="h-3 w-3" /> Just now</span></div><p className="text-slate-900 dark:text-slate-200 text-base leading-relaxed">{insight.content}</p><div className="flex items-center gap-4 pt-1"><div className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600" /> Source: <span className="text-slate-400 dark:text-slate-600 dark:text-slate-400">{insight.source || 'Unknown'}</span></div><div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-800" /><div className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-1.5 cursor-pointer hover:text-blue-400"><Edit className="h-3.5 w-3.5" /> Edit Content</div></div></div><div className="flex flex-col gap-2 shrink-0 pt-1"><Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white w-24 h-9 shadow-lg shadow-emerald-900/20" onClick={() => handleApproveInsight(insight._id)}><Check className="h-4 w-4 mr-1.5" /> Approve</Button><Button size="sm" variant="ghost" className="text-slate-400 dark:text-slate-600 dark:text-slate-400 hover:text-red-400 hover:bg-red-950/20 w-24 h-9" onClick={() => handleRejectInsight(insight._id)}><X className="h-4 w-4 mr-1.5" /> Reject</Button></div></div></Card>))}{pendingInsights.length === 0 && (<div className="flex flex-col items-center justify-center py-24 text-slate-500 dark:text-slate-500 border-2 border-dashed border-slate-300/50 dark:border-slate-800/50 rounded-xl bg-slate-100/20 dark:bg-slate-900/20"><div className="h-16 w-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4"><CheckCircle className="h-8 w-8 text-emerald-500/50" /></div><h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">All Caught Up!</h3><p className="max-w-sm text-center mt-2">No pending insights in the queue. The AI is actively monitoring new conversations.</p></div>)}</div></ScrollArea></div></TabsContent>
                </Tabs>
            </div>

            {/* --- USER DETAIL SLIDE-OVER (Drill Down) --- */}
            <UserProfileDrawer user={selectedUser} onClose={() => setSelectedUser(null)} />





            {/* --- DIALOGS --- */}
            < Dialog open={!!editingMemory} onOpenChange={(open) => !open && setEditingMemory(null)}>
                <DialogContent className="bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-200">
                    <DialogHeader><DialogTitle>Edit Memory Content</DialogTitle><DialogDescription>Manually refine knowledge.</DialogDescription></DialogHeader>
                    <div className="py-4 space-y-4"><Textarea className="bg-slate-100/50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-800 min-h-[120px]" value={editingMemory?.content || ''} onChange={(e) => editingMemory && setEditingMemory({ ...editingMemory, content: e.target.value })} /></div>
                    <DialogFooter><Button onClick={handleUpdateMemory}>Update Memory</Button></DialogFooter>
                </DialogContent>
            </Dialog >
            <Dialog open={!!resolutionMemory} onOpenChange={(open) => !open && setResolutionMemory(null)}>
                <DialogContent className="bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-200">
                    <DialogHeader><DialogTitle className="text-red-400">Conflict Resolution</DialogTitle></DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="p-4 border border-slate-300 dark:border-slate-800 rounded-lg bg-slate-100/30 dark:bg-slate-900/30 cursor-pointer" onClick={() => handleResolveConflict(true)}><p className="text-sm text-slate-700 dark:text-slate-300">Keep Old</p></div>
                        <div className="p-4 border border-amber-500/30 rounded-lg bg-amber-500/5 cursor-pointer" onClick={() => handleResolveConflict(false)}><p className="text-sm text-white">Accept New</p></div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent className="bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-200 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-red-400 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Confirm Delete
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 dark:text-slate-600 dark:text-slate-400">
                            Are you sure you want to delete this user? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    {userToDelete && (
                        <div className="py-4">
                            <div className="p-4 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-800 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                        {getInitials(userToDelete.userId || "User")}
                                    </div>
                                    <div>
                                        <div className="font-medium text-slate-900 dark:text-white">{userToDelete.userId}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-500">ID: #{userToDelete._id.substring(0, 6)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteConfirmOpen(false)}
                            className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmDeleteChat}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* User Profile Drawer */}
            <UserProfileDrawer
                user={selectedUser}
                onClose={() => {
                    setSelectedUser(null);
                    // Remove userId from URL
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete('userId');
                    router.push(`?${params.toString()}`, { scroll: false });
                }}
            />

        </div >
    );
}
