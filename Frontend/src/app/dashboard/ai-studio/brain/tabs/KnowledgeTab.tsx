"use client";

import { useState, useEffect, useMemo } from "react";
import { io } from "socket.io-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw, Database, FileText, Globe, MessageSquare, Zap, Loader2, Plus, AlertTriangle, Search, Brain } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useOrg } from "@/context/OrgContext";
import { DeleteConfirmationModal } from "../components/DeleteConfirmationModal";
import { SourceCard } from "../components/SourceCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBrainStats } from "@/hooks/useBrainStats";


export function KnowledgeTab() {
    const { activeOrgId } = useOrg();


    // --- HOOK: LOGIC LAYER (Separation of Concerns) ---
    const {
        loading,
        stats,
        planUsage,
        sources,
        tokensBySource,
        setSources,
        refresh: fetchOverview,
        helpers
    } = useBrainStats();

    // Removed unused isAddModalOpen state

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ type: 'website' | 'file' | 'text' | 'api', id: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // MOCK SIMULATION REMOVED (Zero-Error Protocol: No Fake Features)

    const handleEditSource = (source: any) => {
        // Logic moved to SourceCard direct navigation
    };



    // Socket Listener (Kept here for View Updates, could be moved to hook later)
    useEffect(() => {
        if (!activeOrgId) return;

        // Strip /v1 from API URL for Socket.io (Socket needs base URL only)
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const socketUrl = apiUrl.replace(/\/v1$/, ''); // Remove trailing /v1 if present
        console.log("🔌 Connecting to Socket.io at:", socketUrl);
        const socket = io(socketUrl);

        socket.on("connect", () => {
            console.log("✅ Socket.io connected, joining room:", activeOrgId);
            socket.emit("join_room", activeOrgId);
        });

        socket.on("disconnect", () => {
            console.log("❌ Socket.io disconnected");
        });

        socket.on("crawl:progress", (data: any) => {
            console.log("🕷️ Crawl progress:", data);
        });

        // Listen for embedding completion to refresh stats
        socket.on("brain:progress", (data: any) => {
            console.log("🧠 Brain progress event received:", data);

            // Update local state for real-time progress
            setSources(prev => {
                const updateList = (list: any[]) => list.map(item => {
                    const isMatch = (data.sourceId && item.id && data.sourceId.toString() === item.id.toString()) ||
                        (data.sourceId && item._id && data.sourceId.toString() === item._id.toString());

                    if (isMatch) {
                        return {
                            ...item,
                            status: data.status,
                            progress: data.progress,
                            message: data.message,
                            // 🔥 Force update last_crawled/synced to trigger re-sort/refresh visually
                            lastSynced: new Date().toISOString()
                        };
                    }
                    return item;
                });

                return {
                    websites: updateList(prev.websites),
                    files: updateList(prev.files),
                    api: updateList(prev.api),
                    qa: updateList(prev.qa),
                    all: prev.all // Note: 'all' needs specific handling if strictly relying on it, but derived below
                };
            });

            if (data.status === "synced" || data.status === "failed" || data.status === "error") {
                console.log(`✅ Source ${data.status}! Refreshing data...`);
                setTimeout(() => {
                    fetchOverview(); // Refresh to get updated status/stats
                }, 500); // Small delay to ensure DB is updated
            }
        });

        // 🔥 Real-time status updates from embed worker
        socket.on("knowledge_status_update", (data: any) => {
            console.log("📡 Knowledge status update:", data);

            // 1. Instant Local Update
            setSources(prev => {
                const updateList = (list: any[]) => list.map(item => {
                    // Match by ID (handling _id vs id and manual custom_text IDs)
                    const isMatch = (data.sourceId && item.id && data.sourceId.toString() === item.id.toString()) ||
                        (data.sourceId && item._id && data.sourceId.toString() === item._id.toString());

                    if (isMatch) {
                        return {
                            ...item,
                            status: data.status,
                            token_count: data.token_count || item.token_count, // Update tokens if provided
                            progress: data.progress || (data.status === 'active' || data.status === 'ready' ? 100 : undefined),
                            lastSynced: new Date().toISOString()
                        };
                    }
                    return item;
                });

                return {
                    websites: updateList(prev.websites),
                    files: updateList(prev.files),
                    api: updateList(prev.api),
                    qa: updateList(prev.qa),
                    all: prev.all // Derived in render/useMemo
                };
            });

            // 2. Fetch fresh data when status matches final states
            if (data.status === "ready" || data.status === "active" || data.status === "trained" || data.status === "failed") {
                setTimeout(() => fetchOverview(), 500);
            }
        });

        return () => {
            console.log("🔌 Disconnecting Socket.io");
            socket.disconnect();
        };
    }, [activeOrgId, setSources, fetchOverview]);

    // --- SEARCH / FILTER LOGIC ---
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("newest");
    const [mounted, setMounted] = useState(false);

    // --- PAGINATION STATE ---
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20); // Dynamic items per page

    useEffect(() => {
        setMounted(true);
    }, []);

    const filterSources = (items: any[]) => {
        if (!searchQuery) return items;
        const lower = searchQuery.toLowerCase();
        return items.filter(item =>
            (item.domain || item.name || item.title || "").toLowerCase().includes(lower) ||
            (item.description || "").toLowerCase().includes(lower) ||
            (item.tags || []).some((tag: string) => tag.toLowerCase().includes(lower))
        );
    };

    const displaySources = useMemo(() => {
        const _websites = filterSources(sources.websites);
        const _files = filterSources(sources.files);
        const _api = filterSources(sources.api);
        const _qa = filterSources(sources.qa);

        const sortItems = (items: any[]) => {
            return items.sort((a, b) => {
                const getTitle = (i: any) => (i.domain || i.name || i.title || "").toLowerCase();
                const getSize = (i: any) => i.token_count || i.pages?.reduce((acc: number, p: any) => acc + (p.token_count || 0), 0) || 0;

                switch (sortBy) {
                    case "updated":
                        return new Date(b.updatedAt || b.lastSynced || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.lastSynced || a.createdAt || 0).getTime();
                    case "oldest":
                        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
                    case "az":
                        return getTitle(a).localeCompare(getTitle(b));
                    case "za":
                        return getTitle(b).localeCompare(getTitle(a));
                    case "largest":
                        return getSize(b) - getSize(a);
                    case "smallest":
                        return getSize(a) - getSize(b);
                    case "newest":
                    default:
                        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
                }
            });
        };

        const _all = [..._websites, ..._files, ..._api, ..._qa];

        return {
            websites: sortItems(_websites),
            files: sortItems(_files),
            api: sortItems(_api),
            qa: sortItems(_qa),
            all: sortItems(_all)
        };
    }, [sources, searchQuery, sortBy]);

    // 🔥 PAGINATION HELPER: Paginate any list
    const paginateList = (list: any[]) => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return list.slice(startIndex, endIndex);
    };

    // Calculate total pages for each tab
    const pagination = useMemo(() => ({
        all: Math.ceil(displaySources.all.length / itemsPerPage),
        websites: Math.ceil(displaySources.websites.length / itemsPerPage),
        files: Math.ceil(displaySources.files.length / itemsPerPage),
        api: Math.ceil(displaySources.api.length / itemsPerPage),
        manual: Math.ceil(displaySources.qa.length / itemsPerPage)
    }), [displaySources]);

    // Reset page on search or tab change or sort change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, sortBy]);

    // Always show filters and pagination (user preference)
    const totalSources = sources.websites.length + sources.files.length + sources.api.length + sources.qa.length;
    const showFilters = true; // Always visible


    // Helper to render card
    const renderSourceCard = (item: any) => {
        let type: "website" | "file" | "qa" | "api" = "website";
        if (item.domain) type = "website";
        else if (item.endpoint || item.source === 'api' || (item.metadata && item.metadata.source === 'api')) type = "api";
        else if (item.title && !item.name && !item.fileName) type = "qa";
        else type = "file";

        return (
            <SourceCard
                key={item.id || item._id}
                source={item}
                type={type}
                onEdit={handleEditSource}
                onDelete={confirmDelete}
                onToggle={handleToggleSource}
            />
        );
    };

    const confirmDelete = (type: 'website' | 'file' | 'text' | 'api', id: string) => {
        setItemToDelete({ type, id });
        setDeleteModalOpen(true);
    };

    const handleDeleteSource = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        try {
            await api.delete(`/knowledge/${activeOrgId}/source/${itemToDelete.type}/${itemToDelete.id}`);
            toast.success("Source deleted successfully");
            fetchOverview(); // Refresh list
            setDeleteModalOpen(false);
            setItemToDelete(null);
        } catch (error) {
            toast.error("Failed to delete source");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleToggleSource = async (type: 'file' | 'text' | 'api' | 'website' | 'qa' | 'manual', id: string) => {
        try {
            console.log(`🔄 Toggle request: ${type} ${id} for org ${activeOrgId}`);
            // Special handling for legacy UI naming vs backend
            const backendType = type === 'qa' || type === 'text' ? 'text' : type;
            const response = await api.patch(`/knowledge/${activeOrgId}/source/${backendType}/${id}/toggle`);
            toast.success("Status updated");
            fetchOverview();
        } catch (error: any) {
            console.error('❌ Toggle error:', error.response?.data || error.message);
            toast.error(error.response?.data?.message || "Failed to update status");
        }
    };

    if (loading && !stats.totalSources) {
        return <div className="flex bg-muted/5 h-64 rounded-xl border border-dashed items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6">

            <DeleteConfirmationModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                onConfirm={handleDeleteSource}
                loading={isDeleting}
            />

            {/* Plan Limits Dashboard Moved to /dashboard/ai-studio/dashboard */}


            {/* Legacy Cards Removed - Now integrated into Command Center */}



            {/* Source List with Sub-Tabs */}
            <Tabs defaultValue="all" className="w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="websites">Websites</TabsTrigger>
                        <TabsTrigger value="files">Files</TabsTrigger>
                        <TabsTrigger value="api">API Sources</TabsTrigger>
                        <TabsTrigger value="manual">Knowledge Docs</TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 z-10 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                                type="text"
                                placeholder="Search knowledge..."
                                className="pl-9 h-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-full sm:w-[180px] h-10 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem className="cursor-pointer" value="newest">Newest First</SelectItem>
                                <SelectItem className="cursor-pointer" value="updated">Recently Updated</SelectItem>
                                <SelectItem className="cursor-pointer" value="oldest">Oldest First</SelectItem>
                                <SelectItem className="cursor-pointer" value="az">A to Z</SelectItem>
                                <SelectItem className="cursor-pointer" value="za">Z to A</SelectItem>
                                <SelectItem className="cursor-pointer" value="largest">Largest Content</SelectItem>
                                <SelectItem className="cursor-pointer" value="smallest">Smallest Content</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <TabsContent value="all" className="space-y-4">
                    {displaySources.all.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Database className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No knowledge sources yet. Add one to get started!</p>
                        </div>
                    ) : (
                        <>
                            {paginateList(displaySources.all).map((item: any) => renderSourceCard(item))}

                            {/* Pagination Controls - Always Visible */}
                            <div className="flex items-center justify-between border-t pt-4 mt-4">
                                <div className="flex items-center gap-4">
                                    <div className="text-sm text-muted-foreground">
                                        Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, displaySources.all.length)} of {displaySources.all.length}
                                    </div>
                                    <Select value={itemsPerPage.toString()} onValueChange={(val) => { setItemsPerPage(Number(val)); setCurrentPage(1); }}>
                                        <SelectTrigger className="h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">10 / page</SelectItem>
                                            <SelectItem value="20">20 / page</SelectItem>
                                            <SelectItem value="25">25 / page</SelectItem>
                                            <SelectItem value="40">40 / page</SelectItem>
                                            <SelectItem value="50">50 / page</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </Button>
                                    <div className="text-sm">
                                        {currentPage} / {pagination.all}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.min(pagination.all, p + 1))}
                                        disabled={currentPage === pagination.all}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </TabsContent>

                <TabsContent value="websites" className="space-y-4">
                    {displaySources.websites.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Globe className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No websites found.</p>
                        </div>
                    ) : (
                        <>
                            {paginateList(displaySources.websites).map((item: any) => renderSourceCard(item))}

                            {/* Pagination - Always Visible */}
                            <div className="flex items-center justify-between border-t pt-4 mt-4">
                                <div className="text-sm text-muted-foreground">
                                    Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, displaySources.websites.length)} of {displaySources.websites.length}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
                                    <div className="text-sm">{currentPage} / {pagination.websites}</div>
                                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(pagination.websites, p + 1))} disabled={currentPage === pagination.websites}>Next</Button>
                                </div>
                            </div>
                        </>
                    )}
                </TabsContent>

                <TabsContent value="files" className="space-y-4">
                    {displaySources.files.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No files found.</p>
                        </div>
                    ) : (
                        <>
                            {paginateList(displaySources.files).map((item: any) => renderSourceCard(item))}

                            {/* Pagination - Always Visible */}
                            <div className="flex items-center justify-between border-t pt-4 mt-4">
                                <div className="text-sm text-muted-foreground">
                                    Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, displaySources.files.length)} of {displaySources.files.length}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
                                    <div className="text-sm">{currentPage} / {pagination.files}</div>
                                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(pagination.files, p + 1))} disabled={currentPage === pagination.files}>Next</Button>
                                </div>
                            </div>
                        </>
                    )}
                </TabsContent>

                <TabsContent value="api" className="space-y-4">
                    {displaySources.api.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Database className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No API sources found.</p>
                        </div>
                    ) : (
                        <>
                            {paginateList(displaySources.api).map((item: any) => renderSourceCard(item))}

                            {/* Pagination - Always Visible */}
                            <div className="flex items-center justify-between border-t pt-4 mt-4">
                                <div className="text-sm text-muted-foreground">
                                    Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, displaySources.api.length)} of {displaySources.api.length}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
                                    <div className="text-sm">{currentPage} / {pagination.api}</div>
                                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(pagination.api, p + 1))} disabled={currentPage === pagination.api}>Next</Button>
                                </div>
                            </div>
                        </>
                    )}
                </TabsContent>

                <TabsContent value="manual" className="space-y-4">
                    {displaySources.qa.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No manual training entries found.</p>
                        </div>
                    ) : (
                        <>
                            {paginateList(displaySources.qa).map((item: any) => renderSourceCard(item))}

                            {/* Pagination - Always Visible */}
                            <div className="flex items-center justify-between border-t pt-4 mt-4">
                                <div className="text-sm text-muted-foreground">
                                    Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, displaySources.qa.length)} of {displaySources.qa.length}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
                                    <div className="text-sm">{currentPage} / {pagination.manual}</div>
                                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(pagination.manual, p + 1))} disabled={currentPage === pagination.manual}>Next</Button>
                                </div>
                            </div>
                        </>
                    )}
                </TabsContent>
            </Tabs >
        </div >
    );
}

