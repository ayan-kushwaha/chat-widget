import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Package, Lock, ArrowUpRight } from 'lucide-react';

export const BusinessAddons: React.FC = () => {
    const ltv = "₹45,200";

    return (
        <div className="relative pt-6">
            <div className="absolute top-0 left-0 w-full flex items-center gap-4">
                <div className="h-px bg-gradient-to-r from-transparent via-zinc-300 dark:via-zinc-700 to-transparent flex-1" />
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] bg-slate-50/50 dark:bg-[#0a0a0a] px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800">Business Context</span>
                <div className="h-px bg-gradient-to-r from-transparent via-zinc-300 dark:via-zinc-700 to-transparent flex-1" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                {/* LTV Badge */}
                <div className="bg-zinc-900 dark:bg-black text-white rounded-3xl p-5 relative overflow-hidden group shadow-xl">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl group-hover:bg-emerald-500/30 transition-all" />
                    <TrendingUp className="text-emerald-500 mb-3" size={24} />
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Lifetime Value</div>
                    <div className="text-2xl font-black text-emerald-400">{ltv}</div>
                </div>

                {/* Active Orders */}
                <div className="bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-3xl p-5 relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                        <Package className="text-orange-500" size={24} />
                        <Badge className="bg-orange-500/10 text-orange-600 border-orange-200 hover:bg-orange-500/20">1 Active</Badge>
                    </div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Recent Order</div>
                    <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200">#ORD-9921</div>
                </div>

                {/* Vault */}
                <div className="bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-3xl p-5 relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <Lock className="text-indigo-500 mb-3" size={24} />
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Secure Vault</div>
                    <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                        View Files <ArrowUpRight size={12} />
                    </div>
                </div>
            </div>
        </div>
    );
};
