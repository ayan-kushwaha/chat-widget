/**
 * Quoted Message Component
 * Displays the quoted/replied-to message inside a message bubble
 * WhatsApp-style design with left border accent
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface QuotedMessageProps {
    sender: string;
    content: string;
    className?: string;
    onClick?: () => void;
}

export const QuotedMessage: React.FC<QuotedMessageProps> = ({ sender, content, className, onClick }) => {
    // Truncate long messages
    const truncatedContent = content.length > 60
        ? content.substring(0, 60) + '...'
        : content;

    return (
        <div
            onClick={onClick}
            className={cn(
                "mb-2 relative flex overflow-hidden rounded-lg bg-black/10 dark:bg-white/5",
                className
            )}>
            <div className="w-1 bg-emerald-500 shrink-0" />
            <div className="py-2 pr-3 pl-2 w-full">
                <div className="text-[10px] font-bold text-emerald-500 capitalize mb-0.5">
                    {sender}
                </div>
                <div className="text-[11px] opacity-70 line-clamp-2">
                    {truncatedContent}
                </div>
            </div>
        </div>
    );
};
