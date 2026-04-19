/**
 * Reply Context Bar Component
 * Shows "Replying to..." bar above input when user swipes to reply
 * WhatsApp-style design with quoted message preview
 */

import React from 'react';
import { Reply } from 'lucide-react';
import { X as AnimatedX } from '@/components/animate-ui/icons/x';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ReplyContextBarProps {
    replyingTo: {
        id: string | number;
        sender: string;
        content: string;
    } | null;
    onCancel: () => void;
    className?: string;
}

export const ReplyContextBar: React.FC<ReplyContextBarProps> = ({
    replyingTo,
    onCancel,
    className
}) => {
    if (!replyingTo) return null;

    // Truncate long messages
    const truncatedContent = replyingTo.content.length > 80
        ? replyingTo.content.substring(0, 80) + '...'
        : replyingTo.content;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
                "flex items-center gap-3 px-4 py-2 bg-slate-100 dark:bg-slate-800 border-l-4 border-blue-500",
                className
            )}
        >
            <Reply size={16} className="text-blue-500 flex-shrink-0" />

            <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-blue-500 capitalize mb-0.5">
                    {replyingTo.sender}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 truncate">
                    {truncatedContent}
                </div>
            </div>

            <button
                onClick={onCancel}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors flex-shrink-0"
                aria-label="Cancel reply"
            >
                <AnimatedX size={16} className="text-slate-500" animateOnHover />
            </button>
        </motion.div>
    );
};
