import React from "react";
import { Metadata } from "next";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { generatePageMetadata } from "@/lib/seo-config";
import { Brain, Clock, Globe, Zap } from "lucide-react";

export const metadata: Metadata = generatePageMetadata("website.chatbot") as any;

export default function ChatbotPage() {
    return (
        <main className="min-h-screen bg-slate-950 antialiased selection:bg-indigo-500/30">
            <Navbar />

            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                        AI Chat Agent
                    </h1>
                    <p className="text-xl text-slate-400 max-w-3xl mb-8">
                        24/7 customer support automation. Instant answers, lead capture, multi-language support.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
                        {[
                            { icon: Clock, title: "24/7 Available", desc: "Never miss a lead" },
                            { icon: Brain, title: "Smart AI", desc: "Learns your business" },
                            { icon: Globe, title: "Multi-language", desc: "Hindi, English, more" },
                            { icon: Zap, title: "Instant Setup", desc: "2 minutes to live" },
                        ].map((feature) => {
                            const Icon = feature.icon;
                            return (
                                <div key={feature.title} className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 text-center">
                                    <Icon className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
                                    <h3 className="font-bold text-white mb-1">{feature.title}</h3>
                                    <p className="text-sm text-slate-400">{feature.desc}</p>
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
