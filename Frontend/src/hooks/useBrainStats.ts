import { useState, useEffect, useMemo, useCallback } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useOrg } from "@/context/OrgContext";

export interface BrainStats {
    totalSources: number;
    tokensUsed: number; // Renamed from wordsUsed for clarity
    tokenLimit: number;
    lastSynced: string;
    totalConversations: number;
    iq: {
        level: string;
        title: string;
        progress: number;
        capabilities: string[];
    };
    trends: { tag: string; score: number; type: string }[]; // 🔥 Global Trends
    knowledge_strategy?: any;
}

export interface BrainSources {
    websites: any[];
    files: any[];
    api: any[];
    qa: any[];
    all: any[];
}

export interface ResourceLimit {
    current: number;
    limit: number;
    percentage: number;
    exceeded: number;
    available: number;
}

export interface PlanUsageData {
    websites: ResourceLimit;
    pages: ResourceLimit;
    files: ResourceLimit;
    manual: ResourceLimit;
    overall: number;
}

export interface TokensBySource {
    websites: number;
    files: number;
    manual: number;
    api: number;
    total: number;
    knowledgeUnits: number;
}

export function useBrainStats() {
    const { activeOrgId } = useOrg();
    const [loading, setLoading] = useState(true);

    // Initial Stats State
    const [stats, setStats] = useState<BrainStats>({
        totalSources: 0,
        tokensUsed: 0,
        tokenLimit: 200000,
        lastSynced: "Never",
        totalConversations: 0,
        iq: { level: "Beginner", title: "Novice Assistant", progress: 0, capabilities: [] },
        trends: [] // 🔥 Initialize empty trends
    });

    const [planUsage, setPlanUsage] = useState<PlanUsageData | null>(null);

    // Initial Sources State
    const [sources, setSources] = useState<BrainSources>({
        websites: [],
        files: [],
        api: [],
        qa: [],
        all: []
    });

    const formatNumber = (num: number) => {
        if (!num) return "0";
        // Requirement: Show full numbers (e.g. 77,400), NO abbreviations like 'k' or 'M'
        return Math.floor(num).toLocaleString();
    };

    const fetchOverview = useCallback(async () => {
        if (!activeOrgId) return;
        setLoading(true);
        try {
            const res = await api.get(`/knowledge/${activeOrgId}/overview`);
            if (res.data.success) {
                const s = res.data.stats;
                const o = res.data.overview; // 🔥 Access Overview for Trends

                // MAPPED STATS (Backend Response -> Type Safe Interface)
                setStats({
                    totalSources: s.totalSources || 0,
                    tokensUsed: Math.floor(s.wordsUsed || 0), // Force Integer
                    tokenLimit: s.wordsLimit || 200000,
                    lastSynced: s.lastSynced || "Never",
                    totalConversations: s.totalConversations || 0,
                    iq: {
                        level: s.iq?.level || "Beginner",
                        title: s.iq?.title || "Novice",
                        progress: s.iq?.progress || 0,
                        capabilities: s.iq?.capabilities || []
                    },
                    trends: o.trends || [],
                    knowledge_strategy: res.data.knowledge_strategy
                });

                if (res.data.planUsage) {
                    setPlanUsage(res.data.planUsage);
                }

                const _websites = res.data.sources.websites || [];
                const _files = res.data.sources.documents || [];
                const _api = res.data.sources.api || [];
                const _qa = res.data.sources.custom_text || [];

                setSources({
                    websites: _websites,
                    files: _files,
                    api: _api,
                    qa: _qa,
                    all: [..._websites, ..._files, ..._api, ..._qa].sort((a, b) =>
                        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
                    )
                });
            }
        } catch (error: any) {
            console.error("Failed to fetch brain overview", error);
            toast.error(error.response?.data?.message || "Failed to load brain data");
        } finally {
            setLoading(false);
        }
    }, [activeOrgId]);

    // Auto-fetch on Org Change
    useEffect(() => {
        if (activeOrgId) {
            fetchOverview();
        }
    }, [activeOrgId]);

    // Derived Logic (Move calculation out of UI)
    const usagePercentage = useMemo(() => {
        const limit = stats.tokenLimit || 200000;
        const used = stats.tokensUsed || 0;
        return Math.min((used / limit) * 100, 100);
    }, [stats.tokensUsed, stats.tokenLimit]);

    const estimatedPages = useMemo(() => {
        return Math.floor((stats.tokensUsed || 0) / 400);
    }, [stats.tokensUsed]);

    // Calculate Tokens by Source Type
    const tokensBySource = useMemo(() => {
        const calculateStats = (items: any[]) => {
            return items.reduce((acc, item) => {
                // Tokens Logic
                let tokens = item.token_count || 0;
                if (item.pages && Array.isArray(item.pages)) {
                    const pagesTokens = item.pages.reduce((pAcc: number, p: any) => pAcc + (p.token_count || 0), 0);
                    if (pagesTokens > tokens) tokens = pagesTokens;
                }

                // Chunk/Knowledge Unit Logic
                let chunks = item.chunk_count || 0;
                if (item.pages && Array.isArray(item.pages)) {
                    const pagesChunks = item.pages.reduce((pAcc: number, p: any) => pAcc + (p.chunk_count || 0), 0);
                    chunks = pagesChunks; // Prefer calculated pages chunks for websites
                }

                return {
                    tokens: acc.tokens + tokens,
                    chunks: acc.chunks + chunks
                };
            }, { tokens: 0, chunks: 0 });
        };

        const web = calculateStats(sources.websites);
        const file = calculateStats(sources.files);
        const manual = calculateStats(sources.qa);
        const api = calculateStats(sources.api);

        return {
            websites: web.tokens,
            files: file.tokens,
            manual: manual.tokens,
            api: api.tokens,
            total: web.tokens + file.tokens + manual.tokens + api.tokens,
            knowledgeUnits: web.chunks + file.chunks + manual.chunks + api.chunks
        };
    }, [sources]);

    return {
        loading,
        stats,
        planUsage,
        sources,
        tokensBySource,
        setSources, // Exposed for socket updates
        refresh: fetchOverview,
        helpers: {
            formatNumber,
            usagePercentage,
            estimatedPages
        }
    };
}
