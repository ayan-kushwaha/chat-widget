"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusCircleProps {
    type: 'add' | 'status';
    label?: string; // Optional now, mainly for "My Status" tooltip if needed or initial
    content?: string; // Image URL or Text Content
    statusType?: 'text' | 'image';
    styling?: {
        backgroundColor?: string;
        textColor?: string;
        fontFamily?: string;
    };
    hasUnviewed?: boolean;
    onClick?: () => void;
    onContextMenu?: (e: React.MouseEvent) => void;
}

export const StatusCircle: React.FC<StatusCircleProps> = ({
    type,
    label,
    content,
    statusType = 'image',
    styling,
    hasUnviewed = false,
    onClick,
    onContextMenu
}) => {
    return (
        <motion.div
            className="flex flex-col items-center gap-1.5 px-2 shrink-0 cursor-pointer group"
            onClick={onClick}
            onContextMenu={onContextMenu}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            {type === 'add' ? (
                // + MY STATUS
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center group-hover:border-emerald-500 transition-all">
                    <div className="w-11 h-11 bg-zinc-900 rounded-full flex items-center justify-center">
                        <Plus className="text-zinc-500 group-hover:text-emerald-500 transition-colors" size={20} />
                    </div>
                </div>
            ) : (
                // Status Avatar with Ring
                <div className="relative">
                    {hasUnviewed && (
                        <motion.div
                            className="absolute inset-0 rounded-full p-[2px]"
                            style={{
                                background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'
                            }}
                            animate={{ rotate: 360 }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                        >
                            <div className="w-full h-full bg-black rounded-full" />
                        </motion.div>
                    )}

                    <div className={cn(
                        "w-14 h-14 rounded-full overflow-hidden border-2 relative z-10 flex items-center justify-center",
                        hasUnviewed ? "border-black" : "border-zinc-700"
                    )}>
                        {statusType === 'image' ? (
                            <Avatar className="w-full h-full">
                                <AvatarImage src={content || `https://api.dicebear.com/7.x/avataaars/svg?seed=${label}`} className="object-cover" />
                                <AvatarFallback className="bg-zinc-800 text-zinc-500 text-[10px] font-bold">
                                    {label?.[0]}
                                </AvatarFallback>
                            </Avatar>
                        ) : (
                            // Text Status Preview
                            <div
                                className="w-full h-full flex items-center justify-center p-1 text-center"
                                style={{
                                    backgroundColor: styling?.backgroundColor || '#000000',
                                    color: styling?.textColor || '#ffffff'
                                }}
                            >
                                <span className="text-[6px] font-bold line-clamp-3 leading-tight break-all">
                                    {content}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Label Removed as requested */}
        </motion.div>
    );
};
