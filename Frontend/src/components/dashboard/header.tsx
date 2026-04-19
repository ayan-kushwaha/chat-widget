"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Bell, ChevronRight, Menu, Search } from "lucide-react";
import { CommandPalette } from "@/components/dashboard/command-palette";
import { cn } from "@/lib/utils";
import { HeaderBalanceGauge } from "./HeaderBalanceGauge";

interface HeaderProps {
    onMobileMenuClick: () => void;
}

export function Header({ onMobileMenuClick }: HeaderProps) {
    const pathname = usePathname();
    const [openCommand, setOpenCommand] = useState(false);

    // Generate breadcrumbs from pathname
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs = segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join("/")}`;
        const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
        const isLast = index === segments.length - 1;

        return { href, label, isLast };
    });

    return (
        <>
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-neutral-200 bg-white/80 px-4 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/80 md:px-6">
                <div className="flex items-center gap-4">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={onMobileMenuClick}
                        className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 md:hidden"
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    {/* Logo */}
                    <Link href="/dashboard" className="flex items-center gap-2 mr-4">
                        <Image src="/logo.svg" alt="Cluaiz" width={32} height={32} className="w-8 h-8" />
                        <span className="font-semibold text-lg text-neutral-900 dark:text-white">Cluaiz</span>
                    </Link>

                    {/* Breadcrumbs */}
                    <nav className="hidden items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400 md:flex">
                        {breadcrumbs.map((crumb, index) => (
                            <React.Fragment key={crumb.href}>
                                {index > 0 && <ChevronRight className="h-4 w-4 text-neutral-400" />}
                                <Link
                                    href={crumb.href}
                                    className={cn(
                                        "transition-colors hover:text-neutral-900 dark:hover:text-white",
                                        crumb.isLast && "font-medium text-neutral-900 dark:text-white"
                                    )}
                                >
                                    {crumb.label}
                                </Link>
                            </React.Fragment>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    {/* Search Trigger */}
                    <button
                        onClick={() => setOpenCommand(true)}
                        className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-500 transition-colors hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
                    >
                        <Search className="h-4 w-4" />
                        <span className="hidden md:inline">Search...</span>
                        <kbd className="hidden rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 md:inline-block">
                            ⌘K
                        </kbd>
                    </button>

                    {/* ⛽ Token Fuel Gauge */}
                    <HeaderBalanceGauge />

                    {/* Notifications */}
                    <button className="relative rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800">
                        <Bell className="h-5 w-5" />
                        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-neutral-950" />
                    </button>
                </div>
            </header>

            <CommandPalette open={openCommand} setOpen={setOpenCommand} />
        </>
    );
}
