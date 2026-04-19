"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Star, ArrowRight } from 'lucide-react';
import { useTheme } from 'next-themes';

interface ProductCardProps {
    id: string;
    title: string;
    description: string;
    price: number;
    image: string;
    category?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
    id,
    title,
    description,
    price,
    image,
    category = 'Product'
}) => {

    return (
        <div className={cn(
            "border rounded-2xl overflow-hidden max-w-[280px] shadow-lg transition-all duration-500",
            "bg-white dark:bg-[#1e293b] border-black/5 dark:border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:shadow-none"
        )}>
            {/* Image */}
            <div className="relative h-40 bg-zinc-900 group">
                <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">{category}</span>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <h3 className={cn(
                        "font-bold leading-tight flex-1 mr-2 transition-colors",
                        "text-[#1d1d1f] dark:text-white"
                    )}>{title}</h3>
                    <div className="flex items-center gap-1 text-amber-400">
                        <Star size={12} fill="currentColor" />
                        <span className="text-xs font-bold">4.8</span>
                    </div>
                </div>

                <p className={cn(
                    "text-xs line-clamp-2 mb-4 h-8 transition-colors",
                    "text-zinc-500 dark:text-zinc-400"
                )}>
                    {description}
                </p>

                <div className={cn(
                    "flex items-center justify-between pt-3 border-t transition-colors",
                    "border-black/5 dark:border-white/5"
                )}>
                    <div>
                        <p className="text-xs text-zinc-500 font-medium">Price</p>
                        <p className="font-black text-emerald-500">₹{price.toLocaleString()}</p>
                    </div>

                    <button className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
                        <ShoppingBag size={14} />
                        Buy Now
                    </button>
                </div>
            </div>
        </div>
    );
};

// Add cn utility if not present or use string template
const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
