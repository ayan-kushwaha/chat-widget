"use client";

import React from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const activities = [
    {
        user: {
            name: "Aryan",
            image: "https://github.com/shadcn.png",
            initials: "AR",
        },
        action: "deployed a new agent",
        target: "Customer Support Bot",
        time: "2 minutes ago",
    },
    {
        user: {
            name: "Sarah",
            image: "",
            initials: "SA",
        },
        action: "updated the knowledge base",
        target: "Product Documentation",
        time: "1 hour ago",
    },
    {
        user: {
            name: "System",
            image: "",
            initials: "SY",
        },
        action: "completed scheduled backup",
        target: "Database",
        time: "3 hours ago",
    },
    {
        user: {
            name: "Mike",
            image: "",
            initials: "MI",
        },
        action: "invited a new team member",
        target: "John Doe",
        time: "5 hours ago",
    },
    {
        user: {
            name: "Aryan",
            image: "https://github.com/shadcn.png",
            initials: "AR",
        },
        action: "changed billing plan",
        target: "Pro Plan",
        time: "1 day ago",
    },
];

export function RecentActivity() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="h-[400px] w-full rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950"
        >
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Recent Activity</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Latest actions across your organization.
                </p>
            </div>
            <div className="space-y-6 overflow-y-auto pr-2 h-[300px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {activities.map((activity, index) => (
                    <div key={index} className="flex items-start gap-4">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={activity.user.image} alt={activity.user.name} />
                            <AvatarFallback>{activity.user.initials}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            <p className="text-sm font-medium leading-none text-neutral-900 dark:text-white">
                                {activity.user.name}{" "}
                                <span className="font-normal text-neutral-500 dark:text-neutral-400">
                                    {activity.action}
                                </span>{" "}
                                <span className="font-medium text-neutral-900 dark:text-white">
                                    {activity.target}
                                </span>
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                {activity.time}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}
