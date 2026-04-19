"use client";
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IconBrandGithub, IconBrandLinkedin, IconBrandTwitter } from "@tabler/icons-react";

export function Contact() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

                {/* Left Side: Text & Socials */}
                <div>
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                        Get in touch
                    </h2>
                    <p className="text-slate-400 text-lg mb-8">
                        Have a question about Cluaiz? We're here to help. Fill out the form or reach out to us on social media.
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4 text-slate-300">
                            <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                                <IconBrandTwitter className="h-5 w-5" />
                            </div>
                            <span>@cluaiz_ai</span>
                        </div>
                        <div className="flex items-center gap-4 text-slate-300">
                            <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                                <IconBrandGithub className="h-5 w-5" />
                            </div>
                            <span>github.com/cluaiz</span>
                        </div>
                        <div className="flex items-center gap-4 text-slate-300">
                            <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                                <IconBrandLinkedin className="h-5 w-5" />
                            </div>
                            <span>linkedin.com/company/cluaiz</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                    <form className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="firstname">First name</Label>
                                <Input id="firstname" placeholder="John" className="bg-slate-950 border-slate-800" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastname">Last name</Label>
                                <Input id="lastname" placeholder="Doe" className="bg-slate-950 border-slate-800" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" placeholder="john@example.com" type="email" className="bg-slate-950 border-slate-800" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="message">Message</Label>
                            <Textarea
                                id="message"
                                placeholder="Tell us about your project..."
                                className="bg-slate-950 border-slate-800 min-h-[120px]"
                            />
                        </div>
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                            Send Message
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
