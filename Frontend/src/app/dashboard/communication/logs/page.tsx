"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Database } from "lucide-react";
import { MemoryManagerTab } from "../../ai-studio/memory/MemoryManagerTab";
import { MemoryTimelineTabV2 } from "../../ai-studio/memory/MemoryTimelineTab";
import { PageWrapper, ScrollableContent } from "@/components/layout/PageWrapper";
import { PageHeader } from "@/components/layout/PageHeader";

export default function ChatLogsPage() {
    return (
        <PageWrapper>
            <PageHeader
                title="Communication Logs 💬"
                description="View and manage all AI communication logs, chat history, and active sessions"
            />

            <ScrollableContent>
                <Tabs defaultValue="timeline" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="timeline" className="gap-2">
                            <FileText className="h-4 w-4" />
                            Chats Timeline
                        </TabsTrigger>
                        <TabsTrigger value="manager" className="gap-2">
                            <Database className="h-4 w-4" />
                            Chats Master List
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="timeline" className="space-y-4">
                        <MemoryTimelineTabV2 />
                    </TabsContent>

                    <TabsContent value="manager" className="space-y-4">
                        <MemoryManagerTab />
                    </TabsContent>
                </Tabs>
            </ScrollableContent>
        </PageWrapper>
    );
}
