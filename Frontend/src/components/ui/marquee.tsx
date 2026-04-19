"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import React from "react";

interface MarqueeProps {
    className?: string;
    reverse?: boolean;
    pauseOnHover?: boolean;
    children?: React.ReactNode;
    repeat?: number;
    duration?: number;
}

export function Marquee({
    className,
    reverse,
    pauseOnHover = false,
    children,
    repeat = 4,
    duration = 30, // Default duration in seconds
    ...props
}: MarqueeProps) {
    return (
        <div
            {...props}
            className={cn("group flex overflow-hidden p-2 [--gap:1rem] [gap:var(--gap)]", className)}
        >
            {Array(repeat)
                .fill(0)
                .map((_, i) => (
                    <motion.div
                        key={i}
                        className={cn("flex shrink-0 items-center justify-around [gap:var(--gap)]", {
                            "flex-row-reverse": reverse,
                        })}
                        animate={{
                            x: reverse ? ["0%", "100%"] : ["0%", "-100%"],
                        }}
                        transition={{
                            duration: duration,
                            repeat: Infinity,
                            ease: "linear",
                            repeatType: "loop",
                        }}
                        // Apply pause on hover to the motion div itself if needed, 
                        // but usually it's on the container. Framer motion 'animate' 
                        // doesn't pause easily with simple props. 
                        // For a simple CSS-like 'paused' state, we might need CSS animation 
                        // OR use animation controls. 
                        // However, a simpler way for Marquee with framer is to just rely on 
                        // CSS for the pause if we used CSS keys, but sticking to framer:
                        // Let's us standard CSS for the animation to support 'animation-play-state'.
                        style={{
                            // motion.div overrides inline styles for transform, so we use className for the "movement"
                            // Actually, for simple linear infinite scroll, CSS is often smoother and easier to pause.
                        }}
                    >
                        {children}
                    </motion.div>
                ))}
        </div>
    );
}

// Re-writing to use CSS Animation for better 'pauseOnHover' support which is tricky with pure framer-motion 'animate' prop.
// We will simply define a keyframe animation in tailwind or style.

export function MarqueeCSS({
    className,
    reverse,
    pauseOnHover = false,
    children,
    vertical = false,
    repeat = 4,
    ...props
}: {
    className?: string;
    reverse?: boolean;
    pauseOnHover?: boolean;
    children?: React.ReactNode;
    vertical?: boolean;
    repeat?: number;
    [key: string]: any;
}) {
    return (
        <div
            {...props}
            className={cn(
                "group flex overflow-hidden p-2 [--duration:40s] [--gap:1rem] [gap:var(--gap)]",
                {
                    "flex-row": !vertical,
                    "flex-col": vertical,
                },
                className
            )}
        >
            {Array(repeat)
                .fill(0)
                .map((_, i) => (
                    <div
                        key={i}
                        className={cn("flex shrink-0 justify-around [gap:var(--gap)]", {
                            "animate-marquee": !vertical,
                            "animate-marquee-vertical": vertical,
                            "group-hover:[animation-play-state:paused]": pauseOnHover,
                            "[animation-direction:reverse]": reverse,
                        })}
                    >
                        {children}
                    </div>
                ))}
        </div>
    );
}
