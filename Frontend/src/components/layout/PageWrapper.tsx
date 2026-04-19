"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface PageWrapperProps {
    children: React.ReactNode
    className?: string
}

/**
 * Universal Page Wrapper
 * - Provides consistent page structure
 * - Handles overflow for scrollable content
 * - Use with PageHeader for fixed header + scrollable content
 */
export function PageWrapper({ children, className }: PageWrapperProps) {
    return (
        <div className={cn("flex min-h-full flex-col", className)}>
            {children}
        </div>
    )
}

/**
 * Scrollable Content Area
 * - Custom purple gradient scrollbar
 * - Smooth scrolling
 * - Auto-hide scrollbar
 */
export function ScrollableContent({ children, className }: PageWrapperProps) {
    return (
        <div
            className={cn(
                "p-4 md:p-6 flex-1",
                className
            )}
        >
            {children}
        </div>
    )
}
