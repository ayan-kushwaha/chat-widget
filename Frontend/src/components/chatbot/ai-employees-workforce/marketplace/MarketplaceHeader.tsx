import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const MarketplaceHeader = () => {
    const router = useRouter();

    return (
        <div className="max-w-7xl mx-auto mb-12">
            <button
                onClick={() => router.back()}
                className="mb-6 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
            >
                <ArrowLeft size={16} /> Back
            </button>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-2"
            >
                <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                    <Sparkles className="text-amber-500" fill="currentColor" />
                    DIGITAL WORKFORCE
                </h1>
                <p className="text-zinc-400 font-medium max-w-2xl text-lg">
                    Hire specialized AI employees to automate your business operations.
                    Verified, secure, and available 24/7.
                </p>
            </motion.div>
        </div>
    );
};
