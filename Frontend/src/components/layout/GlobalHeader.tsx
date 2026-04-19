"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRBAC } from "@/hooks/useRBAC";
import { useOrg } from "@/context/OrgContext";
import { useLogout } from "@/hooks/useLogout";
import { useSession } from "next-auth/react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import OrgSwitcher from "@/components/OrgSwitcher";
import { HeaderBalanceGauge } from "@/components/dashboard/HeaderBalanceGauge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { LogOut, User, Menu, Bell, Search, Moon, Sun, Monitor, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { CommandPalette } from "../dashboard/command-palette";

import { toast } from 'sonner';

export function GlobalHeader({ onMobileMenuClick }: { onMobileMenuClick?: () => void }) {
    const { userProfileInActiveOrg } = useOrg();
    const logout = useLogout();
    const { data: session } = useSession();
    const { setTheme, theme } = useTheme();

    // Get user details from OrgContext or fallback
    const userName = userProfileInActiveOrg?.name || session?.user?.name || "User";
    const userEmail = userProfileInActiveOrg?.email || session?.user?.email || "Account";
    const userImage = userProfileInActiveOrg?.image || session?.user?.image || null;
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

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            toast.success("Entered Full Screen Mode");
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                toast.info("Exited Full Screen");
            }
        }
    };

    return (
        <header
            className="h-14 flex items-center justify-between px-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex-shrink-0 select-none"
            onDoubleClick={toggleFullScreen}
        >
            {/* LEFT: Logo & Mobile Menu & Org Switcher */}
            <div className="flex items-center gap-4">
                {/* Mobile Menu Trigger */}
                <button
                    onClick={onMobileMenuClick}
                    className="md:hidden p-2 -ml-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                >
                    <Menu className="w-5 h-5" />
                </button>

                {/* Logo */}
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="flex h-full w-full items-center justify-center">
                        <img
                            src="/logo.png"
                            alt="Cluaiz"
                            className="h-8 w-8 object-contain dark:brightness-0 dark:invert"
                        />
                    </div>
                </Link>

                {/* Vertical Divider */}
                <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-800 ml-4 hidden md:block" />

                {/* Org Switcher (Now in Header) */}
                <div className="w-[200px] hidden md:block">
                    <OrgSwitcher />
                </div>
            </div>

            {/* RIGHT: Usage, Notifications, User */}
            <div className="flex items-center gap-4">

                <div className="flex items-center mr-4 gap-2 md:gap-4">
                    {/* ⛽ Token Fuel Gauge */}
                    <HeaderBalanceGauge />

                    {/* Search Trigger */}
                    <button
                        onClick={() => setOpenCommand(true)}
                        className="flex   justify-between   w-60 items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-500 transition-colors hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
                    >
                        <div className="flex items-center gap-2">
                            <Search className="h-4 w-4" />
                            <span className="hidden md:inline">Search...</span>
                        </div>
                        <kbd className="hidden rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 md:inline-block">
                            ⌘K
                        </kbd>
                    </button>


                    {/* Notifications */}
                    <button className="relative rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800">
                        <Bell className="h-5 w-5" />
                        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-neutral-950" />
                    </button>
                </div>




                {/* User Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 overflow-hidden border border-neutral-200 dark:border-neutral-800">
                            {userImage ? (
                                <img
                                    src={userImage}
                                    alt={userName}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="h-full w-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-xs">
                                    {(userName && userName.charAt(0).toUpperCase()) || "U"}
                                </div>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{userName}</p>
                                <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard/settings/org" className="cursor-pointer">
                                <User className="mr-2 h-4 w-4" />
                                <span>Profile Settings</span>
                            </Link>
                        </DropdownMenuItem>

                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <Monitor className="mr-2 h-4 w-4" />
                                <span>Theme</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    <DropdownMenuItem onClick={() => setTheme("light")}>
                                        <Sun className="mr-2 h-4 w-4" />
                                        <span>Light</span>
                                        {theme === "light" && <Check className="ml-auto h-4 w-4" />}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setTheme("dark")}>
                                        <Moon className="mr-2 h-4 w-4" />
                                        <span>Dark</span>
                                        {theme === "dark" && <Check className="ml-auto h-4 w-4" />}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setTheme("system")}>
                                        <Monitor className="mr-2 h-4 w-4" />
                                        <span>System</span>
                                        {theme === "system" && <Check className="ml-auto h-4 w-4" />}
                                    </DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>

                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={logout} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <CommandPalette open={openCommand} setOpen={setOpenCommand} />

        </header>
    );
}

