"use client";
import React from "react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

import DotPattern from "@/components/ui/dotted-map";
import { cn } from "@/lib/utils";

export function FAQ() {
    return (
        <section className="py-20 bg-slate-950 relative overflow-hidden">
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
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <h2 className="text-3xl font-bold text-white mb-12 text-center">
                    Common Questions
                </h2>

                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1" className="border-slate-800">
                        <AccordionTrigger className="text-white hover:text-indigo-400 text-lg">
                            Will Cluaiz slow down my website?
                        </AccordionTrigger>
                        <AccordionContent className="text-slate-400 text-base">
                            No. The widget is extremely lightweight (less than 50KB gzipped) and lazy-loaded. It only loads the full chat interface when a user interacts with it, ensuring zero impact on your initial page load speed.
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-2" className="border-slate-800">
                        <AccordionTrigger className="text-white hover:text-indigo-400 text-lg">
                            Is my data used to train your models?
                        </AccordionTrigger>
                        <AccordionContent className="text-slate-400 text-base">
                            Absolutely not. We prioritize data privacy. Your website content and customer conversations are isolated in your own vector database namespace. We do not use your data to train our base models.
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-3" className="border-slate-800">
                        <AccordionTrigger className="text-white hover:text-indigo-400 text-lg">
                            How do the smart forms work?
                        </AccordionTrigger>
                        <AccordionContent className="text-slate-400 text-base">
                            Cluaiz detects when a user shows intent (e.g., asking for pricing or a demo) and automatically triggers a lead capture form within the chat. It can even pre-fill information if the user has already provided it during the conversation.
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-4" className="border-slate-800">
                        <AccordionTrigger className="text-white hover:text-indigo-400 text-lg">
                            What happens after the Beta period?
                        </AccordionTrigger>
                        <AccordionContent className="text-slate-400 text-base">
                            Early beta users will be grandfathered into a special discounted plan. You will be notified well in advance before any billing changes occur. The Starter plan will remain free forever.
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </section>
    );
}
