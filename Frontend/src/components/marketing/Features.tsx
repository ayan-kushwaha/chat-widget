"use client";
import React from "react";
import { BentoGrid, BentoGridItem } from "../ui/bento-grid";
import { MARKETING_CONTENT } from "@/lib/marketing-content";
import { WavyBackground } from "@/components/ui/wavy-background";
import { cn } from "@/lib/utils";

export function Features() {
    return (
        <section id="features" className="relative overflow-hidden">
            <WavyBackground className="max-w-4xl mx-auto pb-40">
                <div className="text-center mb-16 relative z-10 px-4">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                        Powerful Features Built In
                    </h2>
                    <p className="text-slate-300 max-w-2xl mx-auto text-lg">
                        Everything you need to automate your customer interactions.
                    </p>
                </div>

                <BentoGrid className="max-w-4xl mx-auto relative z-10 px-4">
                    {MARKETING_CONTENT.features.map((item, i) => (
                        <BentoGridItem
                            key={i}
                            title={item.title}
                            description={item.description}
                            icon={<item.icon className="h-4 w-4 text-neutral-500" />}
                            className={i === 3 || i === 6 ? "md:col-span-2" : ""}
                        />
                    ))}
                </BentoGrid>
            </WavyBackground>
        </section>
    );
}
