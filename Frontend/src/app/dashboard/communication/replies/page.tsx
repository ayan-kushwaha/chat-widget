"use client";

import React from "react";
import { motion } from "framer-motion";
import { Plus, Copy, Edit, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const savedReplies = [
    {
        id: "1",
        title: "Welcome Message",
        content: "Hi! Thanks for reaching out. How can I help you today?",
        category: "Greeting",
        usageCount: 234,
    },
    {
        id: "2",
        title: "Order Status",
        content: "Your order #{{ORDER_ID}} is currently being processed and will ship within 2-3 business days.",
        category: "Support",
        usageCount: 156,
    },
    {
        id: "3",
        title: "Pricing Info",
        content: "Our pricing starts at $49/month for the Pro plan. Would you like me to send you a detailed breakdown?",
        category: "Sales",
        usageCount: 89,
    },
    {
        id: "4",
        title: "Thank You",
        content: "Thank you for your patience! Is there anything else I can help you with?",
        category: "Closing",
        usageCount: 312,
    },
];

const getCategoryColor = (category: string) => {
    switch (category) {
        case "Greeting":
            return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
        case "Support":
            return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
        case "Sales":
            return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
        case "Closing":
            return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
        default:
            return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400";
    }
};

export default function SavedRepliesPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                        Saved Replies 💬
                    </h2>
                    <p className="text-neutral-500 dark:text-neutral-400">
                        Quick responses for common questions and scenarios.
                    </p>
                </div>
                <Button className="bg-blue-600 text-white hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" />
                    New Reply
                </Button>
            </div>

            {/* Replies Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                {savedReplies.map((reply, index) => (
                    <motion.div
                        key={reply.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="group relative overflow-hidden transition-all hover:shadow-md">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-base">{reply.title}</CardTitle>
                                            <Badge className={getCategoryColor(reply.category)}>
                                                {reply.category}
                                            </Badge>
                                        </div>
                                        <CardDescription className="mt-1 text-xs">
                                            Used {reply.usageCount} times
                                        </CardDescription>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                                <Copy className="mr-2 h-4 w-4" />
                                                Duplicate
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-lg bg-neutral-50 p-4 dark:bg-neutral-900">
                                    <p className="text-sm text-neutral-700 dark:text-neutral-300">
                                        {reply.content}
                                    </p>
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <Button variant="outline" size="sm" className="flex-1">
                                        <Copy className="mr-2 h-3 w-3" />
                                        Copy
                                    </Button>
                                    <Button variant="outline" size="sm" className="flex-1">
                                        <Edit className="mr-2 h-3 w-3" />
                                        Edit
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Tips Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 dark:border-blue-900 dark:from-blue-950/50 dark:to-purple-950/50">
                    <CardHeader>
                        <CardTitle className="text-blue-900 dark:text-blue-100">
                            💡 Pro Tip
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            Use variables like {`{{ORDER_ID}}`}, {`{{CUSTOMER_NAME}}`}, or {`{{PRODUCT_NAME}}`} to personalize your saved replies automatically.
                        </p>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
