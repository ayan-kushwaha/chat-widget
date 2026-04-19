"use client";
import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const GeminiEffect = ({
    pathLengths,
    title,
    description,
    className,
}: {
    pathLengths: any[];
    title?: string;
    description?: string;
    className?: string;
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    return (
        <div
            ref={ref}
            onMouseMove={handleMouseMove}
            className={cn(
                "relative h-96 w-full overflow-hidden rounded-lg bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10",
                className
            )}
        >
            <div className="absolute inset-0">
                <svg className="h-full w-full">
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                            <stop offset="50%" stopColor="#a855f7" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.8" />
                        </linearGradient>
                    </defs>
                    {pathLengths.map((pathLength, index) => (
                        <motion.path
                            key={index}
                            d={`M ${mousePosition.x} ${mousePosition.y} Q ${mousePosition.x + (index * 50 - 100)
                                } ${mousePosition.y + (index * 30 - 60)} ${mousePosition.x + (index * 100 - 200)
                                } ${mousePosition.y + (index * 60 - 120)}`}
                            stroke="url(#gradient)"
                            strokeWidth="2"
                            fill="none"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 0.6 }}
                            transition={{ duration: 1, delay: index * 0.1 }}
                        />
                    ))}
                </svg>
            </div>
            <div className="relative z-10 flex h-full flex-col items-center justify-center p-8 text-center">
                {title && (
                    <h2 className="mb-4 text-4xl font-bold text-white">{title}</h2>
                )}
                {description && (
                    <p className="text-lg text-white/80">{description}</p>
                )}
            </div>
        </div>
    );
};
