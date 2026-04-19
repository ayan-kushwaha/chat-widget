"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface HighlighterProps {
    children: React.ReactNode;
    className?: string;
    action?: "underline" | "highlight";
    color?: string;
}

export const Highlighter = ({
    children,
    className,
    action = "underline",
    color = "#FF9800",
}: HighlighterProps) => {
    return (
        <span className={cn("relative inline-block", className)}>
            {children}
            {action === "underline" && (
                <motion.span
                    className="absolute bottom-0 left-0 h-[2px] w-full"
                    style={{ backgroundColor: color }}
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    viewport={{ once: true }}
                />
            )}
            {action === "highlight" && (
                <motion.span
                    className="absolute inset-0 -z-10"
                    style={{ backgroundColor: color, opacity: 0.3 }}
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    viewport={{ once: true }}
                />
            )}
        </span>
    );
};
