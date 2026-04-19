"use client";

import { ComingSoon } from "@/components/shared/ComingSoon";
import { Users, UserCircle, Search, LineChart, Linkedin } from "lucide-react";

export default function ContactsPage() {
    return (
        <ComingSoon
            title="Smart Contacts CRM"
            description="A built-in Mini CRM to track every lead. See user journey, sentiment, and auto-enrich data automatically."
            badge="Planned"
            features={[
                {
                    title: "Auto-Enrichment",
                    desc: "Automatically finds LinkedIn profiles, job titles, and company info from just an email.",
                    icon: Linkedin,
                },
                {
                    title: "Lead Scoring",
                    desc: "AI analyzes chat sentiment to score leads (Hot/Warm/Cold) for your sales team.",
                    icon: LineChart,
                },
                {
                    title: "Journey Tracking",
                    desc: "See exactly which pages they visited and what they asked before converting.",
                    icon: Search,
                }
            ]}
        />
    );
}
