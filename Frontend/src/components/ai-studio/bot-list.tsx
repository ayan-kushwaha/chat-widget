"use client";

import React from "react";
import { motion } from "framer-motion";
import { Bot, MoreVertical, Play, Settings, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

// Mock data
const bots = [
    {
        id: "1",
        name: "Customer Support",
        description: "Handles general inquiries and FAQs.",
        model: "GPT-4o",
        status: "active",
        chats: 1234,
        lastActive: "2 mins ago",
    },
    {
        id: "2",
        name: "Sales Assistant",
        description: "Qualifies leads and schedules meetings.",
        model: "Claude 3.5 Sonnet",
        status: "active",
        chats: 856,
        lastActive: "1 hour ago",
    },
    {
        id: "3",
        name: "Internal HR Helper",
        description: "Answers employee policy questions.",
        model: "GPT-4o Mini",
        status: "inactive",
        chats: 45,
        lastActive: "2 days ago",
    },
];

export function BotList() {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bots.map((bot, index) => (
                <motion.div
                    key={bot.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group relative flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-950"
                >
                    {/* Header */}
                    <div className="mb-4 flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                            <Bot className="h-6 w-6" />
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8 text-neutral-500">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Content */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-neutral-900 dark:text-white">{bot.name}</h3>
                        <p className="mt-1 text-sm text-neutral-500 line-clamp-2 dark:text-neutral-400">
                            {bot.description}
                        </p>
                    </div>

                    {/* Stats & Footer */}
                    <div className="mt-auto space-y-4">
                        <div className="flex items-center gap-2">
                            <Badge variant={bot.status === "active" ? "default" : "secondary"} className={bot.status === "active" ? "bg-green-500 hover:bg-green-600" : ""}>
                                {bot.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs font-normal">
                                {bot.model}
                            </Badge>
                        </div>

                        <div className="flex items-center justify-between border-t border-neutral-100 pt-4 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                            <div className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {bot.chats} chats
                            </div>
                            <div>{bot.lastActive}</div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button className="w-full bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200" size="sm">
                                <Settings className="mr-2 h-3 w-3" />
                                Configure
                            </Button>
                            <Button variant="outline" size="sm" className="w-full">
                                <Play className="mr-2 h-3 w-3" />
                                Test
                            </Button>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
