import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AgentProfile {
    id: string;
    name: string;
    role: string;
    avatar: string;
    description: string;
    skills: { name: string; description: string }[];
    status: 'available' | 'hired';
    premium: boolean;
    price: string;
}

interface EmployeeCardProps {
    agent: AgentProfile;
    onHire: (id: string) => void;
    onChat: (id: string) => void;
    layout?: 'grid' | 'list';
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({
    agent,
    onHire,
    onChat,
    layout = 'list'
}) => {
    // 🎨 Using Project's Standard Colors (Zinc + Emerald)
    const containerClasses = cn(
        "group relative border transition-all duration-300 overflow-hidden",
        layout === 'list' ?
            "p-3 rounded-2xl flex items-start gap-3 hover:border-emerald-500/30 hover:bg-neutral-50 dark:hover:bg-zinc-900/50 bg-white dark:bg-black border-neutral-200 dark:border-white/10" :
            "p-5 rounded-3xl flex flex-col gap-3 bg-white dark:bg-zinc-900/30 border-neutral-200 dark:border-white/5 hover:border-emerald-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-900"
    );

    return (
        <motion.div
            layoutId={`agent-${agent.id}`}
            className={containerClasses}
        >
            {/* ✨ Premium Badge */}
            {agent.premium && agent.status !== 'hired' && (
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full z-10">
                    <Sparkles size={8} className="text-amber-500" />
                    <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">PRO</span>
                </div>
            )}

            {/* ✅ Hired Badge */}
            {agent.status === 'hired' && (
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-neutral-100 dark:bg-emerald-500/10 border border-neutral-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-full z-10">
                    <Check size={10} className="text-neutral-500 dark:text-emerald-500" />
                    <span className="text-[9px] font-black text-neutral-500 dark:text-emerald-500 uppercase tracking-widest">Hired</span>
                </div>
            )}

            {/* 🖼️ Avatar Section */}
            <div className="relative shrink-0">
                <Avatar className={cn(
                    "border border-black/5 dark:border-white/10 shadow-sm",
                    layout === 'list' ? "w-12 h-12" : "w-20 h-20 mx-auto"
                )}>
                    <AvatarImage src={agent.avatar} className="object-cover" />
                    <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-bold">{agent.name[0]}</AvatarFallback>
                </Avatar>
                <div className={cn(
                    "absolute border-2 border-white dark:border-black flex items-center justify-center rounded-full",
                    agent.status === 'available' ? 'bg-emerald-500' : 'bg-zinc-400',
                    layout === 'list' ? "-bottom-0.5 -right-0.5 w-3.5 h-3.5" : "bottom-1 right-1 w-5 h-5"
                )}>
                    {agent.status === 'available' && <div className="w-1 h-1 bg-white rounded-full animate-pulse" />}
                </div>
            </div>

            {/* 📝 Info Section */}
            <div className={cn("flex-1 min-w-0", layout === 'grid' && "text-center")}>
                <h3 className="font-bold text-zinc-900 dark:text-white truncate text-sm">
                    {agent.name}
                </h3>
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wide mb-1">
                    {agent.role}
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed h-[2.8em]">
                    {agent.description}
                </p>

                {/* 🏷️ Skills Tags */}
                <div className={cn("flex flex-wrap gap-1 mt-2", layout === 'grid' && "justify-center")}>
                    {agent.skills.slice(0, layout === 'list' ? 2 : 3).map(skill => (
                        <span key={skill.name} className="px-1.5 py-0.5 bg-zinc-100 dark:bg-white/5 rounded-md text-[9px] font-medium text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/5">
                            {skill.name}
                        </span>
                    ))}
                    {agent.skills.length > (layout === 'list' ? 2 : 3) && (
                        <span className="px-1.5 py-0.5 bg-zinc-100 dark:bg-white/5 rounded-md text-[9px] font-medium text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/5">
                            +{agent.skills.length - (layout === 'list' ? 2 : 3)}
                        </span>
                    )}
                </div>
            </div>

            {/* 🔘 Actions */}
            <div className={cn(
                "pt-3 border-t border-zinc-100 dark:border-white/5 flex items-center w-full",
                layout === 'list' ? "mt-auto justify-between" : "mt-2 justify-between"
            )}>
                {agent.status === 'available' ? (
                    <>
                        <div className="text-[10px] font-bold text-zinc-400">
                            From <span className="text-zinc-900 dark:text-white font-black">{agent.price}</span>
                        </div>
                        <Button
                            size="sm"
                            className="h-7 px-3 text-[10px] font-black uppercase tracking-wide bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-all hover:scale-105 rounded-lg"
                            onClick={() => onHire(agent.id)}
                        >
                            Hire <ArrowRight size={10} className="ml-1" />
                        </Button>
                    </>
                ) : (
                    <Button
                        size="sm"
                        variant="ghost"
                        className="w-full h-7 text-[10px] font-bold uppercase tracking-wide text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/10"
                        onClick={() => onChat(agent.id)}
                    >
                        Active • Chat Now
                    </Button>
                )}
            </div>
        </motion.div>
    );
};
