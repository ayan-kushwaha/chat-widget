"use client";

import React from "react";
import { AgentCard } from "./AgentCard";
import { agents } from "@/lib/agents-data";

export function TalentGrid() {
    return (
        <div className="grid grid-cols-1 min-[1100px]:grid-cols-2 gap-6 md:gap-8 max-w-6xl mx-auto py-8 md:py-12 px-6 md:px-12 relative z-10 w-full">
            {agents.map((agent) => (
                <div key={agent.id} className="min-h-[400px] h-auto">
                    <AgentCard agent={agent} />
                </div>
            ))}
        </div>
    );
}
