"use client";
import React from "react";
import { MARKETING_CONTENT } from "@/lib/marketing-content";
import { Smartphone, QrCode, Globe, Facebook, Instagram } from "lucide-react";
import { cn } from "@/lib/utils";
import DotPattern from "@/components/ui/dotted-map";

export function AIAssistantPage() {
    return (
        <section className="py-24 bg-slate-950 relative overflow-hidden border-t border-slate-900">
            <DotPattern
                width={20}
                height={20}
                cx={1}
                cy={1}
                cr={1}
                className={cn(
                    "absolute inset-0 z-0 h-full w-full fill-slate-800/40 [mask-image:linear-gradient(to_bottom_right,white,transparent,transparent)]",
                )}
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                            {MARKETING_CONTENT.aiAssistantPage.title}
                        </h2>
                        <p className="text-slate-400 text-lg mb-8">
                            {MARKETING_CONTENT.aiAssistantPage.description}
                        </p>

                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
                            <h3 className="text-white font-semibold mb-4">Perfect for:</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {MARKETING_CONTENT.aiAssistantPage.useCases.map((useCase, i) => (
                                    <div key={i} className="flex items-center text-slate-300">
                                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3" />
                                        {useCase}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <p className="text-indigo-400 font-medium">
                            {MARKETING_CONTENT.aiAssistantPage.footer}
                        </p>
                    </div>

                    {/* Visual Mockup */}
                    <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-900 border-[14px] rounded-2xl h-[600px] w-[300px]">
                        <div className="h-[32px] w-[3px] bg-gray-800 absolute -start-[17px] top-[72px] rounded-s-lg"></div>
                        <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
                        <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
                        <div className="h-[64px] w-[3px] bg-gray-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>
                        <div className="rounded-[2rem] overflow-hidden w-full h-full bg-slate-950 relative">
                            {/* Screen Content */}
                            <div className="absolute top-0 w-full h-full flex flex-col">
                                <div className="bg-indigo-600 h-32 flex items-end p-6">
                                    <div className="w-16 h-16 bg-white rounded-full border-4 border-slate-950 -mb-8 shadow-lg"></div>
                                </div>
                                <div className="mt-10 px-6 text-center">
                                    <h4 className="text-white font-bold text-xl">My Business AI</h4>
                                    <p className="text-slate-400 text-sm">Always Open • 24/7 Support</p>
                                </div>
                                <div className="p-4 space-y-3 mt-4 overflow-y-auto no-scrollbar">
                                    <div className="bg-slate-900 p-3 rounded-lg rounded-tl-none text-slate-300 text-sm max-w-[85%]">
                                        Hello! How can I help you today?
                                    </div>
                                    <div className="bg-indigo-600 p-3 rounded-lg rounded-tr-none text-white text-sm max-w-[85%] ml-auto">
                                        Do you have a price list?
                                    </div>
                                    <div className="bg-slate-900 p-3 rounded-lg rounded-tl-none text-slate-300 text-sm max-w-[85%]">
                                        Yes! Here is our latest pricing...
                                    </div>
                                </div>
                                <div className="mt-auto p-4 border-t border-slate-800">
                                    <div className="h-10 bg-slate-900 rounded-full w-full" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
