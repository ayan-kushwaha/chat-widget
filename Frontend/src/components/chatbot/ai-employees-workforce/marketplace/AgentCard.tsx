import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Eye, User, BrainCircuit } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { MOCK_AGENTS } from './data';

interface AgentCardProps {
    agent: typeof MOCK_AGENTS[0];
    index: number;
    onPreview: (agent: typeof MOCK_AGENTS[0]) => void;
}

export const AgentCard: React.FC<AgentCardProps> = ({ agent, index, onPreview }) => {
    const router = useRouter();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="group relative bg-zinc-900/40 border border-white/5 hover:border-amber-500/50 rounded-3xl p-4 flex flex-col gap-4 overflow-hidden transition-all hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-1"
        >
            {/* Avatar & Header */}
            <div className="relative flex items-start justify-between">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-950 p-1 flex items-center justify-center border border-white/10 shadow-inner">
                    <div className={cn("w-full h-full rounded-xl flex items-center justify-center text-xs font-black", `bg-${agent.color}-500/20 text-${agent.color}-500`)}>
                        {agent.name.slice(0, 2).toUpperCase()}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => onPreview(agent)}
                        className="p-2 rounded-full hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"
                    >
                        <Eye size={18} />
                    </button>
                </div>
            </div>

            {/* Info */}
            <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-white leading-tight">{agent.name}</h3>
                <div className="flex items-center gap-2">
                    <span className={cn("text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border bg-opacity-10",
                        agent.color === 'emerald' ? "border-emerald-500 text-emerald-500 bg-emerald-500" :
                            agent.color === 'blue' ? "border-blue-500 text-blue-500 bg-blue-500" :
                                "border-purple-500 text-purple-500 bg-purple-500"
                    )}>
                        {agent.role}
                    </span>
                </div>
                <p className="text-xs text-zinc-500 font-medium leading-relaxed mt-2 line-clamp-2">
                    {agent.description}
                </p>
            </div>

            {/* Skills */}
            <div className="flex flex-wrap gap-1.5 mt-auto">
                {agent.skills.slice(0, 3).map(skill => (
                    <span key={skill} className="text-[10px] items-center px-1.5 py-1 rounded-md bg-white/5 text-zinc-400 border border-white/5">
                        {skill}
                    </span>
                ))}
            </div>

            <div className="h-px w-full bg-white/5 my-1" />

            {/* Footer / Action (NO PRICE) */}
            <div className="flex items-center justify-between">
                <div>
                    <span className="text-[10px] text-emerald-500 uppercase tracking-wider font-bold flex items-center gap-1">
                        <CheckCircle2 size={12} /> Ready to Hire
                    </span>
                </div>
                <button
                    onClick={() => router.push(`/dashboard/communication/ai-employees/${agent.id}`)}
                    className="px-5 py-2.5 bg-white text-black text-xs font-black uppercase tracking-wider rounded-xl hover:bg-emerald-400 transition-colors shadow-lg hover:shadow-emerald-500/20"
                >
                    Hire Free
                </button>
            </div>
        </motion.div>
    );
};
