"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, MessageSquare, Database, Zap, Activity, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import axiosInstance from "@/api/axiosInstance";
import { useOrg } from "@/context/OrgContext";

export function StatsCards() {
    const { activeOrg } = useOrg();
    const [stats, setStats] = useState([
        {
            label: "Total Chats",
            value: "0",
            change: "+0%",
            trend: "up",
            icon: MessageSquare,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
        },
        {
            label: "Total Messages",
            value: "0",
            change: "+0%",
            trend: "up",
            icon: Activity,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
        },
        {
            label: "Knowledge Sources",
            value: "0",
            change: "Files & Sites",
            trend: "neutral",
            icon: Database,
            color: "text-green-500",
            bg: "bg-green-500/10",
        },
        {
            label: "System Status",
            value: "Operational",
            change: "99.9% Uptime",
            trend: "up",
            icon: Zap,
            color: "text-orange-500",
            bg: "bg-orange-500/10",
        },
    ]);

    useEffect(() => {
        const fetchData = async () => {
            if (!activeOrg?.id) return;

            try {
                // 1. Fetch Analytics Stats (Aggregated for all sites)
                const url = `/analytics/public-stats?orgId=${activeOrg.id}`;
                console.log("Fetching Stats URL:", axiosInstance.getUri({ url }));
                const analyticsRes = await axiosInstance.get(url);

                // 2. Fetch Knowledge Stats
                const knowledgeRes = await axiosInstance.get(`/knowledge/${activeOrg.id}/overview`);

                if (analyticsRes.data.success) {
                    const { totalChats, totalMessages, chatTrend, callsToday, missedCalls } = analyticsRes.data.stats;

                    // Calculate Chat Trend (Last 2 days comparison)
                    let chatChange = "+0%";
                    let chatTrendDir = "neutral";

                    if (chatTrend && chatTrend.length >= 2) {
                        const today = chatTrend[chatTrend.length - 1].chats;
                        const yesterday = chatTrend[chatTrend.length - 2].chats;

                        if (yesterday > 0) {
                            const diff = ((today - yesterday) / yesterday) * 100;
                            chatChange = `${diff > 0 ? "+" : ""}${diff.toFixed(1)}%`;
                            chatTrendDir = diff >= 0 ? "up" : "down";
                        } else if (today > 0) {
                            chatChange = "+100%";
                            chatTrendDir = "up";
                        }
                    }

                    setStats(prev => {
                        const newStats = [...prev];
                        // Total Chats
                        newStats[0].value = totalChats.toLocaleString();
                        newStats[0].change = chatChange;
                        newStats[0].trend = chatTrendDir;

                        // Total Messages
                        newStats[1].value = totalMessages.toLocaleString();

                        // 📞 Call Stats (Replacing System Status for now as per user request)
                        newStats[3] = {
                            label: "Calls Today",
                            value: (callsToday || 0).toString(),
                            change: `${missedCalls || 0} Missed`,
                            trend: missedCalls > 0 ? "down" : "neutral", // Red if missed calls exist
                            icon: Phone, 
                            color: "text-rose-500",
                            bg: "bg-rose-500/10",
                        };

                        return newStats;
                    });
                }

                if (knowledgeRes.data.success) {
                    const { totalSources } = knowledgeRes.data.stats;
                    setStats(prev => {
                        const newStats = [...prev];
                        newStats[2].value = totalSources.toString();
                        return newStats;
                    });
                }

            } catch (error) {
                console.error("Failed to fetch dashboard stats:", error);
            }
        };

        fetchData();
    }, [activeOrg]);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950"
                    >
                        <div className="flex items-center justify-between">
                            <div className={cn("rounded-lg p-2", stat.bg)}>
                                <Icon className={cn("h-5 w-5", stat.color)} />
                            </div>
                            {stat.trend !== "neutral" && (
                                <div className={cn("flex items-center gap-1 text-xs font-medium",
                                    stat.trend === "up" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                                )}>
                                    {stat.change}
                                    {stat.trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                </div>
                            )}
                            {stat.trend === "neutral" && (
                                <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                    {stat.change}
                                </div>
                            )}
                        </div>
                        <div className="mt-4">
                            <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">
                                {stat.value}
                            </h3>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                {stat.label}
                            </p>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
