"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search, File, Settings, User, CreditCard, LogOut, LayoutDashboard, Bot, MessageSquare, Zap, Rocket, BarChart3, Brain, Eye, Workflow, Users, Mail, FileText, TrendingUp, Activity, ShoppingBag, UserPlus, Briefcase, Building2, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ScrollArea } from "../ui/scroll-area";

export function CommandPalette({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
    const router = useRouter();

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen(!open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, [setOpen]);

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false);
        command();
    }, [setOpen]);

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setOpen(false)}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="relative w-full max-w-lg overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-950"
                    >
                        <Command className="w-full bg-transparent">
                            <div className="flex items-center border-b border-neutral-200 px-3 dark:border-neutral-800">
                                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                <Command.Input
                                    placeholder="Type a command or search..."
                                    className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-neutral-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-neutral-50"
                                />
                            </div>
                            <ScrollArea className="h-[400px]">
                                <Command.List  className="p-2">
                                <Command.Empty className="py-6 text-center text-sm text-neutral-500">
                                    No results found.
                                </Command.Empty>

                                    <Command.Group heading="Navigation" className="mb-2 px-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
                                            <LayoutDashboard className="mr-2 h-4 w-4" />
                                            <span>Dashboard</span>
                                        </CommandItem>
                                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/analytics"))}>
                                            <BarChart3 className="mr-2 h-4 w-4" />
                                            <span>Live Pulse</span>
                                        </CommandItem>
                                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/activity"))}>
                                            <Activity className="mr-2 h-4 w-4" />
                                            <span>Activity Logs</span>
                                        </CommandItem>
                                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/marketplace"))}>
                                            <ShoppingBag className="mr-2 h-4 w-4" />
                                            <span>Marketplace</span>
                                        </CommandItem>
                                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/marketplace/installed"))}>
                                            <Package className="mr-2 h-4 w-4" />
                                            <span>Installed Apps</span>
                                        </CommandItem>
                                    </Command.Group>

                                    <Command.Group heading="Insights" className="mb-2 px-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/insights/reports"))}>
                                            <BarChart3 className="mr-2 h-4 w-4" />
                                            <span>Chat Insights</span>
                                        </CommandItem>
                                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/insights/performance"))}>
                                            <TrendingUp className="mr-2 h-4 w-4" />
                                            <span>Performance</span>
                                        </CommandItem>
                                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/insights/traffic"))}>
                                            <TrendingUp className="mr-2 h-4 w-4" />
                                            <span>Traffic Analytics</span>
                                        </CommandItem>
                                    </Command.Group>

                                    <Command.Group heading="AI Studio - Knowledge" className="mb-2 px-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/ai-studio/dashboard"))}>
                                            <LayoutDashboard className="mr-2 h-4 w-4" />
                                            <span>AI Studio Dashboard</span>
                                        </CommandItem>
                                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/ai-studio/brain"))}>
                                            <Brain className="mr-2 h-4 w-4" />
                                            <span>Brain (Knowledge Base)</span>
                                        </CommandItem>
                                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/ai-studio/memory"))}>
                                            <Brain className="mr-2 h-4 w-4" />
                                            <span>Memory (Long-term)</span>
                                        </CommandItem>
                                    </Command.Group>

                                    <Command.Group heading="AI Studio - Personality" className="mb-2 px-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/ai-studio/behavior"))}>
                                            <Workflow className="mr-2 h-4 w-4" />
                                            <span>Behavior & Tone</span>
                                        </CommandItem>
                                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/ai-studio/instructions"))}>
                                            <FileText className="mr-2 h-4 w-4" />
                                            <span>Instructions</span>
                                        </CommandItem>
                                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/ai-studio/vision"))}>
                                            <Eye className="mr-2 h-4 w-4" />
                                            <span>Vision</span>
                                        </CommandItem>
                                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/ai-studio/automation"))}>
                                            <Zap className="mr-2 h-4 w-4" />
                                            <span>Automation</span>
                                        </CommandItem>
                                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/ai-studio/apps"))}>
                                            <Package className="mr-2 h-4 w-4" />
                                            <span>Apps & Integrations</span>
                                        </CommandItem>
                                    </Command.Group>

                                    <Command.Group heading="Chatbot Studio - Configuration" className="mb-2 px-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/ai-studio/bots?tab=install"))}>
                                            <Bot className="mr-2 h-4 w-4" />
                                            <span>Bot Install</span>
                                        </CommandItem>
                                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/ai-studio/bots?tab=design"))}>
                                            <Workflow className="mr-2 h-4 w-4" />
                                            <span>Bot Design</span>
                                        </CommandItem>
                                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/ai-studio/bots?tab=chatwindow"))}>
                                            <MessageSquare className="mr-2 h-4 w-4" />
                                            <span>Bot Pages</span>
                                        </CommandItem>
                                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/ai-studio/bots?tab=share"))}>
                                            <Users className="mr-2 h-4 w-4" />
                                            <span>Bot Share</span>
                                        </CommandItem>
                                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/ai-studio/bots?tab=analytics"))}>
                                            <BarChart3 className="mr-2 h-4 w-4" />
                                            <span>Bot Analytics</span>
                                        </CommandItem>
                                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/ai-studio/bots?tab=advanced"))}>
                                            <Settings className="mr-2 h-4 w-4" />
                                            <span>Bot Advanced Settings</span>
                                        </CommandItem>
                                    </Command.Group>

                                    <Command.Group heading="Communication - Channels" className="mb-2 px-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/communication/inbox"))}>
                                            <MessageSquare className="mr-2 h-4 w-4" />
                                            <span>Unified Inbox</span>
                                        </CommandItem>
                                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/communication/logs"))}>
                                            <Activity className="mr-2 h-4 w-4" />
                                            <span>Live Chat Logs</span>
                                        </CommandItem>
                                    </Command.Group>

                                    <Command.Group heading="Communication - Workflow" className="mb-2 px-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/communication/contacts"))}>
                                            <Users className="mr-2 h-4 w-4" />
                                            <span>Contacts (CRM)</span>
                                        </CommandItem>
                                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/communication/leads"))}>
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            <span>Leads</span>
                                        </CommandItem>
                                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/communication/forms"))}>
                                            <FileText className="mr-2 h-4 w-4" />
                                            <span>Forms</span>
                                        </CommandItem>
                                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/communication/flows"))}>
                                            <Workflow className="mr-2 h-4 w-4" />
                                            <span>Automation Flows</span>
                                        </CommandItem>
                                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/communication/replies"))}>
                                            <Mail className="mr-2 h-4 w-4" />
                                            <span>Quick Replies</span>
                                        </CommandItem>
                                    </Command.Group>

                                    <Command.Group heading="Agents & Flows" className="mb-2 px-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/agents/flow"))}>
                                            <Workflow className="mr-2 h-4 w-4" />
                                            <span>Flow Architect</span>
                                        </CommandItem>
                                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/agents/logs"))}>
                                            <Activity className="mr-2 h-4 w-4" />
                                            <span>Agent Logs</span>
                                        </CommandItem>
                                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/flows"))}>
                                            <Workflow className="mr-2 h-4 w-4" />
                                            <span>Flows</span>
                                        </CommandItem>
                                    </Command.Group>

                                    <Command.Group heading="Organization - Settings" className="mb-2 px-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/settings/org"))}>
                                            <Building2 className="mr-2 h-4 w-4" />
                                            <span>General Settings</span>
                                        </CommandItem>
                                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/settings/team"))}>
                                            <Users className="mr-2 h-4 w-4" />
                                            <span>Team & Roles</span>
                                        </CommandItem>
                                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/settings/security"))}>
                                            <Settings className="mr-2 h-4 w-4" />
                                            <span>Security</span>
                                        </CommandItem>
                                    </Command.Group>

                                    <Command.Group heading="Organization - Billing" className="mb-2 px-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/settings/billing"))}>
                                            <CreditCard className="mr-2 h-4 w-4" />
                                            <span>Subscription</span>
                                        </CommandItem>
                                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/settings/usage"))}>
                                            <Activity className="mr-2 h-4 w-4" />
                                            <span>Usage & Limits</span>
                                        </CommandItem>
                                    </Command.Group>
                                </Command.List>
                            </ScrollArea>
                        </Command>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

function CommandItem({ children, onSelect }: { children: React.ReactNode; onSelect: () => void }) {
    return (
        <Command.Item
            onSelect={onSelect}
            className="flex cursor-pointer select-none items-center rounded-lg px-2 py-2 text-sm text-neutral-700 aria-selected:bg-neutral-100 aria-selected:text-neutral-900 dark:text-neutral-300 dark:aria-selected:bg-neutral-800 dark:aria-selected:text-white"
        >
            {children}
        </Command.Item>
    );
}
