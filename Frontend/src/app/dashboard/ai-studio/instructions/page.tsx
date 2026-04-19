"use client";

import { PersonalityTab } from "../brain/tabs/PersonalityTab";
import { PageWrapper, ScrollableContent } from "@/components/layout/PageWrapper";
import { PageHeader } from "@/components/layout/PageHeader";

export default function InstructionsPage() {
    return (
        <PageWrapper>
            <PageHeader
                title="System Instructions"
                description="Configure your AI's personality, tone, and core identity."
            />
            <ScrollableContent>
                <PersonalityTab />
            </ScrollableContent>
        </PageWrapper>
    );
}
