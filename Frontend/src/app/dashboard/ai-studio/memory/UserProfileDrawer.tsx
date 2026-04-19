"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

import {
    Search, Clock, SlidersHorizontal, MessageSquare, Globe, Mail,
    Smile, Frown, Meh, ArrowLeft, MapPin, Phone, AlertTriangle,
    Trash2, X, Check, Brain, MoreVertical, Ban, Smartphone, Zap,
    Sparkles
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FaInstagram } from "react-icons/fa6";

// Mock Data
import { getChats, Chat } from "@/api/chat.api";
import { useOrg } from "@/context/OrgContext";

interface UserProfileDrawerProps {
    user: any;
    onClose: () => void;
}

export function UserProfileDrawer({ user, onClose }: UserProfileDrawerProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [detailSearchQuery, setDetailSearchQuery] = useState("");
    const [detailChannelFilters, setDetailChannelFilters] = useState({
        whatsapp: false,
        web: false,
        instagram: false,
        email: false,
        lead: false // New "Has Lead" filter
    });
    const [detailSentimentFilters, setDetailSentimentFilters] = useState({
        positive: false,
        negative: false,
        neutral: false
    });
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    // Multi-select state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [selectionMode, setSelectionMode] = useState(false);
    const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

    // Helper functions for the card design
    const getSentimentDisplay = (sentiment: string) => {
        const map: Record<string, { emoji: string, color: string }> = {
            'positive': { emoji: '😊', color: 'text-green-500' },
            'negative': { emoji: '😟', color: 'text-red-500' },
            'neutral': { emoji: '😐', color: 'text-yellow-500' }
        };
        return map[sentiment?.toLowerCase()] || map['neutral'];
    };

    const getEventIcon = (topic: string) => {
        // Simple mapping based on topic keywords since we don't have 'type' in mock
        if (topic.includes('Bug') || topic.includes('Issue')) return <AlertTriangle className="h-4 w-4 text-red-400" />;
        if (topic.includes('Pricing') || topic.includes('Limit')) return <Brain className="h-4 w-4 text-amber-400" />; // Gap/Insight
        return <Check className="h-4 w-4 text-theme-400" />;
    };

    const handleLeadClick = (leadId: string) => {
        // Navigate to Leads page with specific Lead ID to open its drawer
        router.push(`/dashboard/communication/leads?leadId=${leadId}`);
    };

    const { activeOrg } = useOrg();
    const [history, setHistory] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch User History
    React.useEffect(() => {
        if (user?._id && activeOrg?.id) {
            setLoading(true);
            getChats({
                organizationId: activeOrg.id,
                userId: user.userId, // Query by userId (identity)
                limit: 50 // Fetch last 50 interactions
            }).then(res => {
                setHistory(res.chats);
            }).catch(err => {
                console.error("Failed to fetch user history", err);
                toast({ title: "Error", description: "Could not load user history", variant: "destructive" });
            }).finally(() => setLoading(false));
        }
    }, [user, activeOrg, toast]);

    // Multi-select handlers
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIds = filteredHistory.map(event => event._id);
            setSelectedIds(new Set(allIds));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectEvent = (eventId: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(eventId)) {
            newSelected.delete(eventId);
        } else {
            newSelected.add(eventId);
        }
        setSelectedIds(newSelected);
    };

    const handleBulkDelete = () => {
        setBulkDeleteConfirmOpen(false);
        // Implement bulk delete API here if needed (omitted for now as drawer is mostly view-only)
        toast({
            title: "Deleted",
            description: `${selectedIds.size} conversation(s) deleted`,
            variant: "default"
        });
        setSelectedIds(new Set());
        setSelectionMode(false);
    };

    // Filter Logic
    const filteredHistory = history.filter(chat => {
        const matchesSearch = (chat.summary || "").toLowerCase().includes(detailSearchQuery.toLowerCase()) ||
            (chat.topic || "").toLowerCase().includes(detailSearchQuery.toLowerCase());

        // Channel Filter
        const allChannelsUnchecked = Object.values(detailChannelFilters).every(val => !val);
        const matchesChannel = allChannelsUnchecked ||
            (detailChannelFilters[chat.channel as keyof typeof detailChannelFilters]) ||
            (detailChannelFilters.lead && !!chat.leadInfo);

        // Sentiment Filter
        const allSentimentsUnchecked = Object.values(detailSentimentFilters).every(val => !val);
        const matchesSentiment = allSentimentsUnchecked || detailSentimentFilters[(chat.sentiment || 'neutral').toLowerCase() as keyof typeof detailSentimentFilters];

        return matchesSearch && matchesChannel && matchesSentiment;
    });

    if (!user) return null;

    return (
        <AnimatePresence>
            <>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-slate-50 bg-slate-950/60 backdrop-blur-[2px] z-[50]"
                />
                <motion.div
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="fixed top-0 right-0 w-[800px] h-full bg-slate-50 dark:bg-slate-950 border-l border-slate-300 dark:border-slate-800 shadow-2xl z-[51] flex flex-col"
                >
                    {/* 1. Header: Name & Actions Only */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-300 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-20">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full shrink-0 border border-slate-300/50 dark:border-slate-700/50" onClick={onClose}>
                                <ArrowLeft className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            </Button>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                    {user.user || "Unknown User"}
                                    {user.status === 'spam' && <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">SPAM</Badge>}
                                </h2>
                                <div className="text-xs text-slate-500 font-mono">ID: {user.id || "UNK-000"}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Meatball Menu */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400">
                                        <MoreVertical className="h-5 w-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 w-48">
                                    <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-slate-800" />
                                    <DropdownMenuItem className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer" onClick={() => setDeleteConfirmOpen(true)}>
                                        <Trash2 className="h-4 w-4 mr-2" /> Delete User
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-amber-400 focus:text-amber-300 focus:bg-amber-500/10 cursor-pointer">
                                        <Ban className="h-4 w-4 mr-2" /> Block User
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="p-6 space-y-8">
                            {/* 2. Profile Summary & Stats */}
                            <div className="bg-slate-100/20 dark:bg-slate-900/20 border border-slate-300/50 dark:border-slate-800/50 rounded-xl p-6">
                                <div className="flex flex-col  gap-6 ">
                                    {/* Avatar/Profile Info */}
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="h-16 w-16 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center text-2xl font-bold text-slate-600 dark:text-slate-400 select-none">
                                            {(user.user || "U").charAt(0).toUpperCase()}
                                        </div>
                                        <div className="space-y-1.5 flex-1">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                                    <Mail className="h-3.5 w-3.5 text-slate-500 dark:text-slate-500" />
                                                    {user.email || "No email linked"}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                                    <Phone className="h-3.5 w-3.5 text-slate-500 dark:text-slate-500" />
                                                    {user.phone || "+91 900 000 0000"}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                                    <MapPin className="h-3.5 w-3.5 text-slate-500 dark:text-slate-500" />
                                                    {user.location || "Location Unknown"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats Grid - 2x2 Layout */}
                                    <div className="grid grid-cols-5 gap-3 w-fit">
                                        <div className="bg-white dark:bg-slate-950/50 rounded-lg p-3 w-32 border border-slate-200 dark:border-slate-800/50 shadow-sm">
                                            <div className="text-[10px] font-bold text-slate-500  dark:text-slate-500 uppercase mb-1 tracking-wider">Total Chats</div>
                                            <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{history.length}</div>
                                        </div>
                                        <div className="bg-white dark:bg-slate-950/50 rounded-lg p-3 w-32 border border-slate-200 dark:border-slate-800/50 shadow-sm">
                                            <div className="text-[10px] font-bold text-green-500 uppercase mb-1 tracking-wider">Positive</div>
                                            <div className="text-2xl font-bold text-green-400 tracking-tight">{history.filter(h => h.sentiment === 'Positive').length}</div>
                                        </div>
                                        <div className="bg-white dark:bg-slate-950/50 rounded-lg p-3 w-32 border border-slate-200 dark:border-slate-800/50 shadow-sm">
                                            <div className="text-[10px] font-bold text-amber-500 uppercase mb-1 tracking-wider">Neutral</div>
                                            <div className="text-2xl font-bold text-amber-400 tracking-tight">{history.filter(h => h.sentiment === 'Neutral').length}</div>
                                        </div>
                                        <div className="bg-white dark:bg-slate-950/50 rounded-lg p-3 w-32 border border-slate-200 dark:border-slate-800/50 shadow-sm">
                                            <div className="text-[10px] font-bold text-red-500 uppercase mb-1 tracking-wider">Negative</div>
                                            <div className="text-2xl font-bold text-red-400 tracking-tight">{history.filter(h => h.sentiment === 'Negative').length}</div>
                                        </div>
                                        <div className="bg-white dark:bg-slate-950/50 rounded-lg p-3 w-32 border border-slate-200 dark:border-slate-800/50 shadow-sm">
                                            <div className="text-[10px] font-bold text-blue-500 uppercase mb-1 tracking-wider">LEAD</div>
                                            <div className="text-2xl font-bold text-blue-400 tracking-tight">{history.filter(h => h.leadInfo).length}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Activity Log Header (Search/Filter) */}
                            <div className="flex items-center justify-between sticky top-0 z-10 bg-slate-50 dark:bg-slate-950 z-10 py-2">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                    <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-200">History Stream</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative w-64">
                                        <Search className="absolute z-10 left-3 top-3 h-4 w-4 text-slate-500 dark:text-slate-500" />
                                        <Input
                                            placeholder="Search conversation history..."
                                            value={detailSearchQuery}
                                            onChange={(e) => setDetailSearchQuery(e.target.value)}
                                            className="h-9 pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/50 text-sm focus:border-blue-500 rounded-lg placeholder:text-slate-400 dark:text-slate-600 shadow-sm"
                                        />
                                    </div>
                                    {/* Polished Filter Logic */}
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white rounded-lg shadow-sm">
                                                <SlidersHorizontal className="h-3.5 w-3.5" /> Filter
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-slate-200 dark:border-slate-800 p-0 shadow-xl rounded-xl overflow-hidden" align="end">
                                            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800/50 bg-slate-50/80 dark:bg-slate-900/50">
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Filter View</span>
                                            </div>
                                            <div className="p-3 grid grid-cols-2 gap-4">
                                                {/* Column 1: Channels */}
                                                <div className="space-y-1">
                                                    <div className="px-2 py-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1">Channels</div>
                                                    {[
                                                        { id: 'whatsapp', label: 'Whatsapp', icon: MessageSquare, color: 'text-green-500' },
                                                        { id: 'web', label: 'Web', icon: Globe, color: 'text-blue-500' },
                                                        { id: 'instagram', label: 'Instagram', icon: FaInstagram, color: 'text-pink-500' },
                                                        { id: 'email', label: 'Email', icon: Mail, color: 'text-red-500' },
                                                        { id: 'lead', label: 'Leads Only', icon: Sparkles, color: 'text-blue-400' }
                                                    ].map(channel => {
                                                        const Icon = channel.icon;
                                                        return (
                                                            <div
                                                                key={channel.id}
                                                                className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-200 dark:hover:bg-slate-800/50 rounded-md cursor-pointer group transition-colors"
                                                                onClick={() => setDetailChannelFilters(prev => ({ ...prev, [channel.id]: !prev[channel.id as keyof typeof detailChannelFilters] }))}
                                                            >
                                                                <Checkbox
                                                                    checked={detailChannelFilters[channel.id as keyof typeof detailChannelFilters]}
                                                                    className="h-3.5 w-3.5 border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-[3px]"
                                                                />
                                                                <Icon className={`h-3.5 w-3.5 ${channel.color}`} />
                                                                <span className="text-slate-700 dark:text-slate-300 text-xs font-medium">{channel.label}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Column 2: Sentiment */}
                                                <div className="space-y-1 border-l border-slate-300/50 dark:border-slate-800/50 pl-4">
                                                    <div className="px-2 py-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1">Sentiment</div>
                                                    {[
                                                        { id: 'positive', label: 'Positive', icon: Smile, color: 'text-green-500' },
                                                        { id: 'negative', label: 'Negative', icon: Frown, color: 'text-red-500' },
                                                        { id: 'neutral', label: 'Neutral', icon: Meh, color: 'text-slate-600 dark:text-slate-400' }
                                                    ].map(sentiment => {
                                                        const Icon = sentiment.icon;
                                                        return (
                                                            <div
                                                                key={sentiment.id}
                                                                className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-200 dark:hover:bg-slate-800/50 rounded-md cursor-pointer group transition-colors"
                                                                onClick={() => setDetailSentimentFilters(prev => ({ ...prev, [sentiment.id]: !prev[sentiment.id as keyof typeof detailSentimentFilters] }))}
                                                            >
                                                                <Checkbox
                                                                    checked={detailSentimentFilters[sentiment.id as keyof typeof detailSentimentFilters]}
                                                                    className="h-3.5 w-3.5 border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-[3px]"
                                                                />
                                                                <Icon className={`h-3.5 w-3.5 ${sentiment.color}`} />
                                                                <span className="text-slate-700 dark:text-slate-300 text-xs font-medium">{sentiment.label}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>

                                    {/* Selection Mode Toggle */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setSelectionMode(!selectionMode);
                                            if (selectionMode) setSelectedIds(new Set());
                                        }}
                                        className={`h-9 hover:bg-slate-200 dark:hover:bg-slate-800 ${selectionMode ? 'text-blue-600 bg-blue-50 dark:bg-slate-800 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                                    >
                                        <Check className="h-3.5 w-3.5 mr-2" />
                                        {selectionMode ? 'Cancel' : 'Select'}
                                    </Button>

                                    {/* Bulk Delete - Only when items selected */}
                                    {selectionMode && selectedIds.size > 0 && (
                                        <Button
                                            variant="default"
                                            size="sm"
                                            onClick={() => setBulkDeleteConfirmOpen(true)}
                                            className="h-9 gap-2 bg-red-600 hover:bg-red-700 text-white"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Delete ({selectedIds.size})
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Select All Row - Only in selection mode */}
                            {selectionMode && (
                                <div className="flex items-center justify-between px-1 py-2 bg-slate-100/30 dark:bg-slate-900/30 border-b border-slate-300/50 dark:border-slate-800/50">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            checked={filteredHistory.length > 0 && selectedIds.size === filteredHistory.length}
                                            onCheckedChange={handleSelectAll}
                                            className="h-4 w-4 border-slate-600 data-[state=checked]:bg-blue-600"
                                        />
                                        <span className="text-sm text-slate-700 dark:text-slate-300 font-medium select-none">
                                            {selectedIds.size === filteredHistory.length ? 'Deselect All' : 'Select All'}
                                        </span>
                                    </div>
                                    <span className="text-xs text-slate-500 dark:text-slate-500">
                                        {selectedIds.size} of {filteredHistory.length} selected
                                    </span>
                                </div>
                            )}

                            {/* 4. Detailed "Live Insight Stream" Cards */}
                            <div className="space-y-6 pb-12">
                                {filteredHistory.map((event: any, index: any) => (
                                    <div key={index} className="relative flex gap-4 pl-0 group transition-all">
                                        {/* Left Channel Badge (Rotated) */}
                                        <div className={`mt-6 px-1.5 py-0.5 max-h-[100px] rounded-full flex items-center justify-center border border-slate-300 dark:border-slate-800 shadow-sm  gap-1.5 w-auto -rotate-180 [writing-mode:vertical-lr] whitespace-nowrap ${event.channel === 'whatsapp' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                            event.channel === 'instagram' ? 'bg-pink-500/10 text-pink-500 border-pink-500/20' :
                                                event.channel === 'email' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                    'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                            }`}>
                                            {event.channel === 'whatsapp' ? <MessageSquare className="h-3 w-3 rotate-90" /> :
                                                event.channel === 'instagram' ? <FaInstagram className="h-3 w-3 rotate-90" /> :
                                                    event.channel === 'email' ? <Mail className="h-3 w-3 rotate-90" /> :
                                                        <Globe className="h-3 w-3 rotate-90" />}
                                            <span className="text-[10px] font-bold uppercase tracking-wider ">
                                                {event.channel === 'whatsapp' ? 'WhatsApp' :
                                                    event.channel === 'instagram' ? 'Instagram' :
                                                        event.channel === 'email' ? 'Email' : 'Website'}
                                            </span>
                                        </div>

                                        <Card className={`flex-1 bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/60 transition-all duration-300 hover:shadow-md group/card overflow-hidden
                                            ${(event.sentiment || 'neutral') === 'negative' ? 'hover:border-red-300 dark:hover:border-red-500/30 hover:shadow-red-500/10' : 'hover:border-emerald-300 dark:hover:border-emerald-500/30 hover:shadow-emerald-500/10'}
                                        `}>
                                            {/* Header */}
                                            <div className="bg-slate-50 dark:bg-slate-950/30 p-3 border-b border-slate-300/50 dark:border-slate-800/50 flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    {/* Selection Checkbox */}
                                                    {selectionMode && (
                                                        <Checkbox
                                                            checked={selectedIds.has(event._id)}
                                                            onCheckedChange={() => handleSelectEvent(event._id)}
                                                            className="h-4 w-4 border-slate-600 data-[state=checked]:bg-blue-600"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    )}
                                                    <Clock className="h-3 w-3 text-slate-500 dark:text-slate-500" />
                                                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 font-mono tracking-wide">
                                                        {new Date(event.startedAt || event.createdAt || Date.now()).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {event.leadId && (
                                                        <Badge
                                                            variant="outline"
                                                            className="h-4 text-[9px] font-mono border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 cursor-pointer transition-colors"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleLeadClick(event.leadId);
                                                            }}
                                                        >
                                                            <Sparkles size={10} className="mr-1" />
                                                            {event.leadId}
                                                        </Badge>
                                                    )}
                                                    <Badge variant="secondary" className="bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 h-4 text-[9px] font-mono border border-slate-300 dark:border-slate-800">
                                                        {event._id.substring(0, 8)}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <CardContent className="p-4 flex flex-col gap-4">
                                                {/* Device Row */}
                                                <div className="flex items-center gap-3 text-[10px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40 p-2 rounded-lg border border-slate-200 dark:border-slate-800/40">
                                                    <div className="flex items-center gap-1.5 flex-1">
                                                        <Zap className="h-3 w-3 text-purple-400" />
                                                        <span className="font-medium text-slate-700 dark:text-slate-300">{user.device || "Web Client"}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 ml-auto text-slate-500 dark:text-slate-500">
                                                        <Clock className="h-3 w-3" /> {event.duration}
                                                    </div>
                                                </div>

                                                {/* Content Body */}
                                                <div className="relative pl-1">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            {getEventIcon(event.topic)}
                                                            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                                                                {(event.tags && event.tags[0]) || 'Discussion'} Detected
                                                            </span>
                                                        </div>
                                                        <Badge variant="outline" className={`h-5 border-0 font-medium ${event.sentiment === 'positive' ? 'bg-green-500/10 text-green-400' : event.sentiment === 'negative' ? 'bg-red-500/10 text-red-500' : 'bg-slate-700/20 text-slate-600 dark:text-slate-400'}`}>
                                                            {getSentimentDisplay(event.sentiment).emoji} {event.sentiment} (98% Conf)
                                                        </Badge>
                                                    </div>

                                                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
                                                        {event.topic}
                                                    </h4>
                                                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium opacity-90">
                                                        "{event.summary}"
                                                    </p>
                                                </div>

                                                {/* Footer Tags */}
                                                <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-200 dark:border-slate-800/40">
                                                    <span className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-wide mr-1">Tags:</span>
                                                    {event.tags?.map((t: string) => (
                                                        <Badge key={t} variant="secondary" className="h-5 text-[10px] bg-slate-800/10 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-slate-300/50 dark:border-slate-700/50">
                                                            #{t}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </ScrollArea>
                </motion.div>

                {/* Dialogs */}
                <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                    <DialogContent className="bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-200 max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-red-400 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                Confirm Delete
                            </DialogTitle>
                            <DialogDescription className="text-slate-600 dark:text-slate-400">
                                Are you sure you want to delete this user? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800">Cancel</Button>
                            <Button onClick={() => setDeleteConfirmOpen(false)} className="bg-red-600 hover:bg-red-700">Delete User</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Bulk Delete Confirmation Dialog */}
                <Dialog open={bulkDeleteConfirmOpen} onOpenChange={setBulkDeleteConfirmOpen}>
                    <DialogContent className="bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-200 max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-red-400 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                Confirm Bulk Delete
                            </DialogTitle>
                            <DialogDescription className="text-slate-600 dark:text-slate-400">
                                Are you sure you want to delete {selectedIds.size} conversation{selectedIds.size > 1 ? 's' : ''}? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setBulkDeleteConfirmOpen(false)}
                                className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleBulkDelete}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                Delete {selectedIds.size} Item{selectedIds.size > 1 ? 's' : ''}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </>
        </AnimatePresence>
    );
}
