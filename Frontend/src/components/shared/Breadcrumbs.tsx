"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
    name: string;
    url: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    className?: string;
}

/**
 * Breadcrumbs Component
 * Shows navigation trail with SEO-friendly markup
 */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
    return (
        <nav
            aria-label="breadcrumb"
            className={cn("flex items-center space-x-2 text-sm", className)}
        >
            {/* Home Link */}
            <Link
                href="/"
                className="flex items-center text-slate-400 hover:text-indigo-400 transition-colors"
                aria-label="Home"
            >
                <Home className="w-4 h-4" />
            </Link>

            {/* Breadcrumb Items */}
            {items.map((item, index) => {
                const isLast = index === items.length - 1;

                return (
                    <React.Fragment key={item.url}>
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                        {isLast ? (
                            <span
                                className="text-white font-medium"
                                aria-current="page"
                            >
                                {item.name}
                            </span>
                        ) : (
                            <Link
                                href={item.url}
                                className="text-slate-400 hover:text-indigo-400 transition-colors"
                            >
                                {item.name}
                            </Link>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
}

/**
 * Helper to generate breadcrumbs from URL path
 */
export function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
    const paths = pathname.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    let currentPath = "";
    paths.forEach((path, index) => {
        currentPath += `/${path}`;

        // Capitalize and format path name
        const name = path
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

        breadcrumbs.push({
            name,
            url: currentPath,
        });
    });

    return breadcrumbs;
}
