"use client";

import React, { use } from "react";
import { ProductHub, SidebarItem } from "@/components/marketing/ProductHub";
import { BLOG_CATEGORIES, getPostsByCategory } from "@/data/blog";
import { MessageSquare, Zap, Target, BookOpen, Rss, Layers } from "lucide-react";
import { notFound } from "next/navigation";

// Map aliases to icons
const blogIcons: Record<string, any> = {
    "tutorials": BookOpen,
    "product-updates": Zap,
    "case-studies": Target,
    "marketing": MessageSquare
};

export default function BlogCategoryPage({ params }: { params: Promise<{ category: string }> }) {
    const { category } = use(params);
    const categoryData = (BLOG_CATEGORIES as any)[category];

    if (!categoryData) {
        return notFound();
    }

    // 1. Sidebar with STATIC PATHS
    const sidebarItems: SidebarItem[] = Object.values(BLOG_CATEGORIES).map((cat) => ({
        name: cat.name,
        href: `/blog/${cat.id}`,
        icon: blogIcons[cat.id] || Rss,
        count: getPostsByCategory(cat.id).length
    }));

    sidebarItems.unshift({ name: "All Posts", href: "/blog", icon: Layers });

    // 2. Filtered Items
    const posts = getPostsByCategory(category).map(post => ({
        name: post.title,
        desc: post.excerpt,
        href: `/blog/${category}/${post.slug}`,
        icon: blogIcons[category] || Rss
    }));

    return (
        <ProductHub
            title={categoryData.name}
            description={categoryData.description}
            items={posts}
            sidebarItems={sidebarItems}
            activeSidebarItem={`/blog/${category}`}
        />
    );
}
