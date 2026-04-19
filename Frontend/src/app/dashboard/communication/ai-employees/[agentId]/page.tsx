"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, ArrowLeft, Bot, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// We can import the same MOCK data or fetch it
import { MOCK_AGENTS } from '@/components/chatbot/ai-employees-workforce/marketplace/data';

export default function AgentRitualPage() {
    const params = useParams();
    const router = useRouter();
    const agentId = params.agentId as string;

    // Find agent (or use placeholder if not found)
    const agent = MOCK_AGENTS.find(a => a.id === agentId) || MOCK_AGENTS[0];

    return (
        <div className="w-full h-full bg-black text-white p-8 relative overflow-y-auto no-scrollbar">
            {/* Header / Back */}
            <div className="max-w-5xl mx-auto mb-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest mb-6"
                >
                    <ArrowLeft size={14} /> Back to Marketplace
                </button>

                <div className="flex items-start gap-6">
                    <div className={cn("w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-black border border-white/10 shadow-2xl", `bg-${agent.color}-500/20 text-${agent.color}-500`)}>
                        {agent.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tight mb-2">{agent.name}</h1>
                        <div className="flex items-center gap-3">
                            <span className={cn("px-3 py-1 rounded-full text-xs font-bold border bg-opacity-10", `border-${agent.color}-500 text-${agent.color}-500 bg-${agent.color}-500`)}>
                                {agent.role}
                            </span>
                            <span className="text-zinc-500 text-sm font-medium">
                                Ready for deployment
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Placeholder (Ritual Steps will go here) */}
            <div className="max-w-5xl mx-auto bg-zinc-900/40 border border-white/5 rounded-3xl p-12 text-center">
                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-400">
                    <Bot size={32} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Hiring Ritual</h2>
                <p className="text-zinc-400 max-w-md mx-auto">
                    Configure your AI employee's knowledge base, permissions, and initial tasks here.
                </p>
            </div>
        </div>
    );
}
