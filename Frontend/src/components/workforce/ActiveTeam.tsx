"use client";

import React, { useEffect, useState } from "react";
import { workforceAPI } from "@/lib/api";
import { Loader2, UserCheck, Briefcase, Zap, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";

export function ActiveTeam() {
    const [team, setTeam] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTeam = async () => {
            try {
                const res = await workforceAPI.getMyTeam();
                if (res.data.success) {
                    setTeam(res.data.data);
                }
            } catch (err) {
                console.error("Failed to fetch active team:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTeam();
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 w-full">
                <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                <p className="text-zinc-500 font-mono uppercase tracking-widest text-xs">Syncing Personnel Registry...</p>
            </div>
        );
    }

    if (team.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center w-full max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 border border-white/5">
                    <Briefcase className="w-10 h-10 text-zinc-700" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">No Active Personnel</h3>
                <p className="text-zinc-500 text-sm mb-8">
                    You haven't deployed any AI employees yet. Visit the marketplace to find the perfect talent for your organization.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 min-[1100px]:grid-cols-2 gap-6 md:gap-8 max-w-6xl mx-auto py-8 md:py-12 px-6 md:px-12 relative z-10 w-full">
            {team.map((member) => (
                <CardContainer key={member._id} className="inter-var w-full h-full">
                    <CardBody className="bg-zinc-50 relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-full min-h-[400px] h-auto rounded-xl p-4 md:p-6 border flex flex-col justify-between transition-all duration-300">
                        {/* Status Header */}
                        <div className="flex justify-between items-start mb-2 relative z-20">
                            <CardItem translateZ="50" className="flex items-center gap-2">
                                <div className={cn(
                                    "w-2 h-2 rounded-full",
                                    member.status === 'active' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" :
                                        member.status === 'training' ? "bg-amber-500 animate-pulse" : "bg-red-500"
                                )} />
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                    {member.status === 'active' ? 'Operational' : member.status}
                                </span>
                            </CardItem>

                            <CardItem
                                translateZ="40"
                                className="px-3 py-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400"
                            >
                                Manage
                            </CardItem>
                        </div>

                        {/* Avatar */}
                        <CardItem translateZ="80" className="w-full mt-2 mb-4">
                            <div className="relative w-28 h-28 mx-auto rounded-full p-1 bg-gradient-to-tr from-emerald-500 to-blue-500 shadow-2xl">
                                <Image
                                    src={member.avatar_url || `/avatars/agent-default.png`}
                                    height="500"
                                    width="500"
                                    className="h-full w-full object-cover rounded-full border-4 border-black"
                                    alt={member.name}
                                />
                            </div>
                        </CardItem>

                        {/* Name & Role */}
                        <div className="flex flex-col items-center justify-center mb-4 w-full text-center">
                            <CardItem translateZ="60" className="text-2xl font-bold text-neutral-800 dark:text-white">
                                {member.name}
                            </CardItem>
                            <CardItem as="p" translateZ="50" className="text-neutral-400 dark:text-neutral-300 text-xs font-mono uppercase tracking-widest mt-1">
                                {member.role} <span className="text-zinc-600 px-2">|</span> {member.department}
                            </CardItem>
                        </div>

                        {/* Constitution Preview */}
                        <div className="space-y-3 mb-6 flex-1 border-t border-white/5 pt-4">
                            <CardItem translateZ="40" className="flex items-start gap-3">
                                <div className="mt-1 p-1 bg-emerald-500/10 rounded-md">
                                    <Zap size={12} className="text-emerald-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 text-left">Identity Core</p>
                                    <p className="text-xs text-zinc-300 line-clamp-2 text-left">{member.constitution?.identity_core?.role_definition || 'No definition set.'}</p>
                                </div>
                            </CardItem>

                            <CardItem translateZ="30" className="flex items-start gap-3">
                                <div className="mt-1 p-1 bg-blue-500/10 rounded-md">
                                    <ShieldCheck size={12} className="text-blue-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 text-left">Operational Protocols</p>
                                    <p className="text-xs text-zinc-300 line-clamp-1 text-left">
                                        {member.constitution?.protocols?.responsibilities?.length || 0} Responsibilities Active
                                    </p>
                                </div>
                            </CardItem>
                        </div>

                        {/* Footer Stats */}
                        <div className="flex justify-between items-center border-t border-white/5 pt-3">
                            <CardItem translateZ="20" className="text-[9px] font-mono text-zinc-600 uppercase">
                                Joined: {new Date(member.created_at).toLocaleDateString()}
                            </CardItem>
                            <CardItem translateZ="20" className="text-[9px] font-mono text-zinc-600 uppercase">
                                ID: {member.agent_id}
                            </CardItem>
                        </div>

                        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none rounded-b-xl" />
                    </CardBody>
                </CardContainer>
            ))}
        </div>
    );
}
