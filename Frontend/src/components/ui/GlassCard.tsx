"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Copy } from "lucide-react";

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

export const GlassCard = ({ children, className, hoverEffect = true }: GlassCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={hoverEffect ? { scale: 1.02, boxShadow: "0 0 20px rgba(124, 58, 237, 0.2)" } : {}}
            className={cn(
                "relative overflow-hidden rounded-xl",
                "bg-[#141419]/60 backdrop-blur-2xl", // Real Glassmorphism: Darker + Higher Blur
                "border border-white/[0.08]", // Shiny Thin Border
                "shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]", // Deep shadow
                className
            )}
        >
            {/* Gradient Border Glow Effect on Top */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            {/* Content Container */}
            <div className="relative z-10 h-full">
                {children}
            </div>
        </motion.div>
    );
};
