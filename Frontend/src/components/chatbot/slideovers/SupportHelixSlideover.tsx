"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Check,
    MessageSquare,
    HelpCircle,
    Send,
    FileText,
    Zap,
    Mail
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SupportHelixSlideoverProps {
    isOpen: boolean;
    onClose: () => void;
    onBack?: () => void;
}

export const SupportHelixSlideover: React.FC<SupportHelixSlideoverProps> = ({
    isOpen,
    onClose,
    onBack
}) => {
    const [formData, setFormData] = useState({
        subject: '',
        message: '',
        priority: 'Normal'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulation of support ticket creation
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-auto"
                    />

                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="absolute left-0 top-0 bottom-0 w-full max-w-[480px] bg-neutral-950 border-r border-white/5 flex flex-col pointer-events-auto shadow-[20px_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
                    >
                        {/* 💎 HEADER */}
                        <div className="relative pt-12 pb-6 px-6 bg-gradient-to-b from-purple-500/10 to-transparent">
                            <div className="flex items-center gap-4">
                                <motion.button
                                    whileHover={{ scale: 1.1, x: -2 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={onBack || onClose}
                                    className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
                                >
                                    <ArrowLeft size={24} />
                                </motion.button>
                                <div className="flex flex-col">
                                    <h2 className="text-xl font-black text-white tracking-tight uppercase">Cluaiz Support</h2>
                                    <p className="text-[10px] text-purple-500 font-bold uppercase tracking-[0.2em]">Neural Assistance Protocol</p>
                                </div>
                            </div>
                        </div>

                        {/* ⚡ CONTENT */}
                        <div className="flex-1 overflow-y-auto no-scrollbar">
                            <div className="px-6 py-6 space-y-10">
                                <div className="bg-white/5 rounded-2xl p-6 border border-white/5 space-y-8 backdrop-blur-sm">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Query Subject</label>
                                        <div className="flex items-center gap-4 group">
                                            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center border border-white/5 group-focus-within:border-purple-500/50 transition-colors">
                                                <HelpCircle className="text-zinc-600 group-focus-within:text-purple-500 transition-colors" size={18} />
                                            </div>
                                            <input
                                                placeholder="HOW CAN WE HELP YOU?"
                                                value={formData.subject}
                                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                                className="flex-1 bg-transparent py-2 text-sm font-bold text-white placeholder:text-zinc-700 outline-none tracking-widest border-b border-transparent focus:border-purple-500/30"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Priority Level</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['Normal', 'Urgent', 'Critical'].map(p => (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, priority: p })}
                                                    className={cn(
                                                        "py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                                        formData.priority === p
                                                            ? "bg-purple-500 text-black border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                                                            : "bg-white/5 text-zinc-500 border-white/5 hover:bg-white/10"
                                                    )}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Detailed Description</label>
                                        <textarea
                                            placeholder="DESCRIBE YOUR ISSUE OR SUGGESTION..."
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            className="w-full bg-zinc-900/50 rounded-xl p-4 text-sm font-bold text-white placeholder:text-zinc-700 outline-none transition-all tracking-widest border border-white/5 focus:border-purple-500/30 h-40 resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Quick Channels */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-2">Official Channels</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col gap-1 hover:bg-white/[0.08] transition-colors cursor-pointer group">
                                            <Mail size={16} className="text-zinc-600 group-hover:text-purple-500 transition-colors" />
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Email Team</span>
                                            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-tight">support@cluaiz.com</span>
                                        </div>
                                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col gap-1 hover:bg-white/[0.08] transition-colors cursor-pointer group">
                                            <Zap size={16} className="text-zinc-600 group-hover:text-purple-500 transition-colors" />
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Twitter X</span>
                                            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-tight">@CluaizAI</span>
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest text-center px-4 leading-relaxed">
                                        Direct response from our core intelligence team within 24 standard cycles.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ✅ TRANSMIT BUTTON */}
                        <AnimatePresence>
                            {formData.subject && formData.message && (
                                <motion.div
                                    initial={{ y: 100, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: 100, opacity: 0 }}
                                    className="p-8 bg-gradient-to-t from-neutral-950 via-neutral-950 to-transparent absolute bottom-0 left-0 right-0 z-20"
                                >
                                    <motion.button
                                        whileHover={{ scale: 1.02, y: -4 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleSubmit}
                                        className="w-full h-16 bg-purple-500 text-black rounded-2xl shadow-[0_20px_40px_rgba(168,85,247,0.3)] flex items-center justify-center gap-3 group relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                        <span className="text-sm font-black uppercase tracking-[0.3em]">Send to Cluaiz Team</span>
                                        <Send size={20} strokeWidth={3} />
                                    </motion.button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
