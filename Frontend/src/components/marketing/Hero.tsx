"use client";
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { MARKETING_CONTENT } from "@/lib/marketing-content";

import { SparklesText } from "../ui/sparkles-text";
import HyperText from "../ui/hyper-text";
import AnimatedGradientText from "../ui/animated-gradient-text";
import { RetroGrid } from "../ui/retro-grid";
import HeroVideoDialog from "../ui/hero-video-dialog";
import { ShimmerButton } from "../ui/shimmer-button";

import { ShootingStars } from "@/components/ui/ShootingStarsBackground/shooting-stars";
import { StarsBackground } from "@/components/ui/ShootingStarsBackground/stars-background";
import { GridBackgroundDemo } from "../ui/GridandDotBackgrounds/GridBackgroundDemo";

import WordRotate from "@/components/ui/word-rotate";
import { Spotlight } from "../ui/spotlight";

export function Hero() {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden mx-auto py-20 md:py-32 bg-slate-950">
            {/* Background Elements */}
            <div className="absolute inset-0 z-0">
                <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="black" />
                <ShootingStars />
                <StarsBackground />
                <GridBackgroundDemo />
            </div>

            {/* Simple Retro Grid for Depth - Subtle */}
            <RetroGrid className="opacity-10 z-0" />

            {/* Radial Gradient for Focus */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_10%,rgba(2,6,23,1)_100%)] pointer-events-none z-0" />

            <div className="p-4 relative z-10 w-full text-center max-w-7xl mx-auto flex flex-col items-center">

                {/* Badge */}
                <div className="mb-8 flex items-center justify-center">
                    <AnimatedGradientText>
                        <span className={cn("inline-flex items-center text-xs font-medium")}>
                            {/* <hr className="mx-2 h-3 w-[1px] shrink-0 bg-gray-300" />{" "} */}
                            <span className={cn("inline animate-gradient bg-gradient-to-r from-[#ffaa40] via-[#9c40ff] to-[#ffaa40] bg-[length:var(--bg-size)_100%] bg-clip-text text-transparent")}>
                                {MARKETING_CONTENT.hero.badge}
                            </span>
                            <ChevronRight className="ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
                        </span>
                    </AnimatedGradientText>
                </div>

                {/* Main Heading with Word Rotate */}
                <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-6 max-w-5xl flex flex-col items-center gap-2">
                    <span>Run Your Business With AI Agents</span>
                    <span className="flex flex-wrap justify-center items-center gap-2 md:gap-3">
                        <WordRotate
                            className="text-4xl md:text-6xl pb-2 font-bold bg-gradient-to-r from-violet-500 via-purple-500 to-blue-500 bg-clip-text text-transparent tracking-tight"
                            words={["On Autopilot", "Without Employees", "While You Sleep", "With Zero Effort", "24/7, Instantly"]}
                        />
                    </span>
                </h1>

                {/* Subheading with HyperText for emphasis */}
                <div className="text-lg md:text-xl text-slate-400 mb-8 max-w-4xl mx-auto leading-relaxed">
                    <p className="mb-4">{MARKETING_CONTENT.hero.subtitle}</p>
                    <div className="flex flex-wrap justify-center gap-4 mt-6">
                        {MARKETING_CONTENT.hero.points.map((point, index) => (
                            <div key={index} className="flex items-center bg-white/5 border border-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:bg-white/10 transition-colors">
                                <span className="text-sm font-medium text-slate-200">{point}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
                    <Link href="https://app.cluaiz.com/login">
                        <ShimmerButton className="shadow-2xl bg-indigo-600 hover:bg-indigo-700 transition-all">
                            <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white lg:text-lg">
                                {MARKETING_CONTENT.hero.ctaPrimary}
                            </span>
                        </ShimmerButton>
                    </Link>

                    <HeroVideoDialog
                        className="dark:hidden block"
                        animationStyle="from-center"
                        videoSrc="https://www.youtube.com/embed/qh3NGpYRG3I?si=4rb-zSdDkVK9BVxx"
                        thumbnailSrc="https://startup-template-sage.vercel.app/hero-light.png"
                        thumbnailAlt="Hero Video"
                    >
                        <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 transition-all group animate-pulse hover:animate-none">
                            <Play className="w-4 h-4 fill-white group-hover:scale-110 transition-transform" />
                            <span className="font-medium">{MARKETING_CONTENT.hero.ctaSecondary}</span>
                        </button>
                    </HeroVideoDialog>
                </div>

                {/* Hero Video Preview */}
                <div className="mt-16 relative max-w-5xl mx-auto w-full">
                    <HeroVideoDialog
                        className="dark:hidden block w-full"
                        animationStyle="from-center"
                        videoSrc="https://www.youtube.com/embed/qh3NGpYRG3I?si=4rb-zSdDkVK9BVxx"
                        thumbnailSrc="https://startup-template-sage.vercel.app/hero-light.png"
                        thumbnailAlt="Hero Video"
                    />
                    <HeroVideoDialog
                        className="hidden dark:block w-full"
                        animationStyle="from-center"
                        videoSrc="https://www.youtube.com/embed/qh3NGpYRG3I?si=4rb-zSdDkVK9BVxx"
                        thumbnailSrc="https://startup-template-sage.vercel.app/hero-dark.png"
                        thumbnailAlt="Hero Video"
                    />
                </div>
            </div>

            {/* Progressive Blur Effect at Bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent z-20 pointer-events-none" />
        </div>
    );
}
