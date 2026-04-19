"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Loader2, FileText, CheckCircle2, Lightbulb, Zap, BookOpen, MessageSquare, Globe } from "lucide-react";
import { generateKnowledgeStrategy } from "@/api/org.api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface KnowledgeTrainingModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    stats: any;
    onStrategyGenerated: () => void;
}

export function KnowledgeTrainingModal({
    open,
    onOpenChange,
    stats,
    onStrategyGenerated
}: KnowledgeTrainingModalProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const strategy = stats?.knowledge_strategy;

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const data = await generateKnowledgeStrategy();
            if (data.success && data.strategy) {
                toast.success("AI Strategy Blueprint Generated!");
                onStrategyGenerated();
            } else {
                toast.error("Failed to generate strategy", { description: data.message });
            }
        } catch (error: any) {
            console.error(error);
            toast.error("Generation Error", { description: error?.response?.data?.message || error.message });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="px-6 py-6 border-b bg-white dark:bg-neutral-950 relative overflow-hidden shrink-0">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />

                    <div className="flex items-center gap-4 relative">
                        <div className="p-3 rounded-xl bg-primary/10 text-primary animate-pulse">
                            <BrainCircuit className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <DialogTitle className="text-2xl font-bold tracking-tight">AI Training & Knowledge Guide</DialogTitle>
                            <DialogDescription className="text-sm font-medium text-muted-foreground/80">
                                Master your AI Brain: How to feed, train, and structure your knowledge base for maximum performance.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 w-full">
                    <div className="px-6 py-8 pb-12 space-y-10">
                        {/* Section 1: The Vision */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 px-1">
                                <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                    <Lightbulb className="w-4 h-4" />
                                </div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-500">The Golden Rule</h3>
                            </div>
                            <div className="group relative overflow-hidden bg-amber-50/30 dark:bg-amber-500/5 border border-amber-200/50 dark:border-amber-500/10 rounded-2xl p-6 transition-all hover:shadow-md">
                                <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                                    Your AI is a "Digital Expert". If you give it junk, it will talk junk. To build a <span className="text-amber-600 dark:text-amber-400 font-bold">World-Class Brain</span>, you must provide structured, verified, and high-context data.
                                    <br /><br />
                                    <span className="text-xs font-semibold opacity-70 italic font-mono">— Quality over Quantity, always.</span>
                                </p>
                            </div>
                        </section>

                        {/* Section 2: Source-Specific Mastery */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-2 px-1">
                                <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                    <BookOpen className="w-4 h-4" />
                                </div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-500">Source-Specific Best Practices</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Files */}
                                <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900/50 shadow-sm space-y-3">
                                    <div className="flex items-center gap-2 text-blue-500">
                                        <FileText className="w-4 h-4" />
                                        <h4 className="text-sm font-bold">Files (PDF/Docx/TXT)</h4>
                                    </div>
                                    <ul className="text-xs space-y-2 text-muted-foreground list-disc pl-4">
                                        <li><strong className="text-foreground">Clean OCR:</strong> Ensure PDFs are not just images. Text must be selectable.</li>
                                        <li><strong className="text-foreground">Naming:</strong> Use <code className="bg-neutral-100 dark:bg-neutral-800 px-1 rounded">ProjectX_V2_Draft.pdf</code> instead of <code className="bg-neutral-100 dark:bg-neutral-800 px-1 rounded">123.pdf</code>.</li>
                                        <li><strong className="text-foreground">Formatting:</strong> Use clear headings (H1, H2) inside docs. It helps AI understand layout.</li>
                                    </ul>
                                </div>

                                {/* Websites */}
                                <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900/50 shadow-sm space-y-3">
                                    <div className="flex items-center gap-2 text-emerald-500">
                                        <Globe className="w-4 h-4" />
                                        <h4 className="text-sm font-bold">Websites (URL Crawling)</h4>
                                    </div>
                                    <ul className="text-xs space-y-2 text-muted-foreground list-disc pl-4">
                                        <li><strong className="text-foreground">Targeted Crawl:</strong> Don't crawl homepages; crawl specific /docs or /features pages.</li>
                                        <li><strong className="text-foreground">Avoid Noise:</strong> Skip Login pages, Dashboards, and bloated footers if possible.</li>
                                        <li><strong className="text-foreground">Freshness:</strong> Re-crawl every time your live site content changes significantly.</li>
                                    </ul>
                                </div>

                                {/* APIs */}
                                <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900/50 shadow-sm space-y-3">
                                    <div className="flex items-center gap-2 text-purple-500">
                                        <Zap className="w-4 h-4" />
                                        <h4 className="text-sm font-bold">APIs & Integrations</h4>
                                    </div>
                                    <ul className="text-xs space-y-2 text-muted-foreground list-disc pl-4">
                                        <li><strong className="text-foreground">Descriptions:</strong> Give each API endpoint a clear, human-readable description.</li>
                                        <li><strong className="text-foreground">Schema Info:</strong> AI needs to know what every field means to use it in conversation.</li>
                                        <li><strong className="text-foreground">Payload limits:</strong> Avoid endpoints that return 10MB+ JSON; keep them concise.</li>
                                    </ul>
                                </div>

                                {/* Manual/QA */}
                                <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900/50 shadow-sm space-y-3">
                                    <div className="flex items-center gap-2 text-orange-500">
                                        <MessageSquare className="w-4 h-4" />
                                        <h4 className="text-sm font-bold">Manual Docs & QA</h4>
                                    </div>
                                    <ul className="text-xs space-y-2 text-muted-foreground list-disc pl-4">
                                        <li><strong className="text-foreground">Q&A Format:</strong> Use "Q: How do I do X? A: Do Y." for direct intent training.</li>
                                        <li><strong className="text-foreground">Structured JSON:</strong> Good for bulk importing FAQ databases.</li>
                                        <li><strong className="text-foreground">Edge Cases:</strong> Add instructions for things NOT in your regular docs.</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* Section 3: AI Knowledge Strategy (The Blueprint) */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                        <Zap className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-500">System Analysis</h3>
                                </div>
                                {strategy ? (
                                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none px-3 font-bold">Analysis Ready</Badge>
                                ) : (
                                    <Badge variant="outline" className="text-amber-600 border-amber-200 dark:border-amber-900 px-3 font-bold">Action Required</Badge>
                                )}
                            </div>

                            <div className="relative overflow-hidden bg-neutral-950/5 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-inner">
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6 font-medium leading-relaxed">
                                    Need a tailored plan? We use Gemini AI to scan your business profile and generate a missing-parts checklist.
                                </p>

                                {!strategy ? (
                                    <Button
                                        onClick={handleGenerate}
                                        disabled={isGenerating}
                                        size="lg"
                                        className="w-full bg-primary dark:text-black hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/30 transition-all active:scale-[0.98] border-none"
                                    >
                                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "✨ Generate AI Strategy Blueprint"}
                                    </Button>
                                ) : (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        {strategy.overview && (
                                            <div className="p-4 bg-white dark:bg-black rounded-xl border border-neutral-100 dark:border-neutral-800 text-sm text-neutral-700 dark:text-neutral-300 italic shadow-sm leading-relaxed">
                                                “{strategy.overview}”
                                            </div>
                                        )}
                                        <div className="grid grid-cols-1 gap-6">
                                            {strategy.categories?.map((cat: any, i: number) => (
                                                <div key={i} className="group flex flex-col gap-3 p-5 rounded-xl border bg-white dark:bg-black/40 hover:border-primary/30 transition-all shadow-sm">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-900 text-neutral-500 group-hover:text-primary transition-colors">
                                                                <FileText className="w-4 h-4" />
                                                            </div>
                                                            <h4 className="text-sm font-bold tracking-tight">{cat.title}</h4>
                                                        </div>
                                                        {cat.isRequired && (
                                                            <Badge className="text-[9px] h-4 px-2 bg-red-500/10 text-red-600 dark:text-red-400 border-none uppercase font-black tracking-tighter">Essential</Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground leading-relaxed">{cat.description}</p>
                                                    <div className="space-y-2 mt-1">
                                                        <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-widest">Suggested Uploads</p>
                                                        <ul className="flex flex-wrap gap-1.5">
                                                            {cat.recommendedFiles?.map((file: string, fi: number) => (
                                                                <li key={fi} className="text-[10px] font-mono px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200/50 dark:border-neutral-700/50">
                                                                    {file}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </ScrollArea>

                <div className="px-6 py-4 border-t bg-white dark:bg-neutral-950 flex justify-between items-center shrink-0">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-60">Control Center Guide v1.0</p>
                    <Button
                        variant="default"
                        size="sm"
                        className="px-8 bg-neutral-900 dark:bg-white text-white dark:text-black font-bold hover:opacity-90 transition-all shadow-xl"
                        onClick={() => onOpenChange(false)}
                    >
                        Understood
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
