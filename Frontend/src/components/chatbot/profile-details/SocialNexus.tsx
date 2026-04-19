import React from 'react';
import { Users, Link2, ExternalLink } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const SocialNexus: React.FC = () => {
    // Mock Data
    const mutuals = [
        { name: "Ravi Sir", role: "Manager", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ravi" },
        { name: "Anjali", role: "Designer", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Anjali" }
    ];

    const commonGroups = [
        { name: "Product Team", members: 12 },
        { name: "Weekend Trek", members: 5 }
    ];

    return (
        <div className="flex flex-col gap-6 w-full">
            <SectionHeader title="Social Graph" icon={Users} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* 1. MUTUAL CONNECTIONS */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">Mutual Connections</h3>
                    <div className="flex flex-col gap-3">
                        {mutuals.map((person, i) => (
                            <div key={i} className="flex items-center gap-3 p-2 hover:bg-zinc-50 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer group">
                                <Avatar className="w-8 h-8 border border-zinc-200 dark:border-zinc-700">
                                    <AvatarImage src={person.img} />
                                    <AvatarFallback>{person.name[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-indigo-500 transition-colors">{person.name}</div>
                                    <div className="text-[9px] text-zinc-500 font-medium">{person.role}</div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ExternalLink size={12} className="text-zinc-400" />
                                </Button>
                            </div>
                        ))}
                        <Button variant="link" size="sm" className="w-full text-[10px] text-zinc-400 hover:text-indigo-500 h-6">
                            + 3 others
                        </Button>
                    </div>
                </div>

                {/* 2. COMMON GROUPS */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">Common Groups</h3>
                    <div className="flex flex-col gap-3">
                        {commonGroups.map((group, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500 border border-zinc-200 dark:border-zinc-700">
                                    {group.name[0]}
                                </div>
                                <div className="flex-1">
                                    <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{group.name}</div>
                                    <div className="text-[9px] text-zinc-500">{group.members} Members</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

const SectionHeader = ({ title, icon: Icon }: any) => (
    <div className="flex items-center gap-3 opacity-80 mt-4 mb-2">
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <Icon size={12} /> {title}
        </span>
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
    </div>
);
