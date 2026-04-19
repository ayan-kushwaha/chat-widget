"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatusSidebarRingProps {
    children: React.ReactNode;
    hasUnviewedStatus?: boolean;
    onClick?: () => void;
    className?: string;
}

export const StatusSidebarRing: React.FC<StatusSidebarRingProps> = ({
    children,
    hasUnviewedStatus = false,
    onClick,
    className
}) => {
    return (
        <div
            className={cn("relative cursor-pointer", className)}
            onClick={onClick}
        >
            {/* 🌈 ANIMATED GRADIENT RING (Instagram Style) */}
            {hasUnviewedStatus && (
                <motion.div
                    className="absolute inset-0 rounded-full p-[2px]"
                    style={{
                        background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'
                    }}
                    animate={{
                        rotate: 360
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                >
                    <div className="w-full h-full bg-[#0b141a] rounded-full" />
                </motion.div>
            )}

            {/* ⭐ CHILD CONTENT (Avatar) */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};
