"use client";

import React from "react";
import { motion } from "framer-motion";
import { StatsCards } from "@/components/dashboard/overview/stats-cards";
import { OverviewChart } from "@/components/dashboard/overview/overview-chart";
import { KnowledgeDistribution } from "@/components/dashboard/overview/knowledge-distribution";
import { SparklesText } from "@/components/ui/sparkles-text";
import { PageWrapper, ScrollableContent } from "@/components/layout/PageWrapper";
import { PageHeader } from "@/components/layout/PageHeader";

export default function DashboardPage() {
    return (
        <PageWrapper>
            <PageHeader
                title="Dashboard"
                description="Here's what's happening with your agents today."
                actions={
                    <div className="hidden md:block">
                        <SparklesText className="text-xl" colors={{ first: "#3b82f6", second: "#a855f7" }}>
                            Cluaiz OS
                        </SparklesText>
                    </div>
                }
            />

            <ScrollableContent>
                <div className="space-y-6">
                    {/* Stats Cards (Real Data) */}
                    <StatsCards />

                    {/* Quick Actions */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <QuickActionCard
                            title="Add Knowledge"
                            description="Train your bot with new data"
                            href="/dashboard/ai-studio/brain"
                            icon="📚"
                            delay={0.1}
                        />
                        <QuickActionCard
                            title="View Analytics"
                            description="Check detailed performance"
                            href="/dashboard/analytics"
                            icon="📊"
                            delay={0.2}
                        />
                        <QuickActionCard
                            title="Manage Team"
                            description="Invite members & assign roles"
                            href="/dashboard/settings/team"
                            icon="👥"
                            delay={0.3}
                        />
                        <QuickActionCard
                            title="Billing & Plans"
                            description="Manage subscription & limits"
                            href="/dashboard/settings/billing"
                            icon="💳"
                            delay={0.4}
                        />
                    </div>

                    {/* Real Charts */}
                    <div className="grid gap-6 md:grid-cols-7">
                        <div className="md:col-span-4 lg:col-span-4">
                            <OverviewChart />
                        </div>
                        <div className="md:col-span-3 lg:col-span-3">
                            <KnowledgeDistribution />
                        </div>
                    </div>
                </div>
            </ScrollableContent>
        </PageWrapper>
    );
}

function QuickActionCard({ title, description, href, icon, delay }: { title: string, description: string, href: string, icon: string, delay: number }) {
    return (
        <motion.a
            href={href}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-200 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-blue-900"
        >
            <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100 text-2xl group-hover:bg-blue-50 dark:bg-neutral-900 dark:group-hover:bg-blue-900/20 transition-colors">
                    {icon}
                </div>
                <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {title}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {description}
                    </p>
                </div>
            </div>
        </motion.a>
    );
}
