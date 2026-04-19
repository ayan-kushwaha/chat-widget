"use client";

import React from "react";
import { ProductHub, SidebarItem } from "@/components/marketing/ProductHub";
import { BLOG_CATEGORIES, getPostsByCategory } from "@/data/blog";
import { MessageSquare, Zap, Target, BookOpen, Rss, Layers } from "lucide-react";

// Map aliases to icons
const blogIcons: Record<string, any> = {
    "tutorials": BookOpen,
    "product-updates": Zap,
    "case-studies": Target,
    "marketing": MessageSquare
};

export default function BlogPage() {
    // 1. Sidebar with STATIC PATHS
    const sidebarItems: SidebarItem[] = Object.values(BLOG_CATEGORIES).map((cat) => ({
        name: cat.name,
        href: `/blog/${cat.id}`, // Static Path
        icon: blogIcons[cat.id] || Rss,
        count: getPostsByCategory(cat.id).length
    }));

    sidebarItems.unshift({ name: "All Posts", href: "/blog", icon: Layers });

    // 2. Items (Posts)
    const allPosts = Object.values(BLOG_CATEGORIES).flatMap(cat =>
        getPostsByCategory(cat.id).map(post => ({
            name: post.title,
            desc: post.excerpt,
            href: `/blog/${cat.id}/${post.slug}`,
            icon: blogIcons[cat.id] || Rss
        }))
    );

    return (
        <ProductHub
            title="Blog"
            description="AI marketing insights, automation guides, and success stories."
            items={allPosts}
            sidebarItems={sidebarItems}
            activeSidebarItem="/blog"
        />
    );
}
