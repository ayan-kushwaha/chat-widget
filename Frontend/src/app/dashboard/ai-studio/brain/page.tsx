"use client";

import { useState } from "react";
import { KnowledgeTab } from "./tabs/KnowledgeTab";
import { PageWrapper, ScrollableContent } from "@/components/layout/PageWrapper";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { SourceSelectionModal } from "./components/SourceSelectionModal";
import { KnowledgeTrainingModal } from "./components/KnowledgeTrainingModal";
import { useBrainStats } from "@/hooks/useBrainStats";

export default function BrainPage() {
    const router = useRouter();
    const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
    const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);

    const { stats, refresh } = useBrainStats();

    const handleAddOpen = () => {
        setIsSelectionModalOpen(true);
    };

    return (
        <PageWrapper>
            <PageHeader
                title="Brain Studio"
                description="Control Center for your AI's Knowledge Base"
                actions={
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setIsTrainingModalOpen(true)}
                            className="rounded-full hover:bg-primary/10 hover:text-primary transition-all border-neutral-200 dark:border-neutral-800"
                            title="Training Guide"
                        >
                            <Info className="w-5 h-5 shadow-sm" />
                        </Button>
                        <Button
                            onClick={handleAddOpen}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Data Source
                        </Button>
                    </div>
                }
            />

            <ScrollableContent>
                <KnowledgeTab />
            </ScrollableContent>

            <SourceSelectionModal
                open={isSelectionModalOpen}
                onOpenChange={setIsSelectionModalOpen}
            />

            <KnowledgeTrainingModal
                open={isTrainingModalOpen}
                onOpenChange={setIsTrainingModalOpen}
                stats={stats}
                onStrategyGenerated={refresh}
            />
        </PageWrapper >
    );
}
