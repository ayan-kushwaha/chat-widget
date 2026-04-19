import React from 'react';
import { motion } from 'framer-motion';

export const TypingIndicator = () => {
    const dotTransition = {
        repeat: Infinity,
        repeatType: "loop" as const,
        duration: 0.8,
        ease: "easeInOut"
    } as any;

    return (
        <div className="flex items-center gap-1 p-3 bg-slate-200 dark:bg-slate-800 w-fit rounded-2xl rounded-bl-md shadow-sm opacity-80">
            <motion.div
                className="w-1.5 h-1.5 bg-slate-500 rounded-full"
                animate={{ y: [0, -5, 0] }}
                transition={{ ...dotTransition, delay: 0 }}
            />
            <motion.div
                className="w-1.5 h-1.5 bg-slate-500 rounded-full"
                animate={{ y: [0, -5, 0] }}
                transition={{ ...dotTransition, delay: 0.15 }}
            />
            <motion.div
                className="w-1.5 h-1.5 bg-slate-500 rounded-full"
                animate={{ y: [0, -5, 0] }}
                transition={{ ...dotTransition, delay: 0.3 }}
            />
        </div>
    );
};

export default TypingIndicator;
