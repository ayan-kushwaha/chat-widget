import React from "react";
import { Metadata } from "next";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { generatePageMetadata } from "@/lib/seo-config";
import { MessageSquare, Zap, Globe, Users } from "lucide-react";

export const metadata: Metadata = generatePageMetadata("website.builder") as any;

export default function BuilderPage() {
    return (
        <main className="min-h-screen bg-slate-950 antialiased selection:bg-indigo-500/30">
            <Navbar />

            {/* Hero */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm mb-6">
                            <Zap className="w-4 h-4" />
                            <span>AI Powered</span>
                        </div>

                        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                            AI Website Builder
                        </h1>

                        <p className="text-xl text-slate-400 mb-8">
                            Create stunning websites in seconds. One prompt, complete website. No coding needed.
                        </p>

                        <button className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition">
                            Start Building Free
                        </button>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl font-bold text-white mb-12">Key Features</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Zap,
                                title: "Instant Generation",
                                description: "Describe your business, get a complete website in seconds.",
                            },
                            {
                                icon: Globe,
                                title: "SEO Optimized",
                                description: "Auto-generated meta tags, structured data, fast loading.",
                            },
                            {
                                icon: MessageSquare,
                                title: "AI Chatbot Included",
                                description: "Every website gets a smart chatbot automatically.",
                            },
                        ].map((feature) => {
                            const Icon = feature.icon;
                            return (
                                <div key={feature.title} className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
                                    <Icon className="w-8 h-8 text-indigo-400 mb-4" />
                                    <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                                    <p className="text-slate-400">{feature.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
