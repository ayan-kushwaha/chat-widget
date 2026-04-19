"use client";
import React from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const CollapsibleSection = ({ id, title, icon, isOpen, onToggle, children, badge }: { id: string, title: string, icon: any, isOpen: boolean, onToggle: (id: string) => void, children: React.ReactNode, badge?: React.ReactNode }) => (
    <div className="space-y-4 border-b border-neutral-100 dark:border-white/5 pb-6 last:border-0 last:pb-0">
        <button
            type="button"
            onClick={() => onToggle(id)}
            className="flex items-center justify-between w-full group"
        >
            <div className="flex items-center gap-3">
                <div className={cn(
                    "p-2 rounded-lg transition-colors",
                    isOpen ? "bg-blue-500/10 text-blue-500" : "bg-neutral-100 dark:bg-white/5 text-neutral-500"
                )}>
                    {React.createElement(icon, { size: 18 })}
                </div>
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-widest">{title}</h3>
                    {badge && <div>{badge}</div>}
                </div>
            </div>
            <div className={cn(
                "p-1.5 rounded-full transition-all duration-300",
                isOpen ? "bg-blue-500/10 text-blue-500 rotate-180" : "bg-neutral-100 dark:bg-white/5 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-200"
            )}>
                <ChevronDown size={16} />
            </div>
        </button>
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                >
                    <div className="pt-2">
                        {children}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);
