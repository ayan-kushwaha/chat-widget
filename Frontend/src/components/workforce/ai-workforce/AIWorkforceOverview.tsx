import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Brain, Server, Shield, Sparkles, TrendingUp, Users } from 'lucide-react';

interface AIWorkforceOverviewProps {
    hiredCount: number;
    totalAvailable: number;
}

export function AIWorkforceOverview({ hiredCount, totalAvailable }: AIWorkforceOverviewProps) {
    const stats = [
        { label: 'Active Neural Agents', value: hiredCount, icon: Users, color: 'emerald' },
        { label: 'Available in Marketplace', value: totalAvailable - hiredCount, icon: Sparkles, color: 'blue' },
        { label: 'Total Operations Handled', value: '1.2M+', icon: Activity, color: 'purple' },
        { label: 'Avg. Response Time', value: '< 0.4s', icon: TrendingUp, color: 'amber' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 md:p-12 w-full max-w-5xl mx-auto space-y-10"
        >
            {/* Header */}
            <div>
                <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-neutral-900 dark:text-white mb-2">
                    Fleet Command Center
                </h2>
                <p className="text-neutral-500 dark:text-gray-400 font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-500" />
                    Overall AI Workforce Performance
                </p>
            </div>

            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white dark:bg-gray-900/40 border border-neutral-200 dark:border-gray-800/50 p-6 rounded-[24px] relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 p-4 opacity-5 bg-gradient-to-bl from-${stat.color}-500 to-transparent w-full h-full pointer-events-none group-hover:opacity-10 transition-opacity`} />
                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div className={`w-10 h-10 rounded-xl bg-${stat.color}-50 dark:bg-${stat.color}-500/10 flex items-center justify-center text-${stat.color}-600 dark:text-${stat.color}-400`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <p className="text-3xl font-black italic text-neutral-900 dark:text-white">{stat.value}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-gray-500 mt-1">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Performance Graph Placeholder */}
            <div className="bg-white dark:bg-gray-900/40 border border-neutral-200 dark:border-gray-800/50 p-6 md:p-8 rounded-[24px] relative overflow-hidden">
                <div className="flex items-center gap-3 mb-6">
                    <Brain className="w-5 h-5 text-neutral-400 dark:text-gray-500" />
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500 dark:text-gray-400">Neural Network Load Distribution</h3>
                </div>
                
                <div className="h-64 w-full flex items-end justify-between gap-2 opacity-50 px-2 mt-8">
                    {[40, 60, 45, 80, 50, 90, 70, 45, 60, 100, 85, 65].map((height, i) => (
                        <div key={i} className="w-full bg-neutral-200 dark:bg-gray-800 rounded-t-sm relative group overflow-hidden" style={{ height: `${height}%` }}>
                            <div className="absolute bottom-0 left-0 w-full bg-emerald-500/50 dark:bg-emerald-500/30 group-hover:bg-emerald-400 dark:group-hover:bg-emerald-500 transition-colors h-full origin-bottom transform scale-y-0 animate-[grow_1s_ease-out_forwards]" style={{ animationDelay: `${i * 0.05}s` }} />
                        </div>
                    ))}
                </div>
                
                <style dangerouslySetInnerHTML={{__html: `
                    @keyframes grow {
                        from { transform: scaleY(0); }
                        to { transform: scaleY(1); }
                    }
                `}} />
            </div>

            {/* Security/Access Log Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-white dark:bg-gray-900/40 border border-neutral-200 dark:border-gray-800/50 p-6 md:p-8 rounded-[24px]">
                    <div className="flex items-center gap-3 mb-6">
                        <Shield className="w-5 h-5 text-neutral-400 dark:text-gray-500" />
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500 dark:text-gray-400">System Security Log</h3>
                    </div>
                    <div className="space-y-4">
                        {[
                            { msg: "Sales Agent Rocky successfully completed 43 interactions", time: "2m ago", status: "success" },
                            { msg: "Support Lead Sarah escalated 2 priority tickets", time: "15m ago", status: "warning" },
                            { msg: "Marketing Head Zara refreshed content vectors", time: "1h ago", status: "info" }
                        ].map((log, i) => (
                            <div key={i} className="flex items-start gap-4 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-gray-800/50 transition-colors">
                                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${log.status === 'success' ? 'bg-emerald-500' : log.status === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-neutral-700 dark:text-gray-300 truncate">{log.msg}</p>
                                    <p className="text-[10px] uppercase font-bold text-neutral-400 dark:text-gray-500 mt-1">{log.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>
            </div>
        </motion.div>
    );
}
