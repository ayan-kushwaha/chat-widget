"use client";

import React from "react";
import { RBACProvider } from "@/context/rbac-context";
import { OrganizationProvider } from "@/hooks/useOrganization";
import { KeyboardShortcuts } from "@/components/layout/KeyboardShortcuts";
import { AppShell } from "@/components/layout/AppShell";

import dynamic from 'next/dynamic';

const DynamicBackground = dynamic(() => import('@/components/layout/DynamicBackground'), {
    ssr: false,
});

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <RBACProvider>
            <OrganizationProvider>
                <KeyboardShortcuts />
                {/* <DynamicBackground /> - Moved to ChatWindow for Scoping */}
                <AppShell>
                    {children}
                </AppShell>
            </OrganizationProvider>
        </RBACProvider>
    );
}
