"use client";

import React from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, Eye, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const trafficData = [
    { date: "Jan 1", visitors: 1200, pageviews: 3400, avgTime: 145 },
    { date: "Jan 8", visitors: 1800, pageviews: 4200, avgTime: 152 },
    { date: "Jan 15", visitors: 2100, pageviews: 5100, avgTime: 168 },
    { date: "Jan 22", visitors: 2400, pageviews: 5800, avgTime: 175 },
    { date: "Jan 29", visitors: 2800, pageviews: 6500, avgTime: 182 },
    { date: "Feb 5", visitors: 3200, pageviews: 7200, avgTime: 190 },
];

const stats = [
    {
        label: "Total Visitors",
        value: "24.5K",
        change: "+12.5%",
        icon: Users,
        color: "text-blue-500",
        bg: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
        label: "Page Views",
        value: "89.2K",
        change: "+8.2%",
        icon: Eye,
        color: "text-green-500",
        bg: "bg-green-100 dark:bg-green-900/20",
    },
    {
        label: "Avg. Session",
        value: "3m 24s",
        change: "+5.1%",
        icon: Clock,
        color: "text-purple-500",
        bg: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
        label: "Bounce Rate",
        value: "42.3%",
        change: "-2.1%",
        icon: TrendingUp,
        color: "text-orange-500",
        bg: "bg-orange-100 dark:bg-orange-900/20",
    },
];

export default function TrafficPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    Traffic Analytics 📊
                </h2>
                <p className="text-neutral-500 dark:text-neutral-400">
                    Monitor your website traffic and user behavior.
                </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                                {stat.label}
                                            </p>
                                            <h3 className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
                                                {stat.value}
                                            </h3>
                                            <div className="mt-1 flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                                                <TrendingUp className="h-3 w-3" />
                                                {stat.change}
                                            </div>
                                        </div>
                                        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bg} ${stat.color}`}>
                                            <Icon className="h-6 w-6" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            {/* Traffic Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle>Visitor Trends</CardTitle>
                        <CardDescription>Daily visitors over the last 30 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trafficData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" className="dark:stroke-neutral-800" />
                                    <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.9)", borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                                        itemStyle={{ color: "#1f2937" }}
                                        labelStyle={{ color: "#6b7280" }}
                                    />
                                    <Line type="monotone" dataKey="visitors" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", r: 4 }} />
                                    <Line type="monotone" dataKey="pageviews" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: "#8b5cf6", r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
