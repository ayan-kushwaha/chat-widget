"use client";
import React from "react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { RetroGrid } from "@/components/ui/retro-grid";

interface ComingSoonProps {
    title: string;
    description: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
    return (
        <main className="min-h-screen bg-slate-950 antialiased selection:bg-indigo-500/30 flex flex-col">
            <Navbar />
            <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
                <RetroGrid className="opacity-20" />
                <div className="relative z-10 text-center px-4">
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                        {title}
                    </h1>
                    <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto">
                        {description}
                    </p>
                    <div className="mt-8">
                        <span className="inline-block px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium">
                            Coming Soon
                        </span>
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    );
}
