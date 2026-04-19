import React from "react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Contact } from "@/components/marketing/Contact";
import { RetroGrid } from "@/components/ui/retro-grid";

export default function ContactPage() {
    return (
        <main className="min-h-screen bg-slate-950 antialiased selection:bg-indigo-500/30 relative overflow-hidden">
            <Navbar />

            {/* Background Pattern */}
            <RetroGrid className="opacity-10" />

            <div className="pt-20">
                <Contact />
            </div>

            <Footer />
        </main>
    );
}
