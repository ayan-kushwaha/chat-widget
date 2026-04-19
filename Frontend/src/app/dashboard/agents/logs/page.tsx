"use client";

import React from "react";
import { motion } from "framer-motion";
import { Search, Filter, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const logs = [
    {
        id: "1",
        agent: "Customer Support Agent",
        action: "Responded to customer query",
        status: "success",
        duration: "1.2s",
        timestamp: "2 mins ago",
        details: "Query: 'How do I reset my password?'",
    },
    {
        id: "2",
        agent: "Lead Qualifier",
        action: "Scored new lead",
        status: "success",
        duration: "0.8s",
        timestamp: "5 mins ago",
        details: "Lead Score: 85/100",
    },
    {
        id: "3",
        agent: "Email Responder",
        action: "Auto-replied to email",
        status: "failed",
        duration: "2.1s",
        timestamp: "10 mins ago",
        details: "Error: Rate limit exceeded",
    },
    {
        id: "4",
        agent: "Lead Nurture Flow",
        action: "Sent follow-up message",
        status: "success",
        duration: "1.5s",
        timestamp: "15 mins ago",
        details: "Step 3/8 completed",
    },
    {
        id: "5",
        agent: "Support Ticket Router",
        action: "Routed ticket to team",
        status: "warning",
        duration: "3.2s",
        timestamp: "20 mins ago",
        details: "Warning: High queue volume",
    },
];

const getStatusIcon = (status: string) => {
    switch (status) {
        case "success":
            return <CheckCircle2 className="h-5 w-5 text-green-500" />;
        case "failed":
            return <XCircle className="h-5 w-5 text-red-500" />;
        case "warning":
            return <AlertCircle className="h-5 w-5 text-orange-500" />;
        default:
            return <Clock className="h-5 w-5 text-blue-500" />;
    }
};

const getStatusColor = (status: string) => {
    switch (status) {
        case "success":
            return "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-900/20 dark:text-green-400";
        case "failed":
            return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400";
        case "warning":
            return "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-900/20 dark:text-orange-400";
        default:
            return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-400";
    }
};

export default function ExecutionLogsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                        Execution Logs 📋
                    </h2>
                    <p className="text-neutral-500 dark:text-neutral-400">
                        Monitor all agent and flow executions in real-time.
                    </p>
                </div>
                <div className="flex gap-2">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <Input placeholder="Search logs..." className="pl-9" />
                    </div>
                    <Button variant="outline">
                        <Filter className="mr-2 h-4 w-4" />
                        Filter
                    </Button>
                </div>
            </div>

            {/* Logs List */}
            <div className="space-y-3">
                {logs.map((log, index) => (
                    <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950"
                    >
                        <div className="flex items-start gap-4">
                            {/* Status Icon */}
                            <div className="mt-1">{getStatusIcon(log.status)}</div>

                            {/* Content */}
                            <div className="flex-1">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-neutral-900 dark:text-white">
                                                {log.agent}
                                            </h3>
                                            <Badge variant="outline" className={getStatusColor(log.status)}>
                                                {log.status}
                                            </Badge>
                                        </div>
                                        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                                            {log.action}
                                        </p>
                                        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-500">
                                            {log.details}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-neutral-500">{log.timestamp}</p>
                                        <div className="mt-1 flex items-center gap-1 text-xs text-neutral-400">
                                            <Clock className="h-3 w-3" />
                                            {log.duration}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Load More */}
            <div className="flex justify-center">
                <Button variant="outline">Load More Logs</Button>
            </div>
        </div>
    );
}
