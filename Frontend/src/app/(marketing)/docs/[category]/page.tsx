"use client";

import React, { use } from "react";
import { ProductHub, SidebarItem } from "@/components/marketing/ProductHub";
import { DOC_CATEGORIES, getDocsByCategory } from "@/data/docs";
import { FileText, BookOpen, Rocket, Shield, Zap, Settings, HelpCircle } from "lucide-react";
import { notFound } from "next/navigation";

const categoryIcons: Record<string, any> = {
    "getting-started": Rocket,
    "features": Zap,
    "integrations": Settings,
    "security": Shield,
    "api": FileText,
    "troubleshooting": HelpCircle
};

export default function DocsCategoryPage({ params }: { params: Promise<{ category: string }> }) {
    const { category } = use(params);
    const categoryData = DOC_CATEGORIES[category as keyof typeof DOC_CATEGORIES];

    if (!categoryData) {
        // Since docs/[category]/[slug] also matches docs/[category]/page, we need to be careful.
        // But [category] folder handles the segment. If [category] has [slug], dynamic routing works.
        // However, this page is inside [category] folder, so it handles /docs/getting-started
        return notFound();
    }

    // 1. Sidebar
    const sidebarItems: SidebarItem[] = Object.values(DOC_CATEGORIES).map((cat) => ({
        name: cat.name,
        href: `/docs/${cat.id}`,
        icon: categoryIcons[cat.id] || BookOpen,
        count: getDocsByCategory(cat.id).length
    }));

    sidebarItems.unshift({ name: "All Guides", href: "/docs", icon: BookOpen });

    // 2. Filtered Items
    const docs = getDocsByCategory(category).map(doc => ({
        name: doc.title,
        desc: doc.description,
        href: `/docs/${category}/${doc.slug}`,
        icon: FileText
    }));

    return (
        <ProductHub
            title={categoryData.name}
            description={categoryData.description}
            items={docs}
            sidebarItems={sidebarItems}
            activeSidebarItem={`/docs/${category}`}
        />
    );
}
