"use client";

import { useEffect, useState } from 'react';
import { legalAPI, LegalPage } from '@/api/legal.api';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Search, FileText, ArrowRight, Loader2, Shield, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LegalHub() {
    const [pages, setPages] = useState<LegalPage[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchPages = async () => {
            try {
                const res = await legalAPI.getAll();
                if (res.success) {
                    setPages(res.pages);
                }
            } catch (error) {
                console.error("Failed to fetch legal pages", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPages();
    }, []);

    const filteredPages = pages.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-black text-white pt-24 pb-12 px-4 md:px-8 relative overflow-hidden">

            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-indigo-900/20 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-900/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10 space-y-12">

                {/* Header */}
                <div className="text-center space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium"
                    >
                        <Shield className="w-4 h-4" />
                        <span>Trust & Compliance</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-500"
                    >
                        Legal Center
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-slate-400 max-w-2xl mx-auto text-lg"
                    >
                        Transparent policies and terms to ensure a safe and reliable experience for everyone using Cluaiz.
                    </motion.p>

                    {/* Search */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="max-w-md mx-auto relative"
                    >
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search documents..."
                            className="bg-slate-900/50 border-slate-800 pl-10 h-12 rounded-full focus:ring-indigo-500/50 transition-all hover:bg-slate-900"
                        />
                    </motion.div>
                </div>

                {/* Content Grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    </div>
                ) : filteredPages.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPages.map((page, index) => (
                            <motion.div
                                key={page._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Link href={`/legal/${page.slug}`} className="block h-full group">
                                    <div className="h-full p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/50 transition-all duration-300 relative overflow-hidden">

                                        <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <FileText className="w-6 h-6 text-indigo-400" />
                                        </div>

                                        <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-indigo-300 transition-colors">
                                            {page.title}
                                        </h3>

                                        <p className="text-slate-400 text-sm mb-6 line-clamp-2">
                                            {page.seo?.description || "Click to read the full document details and policies."}
                                        </p>

                                        <div className="flex items-center justify-between text-sm mt-auto">
                                            <span className="text-slate-500 bg-slate-900 px-2 py-1 rounded-md border border-slate-800 capitalize">
                                                {page.category}
                                            </span>
                                            <span className="flex items-center text-indigo-400 font-medium group-hover:translate-x-1 transition-transform">
                                                Read <ArrowRight className="w-4 h-4 ml-1" />
                                            </span>
                                        </div>

                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 text-slate-500">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No documents found matching "{search}"</p>
                    </div>
                )}

            </div>
        </div>
    );
}
