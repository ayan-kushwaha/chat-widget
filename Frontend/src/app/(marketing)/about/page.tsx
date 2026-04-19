import React from "react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { AboutHero } from "@/components/marketing/AboutHero";
import { Team } from "@/components/marketing/Team";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { Globe, Lock, Heart } from "lucide-react";

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-slate-950 antialiased selection:bg-indigo-500/30">
            <Navbar />
            <AboutHero />

            {/* Our Story / Timeline Placeholder */}
            <section className="py-20 bg-slate-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold text-white mb-12">Our Journey</h2>
                    <div className="flex flex-col md:flex-row justify-center gap-8 text-slate-400">
                        <div className="flex flex-col items-center">
                            <span className="text-indigo-500 font-bold text-xl">2024</span>
                            <p className="mt-2">The Idea. Realized SMBs are losing leads because they sleep.</p>
                        </div>
                        <div className="hidden md:block w-px h-20 bg-slate-800"></div>
                        <div className="flex flex-col items-center">
                            <span className="text-indigo-500 font-bold text-xl">2025</span>
                            <p className="mt-2">Cluaiz v1. First prototype using Gemini.</p>
                        </div>
                        <div className="hidden md:block w-px h-20 bg-slate-800"></div>
                        <div className="flex flex-col items-center">
                            <span className="text-indigo-500 font-bold text-xl">Now</span>
                            <p className="mt-2">Hybrid Brain. Serving 100+ businesses.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Values */}
            <section className="py-20 bg-slate-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-white mb-12 text-center">Core Values</h2>
                    <BentoGrid className="max-w-4xl mx-auto">
                        <BentoGridItem
                            title="Democratize AI"
                            description="AI shouldn't be just for big tech. We bring enterprise-grade AI to every small business."
                            icon={<Globe className="h-4 w-4 text-neutral-500" />}
                            className="md:col-span-1"
                        />
                        <BentoGridItem
                            title="Privacy First"
                            description="Your data is yours. Period. We don't train our models on your customer conversations without permission."
                            icon={<Lock className="h-4 w-4 text-neutral-500" />}
                            className="md:col-span-1"
                        />
                        <BentoGridItem
                            title="Human-Centric"
                            description="AI should empower humans, not replace the human touch. We build tools that amplify your team."
                            icon={<Heart className="h-4 w-4 text-neutral-500" />}
                            className="md:col-span-1"
                        />
                    </BentoGrid>
                </div>
            </section>

            <Team />
            <Footer />
        </main>
    );
}
