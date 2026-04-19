import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Users, Maximize2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useCallStore } from '@/store/useCallStore';

export const MinimizedCallCard = () => {
    const { callerName, callerNumber, callerImage, setMinimized, status } = useCallStore();
    const [duration, setDuration] = useState(0);

    // Simple Timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === 'connected') {
            interval = setInterval(() => setDuration(prev => prev + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [status]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (status === 'idle' || status === 'ended') return null;

    return (
        <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="flex items-center gap-3 bg-emerald-950/80 backdrop-blur-md border border-emerald-500/30 px-3 py-1.5 rounded-full shadow-lg cursor-pointer hover:bg-emerald-900/80 transition-colors group"
            onClick={() => setMinimized(false)}
        >
            {/* Pulsing Dot */}
            <div className="relative">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <div className="absolute inset-0 w-2 h-2 bg-emerald-500 rounded-full animate-ping opacity-50" />
            </div>

            {/* Profile */}
            <Avatar className="w-6 h-6 border border-emerald-500/20">
                <AvatarImage src={callerImage || undefined} />
                <AvatarFallback className="text-[9px] bg-emerald-900 text-emerald-200">
                    {callerName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex flex-col">
                <span className="text-[10px] font-bold text-emerald-100 leading-none">
                    {callerName}
                </span>
                <span className="text-[9px] font-medium text-emerald-400/80 leading-none mt-0.5">
                    {status === 'connected' ? formatTime(duration) : ''}
                </span>
            </div>

            {/* Expand Icon */}
            <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                <Maximize2 size={12} className="text-emerald-200" />
            </div>
        </motion.div>
    );
};
