"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, CheckCircle2, XCircle, Crown, Sparkles, MoreVertical, Power, Copy, Zap, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

import { useGeo } from "@/hooks/useGeo";
import { usePlanCalculations } from "@/hooks/usePlanCalculations";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { formatTokenCount, MARKUP_FACTOR, calculateOriginalPrice } from "@/lib/priceUtils";

interface PlanCardProps {
    plan: any;
    allFeatures?: any[];
    onEdit: (plan: any) => void;
    onDelete: (id: string) => void;
    onToggleStatus: (plan: any) => void;
}

export default function PlanCard({ plan, allFeatures = [], onEdit, onDelete, onToggleStatus }: PlanCardProps) {
    // ✅ Load Config for Tiers
    const { config } = useSystemConfig();
    const geo = useGeo();

    // 🧮 Price Calculation Hook
    // STRICT: User wants Price derived from Tokens * Rate (No Stored Price)
    const { finalPrice } = usePlanCalculations({
        plan,
        tokenLimit: plan.maxTokens || 0,
        costMultiplier: geo.currency.costMultiplier,
        planTiers: config?.tierDefinitions, // ✅ Use FULL tier ranges
        features: config?.features
    });

    // 🎨 Theme Logic
    const isPro = plan.name.toLowerCase().includes("pro");
    const isEnterprise = plan.name.toLowerCase().includes("enterprise") || plan.name.toLowerCase().includes("ultimate");
    const isFree = plan.name.toLowerCase().includes("free");

    // 🏷️ Badge Logic
    let badgeText = "";
    let badgeColor = "";

    if (isEnterprise) {
        badgeText = "MOST POPULAR";
        badgeColor = "bg-purple-600 text-white shadow-purple-500/50";
    } else if (isPro) {
        badgeText = "BEST VALUE";
        badgeColor = "bg-blue-600 text-white shadow-blue-500/50";
    } else if (!isFree) {
        badgeText = "LIMITED DEAL";
        badgeColor = "bg-emerald-600 text-white shadow-emerald-500/50";
    }

    // 🧠 Feature Mapping
    // 1. Included Features
    const includedFeatureIds = plan.featureIds || plan.features || []; // fallback
    const includedFeatures = allFeatures.filter(f => includedFeatureIds.includes(f.id));

    return (
        <Card className={cn(
            "relative flex flex-col h-full border-2 transition-all duration-300 hover:shadow-2xl group",
            isPro || isEnterprise ? "border-primary/20 bg-gradient-to-b from-card to-background" : "border-border bg-card",
            isEnterprise ? "shadow-purple-500/10 dark:shadow-purple-900/20" : "",
            !plan.isActive && "opacity-60 grayscale"
        )}>

            {/* 🏷️ Floating Badge */}
            {badgeText && plan.isActive && (
                <div className={cn("absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-lg z-10", badgeColor)}>
                    {badgeText}
                </div>
            )}

            {/* ⚙️ Action Menu (Top Right) */}
            <div className="absolute top-3 right-3 z-20 transition-opacity opacity-0 group-hover:opacity-100">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background/80 backdrop-blur-sm rounded-full">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(plan); }}>
                            <Edit className="h-4 w-4 mr-2" /> Edit Configuration
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleStatus(plan); }}>
                            <Power className={cn("h-4 w-4 mr-2", plan.isActive ? "text-amber-500" : "text-green-500")} />
                            {plan.isActive ? "Deactivate Plan" : "Activate Plan"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={(e) => { e.stopPropagation(); onDelete(plan.id); }}>
                            <Trash2 className="h-4 w-4 mr-2" /> Delete Permanently
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* 👑 Header Icon for Premium */}
            {isEnterprise && (
                <div className="absolute top-4 right-4 text-purple-500 animate-pulse">
                    <Crown className="w-6 h-6" />
                </div>
            )}

            <CardHeader className="pb-2 pt-8 text-center space-y-2">
                <h3 className="text-xl font-black tracking-tight">{plan.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-1 h-4">
                    {isFree ? "Try before you buy." : isPro ? "Smartest AI for growth." : "Professional power."}
                </p>

                <div className="mt-4 flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-extrabold tracking-tight">
                        {geo.currency.symbol}{finalPrice.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground font-medium text-sm">
                        /{plan.pricing?.interval === "year" ? "yr" : "mo"}
                    </span>
                </div>

                {/* Visual Savings or Discount */}
                {!isFree && finalPrice > 0 && (() => {
                    const originalPrice = calculateOriginalPrice(finalPrice);
                    const discountPercent = Math.round(((originalPrice - finalPrice) / originalPrice) * 100);

                    return (
                        <div className="text-[12px] space-x-2 mt-1">
                            <span className="text-muted-foreground line-through decoration-red-500/50">
                                {geo.currency.symbol}{originalPrice.toLocaleString()}
                            </span>
                            <Badge variant="secondary" className="text-[10px] h-5 bg-green-500/10 text-green-600 hover:bg-green-500/20 px-2">
                                {discountPercent}% OFF
                            </Badge>
                        </div>
                    );
                })()}

                {/* 🪙 Token Display */}
                {plan.maxTokens > 0 && (
                    <div className="mt-2 text-center">
                        <Badge variant="outline" className="border-amber-500/30 text-amber-500 bg-amber-500/5 px-3 py-0.5 text-xs font-mono">
                            {formatTokenCount(plan.maxTokens)} Tokens
                        </Badge>
                    </div>
                )}
            </CardHeader>

            <CardContent className="flex-1 py-6 space-y-6">
                {/* Divider with Text */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-dashed" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Included Features</span>
                    </div>
                </div>

                {/* Feature List */}
                <ul className="space-y-3 text-sm">
                    {/* 1. Master Rules Policies (Virtual Features) */}
                    {plan.canRemoveBranding ? (
                        <li className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                            <span className="font-medium text-foreground">Remove 'Cluaiz' Branding</span>
                        </li>
                    ) : (
                        <li className="flex items-start gap-3 opacity-60">
                            <XCircle className="w-5 h-5 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground">Cluaiz Branding</span>
                        </li>
                    )}

                    {/* 2. Limits Display */}
                    {plan.rolloverPercentage > 0 && (
                        <li className="flex items-start gap-3">
                            <div className="p-1 rounded bg-blue-500/10 text-blue-600 mt-0.5">
                                <Sparkles className="w-3 h-3" />
                            </div>
                            <span className="font-medium text-foreground/90">
                                {plan.rolloverPercentage}% / {plan.rolloverValidity} Days Rollover
                            </span>
                        </li>
                    )}

                    {/* 3. Team Seats Display */}
                    {plan.maxUsers > 0 && (
                        <li className="flex items-start gap-3 group">
                            <div className="p-1 rounded bg-indigo-500/10 text-indigo-600 mt-0.5">
                                <LucideIcons.Users className="w-3 h-3" />
                            </div>
                            <span className="font-medium text-foreground/90">
                                {plan.maxUsers} Team Seats
                            </span>
                        </li>
                    )}

                    {/* 4. Strict Resource Caps (New) */}
                    {(plan.maxWebsites || 0) > 0 && (
                        <li className="flex items-start gap-3">
                            <div className="p-1 rounded bg-rose-500/10 text-rose-600 mt-0.5">
                                <LucideIcons.Globe className="w-3 h-3" />
                            </div>
                            <span className="font-medium text-foreground/90">
                                {plan.maxWebsites} Active Website{plan.maxWebsites > 1 ? 's' : ''}
                            </span>
                        </li>
                    )}
                    {(plan.maxFiles || 0) > 0 && (
                        <li className="flex items-start gap-3">
                            <div className="p-1 rounded bg-orange-500/10 text-orange-600 mt-0.5">
                                <LucideIcons.FileText className="w-3 h-3" />
                            </div>
                            <span className="font-medium text-foreground/90">
                                {plan.maxFiles} AI Knowledge File{plan.maxFiles > 1 ? 's' : ''}
                            </span>
                        </li>
                    )}
                    {(plan.maxForms || 0) > 0 && (
                        <li className="flex items-start gap-3">
                            <div className="p-1 rounded bg-pink-500/10 text-pink-600 mt-0.5">
                                <LucideIcons.FormInput className="w-3 h-3" />
                            </div>
                            <span className="font-medium text-foreground/90">
                                {plan.maxForms} Lead Gen Form{plan.maxForms > 1 ? 's' : ''}
                            </span>
                        </li>
                    )}

                    {/* 4. Real Features List (All included features) */}
                    {includedFeatures.map((feature: any) => {
                        // Dynamic Icon
                        const IconComp = (LucideIcons as any)[feature.icon] || Zap;
                        return (
                            <li key={feature.id} className="flex items-start gap-3 group">
                                <div className="p-1 rounded bg-primary/10 text-primary mt-0.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                    <IconComp className="w-3 h-3" />
                                </div>
                                <span className="font-medium text-foreground/90">{feature.name}</span>
                            </li>
                        );
                    })}


                </ul>
            </CardContent>

            <CardFooter className="pt-0 pb-8 flex flex-col gap-3">
                <Button
                    className={cn(
                        "w-full font-bold shadow-lg h-11 text-base transition-all",
                        isEnterprise ? "bg-purple-600 hover:bg-purple-700 shadow-purple-500/25" : "",
                        !plan.isActive && "opacity-50 cursor-not-allowed"
                    )}
                    variant={isFree ? "outline" : "default"}
                    disabled={!plan.isActive}
                    onClick={() => onEdit(plan)}
                >
                    {isFree ? "Start for Free ->" : `Get ${plan.name} ->`}
                </Button>
                <p className="text-[10px] text-center text-muted-foreground">
                    {isFree ? "No credit card required" : "14-day money back guarantee"}
                </p>
            </CardFooter>
        </Card>
    );
}
