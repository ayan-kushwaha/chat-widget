import React from "react";
import { Navbar } from "@/components/marketing/Navbar";
import { Hero } from "@/components/marketing/Hero";
import { HybridBrain } from "@/components/marketing/HybridBrain";
import { GeminiSection } from "@/components/marketing/GeminiSection";
import { Personality } from "@/components/marketing/Personality";
import { MemoryFeature } from "@/components/marketing/MemoryFeature";
import { AnalyticsPreview } from "@/components/marketing/AnalyticsPreview";
import { Integrations } from "@/components/marketing/Integrations";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Reliability } from "@/components/marketing/Reliability";
import { BeforeAfter } from "@/components/marketing/BeforeAfter";
import { UseCases } from "@/components/marketing/UseCases";
import { Pricing } from "@/components/marketing/Pricing";
import { Roadmap } from "@/components/marketing/Roadmap";
import { Testimonials } from "@/components/marketing/Testimonials";
import { CTA } from "@/components/marketing/CTA";
import { Footer } from "@/components/marketing/Footer";

export default function MarketingPage() {
    return (
        <main className="min-h-screen bg-slate-950 antialiased selection:bg-indigo-500/30">
            <Navbar />
            <Hero />

            {/* Smart Brain & Tech */}
            <HybridBrain />
            <GeminiSection />

            {/* AI Personality & Memory */}
            <Personality />
            <MemoryFeature />

            {/* Business Impact */}
            <AnalyticsPreview />

            {/* Business Connectors */}
            <Integrations />

            {/* Education & Trust */}
            <Reliability />
            <HowItWorks />

            <BeforeAfter />

            {/* Industry Use Cases */}
            <UseCases />

            {/* Pricing Section - The Missing Piece */}
            <Pricing />

            <Roadmap />
            <Testimonials />

            <CTA />
            <Footer />
        </main>
    );
}
