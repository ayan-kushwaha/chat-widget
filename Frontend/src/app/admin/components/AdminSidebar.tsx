"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    DollarSign,
    Users,
    Settings,
    Newspaper,
    BookOpen,
    LogOut,
    User,
    ShoppingBag
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export const adminMenuGroups = [
    {
        label: "ADMIN CENTER",
        items: [
            { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
            { label: "Analytics", icon: ShoppingBag, href: "/admin/analytics", badge: "New" }
        ]
    },
    {
        label: "MANAGEMENT",
        items: [
            { label: "Pricing Plans", icon: DollarSign, href: "/admin/pricing" },
            { label: "User Management", icon: Users, href: "/admin/users" }
        ]
    },
    {
        label: "CONTENT",
        items: [
            { label: "Blog Posts", icon: Newspaper, href: "/admin/blog" },
            { label: "Documentation", icon: BookOpen, href: "/admin/docs" }
        ]
    },
    {
        label: "SYSTEM",
        items: [
            { label: "Settings", icon: Settings, href: "/admin/settings" }
        ]
    }
];

export function AdminSidebar() {
    const pathname = usePathname();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    const adminName = "Admin User";
    const adminEmail = "admin@cluaiz.com";

    const handleLogout = () => {
        console.log("Logout clicked");
    };

    return (
        <aside className="relative h-screen w-64 transition-all duration-300 ease-in-out border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
            <motion.div className="flex flex-col h-full bg-white dark:bg-neutral-950 w-full">
                {/* Header */}
                <div className="flex h-14 items-center border-b border-neutral-200 px-4 dark:border-neutral-800 overflow-hidden">
                    <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl p-0.5 bg-gradient-to-r from-blue-500 to-purple-500">
                            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-white dark:bg-neutral-950">
                                <img src="/logo.svg" alt="Cluaiz" className="h-6 w-6 object-contain" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-neutral-900 dark:text-white">Admin Panel</h1>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">Management</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto px-3 py-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {adminMenuGroups.map((group) => (
                        <div key={group.label} className="mb-2">
                            <h3 className="text-xs font-semibold text-neutral-400 dark:text-neutral-600 px-4 py-2 tracking-wider">
                                {group.label}
                            </h3>
                            <div className="mt-1 space-y-1">
                                {group.items.map((item) => {
                                    const isActive = pathname === item.href;
                                    const Icon = item.icon;
                                    const badge = (item as any).badge;

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                "flex items-center gap-2 rounded-lg py-2 px-2 text-sm font-medium transition-colors",
                                                isActive
                                                    ? "text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10"
                                                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                                            )}
                                        >
                                            <Icon className="h-4 w-4" />
                                            <span>{item.label}</span>
                                            {badge && (
                                                <span className="ml-auto px-1.5 py-0.5 text-[10px] uppercase font-bold rounded-md bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                    {badge}
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* User Profile */}
                <div className="relative border-t border-neutral-200 p-4 dark:border-neutral-800">
                    <AnimatePresence>
                        {isUserMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="absolute bottom-full left-4 right-4 mb-2 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
                            >
                                <div className="p-2">
                                    <Link
                                        href="/admin/settings"
                                        onClick={() => setIsUserMenuOpen(false)}
                                        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                                    >
                                        <User className="h-4 w-4" />
                                        <span>Settings</span>
                                    </Link>
                                    <div className="my-1 h-px bg-neutral-200 dark:bg-neutral-800" />
                                    <button
                                        onClick={handleLogout}
                                        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex items-center gap-2">
                        <div
                            className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        >
                            <div className="h-9 w-9 min-w-[36px] rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                                {adminName.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0 overflow-hidden">
                                <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">{adminName}</p>
                                <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">{adminEmail}</p>
                            </div>
                        </div>
                        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </motion.div>
        </aside>
    );
}
