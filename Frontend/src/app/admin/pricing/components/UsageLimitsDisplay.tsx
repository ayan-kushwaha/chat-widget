"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Info, Zap } from "lucide-react";
import * as LucideIcons from "lucide-react";

interface UsageLimitsDisplayProps {
    tokenLimit: number;
    selectedFeatures: string[];
    groupedFeatures: any[];
    quotaFeatures: any[]; // Changed to accept pre-calculated features
}

export default function UsageLimitsDisplay({
    tokenLimit,
    selectedFeatures,
    groupedFeatures,
    quotaFeatures
}: UsageLimitsDisplayProps) {
    // Logic moved to parent component using usePlanCalculations hook

    return (
        <div className="space-y-6">
            {/* STRICT CAPS - Full Width */}
            <Card className="p-6 border-2 border-dashed bg-zinc-50/50 dark:bg-zinc-900/50">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold">
                            Strict Caps
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">Resource Limits</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                        <Info className="w-4 h-4" />
                        <span className="font-medium">Hard limits to prevent abuse</span>
                    </div>
                </div>

                {quotaFeatures.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {quotaFeatures.map((feature) => {
                            const IconComp = feature.icon && (LucideIcons as any)[feature.icon]
                                ? (LucideIcons as any)[feature.icon]
                                : LucideIcons.Shield;

                            return (
                                <div
                                    key={feature.id}
                                    className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0">
                                            <IconComp className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <Label className="text-sm font-bold text-foreground block mb-1">
                                                {feature.label}
                                            </Label>
                                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                                {feature.description}
                                            </p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-black font-mono text-foreground">
                                                    {feature.value?.toLocaleString() || 0}
                                                </span>
                                                <span className="text-xs text-muted-foreground font-medium uppercase">
                                                    {feature.unit}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center p-8 text-muted-foreground opacity-50">
                        <LucideIcons.Shield className="w-10 h-10 mb-3 stroke-1" />
                        <p className="text-sm font-medium">No resource limits</p>
                        <p className="text-xs mt-1">All features are token-based</p>
                    </div>
                )}
            </Card>

            {/* UNLIMITED FEATURES - Simple Note */}
            <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/10 border-2 border-green-200 dark:border-green-900">
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 shrink-0">
                        <Zap className="w-6 h-6 fill-current" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-green-900 dark:text-green-300 mb-2">
                            Unlimited Token-Based Features
                        </h3>
                        <p className="text-sm text-green-800 dark:text-green-300/90 leading-relaxed mb-3">
                            All other features (Chat, AI Processing, API Calls, etc.) run <strong>continuously</strong> as long as you have tokens in your balance.
                            No monthly caps or hard limits apply.
                        </p>
                        <div className="flex items-start gap-2 p-3 bg-white/60 dark:bg-black/30 rounded-lg border border-green-200 dark:border-green-800">
                            <Info className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                            <p className="text-xs text-green-700 dark:text-green-400 leading-relaxed">
                                <strong>Why Strict Caps?</strong> Resource-heavy features like web scraping and file storage have limits to prevent abuse and ensure fair usage.
                                Everything else is unlimited and only consumes tokens when used.
                            </p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* SMART NOTES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                    <Zap className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                        <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300">Need more power?</h4>
                        <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                            Buy a <strong>Token Top-up</strong> anytime. Your service won't stop!
                        </p>
                    </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                    <LucideIcons.Shield className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                    <div>
                        <h4 className="text-sm font-bold text-green-900 dark:text-green-300">Pause anytime</h4>
                        <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                            Switch to a <strong>Vault Plan</strong> to keep your data safe until you return.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
