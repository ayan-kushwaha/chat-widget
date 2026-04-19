"use client";

import { BehaviorTab } from "../brain/tabs/BehaviorTab";
import { PageWrapper, ScrollableContent } from "@/components/layout/PageWrapper";
import { PageHeader } from "@/components/layout/PageHeader";

export default function BehaviorPage() {
    return (
        <PageWrapper>
            <PageHeader
                title="Behavior & Flow"
                description="Design your AI's conversation flow and decision logic."
            />
            <ScrollableContent>
                <BehaviorTab />
            </ScrollableContent>
        </PageWrapper>
    );
}
