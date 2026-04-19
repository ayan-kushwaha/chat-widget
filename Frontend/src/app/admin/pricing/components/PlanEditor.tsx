"use client";

import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, DollarSign, Tag, Settings, Box, Check, Info, Loader2, Coins, Calculator, CheckCircle2, ChevronsUpDown, CalendarClock } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { featuresAPI } from "@/api/features.api";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { FEATURE_CATEGORIES } from "../data/categories";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { plansAPI } from "@/api/plans.api";
import UsageLimitsDisplay from "./UsageLimitsDisplay";
import { MAX_TOKEN_LIMIT_FALLBACK as MAX_TOKEN_LIMIT } from "@/types/plan-types";
import { calculatePrice, MAX_TOKENS_GLOBAL } from "@/lib/priceUtils";

interface PlanEditorProps {
    open: boolean;
    onClose: () => void;
    plan?: any;
    onSaved: () => void;
    isPublic?: boolean; // New Prop for End-User View
}

import { useGeo } from "@/hooks/useGeo";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { usePlanCalculations } from "@/hooks/usePlanCalculations";

// ... existing imports

export default function PlanEditor({ open, onClose, plan, onSaved, isPublic = false }: PlanEditorProps) {
    // 1. Setup local state
    const [tokenLimit, setTokenLimit] = useState<number>(plan?.maxTokens || 100000);
    const [manualPrice, setManualPrice] = useState<number | null>(plan?.pricing?.inr || plan?.price?.amount || null);

    // Fetch System Config for Tiers
    const { config } = useSystemConfig();
    const geo = useGeo();
    const globalRate = geo.currency.costMultiplier;

    // 2. Use Shared Hook for Calculations (Single Source of Truth)
    const {
        planName: calculatedPlanName,
        permissions,
        quotaFeatures,
        finalPrice,
        isFree
    } = usePlanCalculations({
        plan,
        tokenLimit,
        manualPrice,
        costMultiplier: globalRate,
        planTiers: config?.tierDefinitions, // ✅ Use FULL tier ranges for calculation (not DB plans)
        features: config?.features
    });

    // Helper for safe access
    const safePermissions = permissions.permissions as any;

    // 3. Plan name - ALWAYS use calculated name based on current tokens (real-time update)
    // Only fallback if calculation failed (no planTiers loaded yet)
    const planName = (calculatedPlanName && calculatedPlanName !== 'Loading...')
        ? calculatedPlanName
        : (plan?.name || "Custom Plan");

    const [selectedFeatures, setSelectedFeatures] = useState<string[]>(plan?.featureIds || []);
    const [selectedSubFeatures, setSelectedSubFeatures] = useState<Set<string>>(new Set());

    // 4. Admin Simulator State (Swiftly Moved Up for Hook Access)
    const [baseRate, setBaseRate] = useState<number>(0);

    // Sync Base Rate from Geo Config
    useEffect(() => {
        if (geo.loading || !geo.currency.costMultiplier) return;
        const rate = geo.currency.costMultiplier;
        setBaseRate(Number(rate.toFixed(7)));
    }, [geo.currency.costMultiplier, geo.loading]);

    // Reset State when Plan changes (Strict Reset on Open)
    useEffect(() => {
        if (!open) return; // Only process if modal is open

        // 1. Determine Token Limit Source
        const targetTokens = plan ? (plan.maxTokens || 100000) : 100000;
        setTokenLimit(targetTokens);

        // 2. Determine Price (DB vs Comp) - SYNC CALCULATION TO AVOID RACE
        let initialPrice = null;
        if (plan) {
            const dbPrice = plan.pricing?.inr || plan.price?.amount;
            if (dbPrice && dbPrice > 0) {
                initialPrice = dbPrice;
            } else if (baseRate > 0) {
                // Auto-calculate using fresh baseRate
                console.log("⚡ Instant Auto-Calc for Plan:", targetTokens);
                initialPrice = calculatePrice(targetTokens, baseRate, geo.currency.code);
            }
        } else {
            // New Plan
            if (baseRate > 0) {
                initialPrice = calculatePrice(100000, baseRate, geo.currency.code);
            }
        }

        setManualPrice(initialPrice);

        // 3. Reset Features
        if (plan) {
            setSelectedFeatures(plan.featureIds || []);
            setSelectedSubFeatures(new Set());
        } else {
            setSelectedFeatures([]);
            setSelectedSubFeatures(new Set());
        }
    }, [plan, open, baseRate, geo.currency.code]);

    // Data State
    const [groupedFeatures, setGroupedFeatures] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Master Rules State
    const [canRemoveBranding, setCanRemoveBranding] = useState(false);

    const handleBaseRateChange = (val: number) => {
        setBaseRate(val);
    };
    const [rolloverPercentage, setRolloverPercentage] = useState(0);
    const [rolloverValidity, setRolloverValidity] = useState(0);
    const [dataRetention, setDataRetention] = useState(14);
    const [maxUsers, setMaxUsers] = useState(1);

    // Sync Master Rules
    useEffect(() => {
        const p = permissions.permissions as any;
        setCanRemoveBranding(p.remove_branding);
        setRolloverPercentage(p.rollover_percentage);
        setRolloverValidity(p.rollover_validity_days);
        setDataRetention(p.data_retention_days);
        setMaxUsers(p.max_team_seats);
    }, [permissions]);

    // Pricing Intervals
    const [pricingIntervals, setPricingIntervals] = useState<Array<{
        interval: string;
        amount: number;
        discount?: number;
        isDefault?: boolean;
        label?: string;
    }>>([]);

    useEffect(() => {
        setPricingIntervals([
            { interval: "month", amount: finalPrice, label: "Monthly Billing" },
            { interval: "year", amount: finalPrice * 10, label: "Annual Billing (2 Months Free)" }
        ]);
    }, [finalPrice]);

    // Fetch and Group Logic
    useEffect(() => {
        if (!open) return;
        const fetchFeatures = async () => {
            setIsLoading(true);
            try {
                const res = await featuresAPI.getAll();
                const data = res.data;

                // Group Transformation using GLOBAL CATEGORIES
                const groups: any = {};
                const getGroup = (id: string) => {
                    if (!groups[id]) {
                        // Safe fallback if category ID matches the typed key
                        const style = (FEATURE_CATEGORIES as any)[id] || FEATURE_CATEGORIES.default;
                        groups[id] = { id, label: style.label, items: [] };
                    }
                    return groups[id];
                };

                const allFeatureIds: string[] = [];
                const allSubFeatures = new Set<string>();

                data.forEach((be: any) => {
                    // Use Shared Styles logic
                    const style = (FEATURE_CATEGORIES as any)[be.category] || FEATURE_CATEGORIES.default;
                    const group = getGroup(be.category);

                    let itemBg = style.bg;
                    let itemColor = style.color;

                    if (be.color) {
                        let colorKey = be.color;
                        const match = be.color.match(/text-(\w+)-([0-9]+)/);
                        if (match) colorKey = match[1];
                        itemColor = `text-${colorKey}-500`;
                        itemBg = `bg-${colorKey}-500/10 dark:bg-${colorKey}-500/20`;
                    }

                    const item = {
                        value: be.id,
                        label: be.name,
                        desc: be.description,
                        icon: be.icon || "Box",
                        bg: itemBg,
                        color: itemColor,
                        defaults: {
                            name: be.name,
                            baseMultiplier: be.baseMultiplier,
                            sellMultiplier: be.sellMultiplier,
                            includes: be.includes || []
                        }
                    };
                    group.items.push(item);

                    // Collect IDs for default selection
                    allFeatureIds.push(be.id);
                    if (be.includes && be.includes.length > 0) {
                        be.includes.forEach((_: any, idx: number) => {
                            allSubFeatures.add(`${be.id}:${idx}`);
                        });
                    }
                });

                setGroupedFeatures(Object.values(groups));

                // IF NEW PLAN OR EMPTY SELECTION: Select All By Default
                if (!plan || selectedFeatures.length === 0) {
                    setSelectedFeatures(allFeatureIds);
                    setSelectedSubFeatures(allSubFeatures);
                }
            } catch (error) {
                console.error("PlanEditor Fetch Error:", error);
                toast.error("Could not load features.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchFeatures();
    }, [open, plan]);

    // Init selected sub-features when features change or on load (for Editing scenario)
    useEffect(() => {
        if (plan && groupedFeatures.length > 0 && selectedSubFeatures.size === 0) {
            const initialSubs = new Set<string>();
            groupedFeatures.forEach(group => {
                group.items.forEach((item: any) => {
                    if (selectedFeatures.includes(item.value)) {
                        item.defaults.includes.forEach((sub: any, idx: number) => {
                            initialSubs.add(`${item.value}:${idx}`);
                        });
                    }
                });
            });
            setSelectedSubFeatures(initialSubs);
        }
    }, [groupedFeatures, selectedFeatures, plan]);


    const handleSave = async () => {
        setIsLoading(true);
        try {
            // Generate ID for new plans (snake_case from plan name + random suffix to avoid collision)
            const planId = plan?.id || `${planName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}_${Math.floor(1000 + Math.random() * 9000)}`;

            const payload = {
                id: planId,
                name: planName,
                pricing: {
                    inr: 0, // STRICT: User request - No stored prices. Derived from Tokens.
                    usd: 0,
                    interval: pricingIntervals[0].interval,
                },
                maxTokens: tokenLimit,
                maxUsers: maxUsers,
                features: selectedFeatures,

                // 🛡️ Strict Resource Caps (Saved to Root for Querying)
                maxWebsites: safePermissions.max_websites,
                maxFiles: safePermissions.max_files,
                maxForms: safePermissions.max_forms,
                maxManualEntries: safePermissions.max_manual_qa,

                // Master Rules
                rolloverPercentage,
                rolloverValidity,
                retentionPeriod: dataRetention,
                canRemoveBranding,

                isActive: true,
                isPublic: isPublic
            };

            if (plan?.id) {
                await plansAPI.update(plan.id, payload);
                toast.success("Plan updated successfully");
            } else {
                await plansAPI.create(payload);
                toast.success("Plan created successfully");
            }
            onSaved();
        } catch (error: any) {
            console.error("Save failed", error);
            const msg = error.response?.data?.message || error.message || "Failed to save plan";
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate Fresh Multipliers based on Granular Selection
    const totals = useMemo(() => {
        let base = 0;
        let sell = 0;
        let count = 0;

        const allFeatures = groupedFeatures.flatMap(cat => cat.items);

        selectedFeatures.forEach(id => {
            const template = allFeatures.find((t: any) => t.value === id) as any;
            if (template) {
                count++;
                if (template.defaults.includes && template.defaults.includes.length > 0) {
                    template.defaults.includes.forEach((item: any, idx: number) => {
                        // Check if this specific sub-feature is selected
                        if (selectedSubFeatures.has(`${id}:${idx}`)) {
                            base += (item.baseMultiplier || 0);
                            sell += (item.sellMultiplier || 0);
                        }
                    });
                } else {
                    // Fallback for single items
                    base += (template.defaults.baseMultiplier || 0);
                    sell += (template.defaults.sellMultiplier || 0);
                }
            }
        });

        return { base: Number(base.toFixed(2)), sell: Number(sell.toFixed(2)), count };
    }, [selectedFeatures, groupedFeatures, selectedSubFeatures]);

    // Handle Parent Toggle
    const toggleFeature = (id: string, currentlySelected: boolean) => {
        const allFeatures = groupedFeatures.flatMap(cat => cat.items);
        const feature = allFeatures.find((f: any) => f.value === id);

        if (currentlySelected) {
            // Uncheck Parent -> Remove ID and all sub-IDs
            setSelectedFeatures(prev => prev.filter(f => f !== id));
            setSelectedSubFeatures(prev => {
                const next = new Set(prev);
                feature.defaults.includes.forEach((_: any, idx: number) => next.delete(`${id}:${idx}`));
                return next;
            });
        } else {
            // Check Parent -> Add ID and ALL sub-IDs
            setSelectedFeatures(prev => [...prev, id]);
            setSelectedSubFeatures(prev => {
                const next = new Set(prev);
                feature.defaults.includes.forEach((_: any, idx: number) => next.add(`${id}:${idx}`));
                return next;
            });
        }
    };

    // Handle Sub-Feature Toggle
    const toggleSubFeature = (featureId: string, idx: number, checked: boolean) => {
        const newSet = new Set(selectedSubFeatures);
        const key = `${featureId}:${idx}`;

        if (checked) {
            newSet.add(key);
            // Auto-select parent if not selected
            if (!selectedFeatures.includes(featureId)) {
                setSelectedFeatures(prev => [...prev, featureId]);
            }
        } else {
            newSet.delete(key);
        }
        setSelectedSubFeatures(newSet);
    };

    const addInterval = () => {
        setPricingIntervals([...pricingIntervals, { interval: "year", amount: 0, discount: 0, isDefault: false }]);
    };

    // 🏎️ SIMULATOR LOGIC
    // New Logic: Price is purely based on Token Limit (Volume).
    // Features determing the "Burn Rate" (Sell Factor), not the Price.

    // Simulator Constraints
    // const MAX_TOKENS = 10000000; // 10 Million -> Using Shared Constant
    const MAX_TOKENS = MAX_TOKEN_LIMIT;

    // Bidirectional Handlers
    const handleTokenChange = (tokens: number) => {
        // Enforce Range: 0 to MAX
        const safeTokens = Math.max(0, Math.min(tokens, MAX_TOKENS));
        setTokenLimit(safeTokens);
        setManualPrice(calculatePrice(safeTokens, baseRate, geo.currency.code));
    };

    const handlePriceChange = (price: number) => {
        // Enforce Min Price: 0
        const safePrice = Math.max(0, price);
        setManualPrice(safePrice);

        // Auto-update tokens based on rate
        if (baseRate > 0) {
            let rawTokens = safePrice / baseRate;
            // Enforce Cap & Min
            if (rawTokens > MAX_TOKENS) {
                rawTokens = MAX_TOKENS;
                toast.warning(`Token limit capped at 10M (${MAX_TOKENS.toLocaleString()})`);
            }
            // Round to nearest 100
            setTokenLimit(Math.max(0, Math.floor(rawTokens / 100) * 100));
        }
    };

    // Late Load Fallback: If BaseRate loads AFTER modal open and price is still 0
    useEffect(() => {
        if (open && baseRate > 0 && (!manualPrice || manualPrice === 0) && tokenLimit > 0) {
            // Only runs if manualPrice wasn't set by the main effect (e.g. rate was 0)
            setManualPrice(calculatePrice(tokenLimit, baseRate, geo.currency.code));
        }
    }, [baseRate]); // Minimal dep to avoid loops

    // Calculated Price = Token Limit * Base Rate
    const calculatedValue = calculatePrice(tokenLimit, baseRate, geo.currency.code);
    const suggestedTokens = manualPrice && baseRate > 0 ? Math.floor(manualPrice / baseRate) : 0;


    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0 bg-background">
                <DialogHeader className="p-6 border-b">
                    <DialogTitle className="text-xl flex items-center gap-2">
                        {plan ? "Edit Plan" : "Create New Plan"}
                        <span className="hidden md:inline text-slate-300 mx-2">|</span>
                        <span className="text-primary font-mono font-semibold">{planName}</span>
                    </DialogTitle>
                    <div className="text-sm text-muted-foreground hidden">Configure plan features, pricing, and limits</div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto bg-muted/10">
                    <Tabs defaultValue="features" className="flex flex-col h-full">
                        <div className="px-6 py-2 border-b bg-background sticky top-0 z-10">
                            <TabsList className="grid grid-cols-2 w-full h-10">
                                <TabsTrigger value="features">Feature Selection</TabsTrigger>
                                <TabsTrigger value="limits">Usage Limits</TabsTrigger>
                            </TabsList>
                        </div>

                        {/* FEATURES TAB */}
                        <TabsContent value="features" className="flex-1 p-6 m-0 overflow-visible space-y-6">
                            {isLoading ? (
                                <div className="flex justify-center items-center py-20">
                                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Left: Feature List */}
                                    <div className="space-y-8">
                                        {groupedFeatures.map((category) => (
                                            <div key={category.id} className="space-y-4">
                                                <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 flex items-center gap-2 border-b pb-2">
                                                    {category.label}
                                                </h3>
                                                <div className="space-y-3">
                                                    {category.items.map((feature: any) => {
                                                        const isSelected = selectedFeatures.includes(feature.value);
                                                        return (
                                                            <div key={feature.value} className={`rounded-xl border transition-all ${isSelected ? 'border-primary/50 bg-primary/5 shadow-sm' : 'border-border bg-card'}`}>
                                                                {/* Header */}
                                                                <div className="p-4 flex items-start gap-4 cursor-pointer" onClick={() => toggleFeature(feature.value, isSelected)}>
                                                                    <div className={`mt-1 p-2 rounded-lg text-white shrink-0 ${feature.bg}`}>
                                                                        {(() => {
                                                                            const IconComp = (LucideIcons as any)[feature.icon];
                                                                            return IconComp ? <IconComp className="w-5 h-5" /> : <span className="text-xl">{feature.icon}</span>;
                                                                        })()}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="flex items-center gap-2">
                                                                                <h4 className="font-bold text-base text-foreground">{feature.label}</h4>
                                                                                {(() => {
                                                                                    const key = feature.value.toLowerCase() + " " + feature.label.toLowerCase();
                                                                                    if (key.includes('website') || key.includes('crawl') || key.includes('file') || key.includes('knowledge') || key.includes('document') || key.includes('ocr') || key.includes('form') || key.includes('lead form') || key.includes('survey') || key.includes('member') || key.includes('team') || key.includes('seat') || key.includes('user') || key.includes('api') || key.includes('webhook') || key.includes('connect') || key.includes('storage') || key.includes('vector') || key.includes('memory') || key.includes('brain') || key.includes('cluaiz ai')) {
                                                                                        return <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700">Fixed Cap</Badge>;
                                                                                    } else {
                                                                                        return <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400 border-green-200 dark:border-green-800">Unlimited</Badge>;
                                                                                    }
                                                                                })()}
                                                                            </div>
                                                                            <Checkbox
                                                                                checked={isSelected}
                                                                                onCheckedChange={() => toggleFeature(feature.value, isSelected)}
                                                                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                                            />
                                                                        </div>
                                                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{feature.desc}</p>
                                                                    </div>
                                                                </div>

                                                                {/* 2. Template Defaults (Premium Display) - Hide in Public Mode */}
                                                                {!isPublic && (!feature.defaults.includes || feature.defaults.includes.length === 0) && (
                                                                    <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900/30 border-t border-b border-dashed border-zinc-200 dark:border-zinc-800">
                                                                        <div className="grid grid-cols-2 gap-4">
                                                                            {/* My Cost */}
                                                                            <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 shadow-sm">
                                                                                <span className="text-[9px] font-extrabold text-red-400 uppercase tracking-wider flex items-center gap-1">
                                                                                    <div className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                                                                                    My Base
                                                                                </span>
                                                                                <div className="text-xl font-black text-zinc-700 dark:text-zinc-300 tracking-tight">
                                                                                    {(() => {
                                                                                        let baseCost = feature.defaults.baseCost || 0;
                                                                                        return baseCost > 0 ? (
                                                                                            <span className="flex items-baseline gap-0.5">
                                                                                                {parseFloat(baseCost.toFixed(2))}
                                                                                                <span className="text-xs font-bold text-zinc-400">x</span>
                                                                                            </span>
                                                                                        ) : <span className="text-sm font-bold text-emerald-500">FREE</span>
                                                                                    })()}
                                                                                </div>
                                                                            </div>

                                                                            {/* Sell Price */}
                                                                            <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-green-50/50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/40 shadow-sm">
                                                                                <span className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                                                                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                                                    Sell Price
                                                                                </span>
                                                                                <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight">
                                                                                    {(() => {
                                                                                        let sellPrice = feature.defaults.sellPrice || 0;
                                                                                        return sellPrice > 0 ? (
                                                                                            <span className="flex items-baseline gap-0.5">
                                                                                                {parseFloat(sellPrice.toFixed(2))}
                                                                                                <span className="text-xs font-bold text-emerald-600/70">x</span>
                                                                                            </span>
                                                                                        ) : <span className="text-sm font-bold text-emerald-500">FREE</span>
                                                                                    })()}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Granular Sub-Features */}
                                                                {isSelected && feature.defaults.includes && feature.defaults.includes.length > 0 && (
                                                                    <div className="bg-white/50 dark:bg-black/20 border-t p-3 space-y-2 rounded-b-xl">
                                                                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">Includes</div>
                                                                        {feature.defaults.includes.map((sub: any, idx: number) => {
                                                                            const subChecked = selectedSubFeatures.has(`${feature.value}:${idx}`);
                                                                            return (
                                                                                <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                                                                    <Checkbox
                                                                                        checked={subChecked}
                                                                                        onCheckedChange={(c) => toggleSubFeature(feature.value, idx, !!c)}
                                                                                        id={`sub-${feature.value}-${idx}`}
                                                                                    />
                                                                                    <div className="flex-1 grid grid-cols-[1fr_auto] gap-4">
                                                                                        <label htmlFor={`sub-${feature.value}-${idx}`} className="text-sm font-medium cursor-pointer select-none">
                                                                                            {sub.name}
                                                                                        </label>
                                                                                        {!isPublic && (
                                                                                            <div className="flex items-center gap-3 text-xs font-mono">
                                                                                                <span className="text-muted-foreground">My: {sub.baseMultiplier}x</span>
                                                                                                <span className="font-bold text-green-600 dark:text-green-400">Sell: {sub.sellMultiplier}x</span>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Right: Sticky Simulation Card */}
                                    <div className="lg:sticky lg:top-6 h-fit space-y-6">
                                        <Card className="p-6 border-2 border-primary/20 shadow-2xl bg-gradient-to-br from-white to-primary/5 dark:from-zinc-950 dark:to-primary/10">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="p-3 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/25">
                                                    <Calculator className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-xl">Plan Simulator</h3>
                                                    <p className="text-xs text-muted-foreground">Estimate costs & margins in real-time</p>
                                                </div>
                                            </div>

                                            {/* Metrics Grid */}
                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                <div className="p-3 bg-background rounded-lg border shadow-sm">
                                                    <div className="text-xs text-muted-foreground font-medium uppercase">Active Features</div>
                                                    <div className="text-2xl font-bold">{totals.count}</div>
                                                </div>
                                                <div className="p-3 bg-background rounded-lg border shadow-sm">
                                                    <div className="text-xs text-muted-foreground font-medium uppercase">Avg Burn Rate</div>
                                                    <div className="text-2xl font-bold text-amber-500">{totals.sell}x</div>
                                                    <div className="text-[10px] text-muted-foreground">Multiplier</div>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                {/* Token Slider */}
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <Label>Monthly Token Limit</Label>
                                                        <div className="flex items-center gap-1 font-mono font-bold text-primary">
                                                            <Coins className="w-4 h-4" />
                                                            {tokenLimit.toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <Slider
                                                        value={[tokenLimit]}
                                                        onValueChange={(v) => handleTokenChange(v[0])}
                                                        min={0}
                                                        max={MAX_TOKENS}
                                                        step={100}
                                                        className="py-2"
                                                    />
                                                    <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                                                        <span>0</span>
                                                        <span>1.5M</span>
                                                        <span>3M</span>
                                                        <span>6M</span>
                                                        <span>7.5M</span>
                                                        <span>9M</span>
                                                        <span>12M</span>
                                                    </div>
                                                </div>

                                                {/* Base Rate Config */}
                                                <div className="space-y-2">
                                                    <Label className="text-xs text-muted-foreground">Price per Token ({geo.currency.symbol})</Label>
                                                    <Input
                                                        type="number"
                                                        disabled={true}
                                                        step="0.0000001"
                                                        value={baseRate}
                                                        onChange={(e) => handleBaseRateChange(Number(e.target.value))}
                                                        className="h-8 text-sm"
                                                    />
                                                </div>

                                                {/* Calculated Price */}
                                                <div className="pt-6 border-t border-dashed space-y-4">
                                                    <div className="space-y-2">
                                                        <Label className="flex justify-between text-sm">
                                                            <span>Suggested Monthly Price</span>
                                                            <span className="text-xs text-muted-foreground font-normal">(Based on {baseRate}/token)</span>
                                                        </Label>
                                                        <div className="flex items-center gap-3 bg-background p-3 rounded-lg border-2 border-primary/10">
                                                            <span className="text-2xl font-black">{geo.currency.symbol}</span>
                                                            <Input
                                                                type="number"
                                                                value={manualPrice || 0}
                                                                onChange={(e) => handlePriceChange(Number(e.target.value))}
                                                                className="text-3xl font-black bg-transparent border-none shadow-none p-0 h-auto focus-visible:ring-0"
                                                            />
                                                        </div>
                                                        {(manualPrice || 0) > 0 && (
                                                            <div className="text-xs text-muted-foreground text-right animate-in fade-in">
                                                                At ₹{manualPrice}, users get ~{tokenLimit.toLocaleString()} tokens
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="text-[10px] text-muted-foreground/60 leading-relaxed text-center bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-blue-600 dark:text-blue-300">
                                                        <Info className="w-3 h-3 inline mr-1" />
                                                        Note: Features do not affect price. They only determine how fast tokens are consumed (Burn Rate).
                                                    </div>
                                                </div>

                                            </div>
                                        </Card>
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        {/* PRICING TAB - Simplified now that we have Simulator */}
                        <TabsContent value="pricing" className="p-6 m-0 space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium text-lg">Billing Intervals</h4>
                                    <p className="text-sm text-muted-foreground">Define custom price points for this plan.</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={addInterval}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Interval
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {pricingIntervals.map((pricing, index) => (
                                    <div key={index} className="flex gap-4 items-end bg-card p-4 rounded-xl border shadow-sm">
                                        <div className="w-[200px] space-y-1.5">
                                            <Label className="text-xs uppercase font-bold text-muted-foreground">Interval</Label>
                                            <select className="flex h-10 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                                                <option value="month">Monthly</option>
                                                <option value="3-month">Quarterly (3 Mo)</option>
                                                <option value="year">Yearly (12 Mo)</option>
                                            </select>
                                        </div>
                                        <div className="flex-1 space-y-1.5">
                                            <Label className="text-xs uppercase font-bold text-muted-foreground">Price (₹)</Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
                                                <Input type="number" placeholder="499" className="pl-8 h-10 font-bold" defaultValue={manualPrice || 0} />
                                            </div>
                                        </div>
                                        <div className="w-[120px] space-y-1.5">
                                            <Label className="text-xs uppercase font-bold text-muted-foreground">Discount %</Label>
                                            <Input type="number" placeholder="0" className="h-10" />
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-10 w-10 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg">
                                            <Trash2 className="w-5 h-5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        {/* LIMITS TAB - Now Auto-Calculated via Resource Partitioning */}
                        <TabsContent value="limits" className="p-6 m-0 space-y-6">
                            {/* MASTER RULES CARD */}
                            <Card className="p-0 overflow-hidden border-2 border-purple-100 dark:border-purple-900/50 bg-white dark:bg-zinc-950/50 shadow-sm">
                                <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 border-b border-purple-100 dark:border-purple-900/50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 hover:bg-purple-200">
                                            👑 Master Rules
                                        </Badge>
                                        <span className="text-xs text-muted-foreground font-medium">Auto-configured</span>
                                    </div>
                                    <div className="text-[10px] uppercase font-bold text-purple-600/60 dark:text-purple-400/60 tracking-wider">
                                        Policy Enforcer
                                    </div>
                                </div>

                                <div className="p-5 grid grid-cols-2 gap-4">
                                    {/* 1. Data Retention */}
                                    <div className="flex items-start gap-3 p-3 rounded-lg border bg-zinc-50/50 dark:bg-zinc-900/50">
                                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-md mt-0.5">
                                            <LucideIcons.Archive className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">Data Retention</div>
                                            <div className="text-sm font-bold mt-0.5">{dataRetention} Days</div>
                                            <div className="text-[10px] text-muted-foreground mt-0.5">Post-expiry grace period</div>
                                        </div>
                                    </div>

                                    {/* 2. Rollover Logic */}
                                    <div className="flex items-start gap-3 p-3 rounded-lg border bg-zinc-50/50 dark:bg-zinc-900/50">
                                        <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-md mt-0.5">
                                            <LucideIcons.Sparkles className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">Rollover</div>
                                            <div className="text-sm font-bold mt-0.5">{rolloverPercentage}% / {rolloverValidity} Days</div>
                                            <div className="text-[10px] text-muted-foreground mt-0.5">unused tokens carry-forward</div>
                                        </div>
                                    </div>

                                    {/* 3. Billing Cycle */}
                                    <div className="flex items-start gap-3 p-3 rounded-lg border bg-zinc-50/50 dark:bg-zinc-900/50">
                                        <div className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 rounded-md mt-0.5">
                                            <CalendarClock className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">Cycle Type</div>
                                            <div className="text-sm font-bold mt-0.5">{planName.toLowerCase().includes('free') ? '14 Days Fixed' : 'Monthly (Date-to-Date)'}</div>
                                            <div className="text-[10px] text-muted-foreground mt-0.5">Renewal frequency</div>
                                        </div>
                                    </div>

                                    {/* 4. Branding Policy */}
                                    <div className={cn("flex items-start gap-3 p-3 rounded-lg border transition-colors",
                                        canRemoveBranding ? "bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/50" : "bg-red-50/50 border-red-100 dark:bg-red-950/10 dark:border-red-900/50")}>
                                        <div className={cn("p-2 rounded-md mt-0.5", canRemoveBranding ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" : "bg-red-100 text-red-600 dark:bg-red-900/30")}>
                                            {canRemoveBranding ? <Check className="w-4 h-4" /> : <Box className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">White-Labeling</div>
                                            <div className={cn("text-sm font-bold mt-0.5", canRemoveBranding ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400")}>
                                                {canRemoveBranding ? "Allowed" : "Forced Watermark"}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground mt-0.5">
                                                {canRemoveBranding ? "User can hide 'Powered by'" : "Brand logo is mandatory"}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 5. Team Access (Spans 2 cols) */}
                                    <div className="col-span-2 flex items-start gap-3 p-3 rounded-lg border bg-zinc-50/50 dark:bg-zinc-900/50">
                                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-md mt-0.5">
                                            <LucideIcons.Users className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">Team Access</div>
                                                    <div className="text-sm font-bold mt-0.5">{maxUsers > 20 ? "Unlimited Seats" : `${maxUsers} Team Seats`}</div>
                                                </div>
                                                <Badge variant="outline" className="text-[10px] h-5 px-2 bg-indigo-100 text-indigo-700 border-indigo-200">
                                                    {maxUsers} Users
                                                </Badge>
                                            </div>
                                            <div className="text-[10px] text-muted-foreground mt-0.5">Collaborative workspace access</div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 mb-6">
                                <h4 className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                                    <Info className="w-4 h-4" />
                                    Resource Partitioning Active
                                </h4>
                                <p className="text-sm text-blue-600/80 dark:text-blue-300/80 mt-1">
                                    Limits are automatically calculated based on the <strong>{tokenLimit.toLocaleString()} monthly tokens</strong>.
                                    We reserve small portions of the plan for "Heavy" tasks (Scanning, Storage) to prevent abuse, while keeping Chat & Leads unlimited.
                                </p>
                            </div>


                            {/* Clean Usage Limits Display */}
                            <UsageLimitsDisplay
                                tokenLimit={tokenLimit}
                                selectedFeatures={selectedFeatures}
                                groupedFeatures={groupedFeatures}
                                quotaFeatures={quotaFeatures}
                            />

                        </TabsContent>

                    </Tabs>
                </div>

                <DialogFooter className="p-6 border-t bg-zinc-50 dark:bg-zinc-900/50">
                    <div className="flex w-full items-center justify-between">
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Badge variant="outline">{totals.count} features</Badge>
                            <span>•</span>
                            <span>Total Scale: <strong className="text-foreground">{totals.sell}x</strong></span>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={onClose}>Cancel</Button>
                            <Button className="min-w-[120px]" onClick={handleSave} disabled={isLoading}>
                                {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                Save Plan
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    );
}
