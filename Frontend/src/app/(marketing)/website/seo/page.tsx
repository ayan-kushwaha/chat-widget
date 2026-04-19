import React from "react";
import { Metadata } from "next";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { generatePageMetadata } from "@/lib/seo-config";

export const metadata: Metadata = generatePageMetadata("website.seo") as any;

export default function SEOPage() {
    return (
        <main className="min-h-screen bg-slate-950 antialiased selection:bg-indigo-500/30">
            <Navbar />

            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-5xl font-bold text-white mb-6">
                        SEO Tools
                    </h1>
                    <p className="text-xl text-slate-400 max-w-3xl mx-auto">
                        Auto-optimize your website. Meta tags, structured data, performance optimization.
                    </p>
                </div>
            </section>

            <Footer />
        </main>
    );
}
