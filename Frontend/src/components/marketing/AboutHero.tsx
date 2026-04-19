"use client";
import React from "react";
import { motion } from "framer-motion";
import { RetroGrid } from "../ui/retro-grid";

export function AboutHero() {
    return (
        <div className="h-[40rem] w-full rounded-md flex md:items-center md:justify-center bg-slate-950 antialiased relative overflow-hidden">
            <RetroGrid className="opacity-10" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_10%,rgba(2,6,23,1)_100%)] pointer-events-none" />
            
            <div className="p-4 max-w-7xl mx-auto relative z-10 w-full pt-20 md:pt-0">
                <h1 className="text-4xl md:text-7xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 bg-opacity-50">
                    We are building the <br /> future of work.
                </h1>
                <p className="mt-4 font-normal text-base text-neutral-300 max-w-lg text-center mx-auto">
                    Cluaiz exists to democratize AI for every small business owner who can't afford a 24/7 support team. We believe in a future where humans do the creative work, and AI handles the rest.
                </p>
            </div>
        </div>
    );
}
