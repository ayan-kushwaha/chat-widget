"use client";
import React from "react";
import Link from "next/link";
import { ShimmerButton } from "../ui/shimmer-button";
import HeroVideoDialog from "../ui/hero-video-dialog";
import { Play } from "lucide-react";

export function CTA() {
    return (
        <section className="py-24 bg-slate-950 relative overflow-hidden">
            <div className="absolute inset-0 bg-indigo-600/5 blur-[100px] rounded-full" />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
                    Start Free. <br />
                    <span className="text-indigo-400">Launch in 2 Minutes.</span>
                </h2>

                <div className="flex flex-wrap justify-center gap-8 mb-12 text-slate-400">
                    <span className="flex items-center">⚡ No credit card</span>
                    <span className="flex items-center">⚡ No coding</span>
                    <span className="flex items-center">⚡ No waiting</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link href="https://app.cluaiz.com/register" className="w-full sm:w-auto">
                        <ShimmerButton className="shadow-2xl w-full sm:w-auto px-8 py-4">
                            <span className="whitespace-pre-wrap text-center text-lg font-semibold leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10">
                                Launch Your AI Employee
                            </span>
                        </ShimmerButton>
                    </Link>

                    <HeroVideoDialog
                        className="dark:hidden block w-full sm:w-auto"
                        animationStyle="from-center"
                        videoSrc="https://www.youtube.com/embed/qh3NGpYRG3I?si=4rb-zSdDkVK9BVxx"
                        thumbnailSrc=""
                        thumbnailAlt=""
                    >
                        <button className="flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 transition-all group w-full sm:w-auto">
                            <Play className="w-4 h-4 fill-white group-hover:scale-110 transition-transform" />
                            <span className="font-medium">Watch Demo</span>
                        </button>
                    </HeroVideoDialog>
                    <HeroVideoDialog
                        className="hidden dark:block w-full sm:w-auto"
                        animationStyle="from-center"
                        videoSrc="https://www.youtube.com/embed/qh3NGpYRG3I?si=4rb-zSdDkVK9BVxx"
                        thumbnailSrc=""
                        thumbnailAlt=""
                    >
                        <button className="flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 transition-all group w-full sm:w-auto">
                            <Play className="w-4 h-4 fill-white group-hover:scale-110 transition-transform" />
                            <span className="font-medium">Watch Demo</span>
                        </button>
                    </HeroVideoDialog>
                </div>
            </div>
        </section>
    );
}
