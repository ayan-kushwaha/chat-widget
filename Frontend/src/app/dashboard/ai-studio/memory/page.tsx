import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, FileText, Database, BarChart3 } from "lucide-react";
import { AutoLearningTab } from "./AutoLearningTab";
import { MemoryManagerTab } from "./MemoryManagerTab";
import { MemoryTimelineTabV2 } from "./MemoryTimelineTab";
import { PageWrapper, ScrollableContent } from "@/components/layout/PageWrapper";
import { PageHeader } from "@/components/layout/PageHeader";

export default function MemoryPage() {
    return (
        <PageWrapper>
            <PageHeader
                title="Learning Studio 🧠"
                description="Manage how your AI Agent learns and remembers information."
            />
            <ScrollableContent>
                <div className="h-full flex flex-col">
                    <Tabs defaultValue="auto-learning" className="flex-1 flex flex-col">
                        <div className="px-6 border-b border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-950/50 backdrop-blur-sm z-10">
                            <TabsList className="bg-transparent p-0 h-12 w-full justify-start gap-6">
                                <TabsTrigger
                                    value="auto-learning"
                                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none h-full px-0"
                                >
                                    Auto Learning
                                </TabsTrigger>
                                {/* Add more tabs here in future */}
                            </TabsList>
                        </div>

                        <TabsContent value="auto-learning" className="flex-1 p-6 mt-0">
                            <AutoLearningTab />
                        </TabsContent>
                    </Tabs>
                </div>
            </ScrollableContent>
        </PageWrapper>
    );
}
