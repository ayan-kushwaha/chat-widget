"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

interface MorphingTextProps {
    texts: string[];
    className?: string;
}

export function MorphingText({ texts, className }: MorphingTextProps) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setIndex((prevIndex) => (prevIndex + 1) % texts.length);
        }, 3000);
        return () => clearInterval(intervalId);
    }, [texts]);

    return (
        <div className={cn("relative inline-block h-[1.2em] w-full overflow-hidden text-center", className)}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={texts[index]}
                    initial={{ y: 20, opacity: 0, filter: "blur(4px)" }}
                    animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                    exit={{ y: -20, opacity: 0, filter: "blur(4px)" }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="absolute inset-x-0 mx-auto"
                >
                    {texts[index]}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
