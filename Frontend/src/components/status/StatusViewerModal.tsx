"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusViewerModalProps {
    open: boolean;
    onClose: () => void;
    statuses: StatusItem[];
    initialIndex?: number;
}

interface StatusItem {
    id: string;
    type: 'text' | 'image';
    content: string;
    styling?: {
        fontFamily?: string;
        backgroundColor?: string;
        textColor?: string;
    };
    createdAt: Date;
}

export const StatusViewerModal: React.FC<StatusViewerModalProps> = ({
    open,
    onClose,
    statuses,
    initialIndex = 0
}) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isPaused, setIsPaused] = useState(false);
    const [progress, setProgress] = useState(0);

    const currentStatus = statuses[currentIndex];
    const DURATION = 5000; // 5 seconds per status

    // ⏱️ Auto-advance timer
    useEffect(() => {
        if (!open || isPaused) return;

        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    // Move to next status
                    if (currentIndex < statuses.length - 1) {
                        setCurrentIndex(currentIndex + 1);
                        return 0;
                    } else {
                        onClose(); // Close when all viewed
                        return 100;
                    }
                }
                return prev + (100 / (DURATION / 100));
            });
        }, 100);

        return () => clearInterval(interval);
    }, [open, isPaused, currentIndex, statuses.length, onClose]);

    // Reset progress when index changes
    useEffect(() => {
        setProgress(0);
    }, [currentIndex]);

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < statuses.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            onClose();
        }
    };

    if (!currentStatus) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                className="max-w-full h-full w-full p-0 bg-black/95 border-none"
                onPointerDownOutside={(e) => e.preventDefault()}
            >
                {/* 📊 PROGRESS BARS */}
                <div className="absolute top-4 left-4 right-4 z-50 flex gap-1">
                    {statuses.map((_, idx) => (
                        <div
                            key={idx}
                            className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden"
                        >
                            <motion.div
                                className="h-full bg-white"
                                initial={{ width: '0%' }}
                                animate={{
                                    width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%'
                                }}
                                transition={{ duration: 0.1 }}
                            />
                        </div>
                    ))}
                </div>

                {/* ❌ CLOSE BUTTON */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                >
                    <X size={24} className="text-white" />
                </button>

                {/* ▶️ PAUSE/PLAY BUTTON */}
                <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="absolute bottom-8 right-8 z-50 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                >
                    {isPaused ? <Play size={20} className="text-white" /> : <Pause size={20} className="text-white" />}
                </button>

                {/* ⬅️ NAVIGATION ZONES */}
                <div
                    className="absolute left-0 top-0 bottom-0 w-1/3 z-40 cursor-pointer flex items-center justify-start px-8"
                    onClick={handlePrevious}
                >
                    {currentIndex > 0 && (
                        <ChevronLeft size={48} className="text-white/40 hover:text-white/80 transition-colors" />
                    )}
                </div>

                <div
                    className="absolute right-0 top-0 bottom-0 w-1/3 z-40 cursor-pointer flex items-center justify-end px-8"
                    onClick={handleNext}
                >
                    {currentIndex < statuses.length - 1 && (
                        <ChevronRight size={48} className="text-white/40 hover:text-white/80 transition-colors" />
                    )}
                </div>

                {/* 🎨 CONTENT DISPLAY */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStatus.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                        className="w-full h-full flex items-center justify-center p-12"
                    >
                        {currentStatus.type === 'text' ? (
                            <div
                                className={cn(
                                    "max-w-4xl w-full rounded-3xl p-16 shadow-2xl",
                                    "flex items-center justify-center text-center"
                                )}
                                style={{
                                    backgroundColor: currentStatus.styling?.backgroundColor || '#000000',
                                    color: currentStatus.styling?.textColor || '#ffffff',
                                    fontFamily: currentStatus.styling?.fontFamily || 'Inter'
                                }}
                            >
                                <p className="text-4xl md:text-6xl font-bold leading-tight whitespace-pre-wrap">
                                    {currentStatus.content}
                                </p>
                            </div>
                        ) : (
                            <img
                                src={currentStatus.content}
                                alt="Status"
                                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                            />
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* 📍 STATUS INDICATOR */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 bg-black/50 px-4 py-2 rounded-full">
                    <p className="text-white text-sm font-medium">
                        {currentIndex + 1} / {statuses.length}
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
};
