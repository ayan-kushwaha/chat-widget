"use client";

import { ComingSoon } from "@/components/shared/ComingSoon";
import { Bot, Search, PenTool, VenetianMask, Eye } from "lucide-react";

export default function AgentsPage() {
    return (
        <ComingSoon
            title="Autonomous AI Agents"
            description="Hire specialized AI employees like 'Email Spy' and 'Researcher' to work for you 24/7."
            badge="In Development"
            progress={40}
            features={[
                {
                    title: "Research Agent",
                    desc: "Scours the web to find market trends, competitor pricing, and news for you.",
                    icon: Search,
                },
                {
                    title: "Email Spy",
                    desc: "Reads incoming emails and drafts personalized, high-converting replies on autopilot.",
                    icon: VenetianMask,
                },
                {
                    title: "Content Writer",
                    desc: "Auto-generates SEO blog posts and social media content based on your niche.",
                    icon: PenTool,
                }
            ]}
        />
    );
}
