"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, RefreshCw, Plus, Trash2, ExternalLink, Globe, Loader2, MoreHorizontal, Pencil, Eye, ChevronLeft, ChevronRight, AlertTriangle, Network, Code2, ChevronDown, ChevronRight as ChevronRightIcon } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { io } from "socket.io-client";
import { useOrg } from "@/context/OrgContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EditPageDialog } from "../components/EditPageDialog";
import { DiscoverPagesModal } from "../components/DiscoverPagesModal";
import { Search } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PageIndex {
    _id: string;
    sourceId: string;
    url: string;
    page_index: string;
    page_index_meta: {
        node_count: number;
        confidence: number;
        indexed_at: string;
    };
}

interface Page {
    _id: string;
    url: string;
    status: string;
    crawl_frequency: string;
    chunk_ids: string[];
    chunk_count?: number;
    token_count: number;
    isActive: boolean;
    last_crawled?: string;
    raw_url?: string;
    screenshot_url?: string;
}

interface Site {
    _id: string;
    domain: string;
    status: string;
    pages: Page[];
}

// 🌳 Simple YAML Tree Node Renderer
const TreeNode = ({ yaml }: { yaml: string }) => {
    try {
        const lines = yaml.split('\n').filter(l => l.trim());
        return (
            <div className="space-y-1 font-mono text-xs">
                {lines.map((line, i) => {
                    const indent = line.search(/\S/);
                    const content = line.trim();
                    return (
                        <div key={i} style={{ paddingLeft: `${indent * 8}px` }} className="flex items-center gap-2 py-0.5 hover:bg-muted/50 rounded px-1 transition-colors">
                            <span className="text-blue-500/50">▸</span>
                            <span className={content.includes(':') ? "text-primary/80" : "text-muted-foreground"}>
                                {content}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    } catch (e) {
        return <div className="text-muted-foreground text-xs">Parsing tree...</div>;
    }
};

export default function SourceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const sourceId = params.sourceId as string;
    const { activeOrgId } = useOrg();

    const [loading, setLoading] = useState(true);
    const [site, setSite] = useState<Site | null>(null);
    const [pageIndexes, setPageIndexes] = useState<PageIndex[]>([]);
    const [sourceType, setSourceType] = useState<string>('website');
    const [newUrl, setNewUrl] = useState("");
    const [crawlLogs, setCrawlLogs] = useState<string[]>([]);
    const [editingPage, setEditingPage] = useState<Page | null>(null);
    const [pageToDelete, setPageToDelete] = useState<string | null>(null);
    const [discoverModalOpen, setDiscoverModalOpen] = useState(false);
    const [pageToRefresh, setPageToRefresh] = useState<string | null>(null);

    // Warning Dialogs
    const [retrainWarningOpen, setRetrainWarningOpen] = useState(false);
    const [freqWarning, setFreqWarning] = useState<{ id: string, val: string } | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    // Derived Logic
    const sortedPages = site?.pages || [];
    const totalPages = Math.ceil(sortedPages.length / itemsPerPage);
    const paginatedPages = sortedPages.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const fetchSite = async () => {
        setLoading(true);
        try {
            // Source type can be dynamic, for now we default to website for this detail page
            const res = await api.get(`/knowledge/${activeOrgId}/source/website/${sourceId}`);
            if (res.data.success) {
                setSite(res.data.data);
                setPageIndexes(res.data.pageIndexes || []);
                setSourceType(res.data.type || 'website');
            } else {
                toast.error("Source not found");
                router.push('/dashboard/ai-studio/brain');
            }
        } catch (error) {
            console.error("❌ Fetch source error:", error);
            toast.error("Failed to load source details");
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        if (sourceId) fetchSite();
    }, [sourceId]);

    // Socket listeners for real‑time updates
    useEffect(() => {
        if (!activeOrgId) return () => { };

        // Strip /v1 from API URL for Socket.io (Socket needs base URL only)
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
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
            if (data.url) {
                setCrawlLogs(prev => [`[${new Date().toLocaleTimeString()}] Crawled: ${data.url}`, ...prev].slice(0, 50));
            }
        });

        socket.on("crawl:completed", () => {
            toast.success("Crawl completed!");
            fetchSite();
        });


        socket.on("brain:progress", (data: any) => {
            console.log("🧠 Brain progress event received:", data);
            if (data.pageUrl) {
                // Update status in real-time WITHOUT page reload
                setSite(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        pages: prev.pages.map((p: Page) => {
                            const normalize = (u: string) => u.replace(/\/$/, "");
                            if (normalize(p.url) === normalize(data.pageUrl)) {
                                // Map backend status to frontend status
                                let newStatus = p.status;
                                let updates: any = {};

                                if (data.status === 'synced') {
                                    newStatus = 'trained';
                                    updates.last_crawled = new Date().toISOString();
                                    // Update chunks and tokens if provided
                                    if (data.chunks !== undefined) {
                                        updates.chunk_count = data.chunks;
                                        updates.chunk_ids = new Array(data.chunks).fill('');
                                    }
                                    if (data.tokens !== undefined) {
                                        updates.token_count = data.tokens;
                                    }
                                } else if (data.status === 'embedding') {
                                    newStatus = 'embedding';
                                } else if (data.status === 'crawling') {
                                    newStatus = 'crawling';
                                } else if (data.status === 'failed') { // 🔥 FIX: Handle Failure
                                    newStatus = 'failed';
                                    updates.error_message = data.message || "Unknown error"; // Assume backend sends message
                                } else {
                                    newStatus = data.status; // Fallback
                                }

                                console.log(`📝 Updating page ${p.url}: ${p.status} → ${newStatus}`, updates);
                                return {
                                    ...p,
                                    status: newStatus,
                                    ...updates
                                };
                            }
                            return p;
                        })
                    };
                });
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [activeOrgId]);

    const handleToggle = async (pageId: string, currentStatus: boolean) => {
        if (!site) return;
        // Optimistic UI update
        setSite(prev => {
            if (!prev) return null;
            return {
                ...prev,
                pages: prev.pages.map((p: Page) => p._id === pageId ? { ...p, isActive: !currentStatus } : p)
            };
        });
        try {
            await api.put(`/sites/${site._id}/pages/${pageId}/toggle`, { isActive: !currentStatus });
            toast.success(`Page AI usage ${!currentStatus ? 'enabled' : 'disabled'}.`);
        } catch (error) {
            // Revert on failure
            setSite(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    pages: prev.pages.map((p: Page) => p._id === pageId ? { ...p, isActive: currentStatus } : p)
                };
            });
            toast.error("Failed to update status");
        }
    };

    const handleRefreshPage = async (pageId: string) => {
        // Show confirmation dialog
        setPageToRefresh(pageId);
    };

    const confirmRefreshPage = async () => {
        if (!pageToRefresh) return;
        const pageId = pageToRefresh;
        setPageToRefresh(null);

        try {
            await api.post(`/sites/${sourceId}/pages/${pageId}/crawl`);

            // ✅ Show success ONLY after API succeeds
            toast.success("✅ Page refresh scheduled! Waiting for processing...", {
                description: "Auto-recrawling will start soon. Tokens will be deducted after training."
            });

            // 🔥 NO OPTIMISTIC UPDATES - Status will update via Socket.io event
        } catch (error: any) {
            // Show specific error from backend (no console.error - it's expected)
            const errorMsg = error.response?.data?.message || "Failed to refresh page";
            toast.error(errorMsg);
        }
    };

    const handleDeletePage = (pageId: string) => {
        setPageToDelete(pageId);
    };

    const confirmDeletePage = async () => {
        if (!pageToDelete || !site) return;
        try {
            await api.delete(`/sites/${site._id}/pages/${pageToDelete}`);
            setSite(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    pages: prev.pages.filter((p: Page) => p._id !== pageToDelete)
                };
            });
            toast.success("Page deleted successfully");
        } catch (error) {
            toast.error("Failed to delete page");
        } finally {
            setPageToDelete(null);
        }
    };

    const handleAddPage = async () => {
        if (!newUrl || !site) return;
        try {
            await api.put(`/sites/${site._id}`, { pages: [newUrl] });
            toast.success("Page added. It will be crawled shortly.");
            setNewUrl("");
            fetchSite();
        } catch (error) {
            toast.error("Failed to add page");
        }
    };

    const handleFrequencyChange = async (pageId: string, frequency: string) => {
        // Warning Logic: ALWAYS show warning for any change
        setFreqWarning({ id: pageId, val: frequency });
    };

    const confirmFrequencyChange = async (pageId: string, frequency: string) => {
        if (!site) return;
        setFreqWarning(null); // Close warning

        // Optimistic UI update
        setSite(prev => {
            if (!prev) return null;
            return {
                ...prev,
                pages: prev.pages.map((p: Page) => p._id === pageId ? { ...p, crawl_frequency: frequency } : p)
            };
        });
        try {
            await api.put(`/sites/${site._id}/pages/${pageId}`, { crawl_frequency: frequency });
            toast.success("Frequency updated");
        } catch (error) {
            toast.error("Failed to update frequency");
            fetchSite(); // revert
        }
    };

    const handleRecrawl = async () => {
        if (!site) return;
        setRetrainWarningOpen(false); // Close warning
        try {
            await api.post(`/knowledge/${site._id}/crawl`, {});
            toast.success("Re‑crawl scheduled successfully");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to schedule re‑crawl");
        }
    };

    // Wrapper for Retrain Button
    const confirmRetrain = () => setRetrainWarningOpen(true);

    const handleAddDiscoveredPages = async (urls: string[]) => {
        if (!site) return;
        try {
            // Append to existing pages
            await api.put(`/sites/${site._id}`, { pages: urls });
            toast.success(`added ${urls.length} pages`);
            fetchSite();
        } catch (e) {
            toast.error("Failed to add pages");
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    if (!site) return <div className="p-10 text-center">Source not found</div>;

    return (
        <div className="p-6 space-y-6 bg-background min-h-screen text-foreground">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                        <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{site.domain}</h1>
                        <p className="text-sm text-muted-foreground">Website Source • Status: {site.status}</p>
                    </div>
                </div>
                <div className="ml-auto flex gap-2">
                    <Button variant="outline" className="gap-2" onClick={confirmRetrain}>
                        <RefreshCw className="w-4 h-4" /> Retrain All Website
                    </Button>
                </div>
            </div>

            {/* Real‑time Logs */}
            {crawlLogs.length > 0 && (
                <Card className="bg-black/90 text-green-400 font-mono text-xs border-green-900/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin" /> Real‑time Crawl Logs
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[150px] overflow-y-auto space-y-1">
                        {crawlLogs.map((log, i) => (
                            <div key={i}>{log}</div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Page Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Pages &amp; Training Status</CardTitle>
                    <CardDescription>Manage individual pages. Toggle OFF to exclude from AI knowledge.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 mt-2">
                    {/* 🔥 Add Specific URL & Discover */}
                    <div className="flex flex-col sm:flex-row w-full items-center gap-4 p-4 border rounded-lg bg-muted/20">
                        <div className="flex-1 flex gap-2 w-full">
                            <Input
                                placeholder="https://cluaiz.com/new-page"
                                className="bg-background"
                                value={newUrl}
                                onChange={(e) => setNewUrl(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddPage()}
                            />
                            <Button onClick={handleAddPage} disabled={!newUrl} className="whitespace-nowrap">
                                <Plus className="w-4 h-4 mr-2" /> Add Page
                            </Button>
                        </div>
                        <div className="hidden sm:block text-muted-foreground">|</div>
                        <Button variant="secondary" onClick={() => setDiscoverModalOpen(true)} className="w-full sm:w-auto">
                            <Search className="w-4 h-4 mr-2" /> Discover New Pages
                        </Button>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[45%]">Page URL</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Frequency</TableHead>
                                <TableHead>Points</TableHead>
                                <TableHead>Words</TableHead>
                                <TableHead>AI Usage</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedPages.length > 0 ? (
                                paginatedPages.map((page: Page) => (
                                    <TableRow key={page._id} className={!page.isActive ? "opacity-50 bg-muted/50" : ""}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <span className="truncate max-w-[300px]" title={page.url}>
                                                    {/* Show relative path if matches domain, else full URL */}
                                                    {(() => {
                                                        try {
                                                            const urlObj = new URL(page.url);
                                                            // If hostname matches site domain (roughly) or page starts with site domain
                                                            if (site.domain && page.url.includes(site.domain.replace('https://', '').replace('http://', '').replace(/\/$/, ''))) {
                                                                return urlObj.pathname + urlObj.search;
                                                            }
                                                            return page.url;
                                                        } catch (e) {
                                                            return page.url;
                                                        }
                                                    })()}
                                                </span>
                                                <a href={page.url.startsWith('http') ? page.url : `https://${site.domain}${page.url}`} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary">
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {page.status === 'crawling' ? (
                                                <Badge variant="outline" className="animate-pulse border-yellow-500 text-yellow-500">Reading...</Badge>
                                            ) : page.status === 'embedding' ? (
                                                <Badge variant="outline" className="animate-pulse border-blue-500 text-blue-500">Learning...</Badge>
                                            ) : page.status === 'trained' ? (
                                                <Badge variant="outline" className="border-green-500 text-green-500">Trained</Badge>
                                            ) : (
                                                <Badge variant="outline" className="border-gray-500 text-gray-500">{page.status || 'Synced'}</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Select value={page.crawl_frequency || "14d"} onValueChange={(val) => handleFrequencyChange(page._id, val)} disabled={!page.isActive}>
                                                <SelectTrigger className="h-7 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="weekly">Weekly</SelectItem>
                                                    <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                                                    <SelectItem value="monthly">Monthly</SelectItem>
                                                    <SelectItem value="never">Never (Manual)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>{page.chunk_count ?? (page.chunk_ids?.length || 0)} points</TableCell>
                                        <TableCell>{((page.token_count || 0) / 1000).toFixed(1)}k words</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Switch checked={page.isActive} onCheckedChange={() => handleToggle(page._id, page.isActive)} />
                                                <span className="text-sm text-muted-foreground">{page.isActive ? "ON" : "OFF"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end items-center gap-1">
                                                {/* 🔥 Visual Snapshot Button */}
                                                {(page.screenshot_url || page.raw_url) && (
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                        title="View Visual Snapshot"
                                                        onClick={() => {
                                                            const rawPath = page.screenshot_url || page.raw_url || "";
                                                            if (!rawPath) return;

                                                            let minioUrl = rawPath;
                                                            // Logic matches SourceCard.tsx
                                                            if (rawPath.startsWith('s3://')) {
                                                                minioUrl = rawPath.replace('s3://', 'http://localhost:9000/');
                                                            } else if (rawPath.startsWith('crawls/')) {
                                                                minioUrl = `http://localhost:9000/cluaiz-raw-data/${rawPath}`;
                                                            }
                                                            window.open(minioUrl, '_blank');
                                                        }}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                )}

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!page.isActive}>
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleRefreshPage(page._id)} disabled={!page.isActive}>
                                                            <RefreshCw className="w-4 h-4 mr-2" /> Refresh Memory
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setEditingPage(page)} disabled={!page.isActive}>
                                                            <Pencil className="w-4 h-4 mr-2" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeletePage(page._id)}>
                                                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No pages found. Crawl might be in progress.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter className="bg-muted/10 border-t p-4 flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                        Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, sortedPages.length)} of {sortedPages.length}
                    </div>

                    <div className="flex items-center gap-4">
                        <Select value={itemsPerPage.toString()} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                            <SelectTrigger className="w-[80px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="min-w-[30px] text-center text-sm">{currentPage} / {totalPages || 1}</span>
                            <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardFooter>
            </Card>

            {/* Edit Dialog */}
            {editingPage && (
                <EditPageDialog isOpen={!!editingPage} onClose={() => setEditingPage(null)} siteId={sourceId} page={editingPage} onUpdate={fetchSite} />
            )}

            {/* Delete Confirmation */}
            <AlertDialog open={!!pageToDelete} onOpenChange={() => setPageToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the page and remove all associated learned data from the knowledge base.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeletePage} className="bg-red-600 hover:bg-red-700">Delete Page</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Retrain Warning Dialog */}
            <AlertDialog open={retrainWarningOpen} onOpenChange={setRetrainWarningOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
                            <AlertTriangle className="w-5 h-5" /> Retrain Entire Website?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This will queue <strong>all {site.pages.length} pages</strong> for re-analysis.
                            <br /><br />
                            <span className="font-semibold block text-foreground">⚠️ Token Cost Warning</span>
                            Discovering new content or updates will consume tokens based on your burn rate.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRecrawl}>Yes, Retrain All</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Frequency Change Warning */}
            <AlertDialog open={!!freqWarning} onOpenChange={() => setFreqWarning(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
                            {freqWarning?.val === 'never' ? <AlertTriangle className="w-5 h-5 text-blue-500" /> : <AlertTriangle className="w-5 h-5" />}
                            {freqWarning?.val === 'never' ? "Disable Auto-Updates?" : "Enable Recurring Updates?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Setting this page to <strong>{freqWarning?.val === 'never' ? 'Never' : freqWarning?.val}</strong>.
                            <br /><br />
                            {freqWarning?.val === 'never' ? (
                                <span className="block text-foreground">
                                    💡 <strong>Note:</strong> Automatic crawling will stop. You will need to manually refresh this page to get updates.
                                </span>
                            ) : (
                                <span className="block p-2 bg-amber-500/10 border border-amber-500/20 rounded-md text-amber-700 text-sm">
                                    <span className="font-semibold block">⚠️ Recurring Cost Warning</span>
                                    Future updates will automatically deduct tokens from your balance.
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => freqWarning && confirmFrequencyChange(freqWarning.id, freqWarning.val)}>
                            Confirm Change
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Page Refresh Confirmation Dialog */}
            <AlertDialog open={!!pageToRefresh} onOpenChange={() => setPageToRefresh(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
                            <AlertTriangle className="w-5 h-5" /> Confirm Page Refresh?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Refreshing this page will re-crawl and re-analyze the content, <strong>consuming tokens</strong> from your balance.
                            <br /><br />
                            {/* Show current page size */}
                            {(() => {
                                const page = site?.pages.find(p => p._id === pageToRefresh);
                                if (page) {
                                    return (
                                        <span className="block text-sm mb-2">
                                            <strong>Current Size:</strong> ~{((page.token_count || 0) / 1000).toFixed(1)}k words
                                        </span>
                                    );
                                }
                                return null;
                            })()}
                            <span className="block p-2 bg-amber-500/10 border border-amber-500/20 rounded-md text-amber-700 dark:text-amber-400 text-sm">
                                <span className="font-semibold block">⚠️ Token Cost Estimate</span>
                                Estimated cost: <strong>~{(() => {
                                    const page = site?.pages.find(p => p._id === pageToRefresh);
                                    return Math.ceil((page?.token_count || 1000) * 1.0);
                                })()}  tokens</strong> (based on current page size × your plan's burn rate)
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmRefreshPage}>Yes, Refresh Page</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>


            {/* 🧠 Logical Navigator — Scalable Neural Trees */}
            {pageIndexes.length > 0 && (
                <Card className="border-blue-500/20 shadow-lg shadow-blue-500/5 bg-gradient-to-br from-background to-secondary/5">
                    <CardHeader className="border-b border-border/50 pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <Network className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">Logical Navigator</CardTitle>
                                    <CardDescription>Visual map of the Neural Tree (Page Index) captured from your pages.</CardDescription>
                                </div>
                            </div>
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                                Scalable Neural OS
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/50 max-h-[600px] overflow-y-auto">
                            {pageIndexes.map((idx, i) => (
                                <div key={idx._id || i} className="p-4 hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Code2 className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm font-mono text-muted-foreground truncate" title={idx.url}>
                                            {idx.url}
                                        </span>
                                    </div>
                                    <div className="bg-muted/20 rounded-xl p-4 border border-border/40">
                                        <TreeNode yaml={idx.page_index} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Discover Modal */}
            <DiscoverPagesModal
                isOpen={discoverModalOpen}
                onClose={() => setDiscoverModalOpen(false)}
                siteId={site._id}
                siteUrl={site.domain}
                existingPages={site.pages.map(p => p.url)}
                onAddPages={handleAddDiscoveredPages}
            />
        </div>
    );
}
