"use client";

import Image from "next/image";
import React from "react";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card"; // Aceternity UI
import { getAgentAvatar } from "@/lib/utils";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function AgentCard({ agent }: { agent: any }) {
    const avatarUrl = getAgentAvatar(agent.gender, agent.id);

    return (
        <CardContainer className="inter-var w-full h-full max-w-full">

            {/* 🟢 Clickable Overlay */}
            <Link href={`/dashboard/communication/employees/hire/${agent.id}`} className="absolute inset-0 z-10" />

            <CardBody className="bg-zinc-50 relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-full min-h-[400px] h-auto rounded-xl p-4 md:p-6 border flex flex-col justify-between transition-all duration-300">

                {/* Top Header: ID & Hire Me */}
                <div className="flex justify-between items-start mb-2 relative z-20">
                    <CardItem translateZ="50" className="text-xl font-bold text-neutral-700 dark:text-white">
                        {agent.id}
                    </CardItem>

                    <Link href={`/dashboard/communication/employees/hire/${agent.id}`}>
                        <CardItem
                            translateZ="40"
                            as="div"
                            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full text-xs font-bold uppercase tracking-widest text-white shadow-[0_0_10px_rgba(16,185,129,0.5)] hover:shadow-[0_0_20px_rgba(16,185,129,0.7)] transition-all cursor-pointer"
                        >
                            Hire Me
                        </CardItem>
                    </Link>
                </div>

                {/* The Avatar */}
                <CardItem translateZ="80" className="w-full mt-2 mb-4">
                    <div className="relative w-28 h-28 mx-auto rounded-full p-1 bg-gradient-to-tr from-blue-500 to-purple-500 shadow-2xl">
                        <Image
                            src={avatarUrl}
                            height="1000"
                            width="1000"
                            className="h-full w-full object-cover rounded-full border-4 border-black"
                            alt={agent.name}
                        />
                        <span className={cn("absolute bottom-2 right-2 w-4 h-4 border-4 border-black rounded-full",
                            agent.status === 'hired' ? "bg-purple-500" : "bg-green-500"
                        )}></span>
                    </div>
                </CardItem>

                {/* Agent Name & Role */}
                <div className="flex flex-col items-center justify-center mb-4 w-full">
                    <CardItem translateZ="60" className="text-2xl font-bold text-neutral-800 dark:text-white text-center w-full">
                        {agent.name}
                    </CardItem>
                    <CardItem as="p" translateZ="50" className="text-neutral-400 dark:text-neutral-300 text-sm font-mono uppercase tracking-wider mt-1 text-center w-full">
                        {agent.role} <span className="text-neutral-500 dark:text-neutral-200">| {agent.department}</span>
                    </CardItem>
                </div>

                {/* Skills List - Names Only */}
                <div className="flex flex-wrap  items-center justify-center gap-2 mb-4 w-full px-2">
                    {agent.skills.slice(0, 3).map((skill: any, idx: number) => {
                        const title = skill.name.includes(':') ? skill.name.split(':')[0] : skill.name;
                        return (
                            <CardItem
                                key={idx}
                                translateZ="30"
                                className="w-fit  px-1 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 flex items-center justify-center"
                                title={skill.description}
                            >
                                <span className="text-[10px]  text-center font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{title}</span>
                            </CardItem>
                        );
                    })}
                </div>

                {/* Description (Bio) */}
                <CardItem as="p" translateZ="40" className="text-sm leading-relaxed text-neutral-100 dark:text-neutral-200 font-light text-center mt-auto border-t border-white/5 pt-3">
                    {agent.description}
                </CardItem>

                {/* Card Effect - Bottom Gradient */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none rounded-b-xl" />
            </CardBody>
        </CardContainer>
    );
}
