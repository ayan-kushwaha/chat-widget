"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    LayoutGrid,
    Bot,
    MessageSquare,
    Zap,
    Rocket,
    BarChart3,
    Settings,
    ChevronDown,
    ChevronRight,
    ChevronsRight,
    Search,
    Users,
    Globe,
    BrainCircuit,
    AppWindow,
    ScanEye,
    Inbox,
    Contact,
    Workflow,
    History,
    LineChart,
    PieChart,
    Activity,
    Sparkles,
    CreditCard,
    LogOut,
    User,
    PanelLeftClose,
    X,
    Database,
    ShoppingBag,
    Lock,
    Store,
    FileText,
    MessagesSquare,
    BriefcaseBusiness,
} from "lucide-react";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useRBAC } from "@/hooks/useRBAC";
import { useOrg } from "@/context/OrgContext";
import { useLogout } from "@/hooks/useLogout";
import { useSession } from "next-auth/react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import OrgSwitcher from "@/components/OrgSwitcher";
import { useSidebarState } from "@/hooks/useSidebarState";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export const menuGroups = [
    // 1. HEADQUARTERS (Overview)
    {
        label: "COMMAND CENTER",
        items: [
            {
                label: "Dashboard",
                icon: LayoutDashboard,
                href: "/dashboard",
                permission: "VIEW_DASHBOARD"
            },
            {
                label: "Chat's",
                icon: MessagesSquare,
                href: "/dashboard/communication/inbox",
                permission: "VIEW_INBOX",
                badge: "",
                locked: false, // Show lock icon in UI
                tooltip: ""
            },

        ],
    },

    // 2. THE BRAIN (Where user trains the AI)
    {
        label: "MY AI AGENT",
        permission: "VIEW_AI_STUDIO",
        items: [
            {
                label: "Workforce Hub",
                icon: Users,
                href: "/dashboard/workforce",
                permission: "VIEW_BOT_STUDIO",
                badge: "AI"
            },
            {
                label: "AI Workforces",
                icon: BriefcaseBusiness,
                href: "/dashboard/ai-workforce",
                permission: "VIEW_BOT_STUDIO",
                // badge: " "
            },
            {
                label: "Knowledge Base", // Old "Brain"
                icon: BrainCircuit,
                href: "/dashboard/ai-studio/dashboard", // Landing on AI Dashboard
                permission: "VIEW_BOT_STUDIO"
            },
            {
                label: "Chatbot & Widget",
                icon: Bot,
                href: "/dashboard/ai-studio/bots?tab=install", // Landing on Install tab
                permission: "VIEW_BOT_STUDIO"
            }
        ],
    },

    // 3. THE ENGINE (Where the JSON/Template magic happens)
    {
        label: "BUILDER ENGINE",
        permission: "VIEW_FLOWS",
        items: [
            {
                label: "Apps & Tools", // NEW: App Market
                icon: LayoutGrid,
                href: "/dashboard/apps",
                permission: "VIEW_DASHBOARD"
            },
            {
                label: "Template Store", // NEW: The Marketplace
                icon: Store,
                href: "/dashboard/marketplace",
                badge: "New",
                permission: "VIEW_DASHBOARD"
            },
            {
                label: "My Workflows",
                icon: FileText,
                href: "/dashboard/flows",
                permission: "VIEW_FLOWS"
            },
            {
                label: "Smart Forms", // Forms are now part of the Engine - Pointing to existing route
                icon: AppWindow,
                href: "/dashboard/communication/forms",
                permission: "VIEW_LEADS"
            }
        ],
    },


    // 5. OPERATIONS (Where the money is)
    {
        label: "CUSTOMER OPS",
        permission: "VIEW_INBOX",
        items: [

            {
                label: "Chat Logs",
                icon: MessageSquare,
                href: "/dashboard/communication/logs",
                permission: "VIEW_INBOX",
                badge: "New"
            },
            {
                label: "CRM & Leads", // Renamed for value
                icon: Users,
                href: "/dashboard/communication/leads",
                permission: "VIEW_LEADS"
            },
        ],
    },

    // 5. ADMIN
    {
        label: "SETTINGS",
        permission: "VIEW_SETTINGS",
        items: [
            { label: "Organization", icon: Globe, href: "/dashboard/settings/org", permission: "VIEW_SETTINGS" },
            { label: "Team Access", icon: Users, href: "/dashboard/settings/team", permission: "VIEW_TEAM" },
            { label: "Billing & Plans", icon: CreditCard, href: "/dashboard/settings/billing", permission: "MANAGE_BILLING" },
        ],
    },
];

interface SidebarProps {
    className?: string;
    isMobile?: boolean;
    onClose?: () => void;
}

export function Sidebar({ className, isMobile, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { can } = useRBAC();
    const { userProfileInActiveOrg } = useOrg();
    const logout = useLogout();
    const { data: session } = useSession();
    const user = useSelector((state: RootState) => state.auth.user);

    // Global sidebar collapse state (controlled by Ctrl+B)
    const { isOpen: isCollapsed, setOpen: setIsCollapsed } = useSidebarState();
    const [openGroup, setOpenGroup] = useState<string | null>("DASHBOARD");
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    // Get user details from OrgContext (Active Org Profile) or fallback to session
    const userName = userProfileInActiveOrg?.name || session?.user?.name || "User";
    const userEmail = userProfileInActiveOrg?.email || session?.user?.email || "Account";
    const userImage = userProfileInActiveOrg?.image || session?.user?.image || null;

    // Filter groups based on permissions and ensure groups with no visible items are hidden
    const visibleGroups = menuGroups
        .filter(group => {
            // Check if user has permission to see the group
            if (group.permission && !can(group.permission as any)) {
                return false;
            }

            // Check if group has any visible items (filter by item permissions)
            const visibleItems = group.items.filter((item: any) => {
                if ('permission' in item && item.permission) {
                    return can(item.permission as any);
                }
                // If no permission specified on item, inherit from group
                return true;
            });

            // Hide group if it has no visible items
            return visibleItems.length > 0;
        });

    // Force collapsed on desktop (User request: "hamesha close rahe")
    const isExpanded = isMobile ? true : false;

    const toggleGroup = (label: string) => {
        if (!isExpanded) return;
        setOpenGroup((prev) => (prev === label ? null : label));
    };

    return (
        <TooltipProvider delayDuration={0}>
            <aside
                className={cn(
                    "relative h-full flex flex-col transition-all duration-300 ease-in-out border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950",
                    isMobile ? "w-full max-w-[300px] shadow-2xl fixed left-0" : "w-20", // Forced w-20 on desktop
                    className
                )}
            >
                {/* Toggle Button Removed as per request */}

                {isMobile && (
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 z-50 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                    >
                        <X className="h-5 w-5" />
                    </button>
                )}

                <div className="flex-1 overflow-y-auto px-3 py-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {visibleGroups.map((group) => {
                        const isOpen = true;
                        const isGroupActive = group.items.some((item) => pathname === item.href);


                        return (
                            <div key={group.label} className="">
                                <div className="px-2 py-1">
                                    {isExpanded && (
                                        <h3 className="text-xs font-semibold text-neutral-400 dark:text-neutral-600 px-2 mb-1 tracking-wider">
                                            {group.label}
                                        </h3>
                                    )}
                                </div>

                                <AnimatePresence initial={false}>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: "auto", opacity: 1 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="flex flex-col gap-3">
                                                {group.items
                                                    .filter((item) => {
                                                        if ('permission' in item && item.permission) {
                                                            return can(item.permission as any);
                                                        }
                                                        return true;
                                                    })
                                                    .map((item) => {
                                                        // Smart Active State Logic
                                                        let isActive = pathname.startsWith(item.href.split('?')[0]); // Ignore query params for main rail match

                                                        if (item.href === '/dashboard') {
                                                            isActive = pathname === '/dashboard' || pathname.startsWith('/dashboard/analytics') || pathname.startsWith('/dashboard/activity') || pathname.startsWith('/dashboard/insights');
                                                        } else if (item.href === '/dashboard/communication/inbox') {
                                                            isActive = pathname.startsWith('/dashboard/communication/inbox') || pathname.startsWith('/dashboard/communication/employees');
                                                        } else if (item.href.startsWith('/dashboard/ai-studio/brain')) {
                                                            isActive = pathname.startsWith('/dashboard/ai-studio/brain') || pathname.startsWith('/dashboard/ai-studio/memory');
                                                        } else if (item.href.startsWith('/dashboard/ai-studio/bots')) {
                                                            isActive = pathname.startsWith('/dashboard/ai-studio/bots');
                                                        }
                                                        const Icon = item.icon;
                                                        const isLocked = (item as any).locked;
                                                        const badge = (item as any).badge;

                                                        const linkContent = (
                                                            <Link
                                                                href={item.href}
                                                                onClick={() => isMobile && onClose?.()}
                                                                className={cn(
                                                                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all group relative",
                                                                    isExpanded ? "mx-2" : "justify-center px-2 mx-auto w-10 h-10",
                                                                    isActive
                                                                        ? "bg-primary/10 text-primary dark:bg-primary/20"
                                                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                                                )}
                                                            >
                                                                <Icon className={cn("h-6 w-6 shrink-0", isActive && "text-primary")} />

                                                                {isExpanded && (
                                                                    <motion.span
                                                                        initial={{ opacity: 0 }}
                                                                        animate={{ opacity: 1 }}
                                                                        transition={{ delay: 0.1 }}
                                                                        className="truncate"
                                                                    >
                                                                        {item.label}
                                                                    </motion.span>
                                                                )}

                                                                {isExpanded && badge && (
                                                                    <span className={cn(
                                                                        "ml-auto px-1.5 py-0.5 text-[10px] uppercase font-bold rounded-md",
                                                                        badge === 'New' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                                    )}>
                                                                        {badge}
                                                                    </span>
                                                                )}

                                                                {isExpanded && isLocked && <Lock className="h-3 w-3 ml-auto opacity-50" />}

                                                                {!isExpanded && isActive && (
                                                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-primary" />
                                                                )}
                                                            </Link>
                                                        );

                                                        if (isLocked) {
                                                            return (
                                                                <div key={item.href} className="opacity-50 cursor-not-allowed">
                                                                    {linkContent}
                                                                </div>
                                                            );
                                                        }

                                                        if (isExpanded) {
                                                            return <div key={item.href}>{linkContent}</div>;
                                                        }

                                                        return (
                                                            <Tooltip key={item.href} >
                                                                <TooltipTrigger asChild>
                                                                    {linkContent}
                                                                </TooltipTrigger>
                                                                <TooltipContent side="right" className="font-medium bg-neutral-900 text-white border-neutral-800">
                                                                    {item.label}
                                                                    {badge && <span className="ml-2  text-[10px] opacity-70">({badge})</span>}
                                                                </TooltipContent>
                                                            </Tooltip>

                                                        );
                                                    })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>

            </aside >
        </TooltipProvider >
    );
}
