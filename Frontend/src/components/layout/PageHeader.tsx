"use client"

import * as React from "react"

interface PageHeaderProps {
    title: string
    description?: string
    actions?: React.ReactNode
}

/**
 * Reusable Page Header Component
 * - Sticky at top
 * - Consistent styling
 * - Optional actions (buttons, etc)
 */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
    return (
        <div className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-neutral-950/95 dark:supports-[backdrop-filter]:bg-neutral-950/60">
            <div className="flex h-16 items-center justify-between px-4 md:px-6">
                <div className="flex flex-col">
                    <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white md:text-2xl">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            {description}
                        </p>
                    )}
                </div>
                {actions && (
                    <div className="flex items-center gap-2">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    )
}
