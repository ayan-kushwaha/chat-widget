"use client";
import React from "react";
import { MessageSquare, Star, Quote, TrendingUp, Users, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function Testimonials() {
    return (
        <section className="py-32 bg-slate-950 relative overflow-hidden">
             {/* Background Effects */}
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0%,transparent_70%)]" />
             <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px]" />
             <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px]" />
             
             {/* Floating Elements */}
             <div className="absolute top-20 left-10 w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
             <div className="absolute top-40 right-20 w-1 h-1 bg-purple-400 rounded-full animate-pulse delay-300" />
             <div className="absolute bottom-20 left-1/4 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse delay-500" />

            <div className="container px-4 mx-auto relative z-10">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-20">
                     <div className="flex justify-center mb-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium uppercase tracking-wider">
                            <MessageSquare className="w-3 h-3" />
                            <span>Customer Stories</span>
                        </div>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-400">
                        Trusted by businesses like yours
                    </h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                        See what our early adopters are saying about Cluaiz.
                    </p>
                </div>

                {/* Stats Bar */}
                <div className="flex flex-wrap justify-center gap-8 mb-16">
                    {[
                        { icon: Users, value: "500+", label: "Happy Customers" },
                        { icon: Star, value: "4.9/5", label: "Average Rating" },
                        { icon: TrendingUp, value: "80%", label: "Avg. Time Saved" },
                    ].map((stat, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-center gap-3 px-6 py-3 bg-slate-900/50 border border-slate-800 rounded-xl backdrop-blur-sm"
                        >
                            <stat.icon className="w-5 h-5 text-indigo-400" />
                            <div>
                                <div className="text-2xl font-bold text-white">{stat.value}</div>
                                <div className="text-xs text-slate-400">{stat.label}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Testimonials Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                    {testimonials.map((testimonial, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            className="group relative"
                        >
                            <div className="h-full bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm hover:bg-slate-900/80 hover:border-indigo-500/30 transition-all duration-500">
                                {/* Quote Icon */}
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                                        <Quote className="w-4 h-4 text-indigo-400" />
                                    </div>
                                    {/* Stars */}
                                    <div className="flex gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                                        ))}
                                    </div>
                                </div>

                                {/* Quote */}
                                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                                    "{testimonial.quote}"
                                </p>

                                {/* Author */}
                                <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                        {testimonial.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-white font-medium text-sm">{testimonial.name}</div>
                                        <div className="text-slate-400 text-xs">{testimonial.title}</div>
                                    </div>
                                </div>

                                {/* Verified Badge */}
                                {testimonial.verified && (
                                    <div className="absolute top-4 right-4">
                                        <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                            <span className="text-[9px] text-emerald-400 font-medium">Verified</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

const testimonials = [
    {
        quote: "Cluaiz transformed our customer support. We used to drown in tickets, now the AI handles 80% of them instantly.",
        name: "Sarah Chen",
        title: "Founder, TechFlow",
        verified: true,
    },
    {
        quote: "The hybrid brain approach is genius. We get the reasoning of a large model but the speed of a local one. Best of both worlds.",
        name: "Michael Rodriguez",
        title: "CTO, DataStream",
        verified: true,
    },
    {
        quote: "I was skeptical about an AI employee, but Cluaiz actually feels like part of the team. It learned our docs in minutes.",
        name: "Emily Watson",
        title: "Operations Manager, SwiftLogistics",
        verified: false,
    },
    {
        quote: "The lead capture forms are seamless. Our conversion rate jumped 40% in the first week.",
        name: "David Kim",
        title: "Marketing Director, GrowthHacker",
        verified: true,
    },
    {
        quote: "Finally, an AI that doesn't hallucinate. The vector search is incredibly accurate.",
        name: "Lisa Patel",
        title: "Head of Product, SoftServe",
        verified: true,
    },
    {
        quote: "ROI was visible within days. The automation studio saved us countless hours of manual work.",
        name: "James Wilson",
        title: "CEO, AutoScale",
        verified: false,
    },
];
