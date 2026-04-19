"use client";
import React from "react";
import { MARKETING_CONTENT } from "@/lib/marketing-content";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function PrivacySection() {
    return (
        <section className="py-20 bg-slate-950 border-t border-slate-900">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div className="flex justify-center mb-6">
                    <div className="h-16 w-16 bg-green-500/10 rounded-full flex items-center justify-center">
                        <ShieldCheck className="w-8 h-8 text-green-500" />
                    </div>
                </div>
                <h2 className="text-3xl font-bold text-white mb-6">
                    {MARKETING_CONTENT.privacy.heading}
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed">
                    {MARKETING_CONTENT.privacy.content}
                </p>
            </div>
        </section>
    );
}
