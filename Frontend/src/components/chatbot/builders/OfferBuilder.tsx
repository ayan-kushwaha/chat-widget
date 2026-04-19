"use client";

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag, Calendar, Percent, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface OfferBuilderProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (data: any) => void;
}

export const OfferBuilder: React.FC<OfferBuilderProps> = ({ isOpen, onClose, onSend }) => {
    const [title, setTitle] = useState('');
    const [code, setCode] = useState('');
    const [discount, setDiscount] = useState('');
    const [expiry, setExpiry] = useState('');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleSend = () => {
        if (!title || !code || !discount) {
            toast.error('Please fill all required fields');
            return;
        }

        onSend({
            title,
            code: code.toUpperCase(),
            discount,
            expiry,
            type: 'offer'
        });
        onClose();
        // Reset
        setTitle('');
        setCode('');
        setDiscount('');
        setExpiry('');
    };

    if (!isMounted || typeof document === 'undefined') return null;

    return ReactDOM.createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000]"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-0 flex items-center justify-center z-[10001] p-4"
                    >
                        <div className="bg-[#1a1f2e] rounded-2xl border border-white/10 shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                                        <Tag size={20} className="text-purple-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Create Offer</h3>
                                        <p className="text-xs text-zinc-500">Send a discount coupon</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-5">
                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">Offer Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Min. 50% OFF on Shoes"
                                        className="w-full px-4 py-3 bg-zinc-800/50 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-bold"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Discount Code */}
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">Promo Code</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={code}
                                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                                placeholder="SUMMER25"
                                                className="w-full pl-4 pr-10 py-3 bg-zinc-800/50 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-mono uppercase"
                                                maxLength={10}
                                            />
                                            <Copy size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                        </div>
                                    </div>

                                    {/* Discount Value */}
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">Value</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={discount}
                                                onChange={(e) => setDiscount(e.target.value)}
                                                placeholder="25% OFF"
                                                className="w-full pl-4 pr-10 py-3 bg-zinc-800/50 border border-white/10 rounded-xl placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-bold text-center text-emerald-400"
                                            />
                                            <Percent size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                        </div>
                                    </div>
                                </div>

                                {/* Expiry */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">Expiry Date</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={expiry}
                                            onChange={(e) => setExpiry(e.target.value)}
                                            className="w-full pl-4 pr-4 py-3 bg-zinc-800/50 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all appearance-none"
                                        />
                                        <Calendar size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Preview (Small) */}
                            <div className="px-6 pb-2">
                                <p className="text-[10px] uppercase font-bold text-zinc-500 mb-2 tracking-widest">Preview</p>
                                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-xl flex items-center justify-between shadow-lg">
                                    <div>
                                        <p className="font-bold text-white text-sm">{title || "Offer Title"}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-white border border-white/20 border-dashed">
                                                {code || "CODE"}
                                            </div>
                                            <span className="text-[10px] text-white/80 font-medium">Expires {expiry || "Soon"}</span>
                                        </div>
                                    </div>
                                    <div className="bg-white text-purple-600 font-bold px-3 py-1.5 rounded-lg shadow-sm text-xs">
                                        {discount || "0%"}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-white/10">
                                <button
                                    onClick={handleSend}
                                    className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Tag size={18} />
                                    Create Coupon
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};
