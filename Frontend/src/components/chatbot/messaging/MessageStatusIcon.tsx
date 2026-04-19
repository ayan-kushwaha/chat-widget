/**
 * Message Status Icon Component
 * WhatsApp-style delivery status indicators with smooth transitions
 * 
 * States:
 * - 🕒 Clock (sending - local only)
 * - ✔️ Single Gray (sent to server)
 * - ✔️✔️ Double Gray (delivered to client)
 * - ✔️✔️ Blue (read by client)
 */

import React from 'react';
import { Clock, Check, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

interface MessageStatusIconProps {
    status: MessageStatus;
    className?: string;
}

export const MessageStatusIcon: React.FC<MessageStatusIconProps> = ({ status, className }) => {
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={status}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className={cn("inline-flex items-center justify-center", className)}
            >
                {status === 'sending' && (
                    <Clock size={14} className="text-slate-400 animate-pulse" />
                )}
                {status === 'sent' && (
                    <Check size={14} className="text-slate-400" />
                )}
                {status === 'delivered' && (
                    <CheckCheck size={14} className="text-slate-400" />
                )}
                {status === 'read' && (
                    <CheckCheck size={14} className="text-blue-500" />
                )}
            </motion.div>
        </AnimatePresence>
    );
};

/**
 * Format timestamp for message bubble
 * Returns time in HH:MM format
 */
export const formatMessageTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
};
