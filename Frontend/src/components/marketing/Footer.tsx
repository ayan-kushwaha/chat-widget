"use client";
import React from "react";
import Link from "next/link";
import { Twitter, Linkedin, Github } from "lucide-react";
import DotPattern from "../ui/dotted-map";
import { RetroGrid } from "@/components/ui/retro-grid";
import { cn } from "@/lib/utils";
import { MARKETING_CONTENT } from "@/lib/marketing-content";

export function Footer() {
    return (
        <footer className="bg-slate-950 text-slate-400 py-20 relative overflow-hidden border-t border-slate-900">
            <RetroGrid className="opacity-10" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
                    {/* Brand Column */}
                    <div className="col-span-1 md:col-span-1">
                        <Link href="/" className="flex items-center space-x-2 mb-6">
                            <span className="text-2xl font-bold text-white">Cluaiz</span>
                        </Link>
                        <p className="text-sm leading-relaxed mb-6">
                            {MARKETING_CONTENT.footer.tagline}
                        </p>
                        <div className="flex flex-col space-y-2">
                            {MARKETING_CONTENT.footer.benefits.map((benefit, i) => (
                                <span key={i} className="text-xs font-medium text-indigo-400">{benefit}</span>
                            ))}
                        </div>
                    </div>

                    {/* Products Column */}
                    <div>
                        <h3 className="text-white font-semibold mb-6 text-lg">Products</h3>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="/website" className="hover:text-indigo-400 transition">Website Tools</Link></li>
                            <li><Link href="/automation" className="hover:text-indigo-400 transition">Automation</Link></li>
                            <li><Link href="/ai-brain" className="hover:text-indigo-400 transition">AI Brain</Link></li>
                            <li><Link href="/templates" className="hover:text-indigo-400 transition">Templates</Link></li>
                            <li><Link href="/pricing" className="hover:text-indigo-400 transition">Pricing</Link></li>
                        </ul>
                    </div>

                    {/* Resources Column */}
                    <div>
                        <h3 className="text-white font-semibold mb-6 text-lg">Resources</h3>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="/docs" className="hover:text-indigo-400 transition">Documentation</Link></li>
                            <li><Link href="/blog" className="hover:text-indigo-400 transition">Blog</Link></li>
                            <li><Link href="/tools" className="hover:text-indigo-400 transition">Free Tools</Link></li>
                            <li><Link href="/changelog" className="hover:text-indigo-400 transition">Changelog</Link></li>
                        </ul>
                    </div>

                    {/* Company Column */}
                    <div>
                        <h3 className="text-white font-semibold mb-6 text-lg">Company</h3>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="/about" className="hover:text-indigo-400 transition">About</Link></li>
                            <li><Link href="/contact" className="hover:text-indigo-400 transition">Contact</Link></li>
                            <li><Link href="/careers" className="hover:text-indigo-400 transition">Careers</Link></li>
                        </ul>
                    </div>

                    {/* Legal Column */}
                    <div>
                        <h3 className="text-white font-semibold mb-6 text-lg">Legal</h3>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="/privacy" className="hover:text-indigo-400 transition">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-indigo-400 transition">Terms of Service</Link></li>
                        </ul>
                        <div className="flex space-x-3 mt-8">
                            <Link href="#" className="hover:text-white transition bg-slate-900 p-2 rounded-full border border-slate-800"><Twitter className="w-4 h-4" /></Link>
                            <Link href="#" className="hover:text-white transition bg-slate-900 p-2 rounded-full border border-slate-800"><Linkedin className="w-4 h-4" /></Link>
                            <Link href="#" className="hover:text-white transition bg-slate-900 p-2 rounded-full border border-slate-800"><Github className="w-4 h-4" /></Link>
                        </div>
                    </div>
                </div>

                <div className="mt-16 border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center">
                    <p className="text-slate-500 text-xs mb-4 md:mb-0">
                        &copy; {new Date().getFullYear()} Cluaiz Inc. All rights reserved.
                    </p>
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs text-slate-500">All Systems Operational</span>
                    </div>
                </div>
            </div>

            {/* Watermark */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/3 pointer-events-none select-none opacity-[0.02]">
                <span className="text-[20vw] font-bold text-white leading-none">CLUAIZ</span>
            </div>

            {/* Dotted Map Overlay */}
            <DotPattern
                width={20}
                height={20}
                cx={1}
                cy={1}
                cr={1}
                className={cn(
                    "absolute bottom-0 right-0 z-0 h-[300px] w-[600px] fill-slate-800/40 [mask-image:linear-gradient(to_top_left,white,transparent,transparent)]",
                )}
            />
        </footer>
    );
}
