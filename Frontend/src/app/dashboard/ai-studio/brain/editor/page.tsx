"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Globe, Upload, Brain, Activity, Save, Database, Hash, Sparkles, Wand2, Undo2, Redo2, RefreshCcw, Check, Clock, Loader2, PanelRightClose, PanelRight, FileText, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BrainEditor } from "@/components/ai-studio/brain/BrainEditor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AutoResizeTextarea } from "@/app/dashboard/settings/org/components/AutoResizeTextarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

import { WebsiteTab } from "../components/forms/WebsiteTab";
import { FileUploadTab } from "../components/forms/FileUploadTab";
import { ApiSourceTab } from "../components/forms/ApiSourceTab";
import { WebsiteCanvas } from "@/components/ai-studio/brain/WebsiteCanvas";
import { FileCanvas } from "@/components/ai-studio/brain/FileCanvas";
import { ApiCanvas } from "@/components/ai-studio/brain/ApiCanvas";
import api from "@/lib/api";
import { useOrg } from "@/context/OrgContext";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const getWordCount = (text: string) => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
};

export default function AddKnowledgeCanvas() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const typeFromQuery = searchParams.get("type");

    const { activeOrgId } = useOrg();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [editId, setEditId] = useState<string | null>(searchParams.get("edit"));
    const [isEditing, setIsEditing] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(searchParams.get("edit") ? true : false);

    // Unified Shared States (Sidebar)
    const [description, setDescription] = useState("");
    const [aiIntent, setAiIntent] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [customTitle, setCustomTitle] = useState("");

    // Knowledge Doc specific state
    const [editorContent, setEditorContent] = useState<any>({
        type: "doc",
        content: [
            {
                type: "heading",
                attrs: { level: 1 },
                content: [{ type: "text", text: "" }]
            }
        ]
    });
    const [editorHtml, setEditorHtml] = useState<string>("");
    const [editorText, setEditorText] = useState<string>("");

    // Website specific state
    const [websiteUrl, setWebsiteUrl] = useState("");
    const [discoveredUrls, setDiscoveredUrls] = useState<string[]>([]);
    const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
    const [crawlFrequency, setCrawlFrequency] = useState("never");
    const [isDiscovering, setIsDiscovering] = useState(false);

    // File specific state
    const [file, setFile] = useState<File | null>(null);
    const [existingSource, setExistingSource] = useState<any>(null);

    // API specific state
    const [apiConfig, setApiConfig] = useState<any>(null);

    // UI States
    const [isSyncing, setIsSyncing] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [isAutoFilling, setIsAutoFilling] = useState(false);
    const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [createdAt, setCreatedAt] = useState<Date | null>(null);
    const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
    const [stats, setStats] = useState({ words: 0, chars: 0, tokens: 0 });

    // Refs ensure the debounced syncData always has the latest user input
    // even if the function was scheduled seconds ago.
    const editorRef = useRef(editorContent);
    const editorHtmlRef = useRef(editorHtml);
    const editorTextRef = useRef(editorText);
    const descriptionRef = useRef(description);
    const aiIntentRef = useRef(aiIntent);
    const tagsRef = useRef(tags);
    const customTitleRef = useRef(customTitle);
    const websiteUrlRef = useRef(websiteUrl);
    const apiConfigRef = useRef(apiConfig);
    const crawlFrequencyRef = useRef(crawlFrequency);
    const selectedUrlsRef = useRef(selectedUrls);
    const discoveredUrlsRef = useRef(discoveredUrls); // 🔥 Added to track ALL URLs

    // Keep refs in sync with state
    useEffect(() => { editorRef.current = editorContent; }, [editorContent]);
    useEffect(() => { editorHtmlRef.current = editorHtml; }, [editorHtml]);
    useEffect(() => { editorTextRef.current = editorText; }, [editorText]);
    useEffect(() => { descriptionRef.current = description; }, [description]);
    useEffect(() => { aiIntentRef.current = aiIntent; }, [aiIntent]);
    useEffect(() => { tagsRef.current = tags; }, [tags]);
    useEffect(() => { customTitleRef.current = customTitle; }, [customTitle]);
    useEffect(() => { websiteUrlRef.current = websiteUrl; }, [websiteUrl]);
    useEffect(() => { apiConfigRef.current = apiConfig; }, [apiConfig]);
    useEffect(() => { crawlFrequencyRef.current = crawlFrequency; }, [crawlFrequency]);
    useEffect(() => { selectedUrlsRef.current = selectedUrls; }, [selectedUrls]);
    useEffect(() => { discoveredUrlsRef.current = discoveredUrls; }, [discoveredUrls]); // 🔥 Update ref


    // --- COMPUTED HELPERS ---
    const isDoc = !typeFromQuery || typeFromQuery === 'knowledge-doc';
    const firstH1Node = editorContent?.content?.find((node: any) =>
        node.type === 'heading' && node.attrs?.level === 1
    );

    let extractedTitle = "";
    if (isDoc) {
        if (editorHtml) {
            const h1Match = editorHtml.match(/<h1[^>]*>(.*?)<\/h1>/);
            extractedTitle = h1Match ? h1Match[1].replace(/<[^>]+>/g, '') : "";
        } else {
            extractedTitle = firstH1Node?.content?.[0]?.text || "";
        }
    } else {
        extractedTitle = customTitle || (typeFromQuery === 'website' ? websiteUrl : (file?.name || "Untitled Source"));
    }

    const isOverLimit =
        ((customTitle?.length || 0) > 140) ||
        ((description?.length || 0) > 500) ||
        ((aiIntent?.length || 0) > 350) ||
        ((tags?.length || 0) > 12) ||
        (isDoc && (stats?.chars || 0) > 12000);

    // Keyboard Shortcut for Save
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                const btn = document.getElementById("save-knowledge-btn");
                if (btn && !(btn as HTMLButtonElement).disabled) {
                    btn.click();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (!editId || !activeOrgId) return;

        const fetchSourceData = async () => {
            try {
                toast.loading("Loading source data...", { id: "fetch-source" });
                setIsEditing(true);

                // Need proper endpoint mapping
                let endpoint = "";
                const type = typeFromQuery || 'knowledge-doc';

                if (type === 'website') endpoint = `/sites/${editId}`;
                else endpoint = `/knowledge/${activeOrgId}/overview`;

                const res = await api.get(endpoint);
                toast.dismiss("fetch-source");

                if (res.data) {
                    let source: any = null;
                    if (type === 'website') {
                        source = res.data.site || res.data;
                    } else if (res.data.sources) {
                        const s = res.data.sources;
                        if (type === 'api') source = s.api?.find((obj: any) => obj.id === editId);
                        else if (type === 'knowledge-doc') source = s.custom_text?.find((obj: any) => obj.id === editId);
                        else if (type === 'file') source = s.documents?.find((obj: any) => obj.id === editId);
                    }

                    if (source) {
                        setExistingSource(source);
                        // For files, if title is missing, use fileName
                        const initialTitle = source.title || (type === 'file' ? (source.fileName || source.name) : "");
                        setCustomTitle(initialTitle);

                        // Extract description safely, fallback to stripping tags if it gets html unintentionally
                        let parsedDesc = source.description || source.preview || "";
                        if (parsedDesc && parsedDesc.includes("<") && parsedDesc.includes(">")) {
                            parsedDesc = parsedDesc.replace(/<[^>]+>/g, '');
                        }
                        setDescription(parsedDesc);

                        let parsedIntent = source.intent_summary || source.intent || "";
                        if (parsedIntent && parsedIntent.includes("<") && parsedIntent.includes(">")) {
                            parsedIntent = parsedIntent.replace(/<[^>]+>/g, '');
                        }
                        setAiIntent(parsedIntent);

                        setTags(source.tags || []);
                        setCreatedAt(source.createdAt ? new Date(source.createdAt) : null);
                        setUpdatedAt(source.updatedAt || source.last_updated ? new Date(source.updatedAt || source.last_updated) : null);
                        setIsDataLoading(false);

                        if (type === 'knowledge-doc') {
                            let content: any = source.content;
                            try {
                                if (typeof source.content === 'string' && source.content.trim().startsWith('{')) {
                                    content = JSON.parse(source.content);
                                }
                            } catch (e) {
                                // fallback to string
                            }
                            setEditorContent(content);
                            if (typeof content === 'string' && content.trim().startsWith('<')) {
                                setEditorHtml(content);
                            }
                            calculateStats(content, typeof content === 'string' ? content : '', "");
                        } else if (type === 'website') {
                            setWebsiteUrl(source.domain || "");
                            setCrawlFrequency(source.crawl_schedule || "never");
                            setSelectedUrls(source.pages?.map((p: any) => p.url) || []);
                        } else if (type === 'api') {
                            setApiConfig({
                                url: source.url,
                                method: source.method,
                                toolName: source.title,
                                toolPurpose: source.description,
                                authType: source.authType,
                                headers: source.headers,
                                bodyTemplate: source.bodyTemplate,
                                searchParam: source.searchParam,
                                contextHints: source.contextHints,
                                category: source.category
                            });
                        }
                    } else {
                        toast.error("Source not found");
                        setIsDataLoading(false);
                    }
                }
            } catch (error: any) {
                toast.dismiss("fetch-source");
                toast.error("Failed to load source details");
                console.error("Fetch Error:", error);
                setIsDataLoading(false);
            }
        };

        fetchSourceData();
    }, [editId, activeOrgId, typeFromQuery]);


    useEffect(() => {
        const handleClear = () => setExistingSource(null);
        document.addEventListener('clear-existing-source', handleClear);
        return () => document.removeEventListener('clear-existing-source', handleClear);
    }, []);

    const calculateStats = (content: any, html: string = "", text: string = "") => {
        let plainText = text;
        if (!plainText) {
            if (typeof content === 'string') {
                plainText = content.replace(/<[^>]+>/g, '');
            } else if (content?.content) {
                content.content.forEach((node: any) => {
                    if (node.content) {
                        node.content.forEach((textNode: any) => {
                            if (textNode.type === 'text') plainText += textNode.text + " ";
                        });
                    }
                    plainText += "\n";
                });
            }
        }
        const chars = plainText.trim().length;
        // Word count approximation since getWordCount is removed
        const words = plainText.trim().split(/\s+/).filter(w => w.length > 0).length;
        const tokens = Math.ceil(chars / 4);
        setStats({ words, chars, tokens });
    };

    const globalCharCount =
        (customTitle?.length || 0) +
        (description?.length || 0) +
        (aiIntent?.length || 0) +
        (tags?.length || 0) * 5 +
        (stats?.chars || 0);

    // --- RE-ORDERED SYNC LOGIC ---

    const syncData = async (options: { isExplicitSave?: boolean } = {}) => {
        if (!isEditing && !options.isExplicitSave) return;

        // Use Ref values to avoid stale closure state
        const currentContent = editorRef.current;
        const currentEditorHtml = editorHtmlRef.current;
        const currentDescription = descriptionRef.current;
        const currentAiIntent = aiIntentRef.current;
        const currentTags = tagsRef.current;
        const currentTitle = customTitleRef.current;
        const currentWebsiteUrl = websiteUrlRef.current;
        const currentApiConfig = apiConfigRef.current;
        const currentCrawlFreq = crawlFrequencyRef.current;
        const currentSelectedUrls = selectedUrlsRef.current;
        const currentDiscoveredUrls = discoveredUrlsRef.current;

        if (isOverLimit && !options.isExplicitSave) {
            console.warn("Auto-sync skipped: Input limits exceeded");
            return;
        }

        // Status only starts when actual sync begins
        setIsSyncing(true);

        try {
            if (isDoc) {
                if (!currentContent && !currentEditorHtml) {
                    setIsSyncing(false);
                    return;
                }

                // 🔥 CRITICAL FIX: Always try to extract title from H1 first for knowledge docs!
                let extractedH1 = "";

                if (currentEditorHtml) {
                    const match = currentEditorHtml.match(/<h1[^>]*>(.*?)<\/h1>/);
                    if (match) {
                        extractedH1 = match[1].replace(/<[^>]+>/g, '').trim();
                    } else {
                        const plainText = currentEditorHtml.replace(/<[^>]+>/g, '').trim();
                        extractedH1 = plainText.substring(0, 50);
                    }
                } else if (typeof currentContent === 'object' && currentContent?.content) {
                    const firstH1 = currentContent.content.find((node: any) =>
                        node.type === 'heading' && node.attrs?.level === 1
                    );
                    extractedH1 = firstH1?.content?.[0]?.text?.trim() || "";
                }

                // If we found an H1 in the editor, THAT is the undeniable new title.
                // Otherwise, fallback to whatever was already saved.
                let dynamicTitle = extractedH1 || currentTitle || "Untitled Document";

                // Final safety truncation for backend limits (140 chars)
                if (dynamicTitle.length > 130) {
                    dynamicTitle = dynamicTitle.substring(0, 127) + "...";
                }

                const contentData = currentEditorHtml || (typeof currentContent === 'string' ? currentContent : JSON.stringify(currentContent));

                const payload = {
                    title: dynamicTitle,
                    content: contentData,
                    description: currentDescription, // Local UI field
                    summary: currentDescription,     // Backend standard field
                    tags: currentTags,
                    intent_summary: currentAiIntent,
                    priority: "high",
                    skipTrain: !options.isExplicitSave
                };

                if (editId) {
                    await api.patch(`/knowledge/${activeOrgId}/source/text/${editId}`, payload);
                } else if (options.isExplicitSave) {
                    const res = await api.post(`/knowledge/${activeOrgId}/manual-text`, payload);
                    if (res.data?.data?.id || res.data?.data?._id) {
                        setEditId(res.data.data.id || res.data.data._id);
                    }
                }
            } else if (typeFromQuery === 'website') {
                if (!currentWebsiteUrl) {
                    setIsSyncing(false);
                    return;
                }
                const dynamicTitle = currentTitle || currentWebsiteUrl;
                const payload = {
                    domain: currentWebsiteUrl,
                    title: dynamicTitle,
                    crawl_schedule: currentCrawlFreq,
                    description: currentDescription, // Unified description field
                    summary: currentDescription,     // Fallback for models using summary
                    intent_summary: currentAiIntent,
                    tags: currentTags,
                    pages: currentDiscoveredUrls.length > 0 
                        ? currentDiscoveredUrls.map((url: string) => ({
                            url,
                            isActive: currentSelectedUrls.includes(url)
                        }))
                        : currentSelectedUrls.length > 0
                            ? currentSelectedUrls.map((url: string) => ({ url, isActive: true }))
                            : undefined,
                    allowUI_Actions: true,
                    skipTrain: !options.isExplicitSave
                };

                if (editId) {
                    await api.patch(`/knowledge/${activeOrgId}/source/website/${editId}`, payload);
                } else if (options.isExplicitSave) {
                    const res = await api.post('/sites', payload);
                    if (res.data?.data?.id || res.data?.data?._id) {
                        setEditId(res.data.data.id || res.data.data._id);
                    }
                }
            } else if (typeFromQuery === 'file') {
                const dynamicTitle = currentTitle || (file?.name || "Untitled Source");
                if (editId) {
                    if (file) {
                        // User is replacing the file + updating metadata
                        const formData = new FormData();
                        formData.append("file", file);
                        if (dynamicTitle) formData.append("title", dynamicTitle);
                        if (currentDescription) formData.append("description", currentDescription);
                        if (currentAiIntent) formData.append("intent_summary", currentAiIntent);
                        if (currentTags && currentTags.length > 0) formData.append("tags", JSON.stringify(currentTags));

                        await api.patch(`/knowledge/${activeOrgId}/source/file/${editId}`, formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                    } else {
                        // Just updating metadata
                        await api.patch(`/knowledge/${activeOrgId}/source/file/${editId}`, {
                            title: dynamicTitle,
                            description: currentDescription,
                            summary: currentDescription,
                            intent_summary: currentAiIntent,
                            tags: currentTags
                        });
                    }
                } else if (options.isExplicitSave) {
                    if (!file) throw new Error("File is required");
                    const formData = new FormData();
                    formData.append("file", file!);
                    formData.append("title", dynamicTitle);
                    formData.append("description", currentDescription);
                    formData.append("summary", currentDescription);
                    formData.append("intent_summary", currentAiIntent);
                    formData.append("tags", JSON.stringify(currentTags));
                    formData.append("skipTrain", "true");
                    await api.post(`/knowledge/${activeOrgId}/upload`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                }
            } else if (typeFromQuery === 'api') {
                if (!currentApiConfig?.url) {
                    setIsSyncing(false);
                    return;
                }
                const dynamicTitle = currentTitle || currentApiConfig.toolName || currentApiConfig.url;

                const payload = {
                    url: currentApiConfig.url,
                    title: dynamicTitle,
                    description: currentDescription || currentApiConfig.toolPurpose,
                    summary: currentDescription || currentApiConfig.toolPurpose,
                    tags: currentTags,
                    intent_summary: currentAiIntent || currentApiConfig.toolPurpose,
                    method: currentApiConfig.method,
                    authType: currentApiConfig.authType,
                    headers: currentApiConfig.headers,
                    bodyTemplate: currentApiConfig.bodyTemplate,
                    searchParam: currentApiConfig.searchParam,
                    contextHints: currentApiConfig.contextHints,
                    syncMode: 'real-time',
                    category: currentApiConfig.category,
                    skipTrain: true
                };

                if (editId) {
                    await api.patch(`/knowledge/${activeOrgId}/source/api/${editId}`, payload);
                } else if (options.isExplicitSave) {
                    await api.post(`/knowledge/${activeOrgId}/api-source`, payload);
                }
            }

            setUpdatedAt(new Date());
            setIsSyncing(false);
            setIsDirty(false);
        } catch (e: any) {
            console.error("Sync Error:", e);
            setIsSyncing(false);

            let errorMsg = "Auto-sync failed. Please save manually.";
            if (e.response?.status === 400) {
                errorMsg = `Validation Error: ${e.response?.data?.message || "Invalid data"}`;
            } else if (e.response?.data?.message) {
                errorMsg = e.response.data.message;
            }

            toast.error(errorMsg);
            // Don't reset isDirty on error so they know it failed
            if (options.isExplicitSave) throw e;
        }
    };

    const handleEditorChange = (content: any, html?: string, text?: string) => {
        setEditorContent(content);
        if (html !== undefined) setEditorHtml(html);
        if (text !== undefined) setEditorText(text);
        calculateStats(content, html || "", text || "");

        if (!isEditing) return;

        setIsDirty(true);
        // Reset the 10s timer every time user types
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

        syncTimeoutRef.current = setTimeout(() => {
            syncData();
        }, 10000); // 10 second debounce
    };

    // Auto-sync for metadata fields (Only track changes when actually editing)
    useEffect(() => {
        if (!isEditing || isDataLoading) return;

        setIsDirty(true);
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

        syncTimeoutRef.current = setTimeout(() => {
            syncData();
        }, 10000);

        return () => {
            if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        };
    }, [description, aiIntent, tags, customTitle, websiteUrl, apiConfig, crawlFrequency, selectedUrls]);



    const handleSave = async () => {
        toast.loading("Saving to Brain...", { id: "save-brain" });

        try {
            await syncData({ isExplicitSave: true });
            toast.success("Knowledge successfully added!", { id: "save-brain" });
            router.push("/dashboard/ai-studio/brain");
            router.refresh();
        } catch (e: any) {
            toast.error(e.response?.data?.message || e.message || "Failed to save", { id: "save-brain" });
        }
    };

    const handleAutoFill = async () => {
        try {
            let contentToAnalyze = "";
            let currentType = typeFromQuery || 'knowledge-doc';

            if (isDoc) {
                // Get text from editor
                contentToAnalyze = editorText || (editorHtml ? editorHtml.replace(/<[^>]+>/g, '') : "");
                if (!contentToAnalyze && typeof editorContent === 'object' && editorContent?.content) {
                    editorContent.content.forEach((node: any) => {
                        if (node.content) {
                            node.content.forEach((textNode: any) => {
                                if (textNode.type === 'text') contentToAnalyze += textNode.text + " ";
                            });
                        }
                        contentToAnalyze += "\n";
                    });
                }
            } else if (currentType === 'api') {
                contentToAnalyze = JSON.stringify(apiConfig);
            }

            if (!contentToAnalyze || contentToAnalyze.trim().length < 50) {
                return toast.error("Not enough content to analyze. Please add more details first.");
            }

            setIsAutoFilling(true);
            toast.loading("AI is analyzing your content...", { id: "auto-fill" });

            const res = await api.post('/knowledge/auto-fill-metadata', {
                content: contentToAnalyze,
                type: currentType,
                sourceId: editId
            });

            toast.dismiss("auto-fill");
            setIsAutoFilling(false);

            if (res.data.success && res.data.data) {
                const { title, description: desc, intent, tags: newTags } = res.data.data;

                if (desc) setDescription(desc);
                if (intent) setAiIntent(intent);
                if (newTags && newTags.length > 0) {
                    setTags(prev => [...new Set([...prev, ...newTags])]);
                }
                if (title && !isDoc && !customTitle) setCustomTitle(title);

                toast.success("✨ Metadata Auto-Filled!");
            }
        } catch (error: any) {
            toast.dismiss("auto-fill");
            setIsAutoFilling(false);
            toast.error(error.response?.data?.message || "Failed to auto-fill metadata");
        }
    };

    const handleAutoTag = async () => {
        if (!websiteUrl) return toast.error("Enter URL first");
        try {
            toast.loading("Generating tags...", { id: "auto-tag" });
            const res = await api.post('/knowledge/auto-tag', { 
                url: websiteUrl,
                siteId: editId
            });
            toast.dismiss("auto-tag");
            if (res.data.success && res.data.tags && res.data.tags.length > 0) {
                setTags(prev => [...new Set([...prev, ...res.data.tags])]);
                if (res.data.description && !description) setDescription(res.data.description);
                if (res.data.intent && !aiIntent) setAiIntent(res.data.intent);
                if (res.data.title && !customTitle) setCustomTitle(res.data.title);
                toast.success("Metadata generated!");
            } else {
                toast.error("No tags generated");
            }
        } catch (error) {
            toast.dismiss("auto-tag");
            toast.error("Failed to generate tags");
        }
    };

    const addTag = () => {
        const val = tagInput.trim();
        if (tags.length >= 12) {
            toast.error("Maximum of 12 tags allowed");
            return;
        }
        if (val && !tags.includes(val)) {
            setTags([...tags, val]);
            setTagInput("");
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    return (
        <TooltipProvider delayDuration={400}>
            <div className="flex flex-col h-[calc(100vh-53px)] bg-white dark:bg-[#0A0A0A] overflow-hidden font-sans text-neutral-900 dark:text-neutral-100 selection:bg-indigo-500/30">
                {/* 💎 Premium Sticky Header */}
                <header className="flex-none h-14 bg-white/70 dark:bg-[#0A0A0A]/70 backdrop-blur-xl border-b border-neutral-200/50 dark:border-neutral-800/50 px-6 flex items-center justify-between z-50 sticky top-0">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.back()}
                                className="h-8 w-8 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all active:scale-95"
                            >
                                <ArrowLeft className="h-4 w-4 text-neutral-500" />
                            </Button>
                            <div className="h-4 w-[1px] bg-neutral-200 dark:bg-neutral-800 mr-1" />
                            <div className="flex items-center gap-2 text-xs font-semibold tracking-tight uppercase text-neutral-400">
                                <span className="hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors cursor-pointer" onClick={() => router.push('/dashboard/ai-studio/brain')}>Brain Studio</span>
                                <span className="text-neutral-300 dark:text-neutral-800">/</span>
                                <span className="text-neutral-900 dark:text-white uppercase">
                                    {typeFromQuery === 'website' && (isEditing ? "Edit Website" : "Index Website")}
                                    {typeFromQuery === 'file' && (isEditing ? "Edit Document Meta" : "Upload Documents")}
                                    {typeFromQuery === 'api' && (isEditing ? "Edit API Tool" : "API Connection")}
                                    {isDoc && (isEditing ? "Edit Knowledge Doc" : "New Knowledge Doc")}
                                </span>
                            </div>
                        </div>

                        {isDoc && (
                            <div className="flex items-center gap-1.5 ml-2">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                                            onClick={() => document.dispatchEvent(new CustomEvent('editor-undo'))}
                                        >
                                            <Undo2 className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="text-[10px] py-1 px-2 border-neutral-200 dark:border-neutral-800">
                                        Undo <span className="ml-1 opacity-50 font-mono text-[9px]">Ctrl+Z</span>
                                    </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                                            onClick={() => document.dispatchEvent(new CustomEvent('editor-redo'))}
                                        >
                                            <Redo2 className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="text-[10px] py-1 px-2 border-neutral-200 dark:border-neutral-800">
                                        Redo <span className="ml-1 opacity-50 font-mono text-[9px]">Ctrl+Y</span>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center self-center h-8 px-3 rounded-full bg-neutral-100/50 dark:bg-white/5 border border-neutral-200/50 dark:border-white/5 transition-all ">
                            <AnimatePresence mode="wait">
                                {(isSyncing || isDirty) ? (
                                    <motion.div
                                        key="syncing"
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className="flex items-center gap-2"
                                    >
                                        <Loader2 className="h-2.5 w-2.5 animate-spin text-blue-500" />
                                        {isDoc && (
                                            <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-tight">Syncing...</span>
                                        )}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="synced"
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className="flex items-center gap-2 pr-1"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex h-2 w-2">
                                                <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75", editId ? "bg-emerald-500 animate-ping" : "bg-neutral-500")}></span>
                                                <span className={cn("relative inline-flex rounded-full h-2 w-2", editId ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-neutral-500")}></span>
                                            </div>
                                            <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-tight">
                                                {editId ? "Synced" : "Draft"}
                                            </span>
                                        </div>
                                        <div className="h-3 w-[1px] bg-neutral-200 dark:bg-neutral-800 mx-1" />
                                        <span className="text-[10px] font-medium text-neutral-400 whitespace-nowrap">
                                            {editId ? (
                                                `Last sync: ${updatedAt ? updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Not synced'}`
                                            ) : (
                                                'Draft: Unsaved'
                                            )}
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="h-4 w-[1px] bg-neutral-200 dark:bg-neutral-800" />

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className={cn(
                                "h-8 px-2.5 text-xs font-semibold rounded-lg border border-transparent transition-all active:scale-95 flex items-center gap-2",
                                sidebarOpen
                                    ? "bg-neutral-100 dark:bg-neutral-900/50 text-neutral-900 dark:text-neutral-100 border-neutral-200 dark:border-neutral-800"
                                    : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                            )}
                        >
                            {sidebarOpen ? (
                                <PanelRightClose className="w-3.5 h-3.5 opacity-80" />
                            ) : (
                                <PanelRight className="w-3.5 h-3.5 opacity-80" />
                            )}
                            <span className="text-[10px] uppercase tracking-wider font-bold">
                                {sidebarOpen ? "Hide Tools" : "Show Tools"}
                            </span>
                        </Button>

                        <div className="h-4 w-[1px] bg-neutral-200 dark:bg-neutral-800" />

                        <Button
                            id="save-knowledge-btn"
                            size="sm"
                            onClick={handleSave}
                            disabled={isOverLimit}
                            className={cn(
                                "h-8 px-4 text-xs font-bold shadow-lg shadow-black/5 dark:shadow-white/5 transition-all active:scale-95 rounded-lg",
                                isOverLimit
                                    ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed"
                                    : "bg-black hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                            )}
                        >
                            {typeFromQuery === 'api' ? <Zap className="w-3.5 h-3.5 mr-2" /> : <Save className="w-3.5 h-3.5 mr-2" />}
                            {typeFromQuery === 'api' ? (isEditing ? "Update Tool" : "Save Tool") : (isEditing ? "Update Knowledge" : "Save Knowledge")}
                        </Button>
                    </div>
                </header>

                <div className="flex flex-1 overflow-hidden relative items-stretch">
                    <main className="flex-1 bg-white dark:bg-[#0A0A0A] transition-all duration-300 ease-in-out relative overflow-hidden">
                        <ScrollArea className="h-full w-full">
                            <div className="mx-auto min-h-full max-w-[1200px] px-12 pt-2 pb-40">
                                {(!typeFromQuery || typeFromQuery === 'knowledge-doc') && (
                                    <BrainEditor
                                        key={isEditing ? `edit-${editId}-${isDataLoading}` : 'new'}
                                        initialContent={editorContent}
                                        onChange={handleEditorChange}
                                        className="w-full"
                                    />
                                )}
                                {typeFromQuery === 'website' && (
                                    <WebsiteCanvas
                                        url={websiteUrl}
                                        onUrlChange={setWebsiteUrl}
                                        discoveredUrls={discoveredUrls}
                                        onDiscoveredUrlsChange={setDiscoveredUrls}
                                        selectedUrls={selectedUrls}
                                        onSelectedUrlsChange={setSelectedUrls}
                                        crawlFrequency={crawlFrequency}
                                        onCrawlFrequencyChange={setCrawlFrequency}
                                        isDiscovering={isDiscovering}
                                        setIsDiscovering={setIsDiscovering}
                                        onDiscoveryData={(data) => {
                                            if (data?.description && !description) {
                                                setDescription(data.description);
                                            }
                                        }}
                                    />
                                )}
                                {typeFromQuery === 'file' && (
                                    <FileCanvas
                                        file={file}
                                        onFileChange={setFile}
                                        existingSource={existingSource}
                                    />
                                )}
                                {typeFromQuery === 'api' && (
                                    <ApiCanvas
                                        config={apiConfig}
                                        onConfigChange={setApiConfig}
                                    />
                                )}
                            </div>
                        </ScrollArea>
                    </main>

                    {/* 🤖 Simplified Right Sidebar */}
                    <aside
                        className={cn(
                            "flex-none w-[360px] bg-neutral-50/50 dark:bg-[#0D0D0D] border-l border-neutral-200/50 dark:border-neutral-800/50 flex flex-col transition-all duration-300 ease-in-out z-40 overflow-hidden",
                            !sidebarOpen ? "mr-[-360px] opacity-0 pointer-events-none" : "mr-0 opacity-100"
                        )}
                    >
                        <ScrollArea className="h-full w-full">
                            <div className="flex-1 p-8 space-y-12">
                                {/* 📝 Automatic Title Section */}
                                <section className="space-y-4">
                                    <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                                        <Brain className="w-3.5 h-3.5 text-blue-500" />
                                        Title
                                    </h3>
                                    <div className={cn(
                                        "rounded-xl bg-white dark:bg-neutral-900 border shadow-sm flex items-center group transition-all duration-300",
                                        isDoc
                                            ? "p-4 border-neutral-200/50 dark:border-neutral-800/50 min-h-[50px] hover:border-neutral-300 dark:hover:border-neutral-700"
                                            : "border-2 border-neutral-200 dark:border-neutral-800 focus-within:border-blue-500/50 h-[52px] overflow-hidden shadow-indigo-500/5"
                                    )}>
                                        {isDoc ? (
                                            <p className={cn(
                                                "text-sm font-bold leading-tight",
                                                extractedTitle ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-400/60 font-medium"
                                            )}>
                                                {extractedTitle || "Knowledge Doc Title..."}
                                            </p>
                                        ) : (
                                            <div className="flex-1 flex flex-col group py-1">
                                                <input
                                                    value={customTitle}
                                                    onChange={(e) => {
                                                        if (e.target.value.length <= 140) {
                                                            setCustomTitle(e.target.value);
                                                        }
                                                    }}
                                                    placeholder={typeFromQuery === 'website' ? websiteUrl : (file?.name || "Enter title...")}
                                                    className="border-none bg-transparent shadow-none w-full outline-none focus:ring-0 focus:ring-offset-0 text-sm font-bold h-full px-4 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400/60 transition-all"
                                                />
                                                <div className="px-4 flex justify-end">
                                                    <span className={cn(
                                                        "text-[8px] font-bold tracking-tighter uppercase",
                                                        customTitle.length >= 130 ? "text-red-500" : "text-neutral-400 opacity-0 group-focus-within:opacity-100 transition-opacity"
                                                    )}>
                                                        {customTitle.length}/140
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* 📖 Description Section */}
                                <section className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                                            <Database className="w-3.5 h-3.5 text-neutral-400" />
                                            Description
                                        </h3>
                                        <span className={cn(
                                            "text-[9px] font-bold tracking-tight uppercase",
                                            description.length >= 480 ? "text-red-500" : "text-neutral-400"
                                        )}>
                                            {description.length}/500 chars
                                        </span>
                                    </div>
                                    <AutoResizeTextarea
                                        value={description}
                                        onChange={setDescription}
                                        maxLength={500}
                                        placeholder="Add a brief description..."
                                        className="min-h-[60px] bg-white dark:bg-neutral-900 border-neutral-200/50 dark:border-neutral-800/50 p-3"
                                    />
                                </section>

                                {/* 🧞 AI Intent Context Section */}
                                <section className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                                            <Wand2 className="w-3.5 h-3.5 text-purple-500" />
                                            AI Intent / Context
                                        </h3>
                                        <span className={cn(
                                            "text-[9px] font-bold tracking-tight uppercase",
                                            aiIntent.length >= 325 ? "text-red-500" : "text-neutral-400"
                                        )}>
                                            {aiIntent.length}/350 chars
                                        </span>
                                    </div>
                                    <AutoResizeTextarea
                                        value={aiIntent}
                                        onChange={setAiIntent}
                                        maxLength={350}
                                        rows={2}
                                        placeholder="Explain how the AI should use this info..."
                                        className="min-h-[60px] bg-white dark:bg-neutral-900 border-neutral-200/50 dark:border-neutral-800/50 p-3"
                                    />

                                </section>

                                {/* 🏷️ Interactive Tags Section */}
                                <section className="space-y-4 pb-10">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                                            <Hash className="w-3.5 h-3.5" />
                                            Brain Tags
                                            <span className={cn(
                                                "ml-2 text-[9px]",
                                                tags.length >= 10 ? "text-red-500" : "text-neutral-400"
                                            )}>
                                                ({tags.length}/12)
                                            </span>
                                        </h3>
                                        {(typeFromQuery === 'website' || isDoc || typeFromQuery === 'api') && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 text-[9px] font-bold gap-1 text-blue-500 hover:text-blue-600 uppercase transition-all"
                                                onClick={isDoc || typeFromQuery === 'api' ? handleAutoFill : handleAutoTag}
                                                disabled={isAutoFilling || (typeFromQuery === 'website' ? !websiteUrl : false)}
                                            >
                                                {isAutoFilling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                {isDoc || typeFromQuery === 'api' ? "✨ Auto-Fill" : "Auto-Generate"}
                                            </Button>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap gap-2">
                                            <AnimatePresence>
                                                {tags.map((tag) => (
                                                    <motion.div
                                                        key={tag}
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.8 }}
                                                    >
                                                        <Badge
                                                            variant="secondary"
                                                            className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-none rounded-full text-xs font-medium flex items-center gap-2 group hover:bg-red-500/10 hover:text-red-500 transition-colors cursor-pointer"
                                                            onClick={() => removeTag(tag)}
                                                        >
                                                            {tag}
                                                            <span className="opacity-40 group-hover:opacity-100 text-[10px]">✕</span>
                                                        </Badge>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                        {tags.length < 12 ? (
                                            <div className="relative group">
                                                <Input
                                                    value={tagInput}
                                                    onChange={(e) => setTagInput(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && addTag()}
                                                    placeholder="Add a tag..."
                                                />
                                                <div className="absolute right-3 top-5 -translate-y-1/2">
                                                    <kbd className="px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700 text-[8px] text-neutral-400">Enter</kbd>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-3 rounded-lg border border-dashed border-red-500/30 bg-red-500/5 text-center">
                                                <p className="text-[10px] font-bold text-red-500 uppercase">Limit Reached</p>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {isDoc && (
                                    <section className="space-y-4 pt-4 border-t border-neutral-200/50 dark:border-neutral-800/50">
                                        <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                                            <Activity className="w-3.5 h-3.5 text-emerald-500" />
                                            Document Insights
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm transition-all hover:border-neutral-300 dark:hover:border-neutral-700 bg-gradient-to-br from-transparent to-neutral-50/50 dark:to-neutral-800/20">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center">
                                                        <FileText className="w-2.5 h-2.5 text-blue-500" />
                                                    </div>
                                                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-tight">Overall</span>
                                                </div>
                                                <div className="flex items-baseline gap-1">
                                                    <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{globalCharCount}</p>
                                                    <span className="text-[10px] text-neutral-400 font-medium">chars</span>
                                                </div>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm transition-all hover:border-neutral-300 dark:hover:border-neutral-700 bg-gradient-to-br from-transparent to-neutral-50/50 dark:to-neutral-800/20">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-5 h-5 rounded-full bg-purple-500/10 flex items-center justify-center">
                                                        <Zap className="w-2.5 h-2.5 text-purple-500" />
                                                    </div>
                                                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-tight">Context</span>
                                                </div>
                                                <div className="flex items-baseline gap-1">
                                                    <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{Math.ceil(globalCharCount / 4)}</p>
                                                    <span className="text-[10px] text-neutral-400 font-medium">tokens</span>
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                )}

                                <section className="space-y-4 pt-4 border-t border-neutral-200/50 dark:border-neutral-800/50">
                                    <div className="p-5 rounded-3xl bg-neutral-100/30 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/50 space-y-4 backdrop-blur-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider flex items-center gap-2">
                                                <Clock className="w-3 h-3 opacity-60" /> Created On
                                            </span>
                                            <span className="text-[10px] font-bold text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-800 px-2 py-0.5 rounded-md border border-neutral-200/50 dark:border-neutral-700/50">
                                                {editId && createdAt ? (
                                                    `${createdAt.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })} • ${createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                                ) : (
                                                    <span className="text-neutral-400">---</span>
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider flex items-center gap-2">
                                                <RefreshCcw className="w-3 h-3 opacity-60" /> Last Sync
                                            </span>
                                            <span className={cn(
                                                "text-[10px] font-bold px-2 py-0.5 rounded-md border",
                                                (isSyncing || isDirty)
                                                    ? "text-blue-500 bg-blue-500/5 border-blue-500/10 animate-pulse"
                                                    : editId ? "text-emerald-500 bg-emerald-500/5 border-emerald-500/10" : "text-neutral-400 bg-neutral-100 dark:bg-neutral-800 border-neutral-200/50 dark:border-neutral-700/50"
                                            )}>
                                                {(isSyncing || isDirty) ? 'Syncing...' : (editId ? (
                                                    updatedAt
                                                        ? `${updatedAt.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })} • ${updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                                        : 'Not synced'
                                                ) : (
                                                    'Draft'
                                                ))}
                                            </span>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Footer Info */}
                            <div className="p-8 pt-0 opacity-40">
                                <div className="p-4 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 text-center">
                                    <p className="text-[9px] font-bold text-neutral-400 tracking-tighter uppercase mb-1">Knowledge Guard</p>
                                    <p className="text-[8px] text-neutral-500 leading-tight">Securely encrypted and indexed for private enterprise brain.</p>
                                </div>
                            </div>
                        </ScrollArea>
                    </aside>
                </div>
            </div>
        </TooltipProvider>
    );
}
