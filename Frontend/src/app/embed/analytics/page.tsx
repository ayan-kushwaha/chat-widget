"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { MessageSquare, Users, Zap, Star, Activity } from "lucide-react";
import axiosInstance from "@/api/axiosInstance";

export default function PublicAnalyticsPage() {
    const searchParams = useSearchParams();
    const orgId = searchParams.get("orgId");

    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!orgId) {
            setLoading(false);
            setError(true);
            return;
        }

        const fetchStats = async () => {
            try {
                // Use the new public endpoint
                const response = await axiosInstance.get(`/analytics/public-stats?orgId=${orgId}`);
                if (response.data.success) {
                    setStats(response.data.stats);
                }
            } catch (err) {
                console.error("Failed to fetch public stats", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [orgId]);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-white dark:bg-neutral-950">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-white p-6 text-center dark:bg-neutral-950">
                <Activity className="mb-4 h-12 w-12 text-neutral-300" />
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Analytics Unavailable</h3>
                <p className="text-sm text-neutral-500">Could not load data for this organization.</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full flex-col bg-white dark:bg-neutral-950 font-sans">
            {/* Header */}
            <div className="border-b border-neutral-100 bg-white/50 p-4 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950/50 sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                        <Zap className="h-5 w-5 fill-current" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-neutral-900 dark:text-white leading-none">Cluaiz Analytics</h1>
                        <p className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">Live Performance Data</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">

                {/* Hero Stat */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-xl shadow-blue-500/20"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-blue-100 text-sm font-medium">Total Conversations</span>
                        <MessageSquare className="h-5 w-5 text-blue-100 opacity-80" />
                    </div>
                    <div className="text-4xl font-bold tracking-tight">
                        {stats.totalChats.toLocaleString()}
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-100/90 bg-white/10 w-fit px-2 py-1 rounded-full backdrop-blur-sm">
                        <Activity className="h-3 w-3" />
                        <span>All time activity</span>
                    </div>
                </motion.div>

                {/* Grid Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="rounded-xl border border-neutral-100 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900"
                    >
                        <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                            <Users className="h-4 w-4" />
                        </div>
                        <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                            {stats.totalVisitors.toLocaleString()}
                        </div>
                        <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                            Unique Users
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="rounded-xl border border-neutral-100 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900"
                    >
                        <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                            <Star className="h-4 w-4 fill-current" />
                        </div>
                        <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                            {stats.satisfactionScore}
                        </div>
                        <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                            Satisfaction
                        </div>
                    </motion.div>
                </div>

                {/* Message Volume */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-xl border border-neutral-100 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Messages Processed</p>
                            <p className="text-xl font-bold text-neutral-900 dark:text-white mt-1">{stats.totalMessages.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Avg Response</p>
                            <p className="text-xl font-bold text-neutral-900 dark:text-white mt-1">{stats.avgResponseTime}</p>
                        </div>
                    </div>
                </motion.div>

            </div>

            
        </div>
    );
}
