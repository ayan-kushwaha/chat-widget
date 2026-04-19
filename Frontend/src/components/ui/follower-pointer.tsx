"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export const FollowerPointerCard = ({
    children,
    className,
    title,
}: {
    children: React.ReactNode;
    className?: string;
    title?: string | React.ReactNode;
}) => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    return (
        <div
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`relative ${className}`}
        >
            {isHovered && (
                <motion.div
                    className="pointer-events-none absolute z-50"
                    style={{
                        left: mousePosition.x,
                        top: mousePosition.y,
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                >
                    <div className="flex items-center gap-2 rounded-full bg-black px-4 py-2 text-white shadow-xl">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        {title && <span className="text-sm">{title}</span>}
                    </div>
                </motion.div>
            )}
            {children}
        </div>
    );
};
