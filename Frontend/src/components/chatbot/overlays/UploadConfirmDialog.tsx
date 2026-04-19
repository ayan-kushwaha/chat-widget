"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles } from 'lucide-react';

interface UploadConfirmDialogProps {
    isOpen: boolean;
    fileName: string;
    fileType: 'image' | 'file';
    onClose: () => void;
    onConfirm: (sendToAI: boolean) => void;
}

export const UploadConfirmDialog: React.FC<UploadConfirmDialogProps> = ({
    isOpen,
    fileName,
    fileType,
    onClose,
    onConfirm,
}) => {
    if (!isOpen) return null;

    const isImage = fileType === 'image';

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Dialog */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative z-10 bg-[#1e293b] border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">
                            {isImage ? 'Send Image' : 'Upload Document'}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-zinc-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* File Info */}
                    <div className="mb-6 p-3 bg-white/5 rounded-lg border border-white/5">
                        <p className="text-sm text-zinc-400 mb-1">File:</p>
                        <p className="text-white font-medium truncate">{fileName}</p>
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                        {/* Send to AI - Only for images */}
                        {isImage && (
                            <button
                                onClick={() => onConfirm(true)}
                                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-xl hover:border-emerald-500/40 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/20 rounded-lg group-hover:bg-emerald-500/30 transition-colors">
                                        <Sparkles size={18} className="text-emerald-400" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-white text-sm">Send to AI</p>
                                        <p className="text-xs text-zinc-400">Let AI analyze this image</p>
                                    </div>
                                </div>
                            </button>
                        )}

                        {/* Send to Agent */}
                        <button
                            onClick={() => onConfirm(false)}
                            className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-zinc-700 rounded-lg group-hover:bg-zinc-600 transition-colors">
                                    <Send size={18} className="text-zinc-300" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-white text-sm">
                                        {isImage ? 'Send to Agent Only' : 'Upload for Agent'}
                                    </p>
                                    <p className="text-xs text-zinc-400">Store for later reference</p>
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* Note */}
                    {isImage && (
                        <p className="mt-4 text-xs text-zinc-500 text-center">
                            AI vision may incur small processing costs
                        </p>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
