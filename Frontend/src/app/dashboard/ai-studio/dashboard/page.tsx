"use client";

import { PageWrapper, ScrollableContent } from "@/components/layout/PageWrapper";
import { PageHeader } from "@/components/layout/PageHeader";
import { useBrainStats } from "@/hooks/useBrainStats";
import { PlanLimitsDashboard } from "@/components/dashboard/PlanLimitsDashboard";
import { Loader2 } from "lucide-react";
import { useOrg } from "@/context/OrgContext";
import { useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AIStudioDashboardPage() {
    const { activeOrgId } = useOrg();
    const {
        loading,
        stats,
        planUsage,
        tokensBySource,
        sources,
        refresh: fetchOverview
    } = useBrainStats();

    // Auto-refresh handled by hook internally

    if (loading && !stats.totalSources) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <PageWrapper>
            <PageHeader
                title="AI Studio Dashboard"
                description="Overview of your AI Agent's performance and knowledge usage."
            />


            <ScrollableContent>
                <div className="p-6 max-w-[8 8vw] mx -auto">
                    <PlanLimitsDashboard
                        planUsage={planUsage}
                        stats={stats}
                        tokensBySource={tokensBySource}
                        apiCount={sources.api.length}
                        fileList={sources.files}
                    />
                </div>
            </ScrollableContent>

        </PageWrapper>
    );
}
