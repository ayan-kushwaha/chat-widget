import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Loader2, FileText, CheckCircle2 } from "lucide-react";
import { CollapsibleSection } from "../shared/CollapsibleSection";
import { generateKnowledgeStrategy } from "@/api/org.api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface ProfileKnowledgeStrategyProps {
    org: any;
    isOpen: boolean;
    onToggle: (id: string) => void;
    onStrategyGenerated: (strategy: any) => void;
}

export function ProfileKnowledgeStrategy({
    org,
    isOpen,
    onToggle,
    onStrategyGenerated
}: ProfileKnowledgeStrategyProps) {
    const [isGenerating, setIsGenerating] = useState(false);

    // Fallback to local state if org update takes time
    const strategy = org.knowledge_strategy;

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const data = await generateKnowledgeStrategy();
            if (data.success && data.strategy) {
                toast.success("AI Strategy Blueprint Generated!");
                onStrategyGenerated(data.strategy);
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
        <CollapsibleSection
            id="strategy"
            title="AI Knowledge Strategy"
            icon={BrainCircuit}
            isOpen={isOpen}
            onToggle={onToggle}
            badge={
                strategy ?
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">Generated</Badge> :
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">Action Required</Badge>
            }
        >
            <div className="grid gap-6 pb-4">
                <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-5">
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                        <BrainCircuit className="w-4 h-4 text-blue-500" />
                        Smart Knowledge Blueprint
                    </h4>
                    <p className="text-sm text-blue-700/80 dark:text-blue-300/80 leading-relaxed mb-4">
                        We can analyze your business profile and generate a custom guide on exactly what files, documents, and data you should upload to train your custom AI Brain perfectly. Let Gemini do the hard work.
                    </p>
                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Analyzing Business DNA...
                            </>
                        ) : (
                            <>
                                ✨ Generate Strategy Blueprint
                            </>
                        )}
                    </Button>
                </div>

                {strategy && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {strategy.overview && (
                            <div className="bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800 rounded-lg p-4">
                                <p className="text-sm text-neutral-600 dark:text-neutral-300 italic">
                                    "{strategy.overview}"
                                </p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <h5 className="font-semibold text-sm text-neutral-800 dark:text-neutral-200 uppercase tracking-widest flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Recommended Uploads
                            </h5>

                            {strategy.categories?.map((category: any, idx: number) => (
                                <div key={idx} className="bg-white dark:bg-[#0c0c0e] border border-neutral-200 dark:border-white/5 rounded-xl p-5 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <h6 className="font-medium text-neutral-900 dark:text-white text-base">
                                            {category.title}
                                        </h6>
                                        {category.isRequired && (
                                            <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-none px-2 py-0.5 text-[10px]">
                                                Essential
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                                        {category.description}
                                    </p>

                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Suggested Files</p>
                                        <ul className="space-y-2">
                                            {category.recommendedFiles?.map((file: string, fIdx: number) => (
                                                <li key={fIdx} className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-900/50 p-2 rounded-md border border-neutral-100 dark:border-neutral-800">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                                    <span className="font-mono text-xs">{file}</span>
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
        </CollapsibleSection>
    );
}
