"use client";

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Package, ShoppingBag, ArrowRight } from 'lucide-react';
import Image from 'next/image';

interface Product {
    id: string;
    title: string;
    price: number;
    image: string;
    description: string;
    category: string;
}

// 📦 Mock Data
const MOCK_PRODUCTS: Product[] = [
    {
        id: 'p1',
        title: 'Nike Air Max 90',
        price: 11999,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
        description: 'Iconic comfort and style with Air cushioning.',
        category: 'Shoes'
    },
    {
        id: 'p2',
        title: 'Apple Watch Series 9',
        price: 41900,
        image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&q=80',
        description: 'Smarter. Brighter. Mightier.',
        category: 'Electronics'
    },
    {
        id: 'p3',
        title: 'Sony WH-1000XM5',
        price: 26990,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
        description: 'Industry-leading noise cancelling headphones.',
        category: 'Audio'
    },
    {
        id: 'p4',
        title: 'Premium Leather Bag',
        price: 8499,
        image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&q=80',
        description: 'Handcrafted genuine leather office bag.',
        category: 'Accessories'
    },
    {
        id: 'p5',
        title: 'MacBook Pro M3',
        price: 169900,
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?w=500&q=80',
        description: 'Mind-blowing. Head-turning.',
        category: 'Electronics'
    },
];

interface ProductPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (product: Product) => void;
}

export const ProductPicker: React.FC<ProductPickerProps> = ({ isOpen, onClose, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const filteredProducts = MOCK_PRODUCTS.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isMounted || typeof document === 'undefined') return null;

    return ReactDOM.createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000]"
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#1a1f2e] border-l border-white/10 shadow-2xl z-[10001] flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#1a1f2e]">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <ShoppingBag size={20} className="text-purple-400" />
                                    Product Catalog
                                </h3>
                                <p className="text-xs text-zinc-500">Select a product to share</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="p-4 border-b border-white/5">
                            <div className="relative">
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-zinc-800/50 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-medium"
                                />
                            </div>
                        </div>

                        {/* Product List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {filteredProducts.map((product) => (
                                <motion.div
                                    key={product.id}
                                    layoutId={product.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => onSelect(product)}
                                    className="group flex gap-4 p-3 bg-zinc-800/30 border border-white/5 hover:bg-zinc-800/80 hover:border-purple-500/30 rounded-2xl cursor-pointer transition-all"
                                >
                                    {/* Image */}
                                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-zinc-900 flex-shrink-0 relative">
                                        <img
                                            src={product.image}
                                            alt={product.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="text-white font-semibold truncate pr-2 group-hover:text-purple-400 transition-colors">
                                                    {product.title}
                                                </h4>
                                                <p className="text-xs text-zinc-500 mb-1">{product.category}</p>
                                            </div>
                                            <span className="text-emerald-400 font-bold whitespace-nowrap">
                                                ₹{product.price.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between mt-auto">
                                            <p className="text-xs text-zinc-500 truncate max-w-[150px]">
                                                {product.description}
                                            </p>
                                            <button className="p-1.5 rounded-full bg-purple-500/10 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ArrowRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {filteredProducts.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                                    <Package size={48} className="mb-4 opacity-20" />
                                    <p>No products found</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};
