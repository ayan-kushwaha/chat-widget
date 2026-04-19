"use client";

import React, { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Search, ArrowRight, ChevronRight, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";

export interface SidebarItem {
    name: string;
    href: string; // Can be a hash or a full path
    icon?: any;
    count?: number;
}

interface CategoryLayoutProps {
    title: string;
    description: string;
    icon?: React.ReactNode;
    sidebarItems?: SidebarItem[];
    activeSidebarItem?: string; // href of the active item
    items: {
        name: string;
        desc: string;
        href: string;
        icon: any;
    }[];
}

export function ProductHub({
    title,
    description,
    items,
    sidebarItems = [],
    activeSidebarItem
}: CategoryLayoutProps) {
    const [searchQuery, setSearchQuery] = useState("");

    // Simple search filter
    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.desc.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 pt-32 pb-20 px-4 md:px-8">
            <div className="max-w-7xl mx-auto">

                {/* Header / Search - Sticky */}
                <div className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md py-6 mb-8 -mx-4 px-4 md:-mx-8 md:px-8 border-b border-transparent transition-all duration-300">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <h1 className="text-4xl pb-1 md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                                {title}
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1 text-lg">
                                {description}
                            </p>
                        </div>

                        <div className="relative w-full md:w-96 group">
                            <div className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
                                <Search className="h-4 w-4" />
                            </div>
                            <Input
                                type="text"
                                placeholder="Search..."
                                className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl py-6 pl-10 pr-12 focus-visible:ring-indigo-500 focus-visible:ring-offset-0 transition-all shadow-sm hover:border-indigo-500/50 dark:hover:border-indigo-500/50"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <div className="absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none">
                                <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 px-2 text-[10px] font-medium text-slate-500 dark:text-slate-400 opacity-100">
                                    <span className="text-xs">⌘</span>K
                                </kbd>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Left Sidebar - Local Filters (Only if sidebarItems exist) */}
                    {sidebarItems.length > 0 ? (
                        <div className="lg:col-span-1 space-y-2">
                            <div className="sticky top-32 space-y-1">
                                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-3">
                                    Filters
                                </h3>
                                {sidebarItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                                            activeSidebarItem === item.href
                                                ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-900/50"
                                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            {item.icon && <item.icon className={cn("w-4 h-4", activeSidebarItem === item.href ? "text-indigo-500" : "text-slate-400")} />}
                                            {item.name}
                                        </div>
                                        {item.count !== undefined && (
                                            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full">
                                                {item.count}
                                            </span>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ) : (
                        // If no sidebar, we can potentially use full width or keep a spacer/empty col if desired, 
                        // but usually full width is better. user said "left side ka nhi".
                        // Logic below adjusts the grid col span.
                        null
                    )}

                    {/* Right Content - Grid */}
                    <div className={cn("space-y-12", sidebarItems.length > 0 ? "lg:col-span-3" : "lg:col-span-4")}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Cards Grid */}
                            <div className={cn(
                                "grid gap-6",
                                sidebarItems.length > 0
                                    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                                    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
                            )}>
                                {filteredItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className="group relative flex flex-col p-6 h-full bg-white/40 dark:bg-slate-950/40 backdrop-blur-lg rounded-2xl border border-white/20 dark:border-white/10 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="p-3 bg-white/50 dark:bg-slate-900/50 rounded-xl group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-colors duration-300 backdrop-blur-sm">
                                                    <Icon className="w-6 h-6 text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                                                </div>
                                            </div>

                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                                                {item.name}
                                            </h3>
                                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4 flex-grow">
                                                {item.desc}
                                            </p>

                                            <div className="flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                                View Details <ArrowRight className="w-3 h-3 ml-1" />
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>

                            {filteredItems.length === 0 && (
                                <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                                    <p className="text-slate-500">No items found matching your search.</p>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
