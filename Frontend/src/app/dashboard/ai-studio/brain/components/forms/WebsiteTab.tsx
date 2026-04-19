"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, X, Wand2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useTagManager } from "./hooks/useTagManager";

interface WebsiteTabProps {
    loading: boolean;
    onSuccess: () => void;
    onOpenChange: (open: boolean) => void;
    mode?: 'add' | 'edit';
    initialData?: any;
}

export function WebsiteTab({ loading, onSuccess, onOpenChange, mode = 'add', initialData }: WebsiteTabProps) {
    const { handleAddTag, handleRemoveTag } = useTagManager();

    const [websiteUrl, setWebsiteUrl] = useState(initialData?.domain || "");
    const [websiteDescription, setWebsiteDescription] = useState(initialData?.description || "");
    const [intentSummary, setIntentSummary] = useState(initialData?.intent_summary || "");
    const [websiteTags, setWebsiteTags] = useState<string[]>(initialData?.tags || []);
    const [websiteTagInput, setWebsiteTagInput] = useState("");
    const [crawlFrequency, setCrawlFrequency] = useState(initialData?.crawl_schedule || "never");
    const [discoveredUrls, setDiscoveredUrls] = useState<string[]>([]);
    const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
    const [isDiscovering, setIsDiscovering] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleDiscover = async () => {
        if (!websiteUrl) return;
        setIsDiscovering(true);
        try {
            const res = await api.post('/knowledge/discover', { url: websiteUrl });
            if (res.data.success) {
                if (res.data.data?.description && !websiteDescription) {
                    setWebsiteDescription(res.data.data.description);
                }
                if (res.data.urls && res.data.urls.length > 0) {
                    setDiscoveredUrls(res.data.urls);
                    setSelectedUrls(res.data.urls);
                    toast.success(`Discovered ${res.data.urls.length} pages`);
                } else {
                    toast.success(`Site discovered: ${res.data.data?.title || websiteUrl}`);
                }
            }
        } catch (error) {
            console.error("Discovery failed", error);
            toast.error("Failed to discover site. Please continue manually.");
        } finally {
            setIsDiscovering(false);
        }
    };

    const handleAutoTag = async () => {
        if (!websiteUrl) return toast.error("Enter URL first");
        try {
            toast.loading("Generating tags...");
            const res = await api.post('/knowledge/auto-tag', { url: websiteUrl });
            toast.dismiss();
            if (res.data.success && res.data.tags && res.data.tags.length > 0) {
                setWebsiteTags(prev => [...new Set([...prev, ...res.data.tags])]);
                toast.success("Tags generated!");
            } else {
                toast.error("No tags generated");
            }
        } catch (error) {
            toast.dismiss();
            toast.error("Failed to generate tags");
        }
    };

    const handleWebsiteSubmit = async () => {
        if (!websiteUrl) return toast.error("URL is required");
        setSubmitting(true);
        try {
            if (mode === 'edit') {
                const siteId = initialData._id || initialData.id;
                await api.put(`/sites/${siteId}`, {
                    crawl_schedule: crawlFrequency,
                    description: websiteDescription,
                    intent_summary: intentSummary,
                    tags: websiteTags,
                    pages: selectedUrls.length > 0 ? selectedUrls : undefined
                });
                toast.success("Website updated successfully");
            } else {
                await api.post('/sites', {
                    domain: websiteUrl,
                    crawl_schedule: crawlFrequency,
                    description: websiteDescription,
                    intent_summary: intentSummary,
                    tags: websiteTags,
                    pages: selectedUrls.length > 0 ? selectedUrls : undefined
                });
                toast.success("Website added successfully");
            }
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || `Failed to ${mode === 'edit' ? 'update' : 'add'} website`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="space-y-2">
                    <Label>Website URL</Label>
                    <div className="flex gap-2">
                        <Input
                            placeholder="https://example.com"
                            value={websiteUrl}
                            onChange={(e) => setWebsiteUrl(e.target.value)}
                            disabled={mode === 'edit'}
                            className="h-10"
                        />
                        <Button variant="outline" onClick={handleDiscover} disabled={isDiscovering || !websiteUrl}>
                            {isDiscovering ? <Loader2 className="w-4 h-4 animate-spin" /> : "Discover"}
                        </Button>
                    </div>
                </div>

                {discoveredUrls.length > 0 && (
                    <div className="border rounded-lg p-3 bg-muted/30 max-h-40 overflow-y-auto">
                        <div className="space-y-1">
                            {discoveredUrls.map((url, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedUrls.includes(url)}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedUrls([...selectedUrls, url]);
                                            else setSelectedUrls(selectedUrls.filter(u => u !== url));
                                        }}
                                        className="rounded border-gray-300"
                                    />
                                    <span className="text-sm truncate" title={url}>{url}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <Label>Crawl Frequency</Label>
                    <Select value={crawlFrequency} onValueChange={setCrawlFrequency}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="never">Never (Manual)</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Frequency Warnings */}
                    {(crawlFrequency === 'weekly' || crawlFrequency === 'monthly') && (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-md text-sm mt-2 flex gap-2 items-start">
                            <span>⚠️</span>
                            <div>
                                <span className="font-semibold block">Recurring Cost Warning</span>
                                Rediscovering content costs tokens. <br />
                                <span className="text-xs opacity-80">(New Tokens * 1 Burn Rate)</span>
                            </div>
                        </div>
                    )}

                    {crawlFrequency === 'never' && (
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-600 rounded-md text-sm mt-2 flex gap-2 items-start">
                            <span>💡</span>
                            <div>
                                <span className="font-semibold block">Save Tokens</span>
                                Static site? Select &apos;Never&apos; to save tokens. <br />
                                <span className="text-xs opacity-80">You can manually &apos;Refresh&apos; anytime.</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <Label>Description <span className="text-muted-foreground font-normal ml-1">(Optional)</span></Label>
                    <Textarea
                        placeholder="What is this website about?"
                        value={websiteDescription}
                        onChange={(e) => setWebsiteDescription(e.target.value)}
                        maxLength={3000}
                    />
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                        <span>💡 Describe this website for better context.</span>
                        <span>{websiteDescription.length}/3000</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Intent Context / Answer Guide <span className="text-muted-foreground font-normal ml-1">(Optional - Ai Auto-Generate)</span></Label>
                    <Textarea
                        placeholder="e.g., This site covers Engine Optimization, User Experience, and Boosting"
                        value={intentSummary}
                        onChange={(e) => setIntentSummary(e.target.value)}
                        className="italic text-sm min-h-[80px]"
                        maxLength={600}
                    />
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                        <span>💡 Helps the AI understand **what questions** this site can answer.</span>
                        <span>{intentSummary.length}/600 (Max 120 words)</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label>Tags (Optional)</Label>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs gap-1 text-primary"
                            onClick={handleAutoTag}
                            disabled={!websiteUrl}
                        >
                            <Wand2 className="w-3 h-3" /> Auto-Generate
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Add tag..."
                            value={websiteTagInput}
                            onChange={(e) => setWebsiteTagInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag(websiteTagInput, websiteTags, setWebsiteTags, setWebsiteTagInput))}
                        />
                        <Button type="button" onClick={() => handleAddTag(websiteTagInput, websiteTags, setWebsiteTags, setWebsiteTagInput)}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {websiteTags.map((tag, i) => (
                            <Badge key={i} variant="secondary" className="gap-1">
                                {tag}
                                <X className="w-3 h-3 cursor-pointer" onClick={() => handleRemoveTag(i, setWebsiteTags)} />
                            </Badge>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-background mt-auto">
                <Button className="w-full" onClick={handleWebsiteSubmit} disabled={submitting}>
                    {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {mode === 'edit' ? 'Update Website' : 'Save Website'}
                </Button>
            </div>
        </>
    );
}
