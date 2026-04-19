"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { SecondarySidebar } from "./SecondarySidebar";
import { GlobalHeader } from "./GlobalHeader";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AppShellProps {
    children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    const pathname = usePathname();
    // 🟢 Anti-Gravity Mode: Hide Sidebars on Communication Hiring Page for Full Immersion & Perf
    // Workforce hiring should keep the sidebar as per user request
    const isCommunicatonHiring = pathname?.includes('/communication/employees/hire');
    const isHiringPage = isCommunicatonHiring;

    return (
        <div className="flex h-screen w-full flex-col bg-transparent overflow-hidden relative">
            {/* Level 0: Global Header (Fixed Top) */}
            <GlobalHeader />

            <div className="flex flex-1 overflow-hidden">
                {/* Level 1: Primary Rail (Sides) */}
                {!isHiringPage && <Sidebar />}

                {/* Level 2: Secondary Menu (Collapsible) */}
                {!isHiringPage && <SecondarySidebar />}

                {/* Level 3: Main Content Area */}
                <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                    <ScrollArea className="h-full w-full" viewportRef={undefined}>
                        {children}
                    </ScrollArea>
                </main>
            </div>
        </div>
    );
}
