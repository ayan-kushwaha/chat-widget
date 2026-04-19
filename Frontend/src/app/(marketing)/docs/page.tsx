"use client";

import React from "react";
import { ProductHub, SidebarItem } from "@/components/marketing/ProductHub";
import { DOC_CATEGORIES, getDocsByCategory } from "@/data/docs";
import { FileText, BookOpen, Rocket, Shield, Zap, Settings, HelpCircle } from "lucide-react";

const categoryIcons: Record<string, any> = {
    "getting-started": Rocket,
    "features": Zap,
    "integrations": Settings,
    "security": Shield,
    "api": FileText,
    "troubleshooting": HelpCircle
};

export default function DocsPage() {
    // 1. Sidebar with STATIC PATHS
    const sidebarItems: SidebarItem[] = Object.values(DOC_CATEGORIES).map((cat) => ({
        name: cat.name,
        href: `/docs/${cat.id}`, // Static Path
        icon: categoryIcons[cat.id] || BookOpen,
        count: getDocsByCategory(cat.id).length
    }));

    sidebarItems.unshift({ name: "All Guides", href: "/docs", icon: BookOpen });

    // 2. Items
    const allDocs = Object.values(DOC_CATEGORIES).flatMap(cat =>
        getDocsByCategory(cat.id).map(doc => ({
            name: doc.title,
            desc: doc.description,
            href: `/docs/${cat.id}/${doc.slug}`,
            icon: FileText
        }))
    );

    return (
        <ProductHub
            title="Documentation"
            description="Complete guides, tutorials, and API reference for Cluaiz."
            items={allDocs}
            sidebarItems={sidebarItems}
            activeSidebarItem="/docs"
        />
    );
}
