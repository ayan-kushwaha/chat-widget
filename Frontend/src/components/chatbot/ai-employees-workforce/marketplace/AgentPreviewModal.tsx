import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { MOCK_AGENTS } from './data';
import { useRouter } from 'next/navigation';

interface AgentPreviewModalProps {
    agent: typeof MOCK_AGENTS[0];
    onClose: () => void;
}

export const AgentPreviewModal: React.FC<AgentPreviewModalProps> = ({ agent, onClose }) => {
    const router = useRouter();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-2xl w-full flex gap-8 items-start shadow-2xl"
            >
                {/* Illustration/Avatar Side */}
                <div className={cn("w-1/3 aspect-[3/4] rounded-2xl flex items-center justify-center text-6xl font-black text-white/20 border border-white/5", `bg-${agent.color}-500/10`)}>
                    {agent.name.slice(0, 1)}
                </div>

                {/* Details Side */}
                <div className="flex-1 flex flex-col gap-6">
                    <div>
                        <h2 className="text-3xl font-black text-white">{agent.name}</h2>
                        <p className="text-zinc-500 font-medium text-lg">{agent.role}</p>
                    </div>

                    <div className="space-y-4">
                        <p className="text-zinc-400 leading-relaxed">
                            I am an advanced AI agent specialized in <span className="text-white font-bold">{agent.skills[0]}</span>.
                            I can help you {agent.description.toLowerCase()}
                            My processing speed is unmatched and I'm available 24/7.
                        </p>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                <div className="text-[10px] uppercase text-zinc-500 font-bold">Experience</div>
                                <div className="text-sm font-bold text-white">{agent.stats.exp}</div>
                            </div>
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                <div className="text-[10px] uppercase text-zinc-500 font-bold">Speed</div>
                                <div className="text-sm font-bold text-white">{agent.stats.speed}</div>
                            </div>
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                <div className="text-[10px] uppercase text-zinc-500 font-bold">Lang</div>
                                <div className="text-sm font-bold text-white">{agent.stats.lang}</div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto flex gap-4">
                        <button
                            onClick={() => router.push(`/dashboard/communication/ai-employees/${agent.id}`)}
                            className="flex-1 py-4 bg-white text-black rounded-xl font-black uppercase tracking-wider hover:bg-emerald-400 transition-colors"
                        >
                            Hire Now (Free)
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-4 bg-zinc-800 text-white rounded-xl font-bold hover:bg-zinc-700 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
