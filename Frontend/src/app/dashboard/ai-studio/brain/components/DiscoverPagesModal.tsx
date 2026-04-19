"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Globe, Search, Plus } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface DiscoverPagesModalProps {
    isOpen: boolean;
    onClose: () => void;
    siteId: string;
    siteUrl: string;
    existingPages: string[];
    onAddPages: (urls: string[]) => Promise<void>;
}

export function DiscoverPagesModal({ isOpen, onClose, siteId, siteUrl, existingPages, onAddPages }: DiscoverPagesModalProps) {
    const [loading, setLoading] = useState(false);
    const [discoveredUrls, setDiscoveredUrls] = useState<string[]>([]);
    const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
    const [hasDiscovered, setHasDiscovered] = useState(false);
    const [adding, setAdding] = useState(false);

    const handleDiscover = async () => {
        setLoading(true);
        setHasDiscovered(false);
        try {
            const res = await api.post('/knowledge/discover', { url: siteUrl });
            if (res.data.success && res.data.urls) {
                // Filter out pages that are already in the system
                // robust comparison: normalize slashes
                const normalize = (u: string) => u.replace(/\/$/, "").toLowerCase();
                const existingSet = new Set(existingPages.map(normalize));

                const newUrls = res.data.urls.filter((u: string) => !existingSet.has(normalize(u)));

                setDiscoveredUrls(newUrls);
                // Auto-select all new valid URLs
                setSelectedUrls(newUrls);
                setHasDiscovered(true);

                if (newUrls.length === 0) {
                    toast.info("No new pages found. All discovered pages are already added.");
                } else {
                    toast.success(`Found ${newUrls.length} new pages`);
                }
            } else {
                toast.error("No pages discovered");
            }
        } catch (error) {
            console.error("Discovery failed", error);
            toast.error("Failed to discover pages");
        } finally {
            setLoading(false);
        }
    };

    const handleAddSelected = async () => {
        if (selectedUrls.length === 0) return;
        setAdding(true);
        try {
            await onAddPages(selectedUrls);
            toast.success(`Added ${selectedUrls.length} pages`);
            onClose();
            // Reset state
            setDiscoveredUrls([]);
            setSelectedUrls([]);
            setHasDiscovered(false);
        } catch (error) {
            console.error("Failed to add pages", error);
            toast.error("Failed to add selected pages");
        } finally {
            setAdding(false);
        }
    };

    const toggleUrl = (url: string) => {
        setSelectedUrls(prev =>
            prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
        );
    };

    const toggleAll = () => {
        if (selectedUrls.length === discoveredUrls.length) {
            setSelectedUrls([]);
        } else {
            setSelectedUrls([...discoveredUrls]);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-blue-500" />
                        Discover New Pages
                    </DialogTitle>
                    <DialogDescription>
                        Scan <strong>{siteUrl}</strong> for new content. We'll hide pages you already added.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-2 space-y-4">
                    {!hasDiscovered && !loading && (
                        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl bg-muted/20">
                            <Search className="w-10 h-10 text-muted-foreground mb-3 opacity-50" />
                            <p className="text-sm text-muted-foreground mb-4 text-center">
                                Click below to start scanning the website structure.
                            </p>
                            <Button onClick={handleDiscover} className="gap-2">
                                <Search className="w-4 h-4" /> Start Discovery
                            </Button>
                        </div>
                    )}

                    {loading && (
                        <div className="flex flex-col items-center justify-center p-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                            <p className="text-sm text-muted-foreground">Scanning sitemap & links...</p>
                        </div>
                    )}

                    {hasDiscovered && !loading && discoveredUrls.length === 0 && (
                        <div className="text-center p-8 text-muted-foreground">
                            No <strong>new</strong> pages found. Everything seems up to date!
                            <Button variant="outline" onClick={handleDiscover} className="mt-4 block mx-auto">
                                Scan Again
                            </Button>
                        </div>
                    )}

                    {hasDiscovered && discoveredUrls.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between pb-2 border-b">
                                <span className="text-sm font-medium">{discoveredUrls.length} New Pages Found</span>
                                <Button variant="ghost" size="sm" onClick={toggleAll} className="text-xs h-7">
                                    {selectedUrls.length === discoveredUrls.length ? "Deselect All" : "Select All"}
                                </Button>
                            </div>
                            <ScrollArea className="h-[300px] rounded-md border p-2">
                                <div className="space-y-2">
                                    {discoveredUrls.map((url, idx) => (
                                        <div key={idx} className="flex items-start gap-2 p-2 hover:bg-muted/50 rounded-md transition-colors">
                                            <Checkbox
                                                id={`url-${idx}`}
                                                checked={selectedUrls.includes(url)}
                                                onCheckedChange={() => toggleUrl(url)}
                                                className="mt-1"
                                            />
                                            <label
                                                htmlFor={`url-${idx}`}
                                                className="text-sm leading-tight cursor-pointer break-all flex-1"
                                                title={url}
                                            >
                                                {url}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>

                            {selectedUrls.length > 0 && (
                                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 p-3 rounded-md text-sm flex items-start gap-2">
                                    <span>⚠️</span>
                                    <div>
                                        <span className="font-semibold">Cost Warning</span>
                                        <p className="opacity-90 text-xs">
                                            Adding {selectedUrls.length} pages will trigger crawling.
                                            Estimated cost: ~{(selectedUrls.length * 500).toLocaleString()} tokens (varies by content).
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:justify-between">
                    <Button variant="ghost" onClick={onClose} disabled={adding}>Cancel</Button>
                    {hasDiscovered && discoveredUrls.length > 0 && (
                        <Button onClick={handleAddSelected} disabled={adding || selectedUrls.length === 0}>
                            {adding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            <Plus className="w-4 h-4 mr-2" />
                            Add {selectedUrls.length} Pages
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
