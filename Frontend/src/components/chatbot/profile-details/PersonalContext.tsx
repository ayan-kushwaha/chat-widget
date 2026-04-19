import React from 'react';
import { Calendar, Users, ArrowUpRight, ImageIcon, Music } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const PersonalContext: React.FC = () => {
    const memberSince = "2024";
    const commonGroups = [
        { name: "Gym Bros", members: 15 },
        { name: "Office Team", members: 42 }
    ];

    return (
        <div className="flex flex-col gap-6">
            {/* 1. PERSONAL CONTEXT ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Member Since / Basic Stats */}
                <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md border border-white/20 dark:border-white/5 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Calendar size={80} />
                    </div>
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1">Community Member</h3>
                    <div className="text-4xl font-black text-zinc-800 dark:text-white mb-2">Since {memberSince}</div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full w-[75%] bg-indigo-500 rounded-full" />
                    </div>
                    <p className="text-xs text-zinc-500 mt-2 font-medium">Top 5% Active User</p>
                </div>

                {/* Common Groups */}
                <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md border border-white/20 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <Users size={14} /> Common Groups
                        </h3>
                        <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500">2</Badge>
                    </div>
                    <div className="flex flex-col gap-3">
                        {commonGroups.map((group, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-white/50 dark:bg-black/20 rounded-2xl hover:bg-white dark:hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                                    {group.name[0]}
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">{group.name}</div>
                                    <div className="text-[10px] text-zinc-500">{group.members} Members</div>
                                </div>
                                <ArrowUpRight size={16} className="text-zinc-400" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 2. SHARED MEDIA (Visual Strip) */}
            <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md border border-white/20 dark:border-white/5 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <ImageIcon size={14} /> Shared Media
                    </h3>
                    <Button variant="link" size="sm" className="text-indigo-500 text-xs font-bold h-auto p-0">View All</Button>
                </div>
                <div className="grid grid-cols-4 gap-3">
                    {[1, 2, 3].map((_, i) => (
                        <div key={i} className="aspect-square rounded-2xl bg-zinc-200 dark:bg-zinc-800 relative overflow-hidden group cursor-pointer">
                            <img src={`https://picsum.photos/seed/${i + 10}/200`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="media" />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                        </div>
                    ))}
                    <div className="aspect-square rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex flex-col items-center justify-center text-zinc-400 cursor-pointer hover:border-indigo-500 hover:text-indigo-500 transition-colors">
                        <Music size={20} />
                        <span className="text-[10px] font-bold mt-1">+12</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
