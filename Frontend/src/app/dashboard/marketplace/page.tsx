'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useOrg } from '@/context/OrgContext';
import axiosInstance from '@/api/axiosInstance';
import { Bot, Zap, Plus, Search, Loader2, Layout, CheckCircle, ArrowUpCircle, MessageSquare, HelpCircle, X, ArrowLeft, Download, Eye, Star, Filter, GitMerge, GitBranch, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { UniversalRenderer } from '@/components/sdui/UniversalRenderer';
import { AnimatePresence, motion } from 'framer-motion';
import { flowsAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import ReactFlow, { Background, Controls, Handle, Position } from 'reactflow';
import 'reactflow/dist/style.css';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
interface Template {
    slug: string;
    name: string;
    description: string;
    category: string;
    version: string;
    features: string[];
    use_cases: string[];
    persona?: { greeting_message: string };
    default_tags?: string[];
    rating_stats?: {
        average_rating: number;
        total_ratings: number;
        total_score: number;
    };
    admin_score?: number;
    install_count?: number;
    workflows?: any; // Workflow data for node counting
}

// ... (Node Code retained) ...
// --- Custom Node for Preview ---
const VisualPreviewNode = ({ data, type }: { data: any, type: string }) => {
    let bg = "bg-white dark:bg-slate-900";
    let border = "border-slate-300 dark:border-slate-700";
    let icon = <Layout size={16} />;
    let label = data.label || "Node";

    switch (type) {
        case 'trigger':
            bg = "bg-purple-50 dark:bg-purple-900/20";
            border = "border-purple-500";
            icon = <Zap size={16} className="text-purple-600 dark:text-purple-400" />;
            break;
        case 'message':
            bg = "bg-blue-50 dark:bg-blue-900/20";
            border = "border-blue-500";
            icon = <MessageSquare size={16} className="text-blue-600 dark:text-blue-400" />;
            break;
        case 'question':
            bg = "bg-amber-50 dark:bg-amber-900/20";
            border = "border-amber-500";
            icon = <HelpCircle size={16} className="text-amber-600 dark:text-amber-400" />;
            break;
        case 'ai':
            bg = "bg-emerald-50 dark:bg-emerald-900/20";
            border = "border-emerald-500";
            icon = <Bot size={16} className="text-emerald-600 dark:text-emerald-400" />;
            break;
        case 'logic':
            bg = "bg-slate-100 dark:bg-slate-800";
            border = "border-slate-400";
            icon = <GitMerge size={16} className="text-slate-600 dark:text-slate-400" />;
            break;
        default:
            bg = "bg-slate-100 dark:bg-slate-800";
            border = "border-slate-500";
            icon = <Layout size={16} className="text-slate-600 dark:text-slate-300" />;
            break;
    }

    return (
        <div className={`px-4 py-3 rounded-xl shadow-lg border min-w-[150px] ${bg} ${border} flex items-center gap-3 backdrop-blur-md`}>
            {/* Handles required for ReactFlow - Styled to be invisible but functional for layout */}
            <Handle type="target" position={Position.Top} className="!bg-transparent !border-none" />
            <div className={`p-2 rounded-full bg-white/50 dark:bg-black/20 shadow-sm`}>
                {icon}
            </div>
            <div>
                <div className="text-[10px] font-bold uppercase opacity-60 tracking-wider mb-0.5">{type || 'Node'}</div>
                <div className="font-bold text-xs text-slate-900 dark:text-white whitespace-nowrap">{label}</div>
            </div>
            <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-none" />
        </div>
    );
};

const nodeTypes = {
    trigger: VisualPreviewNode,
    message: VisualPreviewNode,
    question: VisualPreviewNode,
    ai: VisualPreviewNode,
    logic: VisualPreviewNode,
    default: VisualPreviewNode // CATCH-ALL for standard nodes
};

export default function MarketplacePage() {
    const { activeOrgId, activeOrg, refreshOrgs } = useOrg();
    const router = useRouter(); // Explicitly getting router
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [installing, setInstalling] = useState<string | null>(null);
    const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [filter, setFilter] = useState('');
    const [existingFlows, setExistingFlows] = useState<any[]>([]);
    const [mounted, setMounted] = useState(false);

    // Rating State
    const [userRating, setUserRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);

    // Pagination & Search State
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalResults, setTotalResults] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [category, setCategory] = useState('all');
    const [sortBy, setSortBy] = useState('newest'); // popular | rating | newest
    const [loadingMore, setLoadingMore] = useState(false);

    // Dropdown open/close state
    const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
    const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Category options with icons
    const categoryOptions = [
        { value: 'all', label: 'All Templates', icon: '📂', color: 'text-slate-400' },

        // --- 1. Top Business Needs (High Demand) ---
        { value: 'Lead Generation', label: 'Lead Gen & Sales', icon: '💰', color: 'text-emerald-400' },
        { value: 'Customer Support', label: 'Customer Support', icon: '🎧', color: 'text-blue-400' },
        { value: 'Appointment', label: 'Booking & Scheduling', icon: '📅', color: 'text-purple-400' },

        // --- 2. Industry Specific (Target Audience) ---
        { value: 'Real Estate', label: 'Real Estate', icon: '🏠', color: 'text-yellow-400' },
        { value: 'Ecommerce', label: 'E-commerce', icon: '🛍️', color: 'text-pink-400' },
        { value: 'Healthcare', label: 'Healthcare & Clinic', icon: '🏥', color: 'text-red-400' },
        { value: 'Education', label: 'Education & Coaching', icon: '🎓', color: 'text-indigo-400' },
        { value: 'Gym', label: 'Gym & Fitness', icon: '💪', color: 'text-orange-400' },
    ];

    // Sort options with icons
    const sortOptions = [
        { value: 'recommended', label: 'Recommended', icon: '✨', color: 'text-purple-400' }, // Admin Pick
        { value: 'popular', label: 'Most Installed', icon: '🔥', color: 'text-orange-500' }, // Social Proof
        { value: 'rating', label: 'Highest Rated', icon: '⭐', color: 'text-yellow-400' }, // Quality
        { value: 'newest', label: 'Newest Added', icon: '🆕', color: 'text-blue-400' }, // Freshness
    ];

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            // Close if click is outside dropdown containers
            if (!target.closest('.dropdown-container')) {
                setCategoryDropdownOpen(false);
                setSortDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch templates with pagination + filters
    const fetchTemplates = async (pageNum: number = 1, append: boolean = false) => {
        try {
            if (!append) setLoading(true);
            else setLoadingMore(true);

            const params: any = {
                page: pageNum,
                limit: 20
            };

            if (searchQuery) params.search = searchQuery;
            if (category && category !== 'all') params.category = category;
            if (sortBy) params.sort = sortBy;

            const res = await axiosInstance.get('/templates/list', { params });

            if (res.data.success) {
                const newTemplates = res.data.data;

                if (append) {
                    setTemplates(prev => [...prev, ...newTemplates]);
                } else {
                    setTemplates(newTemplates);
                }

                // Update pagination state
                setHasMore(res.data.pagination?.hasMore || false);
                setTotalResults(res.data.pagination?.total || 0);
                setPage(pageNum);
            }
        } catch (err) {
            console.error("Failed to fetch templates", err);
            toast.error("Could not load templates");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchTemplates(1, false);
    }, []);

    // Debounced search (wait 500ms after user stops typing)
    useEffect(() => {
        if (!mounted) return;

        const debounceTimer = setTimeout(() => {
            fetchTemplates(1, false);
        }, 500); // Wait 500ms after user stops typing

        return () => clearTimeout(debounceTimer);
    }, [searchQuery]);

    // Reload on filter/sort change (no debounce needed)
    useEffect(() => {
        if (mounted) {
            fetchTemplates(1, false);
        }
    }, [category, sortBy]);



    const fetchFlows = async () => {
        if (!activeOrgId) return;
        try {
            const res = await flowsAPI.list({ organizationId: activeOrgId });
            if (res.data.success) {
                setExistingFlows(res.data.data);
            }
        } catch (e) {
            console.error("Failed to fetch flows status", e);
        }
    };

    useEffect(() => {
        fetchFlows();
    }, [activeOrgId]);

    const handleInstall = async (slug: string) => {
        if (!activeOrgId) {
            toast.error("No Active Organization selected");
            return;
        }
        setInstalling(slug);
        const toastId = toast.loading("Installing Template & Workflows...");

        try {
            const installRes = await axiosInstance.post('/templates/install', {
                orgId: activeOrgId,
                templateSlug: slug
            });

            if (!installRes.data.success) {
                throw new Error(installRes.data.message || "Activation Failed");
            }

            const tmplRes = await axiosInstance.get(`/templates/${slug}`);
            if (tmplRes.data.success) {
                const tmpl = tmplRes.data.data;
                const workflows = tmpl.workflows || {};

                const flowPromises = Object.entries(workflows).map(async ([key, flowData]: [string, any]) => {
                    const nodes = flowData.nodes || [];
                    const edges = flowData.edges || [];
                    const layout = flowData.layout;

                    if (nodes.length > 0 || layout) {
                        const payload = {
                            organizationId: activeOrgId,
                            name: `${tmpl.name} - ${key.replace('_', ' ').toUpperCase()}`,
                            description: `Imported from ${tmpl.name} v${tmpl.version}`,
                            nodes: nodes,
                            edges: edges,
                            viewport: flowData.viewport || { x: 0, y: 0, zoom: 1 },
                            sourceTemplate: slug
                        };

                        try {
                            const res = await flowsAPI.save(payload);
                            return res;
                        } catch (saveErr) {
                            throw saveErr;
                        }
                    }
                });

                await Promise.all(flowPromises);

                toast.success(`Template Installed & Flows Created!`, { id: toastId });
                await refreshOrgs();
                await fetchFlows();

            } else {
                toast.warning("Template installed but failed to fetch workflow details", { id: toastId });
            }

        } catch (err: any) {
            console.error("Install failed", err);
            toast.error(`Installation Failed: ${err.message}`, { id: toastId });
        } finally {
            setInstalling(null);
        }
    };

    const handlePreview = async (slug: string) => {
        setPreviewLoading(true);
        try {
            const res = await axiosInstance.get(`/templates/${slug}`, {
                params: { userId: activeOrgId }
            });
            if (res.data.success) {
                const tmpl = res.data.data;
                const workflows = tmpl.workflows || {};
                let previewLayout = null;

                if (workflows['welcome_flow']?.layout) previewLayout = workflows['welcome_flow'].layout;
                else if (workflows['main_menu']?.layout) previewLayout = workflows['main_menu'].layout;
                else {
                    const firstFlow = Object.values(workflows).find((w: any) => w.layout);
                    if (firstFlow) previewLayout = (firstFlow as any).layout;
                }

                if (!previewLayout && workflows) {
                    const keys = Object.keys(workflows);
                    for (const key of keys) {
                        const flow = workflows[key];
                        if (flow && flow.layout) {
                            previewLayout = flow.layout;
                            break;
                        }
                    }
                }

                if (previewLayout) {
                    setPreviewTemplate({ ...tmpl, layout: previewLayout });
                } else {
                    setPreviewTemplate(tmpl);
                }

                // Pre-fill user's rating if they've already rated
                if (tmpl.my_rating && tmpl.my_rating > 0) {
                    setUserRating(tmpl.my_rating);
                } else {
                    setUserRating(0);
                }
            }
        } catch (e) {
            toast.error("Failed to load preview");
        } finally {
            setPreviewLoading(false);
        }
    };

    // No client-side filtering - backend handles it
    const displayTemplates = templates;


    // Helper: Count Nodes from Workflows
    const getNodeStats = (tmpl: any) => {
        if (!tmpl.workflows) return { total: 0, breakdown: {} };

        let total = 0;
        const breakdown: Record<string, number> = {};

        Object.values(tmpl.workflows).forEach((flow: any) => {
            if (flow.nodes && Array.isArray(flow.nodes)) {
                flow.nodes.forEach((node: any) => {
                    total++;
                    const type = node.type || 'default';
                    breakdown[type] = (breakdown[type] || 0) + 1;
                });
            }
        });

        return { total, breakdown };
    };

    // Staggered Animation Container
    const handleSubmitRating = async (rating: number) => {
        if (!previewTemplate) return;

        // Optimistic UI Update
        const prevRating = userRating;
        setUserRating(rating);

        try {
            const res = await axiosInstance.post('/templates/rate', {
                templateSlug: previewTemplate.slug,
                rating: rating,
                userId: activeOrgId
            });

            if (res.data.success) {
                // Update local preview state with new stats
                setPreviewTemplate((prev: any) => ({
                    ...prev,
                    rating_stats: res.data.data,
                    my_rating: res.data.my_rating
                }));
                setUserRating(res.data.my_rating);
                toast.success(res.data.message || "Thanks for rating!");
            } else {
                toast.error("Failed to submit rating");
                setUserRating(prevRating);
            }
        } catch (e) {
            toast.error("Failed to submit rating");
            setUserRating(prevRating);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50, damping: 15 } }
    };

    // Don't block entire UI on loading - show skeletons instead
    return (
        <div className="h-[80vh] w-full   flex flex-col overflow-hidden text-slate-200">
            {/* AMBIENT BACKGROUND */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px]"></div>
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px]"></div>
            </div>

            {/* 1. FIXED HEADER */}
            <header className="flex-none z-20 backdrop-blur-xl border-b border-white/5 pb-4  ">
                <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
                    {/* Brand */}
                    <div className="flex items-center gap-4 px-2">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-purple-500/20 ring-1 ring-white/10">
                            <Zap size={24} className="text-white fill-white/20" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Marketplace</h1>
                            <p className="text-xs text-slate-400 font-medium tracking-wide">Production-Ready AI Agents</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Search Bar - Centered & Wide */}
                        <div className="flex-1 max-w-2xl w-full relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-purple-500/50 focus-within:bg-white/10 transition-all">
                                <div className="pl-4 text-slate-500 group-focus-within:text-purple-400">
                                    <Search size={20} />
                                </div>
                                <input
                                    type="text"
                                    className="w-full bg-transparent border-none px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none text-sm font-medium"
                                    placeholder="Search blueprints, agents, workflows..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault(); // Prevent form submission/page refresh
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Action & Profile */}
                        <div className="flex items-center gap-4">
                            <a href="/dashboard/builder">
                                <button className="flex items-center gap-2 px-5 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95">
                                    <Plus size={18} />
                                </button>
                            </a>
                        </div>
                    </div>

                </div>
            </header>

            {/* ⚙️ Filter & Sort Controls Bar */}
            <div className="flex-none px-2 z-40 backdrop-blur-xl border-b border-white/5 py-3 ">
                <div className="max-w-[1920px] mx-auto flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        {/* Category Filter - Shadcn Select */}
                        <Select value={category} onValueChange={(value) => setCategory(value)}>
                            <SelectTrigger className="w-auto min-w-[240px] bg-[#1a1d2e] border-purple-500/30 text-white hover:border-purple-500/50">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1a1d2e] border-purple-500/30 text-white max-h-[320px]">
                                {categoryOptions.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value}
                                        className="hover:bg-purple-500/20 focus:bg-purple-500/20 cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className={option.color}>{option.icon}</span>
                                            <span>{option.label}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Sort Dropdown - Shadcn Select */}
                        <Select value={sortBy} onValueChange={(value) => setSortBy(value)}>
                            <SelectTrigger className="w-auto min-w-[200px] bg-[#1a1d2e] border-blue-500/30 text-white hover:border-blue-500/50">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1a1d2e] border-blue-500/30 text-white">
                                {sortOptions.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value}
                                        className="hover:bg-blue-500/20 focus:bg-blue-500/20 cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className={option.color}>{option.icon}</span>
                                            <span>{option.label}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Results Stats */}
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400">Showing</span>
                        <span className="font-bold text-white">{templates.length}</span>
                        <span className="text-slate-400">of</span>
                        <span className="font-bold text-purple-400">{totalResults}</span>
                        <span className="text-slate-400">templates</span>
                    </div>
                </div>
            </div>

            {/* 2. SCROLLABLE GRID CONTENT */}
            <main className="flex-1 px-2 overflow-y-auto z-10 mt-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <div className="max-w-[1920px] mx-auto ">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-8"
                    >
                        {/* Show Skeleton Cards during loading */}
                        {loading ? (
                            Array.from({ length: 8 }).map((_, idx) => (
                                <div
                                    key={`skeleton-${idx}`}
                                    className="relative flex flex-col h-[380px] rounded-[24px] bg-[#0E1016] border border-white/5 overflow-hidden animate-pulse"
                                >
                                    {/* Skeleton Top Half */}
                                    <div className="h-[50%] w-full bg-slate-800/50"></div>

                                    {/* Skeleton Bottom Half */}
                                    <div className="flex-1 p-5 space-y-3">
                                        <div className="h-3 bg-slate-700/50 rounded w-1/3"></div>
                                        <div className="h-6 bg-slate-700/50 rounded w-3/4"></div>
                                        <div className="h-4 bg-slate-700/50 rounded w-full"></div>
                                        <div className="h-4 bg-slate-700/50 rounded w-5/6"></div>
                                        <div className="flex gap-2 mt-4">
                                            <div className="h-8 bg-slate-700/50 rounded w-20"></div>
                                            <div className="h-8 bg-slate-700/50 rounded flex-1"></div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            displayTemplates.map((template) => {
                                const installedFlow = existingFlows.find(f => f.sourceTemplate === template.slug);
                                const isInstalled = !!installedFlow;

                                return (
                                    <motion.div
                                        key={template.slug}
                                        // variants={itemVariants}
                                        className="group relative flex flex-col h-[380px] rounded-[24px] bg-[#0E1016] border border-white/5 overflow-hidden hover:border-purple-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10 cursor-pointer"
                                        onClick={() => handlePreview(template.slug)}
                                    >
                                        {/* ... rest of card JSX ... */}
                                        {/* --- TOP 50%: ABSTRACT VISUAL --- */}
                                        <div className="h-[50%] w-full relative bg-[#08090C] overflow-hidden border-b border-white/5 group-hover:bg-[#0B0D12] transition-colors">
                                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-[#08090C] to-[#08090C]"></div>

                                            {/* Abstract Flow Art (SVG) */}
                                            <div className="absolute inset-0 flex items-center justify-center opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700">
                                                <svg viewBox="0 0 240 120" className="w-[85%] h-full drop-shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                                                    {/* Connecting Lines */}
                                                    <path d="M50 60 C 80 60, 80 30, 110 30" fill="none" stroke="#64748b" strokeWidth="1.5" strokeOpacity="0.2" />
                                                    <path d="M50 60 C 80 60, 80 90, 110 90" fill="none" stroke="#64748b" strokeWidth="1.5" strokeOpacity="0.2" />
                                                    <path d="M140 30 C 170 30, 170 60, 200 60" fill="none" stroke="#64748b" strokeWidth="1.5" strokeOpacity="0.2" />
                                                    <path d="M140 90 C 170 90, 170 60, 200 60" fill="none" stroke="#64748b" strokeWidth="1.5" strokeOpacity="0.2" />

                                                    {/* Nodes */}
                                                    {/* Start Node */}
                                                    <rect x="20" y="45" width="30" height="30" rx="8" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1" />
                                                    <path d="M35 55 L35 65 M30 60 L40 60" stroke="#818cf8" strokeWidth="1.5" />

                                                    {/* Top Branch */}
                                                    <rect x="110" y="15" width="30" height="30" rx="8" fill="#312e81" stroke="#818cf8" strokeWidth="1" />

                                                    {/* Bottom Branch */}
                                                    <rect x="110" y="75" width="30" height="30" rx="8" fill="#4c1d95" stroke="#a78bfa" strokeWidth="1" />

                                                    {/* End Node */}
                                                    <rect x="200" y="45" width="30" height="30" rx="8" fill="#064e3b" stroke="#34d399" strokeWidth="1" />
                                                    <circle cx="215" cy="60" r="4" fill="#34d399" />
                                                </svg>
                                            </div>
                                        </div>

                                        {/* --- BOTTOM 50%: INFO & ACTIONS --- */}
                                        <div className="flex-1 p-6 flex flex-col justify-between">
                                            <div>
                                                <div className="mb-3">
                                                    <div className="text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-2">{template.category}</div>
                                                    <h3 className="text-xl font-bold text-white leading-tight group-hover:text-purple-300 transition-colors">{template.name}</h3>
                                                </div>

                                                {/* Version + Node Count Badges */}
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-[9px] font-bold text-indigo-400 uppercase tracking-wider">
                                                        v{template.version || '1.0.0'}
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-bold text-emerald-400 uppercase tracking-wider">
                                                        {getNodeStats(template).total} Nodes
                                                    </span>
                                                </div>

                                                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed h-10 mb-1">
                                                    {template.description}
                                                </p>
                                            </div>

                                            {/* Footer Row */}
                                            <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                                                {/* Ratings - Dynamic based on Hybrid Strategy */}
                                                <div className="flex items-center gap-1.5">
                                                    {(() => {
                                                        const totalRatings = template.rating_stats?.total_ratings || 0;
                                                        const showPublicRating = totalRatings >= 20;
                                                        const displayRating = showPublicRating
                                                            ? (template.rating_stats?.average_rating || 0)
                                                            : ((template.admin_score || 9.8) / 2); // Convert /10 to /5 scale

                                                        return (
                                                            <>
                                                                <div className="flex text-amber-500">
                                                                    {[1, 2, 3, 4, 5].map(s => (
                                                                        <Star
                                                                            key={s}
                                                                            size={12}
                                                                            fill={s <= Math.round(displayRating) ? "currentColor" : "none"}
                                                                            className={s <= Math.round(displayRating) ? "opacity-100" : "opacity-30"}
                                                                        />
                                                                    ))}
                                                                </div>
                                                                <span className="text-[10px] font-medium text-slate-500">
                                                                    {displayRating.toFixed(1)}
                                                                </span>
                                                            </>
                                                        );
                                                    })()}
                                                </div>

                                                {/* Install Button (Small) */}
                                                <button
                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${isInstalled
                                                        ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
                                                        : "bg-white text-black hover:bg-slate-200 border-transparent"
                                                        }`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (isInstalled && installedFlow) {
                                                            router.push(`/dashboard/builder?flowId=${installedFlow._id}`);
                                                        } else {
                                                            // setPreviewTemplate(null); // Optional: close preview if opening directly, but here we just install
                                                            handleInstall(template.slug);
                                                        }
                                                    }}
                                                >
                                                    {isInstalled ? "Open" : "Get"}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </motion.div>

                    {/* 🔽 Load More Button */}
                    {hasMore && (
                        <div className="flex justify-center mt-12 pb-16">
                            <button
                                onClick={() => fetchTemplates(page + 1, true)}
                                disabled={loadingMore}
                                className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl font-bold text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="flex items-center gap-3">
                                    {loadingMore ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            <span>Loading...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Load More Templates</span>
                                            <ArrowUpCircle size={20} className="group-hover:translate-y-1 transition-transform" />
                                        </>
                                    )}
                                </div>
                            </button>
                        </div>
                    )}

                    {/* Empty State */}
                    {templates.length === 0 && !loading && (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="text-6xl mb-4">🔍</div>
                            <h3 className="text-xl font-bold text-white mb-2">No Templates Found</h3>
                            <p className="text-slate-400 text-sm">Try adjusting your search or filters</p>
                        </div>
                    )}
                </div>
            </main>

            {/* FULL SCREEN PORTAL MODAL - Split View */}
            {
                mounted && createPortal(
                    <AnimatePresence>
                        {previewTemplate && (() => {
                            const installedFlow = existingFlows.find(f => f.sourceTemplate === previewTemplate.slug);
                            const isInstalled = !!installedFlow;
                            const version = previewTemplate.version || '1.0.0';

                            return (
                                <motion.div
                                    key="modal-backdrop"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 md:p-6"
                                    onClick={() => setPreviewTemplate(null)}
                                >
                                    <motion.div
                                        key="modal-content"
                                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                        animate={{ scale: 1, opacity: 1, y: 0 }}
                                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                                        className="w-full h-full max-w-[1700px] bg-[#0E1016] md:rounded-[24px] shadow-2xl overflow-hidden flex flex-col lg:flex-row relative ring-1 ring-white/10"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        {/* 👈 LEFT PANEL: Details (Scrollable) */}
                                        <div className="w-full lg:w-[480px] flex flex-col h-full bg-[#050608] border-r border-white/5 relative z-20 shrink-0">

                                            {/* Sticky Back Header */}
                                            <div className="flex-none p-6 flex items-center justify-between border-b border-white/5 bg-[#050608]/90 backdrop-blur-sm z-10 sticky top-0">
                                                <button
                                                    onClick={() => setPreviewTemplate(null)}
                                                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider"
                                                >
                                                    <ArrowLeft size={14} /> Back
                                                </button>
                                                <div className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-mono text-slate-400">
                                                    {isInstalled ? <span className="text-emerald-400">● Installed</span> : <span>● Uninstalled</span>}
                                                </div>
                                            </div>

                                            {/* Scrollable Content */}
                                            <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pb-32">

                                                {/* Hero */}
                                                <div className="mb-8">
                                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/10 flex items-center justify-center mb-6">
                                                        {previewTemplate.category === 'AI Agent' ? <Bot size={40} className="text-indigo-400" /> : <Zap size={40} className="text-purple-400" />}
                                                    </div>
                                                    <h2 className="text-3xl font-bold text-white mb-3 leading-tight">{previewTemplate.name}</h2>
                                                    <p className="text-sm text-slate-400 leading-relaxed bg-white/[0.02] p-4 rounded-xl border border-white/5">
                                                        {previewTemplate.description}
                                                    </p>
                                                </div>

                                                {/* Data Points + Ratings */}
                                                <div className="grid grid-cols-2 gap-3 mb-8">
                                                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Category</div>
                                                        <div className="text-sm font-medium text-white">{previewTemplate.category}</div>
                                                    </div>
                                                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Version</div>
                                                        <div className="text-sm font-medium text-white">v{version}</div>
                                                    </div>

                                                    {/* New Rating Section */}
                                                    <div className="col-span-2 p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:border-white/10 transition-colors">
                                                        {/* Hybrid Rating Logic */}
                                                        <div>
                                                            {(() => {
                                                                const totalRatings = previewTemplate?.rating_stats?.total_ratings || 0;
                                                                const showPublicRating = totalRatings >= 20;

                                                                return (
                                                                    <>
                                                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                                                                            {showPublicRating ? "Overall Rating" : "Quality Score"}
                                                                        </div>

                                                                        {showPublicRating ? (
                                                                            // Public User Rating (> 20 Reviews)
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-xl font-bold text-white">
                                                                                    {previewTemplate?.rating_stats?.average_rating || "0.0"}
                                                                                </span>
                                                                                <div className="flex text-amber-500">
                                                                                    {[1, 2, 3, 4, 5].map(s => (
                                                                                        <Star
                                                                                            key={s}
                                                                                            size={14}
                                                                                            fill={s <= (previewTemplate?.rating_stats?.average_rating || 0) ? "currentColor" : "none"}
                                                                                            className={s <= (previewTemplate?.rating_stats?.average_rating || 0) ? "opacity-100" : "opacity-30"}
                                                                                        />
                                                                                    ))}
                                                                                </div>
                                                                                <span className="text-xs text-slate-600">({totalRatings})</span>
                                                                            </div>
                                                                        ) : (
                                                                            // Admin 'Quality Score' (< 20 Reviews) - Safer!
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="flex items-center gap-1.5 text-emerald-400">
                                                                                    <ShieldCheck size={18} />
                                                                                    <span className="text-xl font-bold tracking-tight">
                                                                                        {previewTemplate?.admin_score || 9.8}<span className="text-sm text-emerald-500/60">/10</span>
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                );
                                                            })()}

                                                            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                                                                <Download size={12} className="text-blue-500" />
                                                                <span>{previewTemplate?.install_count || 20}+ Installs</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Your Rating</div>
                                                            <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
                                                                {[1, 2, 3, 4, 5].map(s => (
                                                                    <motion.button
                                                                        key={s}
                                                                        whileHover={{ scale: 1.2 }}
                                                                        whileTap={{ scale: 0.9 }}
                                                                        onClick={() => handleSubmitRating(s)}
                                                                        onMouseEnter={() => setHoverRating(s)}
                                                                        className="focus:outline-none"
                                                                    >
                                                                        <Star
                                                                            size={16}
                                                                            fill={(hoverRating || userRating) >= s ? "currentColor" : "none"}
                                                                            className={`transition-colors duration-200 ${(hoverRating || userRating) >= s
                                                                                ? "text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                                                                                : "text-slate-700 dark:text-slate-600 hover:text-amber-500/50"
                                                                                }`}
                                                                        />
                                                                    </motion.button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Nodes Used Breakdown */}
                                                    <div className="col-span-2 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Nodes Used</div>
                                                        {(() => {
                                                            const { total, breakdown } = getNodeStats(previewTemplate);
                                                            const nodeIcons: Record<string, any> = {
                                                                trigger: <Zap size={14} className="text-purple-400" />,
                                                                message: <MessageSquare size={14} className="text-blue-400" />,
                                                                question: <HelpCircle size={14} className="text-amber-400" />,
                                                                ai: <Bot size={14} className="text-emerald-400" />,
                                                                logic: <GitMerge size={14} className="text-slate-400" />,
                                                                default: <Layout size={14} className="text-slate-400" />
                                                            };

                                                            return (
                                                                <>
                                                                    <div className="flex items-center gap-2 mb-3">
                                                                        <div className="text-2xl font-bold text-white">{total}</div>
                                                                        <span className="text-xs text-slate-500">Total Nodes</span>
                                                                    </div>

                                                                    {Object.keys(breakdown).length > 0 ? (
                                                                        <div className="grid grid-cols-2 gap-2">
                                                                            {Object.entries(breakdown).map(([type, count]) => (
                                                                                <div key={type} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/5">
                                                                                    {nodeIcons[type] || nodeIcons.default}
                                                                                    <div className="flex-1">
                                                                                        <div className="text-xs font-medium text-white capitalize">{type}</div>
                                                                                    </div>
                                                                                    <div className="text-xs font-bold text-slate-400">{count}</div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="text-xs text-slate-500 italic">No nodes available</div>
                                                                    )}
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>

                                                {/* What's Inside */}
                                                <div className="mb-8">
                                                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">What's Inside</h4>
                                                    <div className="space-y-2">
                                                        {(previewTemplate.features || []).map((feat: string, i: number) => (
                                                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                                                                <CheckCircle size={14} className="text-purple-500 shrink-0" />
                                                                <span className="text-xs text-slate-300">{feat}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Integrations (Static Placeholder for 'Enterprise' feel) */}
                                                <div className="mb-8">
                                                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Integrations</h4>
                                                    <div className="flex gap-2">
                                                        {['Slack', 'Gmail', 'Notion'].map(tool => (
                                                            <div key={tool} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] text-slate-400">
                                                                {tool}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Sticky Footer CTA */}
                                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-[#050608] border-t border-white/5 z-20">
                                                <button
                                                    onClick={() => {
                                                        if (isInstalled && installedFlow) {
                                                            router.push(`/dashboard/builder?flowId=${installedFlow._id}`);
                                                        } else {
                                                            setPreviewTemplate(null);
                                                            handleInstall(previewTemplate.slug);
                                                        }
                                                    }}
                                                    className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${isInstalled
                                                        ? "bg-emerald-500 text-white hover:bg-emerald-400 shadow-emerald-500/20"
                                                        : "bg-white text-black hover:bg-slate-200"
                                                        }`}
                                                >
                                                    {isInstalled ? <ArrowUpCircle size={18} /> : <Zap size={18} className="fill-current" />}
                                                    {isInstalled ? "OPEN TEMPLATE" : "USE TEMPLATE"}
                                                </button>
                                            </div>
                                        </div>

                                        {/* 👉 RIGHT SIDE: The Blueprint Canvas */}
                                        <div className="flex-1 h-full relative bg-[#0f111a] overflow-hidden">
                                            <div className="absolute inset-0 bg-[radial-gradient(#ffffff10_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.03),transparent_60%)]"></div>

                                            <div className="absolute top-2 left-2 z-10">
                                                <div className="px-3 py-1.5 rounded-md bg-[#0f111a] border border-purple-500/20 text-[10px] font-mono text-purple-400 uppercase tracking-widest flex items-center gap-2 shadow-xl backdrop-blur-sm">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></div>
                                                    Live Blueprint Preview
                                                </div>
                                            </div>

                                            <div className="h-full w-full relative z-0">
                                                {(previewTemplate.workflows && Object.keys(previewTemplate.workflows).length > 0) ? (
                                                    <div className="h-full w-full">
                                                        {(() => {
                                                            const firstFlowKey = Object.keys(previewTemplate.workflows)[0];
                                                            const flowData = previewTemplate.workflows[firstFlowKey];
                                                            return (
                                                                <ReactFlow
                                                                    nodes={flowData.nodes || []}
                                                                    edges={flowData.edges || []}
                                                                    nodeTypes={nodeTypes}
                                                                    fitView
                                                                    minZoom={0.5}
                                                                    maxZoom={2}
                                                                    proOptions={{ hideAttribution: true }}
                                                                    nodesDraggable={true}
                                                                    nodesConnectable={false}
                                                                    className="react-flow-blueprint"
                                                                >
                                                                    <Background color="#333" gap={24} size={1} className="opacity-20" />
                                                                    <Controls
                                                                        position="bottom-right"
                                                                        showInteractive={true}
                                                                        className="react-flow__controls-ds"
                                                                        style={{
                                                                            display: 'flex',
                                                                            flexDirection: 'column',
                                                                            gap: '4px',
                                                                            padding: '4px',
                                                                            backgroundColor: '#0f111a',
                                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                                            borderRadius: '8px',
                                                                            color: '#e2e8f0'
                                                                        }}
                                                                    />
                                                                </ReactFlow>
                                                            );
                                                        })()}
                                                    </div>
                                                ) : previewTemplate.layout ? (
                                                    <div className="p-12 flex justify-center h-full overflow-y-auto">
                                                        {/* @ts-ignore */}
                                                        <UniversalRenderer block={previewTemplate.layout} />
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-full text-slate-600">
                                                        <Layout className="w-16 h-16 mb-4 opacity-20" />
                                                        <p className="font-mono text-xs uppercase tracking-widest">No Preview Data</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            );
                        })()}
                    </AnimatePresence>,
                    document.body
                )
            }
        </div >
    );
}