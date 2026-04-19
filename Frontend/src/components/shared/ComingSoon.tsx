"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock, Rocket, Bell } from "lucide-react";

interface ComingSoonProps {
    title: string;
    description: string;
    badge: "In Development" | "Planned" | "Coming Next Month";
    features: {
        title: string;
        desc: string;
        icon: any;
    }[];
    progress?: number;
}

export function ComingSoon({ title, description, badge, features, progress }: ComingSoonProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center max-w-4xl mx-auto px-4">

            {/* Badge */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-8"
            >
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${badge === "In Development" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                        badge === "Coming Next Month" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                            "bg-blue-500/10 text-blue-500 border-blue-500/20"
                    }`}>
                    🚧 {badge} {progress ? `(${progress}% Ready)` : ""}
                </span>
            </motion.div>

            {/* Main Content */}
            <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-6xl font-bold tracking-tight mb-6"
            >
                {title} <span className="text-slate-400 opacity-30 select-none ml-2">Locked</span>
            </motion.h1>

            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl text-slate-500 max-w-2xl mb-12 leading-relaxed"
            >
                {description}
            </motion.p>

            {/* Value Grid (Roadmap Selling) */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 w-full text-left mb-16"
            >
                {features.map((feature, idx) => (
                    <div key={idx} className="p-6 rounded-2xl bg-slate-50 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-800">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-4 text-indigo-500">
                            <feature.icon className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                        <p className="text-sm text-slate-500">{feature.desc}</p>
                    </div>
                ))}
            </motion.div>

            {/* CTA */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white w-full max-w-2xl border border-slate-700 shadow-2xl"
            >
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-left">
                        <h4 className="text-lg font-bold flex items-center gap-2">
                            <Rocket className="w-5 h-5 text-yellow-400" />
                            You secured the legacy price!
                        </h4>
                        <p className="text-sm text-slate-300 mt-1">
                            When this launches, current prices will double. You are locked in at the beta rate forever.
                        </p>
                    </div>
                    <Button variant="outline" className="whitespace-nowrap font-bold bg-white/5 border-white/10 hover:bg-white/10 text-white">
                        <Bell className="w-4 h-4 mr-2" /> Notify Me on Launch
                    </Button>
                </div>
            </motion.div>

        </div>
    );
}
