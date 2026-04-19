"use client";

import React from "react";
import { motion } from "framer-motion";
import { Plus, Play, GitBranch, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const flows = [
    {
        id: "1",
        name: "Lead Nurture Flow",
        description: "Automated lead follow-up sequence",
        nodes: 8,
        status: "active",
        executions: 234,
        successRate: 94.5,
        lastRun: "5 mins ago",
    },
    {
        id: "2",
        name: "Customer Onboarding",
        description: "Welcome new customers with personalized messages",
        nodes: 12,
        status: "active",
        executions: 156,
        successRate: 98.2,
        lastRun: "10 mins ago",
    },
    {
        id: "3",
        name: "Support Ticket Router",
        description: "Routes tickets to the right team",
        nodes: 6,
        status: "draft",
        executions: 0,
        successRate: 0,
        lastRun: "Never",
    },
];

export default function NeuralFlowPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                        Neural Flow 🧠
                    </h2>
                    <p className="text-neutral-500 dark:text-neutral-400">
                        Build and automate complex workflows with visual flow builder.
                    </p>
                </div>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Flow
                </Button>
            </div>

            {/* Flows Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {flows.map((flow, index) => (
                    <motion.div
                        key={flow.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-950"
                    >
                        {/* Status Badge */}
                        <div className="mb-4 flex items-center justify-between">
                            <Badge
                                variant={flow.status === "active" ? "default" : "secondary"}
                                className={
                                    flow.status === "active"
                                        ? "bg-green-500 hover:bg-green-600"
                                        : "bg-neutral-500"
                                }
                            >
                                {flow.status}
                            </Badge>
                            <div className="flex items-center gap-1 text-sm text-neutral-500">
                                <GitBranch className="h-4 w-4" />
                                {flow.nodes} nodes
                            </div>
                        </div>

                        {/* Flow Info */}
                        <h3 className="font-semibold text-neutral-900 dark:text-white">{flow.name}</h3>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            {flow.description}
                        </p>

                        {/* Stats */}
                        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-neutral-100 pt-4 dark:border-neutral-800">
                            <div>
                                <div className="flex items-center gap-1 text-xs text-neutral-500">
                                    <Play className="h-3 w-3" />
                                    Executions
                                </div>
                                <p className="mt-1 font-semibold text-neutral-900 dark:text-white">
                                    {flow.executions}
                                </p>
                            </div>
                            <div>
                                <div className="flex items-center gap-1 text-xs text-neutral-500">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Success Rate
                                </div>
                                <p className="mt-1 font-semibold text-green-600 dark:text-green-400">
                                    {flow.successRate}%
                                </p>
                            </div>
                        </div>

                        {/* Last Run */}
                        <div className="mt-4 flex items-center gap-1 text-xs text-neutral-400">
                            <Clock className="h-3 w-3" />
                            Last run: {flow.lastRun}
                        </div>

                        {/* Actions */}
                        <div className="mt-4 flex gap-2">
                            <Button className="flex-1" variant="outline" size="sm">
                                Edit Flow
                            </Button>
                            {flow.status === "active" ? (
                                <Button variant="outline" size="sm">
                                    <Play className="h-4 w-4" />
                                </Button>
                            ) : (
                                <Button variant="outline" size="sm">
                                    <Play className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        {/* Gradient Overlay */}
                        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 blur-2xl transition-all group-hover:scale-150"></div>
                    </motion.div>
                ))}
            </div>

            {/* Empty State for Create */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 py-12 dark:border-neutral-800 dark:bg-neutral-900/50"
            >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                    <GitBranch className="h-8 w-8 text-white" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-white">
                    Build Your First Flow
                </h3>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                    Create powerful automation workflows with our visual builder.
                </p>
                <Button className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Start Building
                </Button>
            </motion.div>
        </div>
    );
}
