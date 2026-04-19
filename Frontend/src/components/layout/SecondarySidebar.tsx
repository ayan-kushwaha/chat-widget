
"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { navigationConfig } from "@/config/navigationConfig";
import { useNavigationStore } from "@/store/navigationStore";
import { motion, AnimatePresence } from "framer-motion";
import { PanelLeftClose, PanelLeftOpen, ChevronRight } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export function SecondarySidebar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { activeModule, isSecondarySidebarOpen, toggleSecondarySidebar } = useNavigationStore();

    // Auto-sync active module based on pathname
    React.useEffect(() => {
        // Prioritize deeper paths first
        if (pathname.includes('/dashboard/ai-studio/bots')) {
            if (activeModule !== 'BOT_STUDIO') useNavigationStore.getState().setActiveModule('BOT_STUDIO');
        } else if (pathname.includes('/dashboard/ai-studio')) {
            if (activeModule !== 'AI_STUDIO') useNavigationStore.getState().setActiveModule('AI_STUDIO');
        } else if (pathname.includes('/dashboard/workforce')) {
            if (activeModule !== 'WORKFORCE') useNavigationStore.getState().setActiveModule('WORKFORCE');
        } else if (pathname.includes('/dashboard/communication')) {
            if (activeModule !== 'COMMUNICATION') useNavigationStore.getState().setActiveModule('COMMUNICATION');
        } else if (pathname.includes('/dashboard/settings')) {
            if (activeModule !== 'ORGANIZATION') useNavigationStore.getState().setActiveModule('ORGANIZATION');
        } else if (pathname.includes('/dashboard/marketplace')) {
            if (activeModule !== 'MARKETPLACE') useNavigationStore.getState().setActiveModule('MARKETPLACE');
        } else if (pathname === '/dashboard' || pathname.startsWith('/dashboard/analytics') || pathname.startsWith('/dashboard/activity') || pathname.startsWith('/dashboard/insights')) {
            if (activeModule !== 'COMMAND') useNavigationStore.getState().setActiveModule('COMMAND');
        }
    }, [pathname, activeModule]);

    const activeConfig = navigationConfig.find((c) => c.id === activeModule);

    // 🕵️ EXTRA: WhatsApp Magic
    // If we are on the Unified Inbox page or AI Workforce page, we hide the secondary sidebar 
    // to give the List/Detail view 100% of the sidebar real-estate.
    const isInbox = pathname === '/dashboard/communication/inbox' || pathname === '/dashboard/communication/employees';
    const isAiWorkforce = pathname === '/dashboard/ai-workforce';
    if (isInbox || isAiWorkforce) return null;

    if (!activeConfig) return null;

    return (
        <TooltipProvider delayDuration={0}>
            <motion.div
                initial={false}
                animate={{ width: isSecondarySidebarOpen ? 240 : 60 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className={cn(
                    "h-screen flex flex-col flex-shrink-0 relative overflow-visible backdrop-blur-sm border-r border-neutral-200 dark:border-neutral-800 transition-colors",
                    "bg-neutral-50/50 dark:bg-neutral-900/30"
                )}
            >
                {/* Header: Module Title or Toggle */}
                <div className={cn(
                    "h-14 flex items-center border-b border-neutral-200 dark:border-neutral-800 transition-all",
                    isSecondarySidebarOpen ? "justify-between px-4" : "justify-center"
                )}>
                    {isSecondarySidebarOpen && (
                        <h2 className="font-semibold text-sm text-neutral-500 dark:text-neutral-400 uppercase tracking-wider truncate">
                            {activeConfig.label}
                        </h2>
                    )}
                    <button
                        onClick={toggleSecondarySidebar}
                        className={cn(
                            "p-1.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 transition-colors",
                            !isSecondarySidebarOpen && "w-8 h-8 flex items-center justify-center"
                        )}
                    >
                        {isSecondarySidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
                    </button>
                </div>

                {/* Vertical Tabs List */}
                <div className={cn("flex-1 overflow-y-auto p-2 scrollbar-overlay", isSecondarySidebarOpen ? "space-y-6" : "space-y-2")}>
                    {activeConfig.items.map((group, idx) => (
                        <div key={idx} className={cn("flex flex-col", !isSecondarySidebarOpen && "items-center")}>
                            {/* Group Label */}
                            {group.label && isSecondarySidebarOpen && (
                                <h3 className="px-2 mb-4 text-[11px] font-bold text-neutral-400 dark:text-neutral-600 uppercase tracking-widest">
                                    {group.label}
                                </h3>
                            )}

                            <div className={cn("w-full flex flex-col gap-3", !isSecondarySidebarOpen && " items-center  mt-4")}>
                                {group.items.map((item) => {
                                    const Icon = item.icon;

                                    // Handle Query Params for Active State
                                    let isActive = false;
                                    const currentPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');

                                    if (item.href.includes('?')) {
                                        const [path, query] = item.href.split('?');
                                        const itemParams = new URLSearchParams(query);
                                        const tab = itemParams.get('tab');
                                        const currentTab = searchParams.get('tab');
                                        // Active if base path matches AND tab matches
                                        isActive = pathname === path && currentTab === tab;
                                    } else {
                                        // Exact match for non-query paths OR if it's a parent path
                                        isActive = pathname === item.href;
                                    }

                                    const linkContent = (
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                "flex items-center transition-all group relative",
                                                isSecondarySidebarOpen
                                                    ? "gap-3 px-3 py-2 text-sm font-medium rounded-md w-full"
                                                    : "justify-center w-9 h-9 rounded-md",
                                                isActive
                                                    ? "bg-white dark:bg-neutral-800 text-primary shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-700"
                                                    : "text-neutral-600 dark:text-neutral-400 hover:bg-white/50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-white"
                                            )}
                                        >
                                            {Icon && (
                                                <Icon className={cn("shrink-0 transition-colors",
                                                    isSecondarySidebarOpen ? "w-4 h-4" : "w-5 h-5",
                                                    isActive ? "text-primary" : "text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white"
                                                )} />
                                            )}

                                            {/* Text Label - Only visible when open */}
                                            {isSecondarySidebarOpen && (
                                                <span className="truncate flex-1">{item.label}</span>
                                            )}

                                            {/* Badge - different styling based on state */}
                                            {item.badge && (
                                                isSecondarySidebarOpen ? (
                                                    <span className={cn(
                                                        "ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                                                        isActive
                                                            ? "bg-primary/10 text-primary"
                                                            : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800"
                                                    )}>
                                                        {item.badge}
                                                    </span>
                                                ) : (
                                                    // Little dot indicator for badge in collapsed mode
                                                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500" />
                                                )
                                            )}

                                            {/* Active Indicator bar for collapsed state */}
                                            {!isSecondarySidebarOpen && isActive && (
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-r-full bg-primary" />
                                            )}
                                        </Link>
                                    );

                                    // Wrap with tooltip if collapsed
                                    if (!isSecondarySidebarOpen) {
                                        return (
                                            <Tooltip key={item.href}>
                                                <TooltipTrigger asChild>
                                                    {linkContent}
                                                </TooltipTrigger>
                                                <TooltipContent side="right" className="font-semibold bg-neutral-900 text-white border-neutral-800">
                                                    {item.label}
                                                </TooltipContent>
                                            </Tooltip>
                                        );
                                    }

                                    return <React.Fragment key={item.href}>{linkContent}</React.Fragment>;
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </TooltipProvider>
    );
}
