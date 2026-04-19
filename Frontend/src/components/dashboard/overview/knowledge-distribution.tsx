"use client";

import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { motion } from "framer-motion";
import axiosInstance from "@/api/axiosInstance";
import { useOrg } from "@/context/OrgContext";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b"];

export function KnowledgeDistribution() {
    const { activeOrg } = useOrg();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!activeOrg?.id) return;
            try {
                const res = await axiosInstance.get(`/knowledge/${activeOrg.id}/overview`);
                if (res.data.success && res.data.sources) {
                    const { sources } = res.data;
                    const chartData = [
                        { name: "Websites", value: sources.websites?.length || 0 },
                        { name: "Documents", value: sources.documents?.length || 0 },
                        { name: "Custom Text", value: sources.custom_text?.length || 0 },
                    ].filter(item => item.value > 0); // Only show non-empty categories

                    setData(chartData);
                }
            } catch (error) {
                console.error("Failed to fetch knowledge distribution:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activeOrg]);

    if (loading) {
        return (
            <div className="h-[400px] w-full rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="h-[400px] w-full rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 flex flex-col items-center justify-center text-center">
                <div className="rounded-full bg-neutral-100 p-4 dark:bg-neutral-900">
                    <span className="text-2xl">📚</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-white">No Knowledge Added</h3>
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 max-w-xs">
                    Add websites, documents, or text to train your bot and see the distribution here.
                </p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="h-[400px] w-full rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950"
        >
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Knowledge Base</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Distribution of your training sources.
                </p>
            </div>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.8)", borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                            itemStyle={{ color: "#1f2937" }}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}
