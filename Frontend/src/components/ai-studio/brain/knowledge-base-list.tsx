"use client";

import React from "react";
import { motion } from "framer-motion";
import { FileText, Globe, Database, MoreVertical, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

// Mock data
const sources = [
    {
        id: "1",
        name: "Company Website",
        type: "url",
        source: "https://cluaiz.com",
        status: "synced",
        lastSynced: "10 mins ago",
        size: "15 pages",
    },
    {
        id: "2",
        name: "Product Manual.pdf",
        type: "file",
        source: "Product Manual.pdf",
        status: "synced",
        lastSynced: "1 day ago",
        size: "2.4 MB",
    },
    {
        id: "3",
        name: "FAQ Database",
        type: "text",
        source: "Custom Text",
        status: "syncing",
        lastSynced: "Just now",
        size: "12 KB",
    },
];

const getIcon = (type: string) => {
    switch (type) {
        case "url":
            return Globe;
        case "file":
            return FileText;
        default:
            return Database;
    }
};

export function KnowledgeBaseList() {
    return (
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            <div className="p-6">
                <h3 className="font-semibold text-neutral-900 dark:text-white">Data Sources</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Your AI uses these sources to answer questions.
                </p>
            </div>
            <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {sources.map((item, index) => {
                    const Icon = getIcon(item.type);
                    return (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
                        >
                            <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-neutral-900 dark:text-white">{item.name}</h4>
                                    <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                                        <span>{item.source}</span>
                                        <span>•</span>
                                        <span>{item.size}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-end gap-1">
                                    <Badge
                                        variant={item.status === "synced" ? "outline" : "secondary"}
                                        className={item.status === "synced" ? "border-green-200 text-green-700 dark:border-green-900 dark:text-green-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"}
                                    >
                                        {item.status}
                                    </Badge>
                                    <span className="text-xs text-neutral-400">
                                        {item.lastSynced}
                                    </span>
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Re-sync
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-600">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
