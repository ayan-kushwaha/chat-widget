"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Brain, Globe, Upload, Database, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface SourceOption {
    id: string;
    title: string;
    description: string;
    icon: any;
    color: string;
    bgColor: string;
}

const options: SourceOption[] = [
    {
        id: "knowledge-doc",
        title: "Knowledge Doc",
        description: "Write or paste text content directly into the editor.",
        icon: Brain,
        color: "text-purple-600",
        bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
        id: "website",
        title: "Website",
        description: "Crawl and index content from a public website URL.",
        icon: Globe,
        color: "text-blue-600",
        bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
        id: "file",
        title: "File Upload",
        description: "Upload PDF, DOCX, or TXT files from your computer.",
        icon: Upload,
        color: "text-emerald-600",
        bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
        id: "api",
        title: "API Connection",
        description: "Sync data from external APIs via JSON endpoints.",
        icon: Database,
        color: "text-amber-600",
        bgColor: "bg-amber-100 dark:bg-amber-900/30",
    },
];

interface SourceSelectionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SourceSelectionModal({ open, onOpenChange }: SourceSelectionModalProps) {
    const router = useRouter();

    const handleSelect = (id: string) => {
        onOpenChange(false);
        router.push(`/dashboard/ai-studio/brain/editor?type=${id}`);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-neutral-950">
                <div className="relative p-6 sm:p-8">
                    <DialogHeader className="mb-8">
                        <DialogTitle className="text-2xl font-bold">Add Knowledge Source</DialogTitle>
                        <DialogDescription className="text-neutral-500 dark:text-neutral-400">
                            Choose how you would like to provide data to train your AI brain.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {options.map((option, index) => (
                            <motion.button
                                key={option.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => handleSelect(option.id)}
                                className="group flex flex-col text-left p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-primary/50 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-all active:scale-[0.98]"
                            >
                                <div className={`w-12 h-12 rounded-lg ${option.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <option.icon className={`w-6 h-6 ${option.color}`} />
                                </div>
                                <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">{option.title}</h3>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                    {option.description}
                                </p>
                            </motion.button>
                        ))}
                    </div>
                </div>

                <div className="bg-neutral-50 dark:bg-neutral-900/50 p-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-neutral-500">
                        Cancel
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
