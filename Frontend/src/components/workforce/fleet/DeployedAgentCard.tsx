'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    MessageSquare,
    Pause,
    Play,
    TrendingUp,
    Zap,
    Command,
    ShieldCheck,
    ArrowUpRight,
    Terminal,
    Beaker,
    Star
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BorderBeam } from '@/components/ui/border-beam';
import { cn } from '@/lib/utils';
import { CardContainer, CardBody, CardItem } from '@/components/ui/3d-card';

interface DeployedAgentCardProps {
    agent: {
        id: string;
        name: string;
        role: string;
        status: string;
        synchronization: number;
        uptime: string;
        last_task: string;
        avatar: string;
        color: string;
        earnings?: string;
        skills: { name: string; description: string }[];
        department: string;
    };
    variant?: 'deployed' | 'market';
}

export function DeployedAgentCard({ agent, variant = 'deployed' }: DeployedAgentCardProps) {
    const router = useRouter();
    const isMarket = variant === 'market';
    // Generate dummy earnings if not present
    const earnings = agent.earnings || `$${(Math.random() * 5000 + 1000).toFixed(2)}`;

    return (
        <CardContainer className="inter-var w-full h-full max-w-full">
            <CardBody className="bg-gray-900/10 relative group/card hover:shadow-2xl hover:shadow-emerald-500/[0.1] border-white/[0.1] w-full h-auto rounded-[20px] p-8 border transition-all">

                {/* 🛡️ Header Identity Area */}
                <div className="flex justify-between items-start mb-8">
                    <CardItem translateZ="50" className="relative">
                        <div className="w-24 h-24 rounded-[20px] overflow-hidden bg-gray-950 border-2 border-gray-800 p-1 group-hover/card:border-emerald-500/50 transition-colors shadow-2xl">
                            <img
                                src={agent.avatar}
                                alt={agent.name}
                                className="w-full h-full object-cover rounded-[16px]"
                            />
                        </div>
                        <div className={cn(
                            "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-black",
                            agent.status === 'active' ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : 'bg-amber-500'
                        )} />
                    </CardItem>

                    <CardItem translateZ="40" className="flex flex-col items-end gap-2">
                        <Badge variant="outline" className="bg-gray-950/50 border-gray-800 text-gray-500 font-mono text-[9px] py-1 px-3 rounded-lg italic">
                            {agent.id}
                        </Badge>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/5 border border-emerald-500/20 rounded-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">Live Protocol</span>
                        </div>
                    </CardItem>
                </div>

                {/* 🏷️ Name & Role */}
                <div className="space-y-1 mb-8">
                    <CardItem translateZ="60" className="text-4xl font-black italic uppercase tracking-tighter bg-gradient-to-br from-white to-gray-500 bg-clip-text text-transparent pr-4 whitespace-nowrap">
                        {agent.name}
                    </CardItem>
                    <CardItem translateZ="50" className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.3em] flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-gray-600" />
                        {agent.role}
                    </CardItem>
                </div>

                {/* 📊 Intelligence Metrics OR Skills */}
                {isMarket ? (
                    <div className="flex flex-wrap gap-2 mb-8 min-h-[104px]">
                        {agent.skills.map((skill, idx) => (
                            <CardItem
                                key={idx}
                                translateZ="40"
                                className="px-3 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-2"
                                title={skill.description}
                            >
                                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-black text-emerald-400/80 uppercase tracking-widest leading-none">
                                    {skill.name.includes(':') ? skill.name.split(':')[0] : skill.name}
                                </span>
                            </CardItem>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <CardItem translateZ="40" className="bg-black/40 border border-gray-800/50 p-4 rounded-[20px] space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Neural Balance</span>
                                <Zap className="w-3 h-3 text-emerald-500" />
                            </div>
                            <div className="flex items-end justify-between">
                                <span className="text-xl font-black italic text-white">{agent.synchronization}%</span>
                                <div className="w-12 h-1 bg-gray-800 rounded-full overflow-hidden mb-1.5">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${agent.synchronization}%` }}
                                        className="h-full bg-emerald-500"
                                    />
                                </div>
                            </div>
                        </CardItem>

                        <CardItem translateZ="40" className="bg-black/40 border border-gray-800/50 p-4 rounded-[20px] space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Revenue Impact</span>
                                <TrendingUp className="w-3 h-3 text-purple-500" />
                            </div>
                            <div className="flex items-end justify-between">
                                <span className="text-xl font-black italic text-purple-400">{earnings}</span>
                                <ArrowUpRight className="w-3.5 h-3.5 text-purple-500 mb-1" />
                            </div>
                        </CardItem>
                    </div>
                )}

                {/* 💬 Strategic Output Overlay */}
                <CardItem translateZ="30" className="mb-10 p-4 bg-gray-950/50 border border-gray-800/50 rounded-[20px] italic text-[11px] text-gray-500 leading-relaxed relative overflow-hidden group/text">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/20" />
                    <span className="font-bold text-gray-400 mr-2 uppercase text-[9px]">Last Directive:</span>
                    "{agent.last_task}"
                </CardItem>

                {/* 🛠️ Action Bay (Premium Controls) */}
                <div className="flex items-center gap-3">
                    <CardItem translateZ="70" className="flex-1">
                        {isMarket ? (
                            <Button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    router.push(`/dashboard/workforce/onboarding/${agent.id}`);
                                }}
                                className="w-full bg-emerald-500 text-black hover:bg-emerald-400 transition-all duration-500 h-14 rounded-[16px] font-black text-xs uppercase tracking-widest flex gap-3 shadow-xl"
                            >
                                <Star className="w-4 h-4 fill-current" />
                                Hire Node
                            </Button>
                        ) : (
                            <Button className="w-full bg-white text-black hover:bg-emerald-500 hover:text-white transition-all duration-500 h-14 rounded-[16px] font-black text-xs uppercase tracking-widest flex gap-3 shadow-xl">
                                <Terminal className="w-4 h-4" />
                                Send Command
                            </Button>
                        )}
                    </CardItem>

                    <CardItem translateZ="60" className="flex gap-2">
                        <Button variant="outline" size="icon" className="h-14 w-14 rounded-[16px] border-gray-800 bg-gray-950/50 text-gray-400 hover:text-emerald-400 hover:border-emerald-500/30">
                            {isMarket ? <Beaker className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                        </Button>
                        <Button variant="outline" size="icon" className="h-14 w-14 rounded-[16px] border-gray-800 bg-gray-950/50 text-gray-400 hover:text-amber-500 hover:border-amber-500/30">
                            {isMarket ? <Play className="w-5 h-5" /> : (agent.status === 'active' ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />)}
                        </Button>
                    </CardItem>
                </div>

                <BorderBeam size={250} duration={15} colorFrom={agent.color || "#10b981"} />
            </CardBody>
        </CardContainer>
    );
}
