"use client";

import { ComingSoon } from "@/components/shared/ComingSoon";
import { Workflow, Globe, Mail, Zap, Sheet } from "lucide-react";

export default function AutomationPage() {
    return (
        <ComingSoon
            title="AI Automation Studio"
            description="The 'n8n Killer'. Build powerful AI workflows visually without writing a single line of code."
            badge="In Development"
            progress={70}
            features={[
                {
                    title: "Drag-and-Drop Editor",
                    desc: "Connect Cluaiz to 5,000+ apps like WhatsApp, Google Sheets, Gmail visually.",
                    icon: Workflow,
                },
                {
                    title: "Multi-Step Logic",
                    desc: "Create complex flows: 'If Email Received -> Analyze Sentiment -> Reply via AI -> Save to Sheets'.",
                    icon: Zap,
                },
                {
                    title: "Native Integrations",
                    desc: "Deep integration with Google Workspace, Slack, Discord, and Shopify out of the box.",
                    icon: Globe,
                }
            ]}
        />
    );
}
