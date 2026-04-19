"use client";

import React from 'react';
import { Tag, Copy, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface OfferCardProps {
    title: string;
    code: string;
    discount: string;
    expiry?: string;
}

export const OfferCard: React.FC<OfferCardProps> = ({ title, code, discount, expiry }) => {
    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        toast.success('Coupon code copied!');
    };

    return (
        <div className="bg-zinc-950 border border-purple-500/20 rounded-2xl overflow-hidden max-w-[280px] shadow-2xl relative group text-white">
            {/* Discount Badge */}
            <div className="absolute top-0 right-0 bg-purple-600 text-white font-black text-xs px-3 py-1 rounded-bl-xl shadow-lg">
                {discount}
            </div>

            <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                        <Tag size={18} className="text-purple-400 font-bold" />
                    </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-1 leading-tight">{title}</h3>
                {expiry && (
                    <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-medium uppercase tracking-wider mb-4">
                        <Clock size={10} /> Expires: {expiry}
                    </div>
                )}

                {/* Dashed Code Area */}
                <div
                    onClick={handleCopy}
                    className="border-2 border-dashed border-purple-500/30 bg-purple-500/5 rounded-xl p-3 flex items-center justify-between group-hover:border-purple-500/50 transition-colors cursor-pointer active:scale-98"
                >
                    <span className="font-mono text-purple-300 font-bold tracking-widest">{code}</span>
                    <Copy size={14} className="text-purple-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
            </div>
        </div>
    );
};
