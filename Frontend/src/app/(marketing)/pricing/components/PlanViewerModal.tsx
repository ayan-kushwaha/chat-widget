"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogOverlay } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Zap, CheckCircle2, Calculator, Coins, Lock, Info, Shield, Plus, Crown, Sparkles, Rocket, Infinity as InfinityIcon, ArrowRight } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getThemeColorClasses } from "@/lib/themeUtils";
import { useSession } from 'next-auth/react';
// import { LoginModal } from '@/components/auth/LoginModal';
import { motion, AnimatePresence } from "framer-motion";
import { FEATURE_CATEGORIES } from "@/app/admin/pricing/data/categories";

// Premium MagicUI Components
import { NumberTicker } from "@/components/ui/number-ticker";
import { SparklesText } from "@/components/ui/sparkles-text";
import { BorderBeam } from "@/components/ui/border-beam";
import { Meteors } from "@/components/ui/meteors";

import { usePlanCalculations } from "@/hooks/usePlanCalculations";

import { useSystemConfig, FeatureDefinition } from "@/hooks/useSystemConfig";
import { getPlanTheme } from "@/utils/planThemes";
import { useGeo } from '@/hooks/useGeo';
import { featuresAPI } from "@/api/features.api";
import { useCheckoutStore } from "@/stores/checkout.store";
import { encodeBillingPayload } from "@/utils/billingCrypto";

import { STANDARD_LIMITS, ID_MAPPING, KNOWN_LIMIT_IDS } from "@/config/features.config";

// ... (Imports)

const CATEGORY_STYLES: Record<string, { color: string; bg: string; label: string }> = FEATURE_CATEGORIES;

// (STANDARD_LIMITS Removed)

interface PlanViewerModalProps {
    open: boolean;
    plan: any;
    onClose: () => void;
    initialTab?: string;
}

export default function PlanViewerModal({ open, plan, onClose, initialTab }: PlanViewerModalProps) {
    // ... (Hooks)
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const currentTab = initialTab || searchParams.get('tab') || 'customize-plan';
    const [activeTab, setActiveTab] = useState(currentTab);

    // ... (Tabs effect)
    useEffect(() => {
        const tabFromUrl = searchParams.get('tab');
        if (tabFromUrl && tabFromUrl !== activeTab) {
            setActiveTab(tabFromUrl);
        }
    }, [searchParams, activeTab]);

    const geo = useGeo();
    const costMultiplier = geo.currency.costMultiplier || 0;

    // ... (Token Logic - Preserved)
    const [tokenLimit, setTokenLimit] = useState<number>(500000);

    useEffect(() => {
        if (plan) {
            // � STRICT INIT: Trust maxTokens first. Back-calculation removed to prevent currency mismatches.
            // fallback to 500,000 if not defined, ensuring we don't accidentally show huge numbers from INR prices.
            const startTokens = plan.maxTokens || plan.rawData?.maxTokens || 500000;
            setTokenLimit(startTokens);
        }
    }, [plan]);

    // ... (Session)
    const { data: session, status } = useSession();

    // ✅ Use System Config Hook for Global Data
    const { config, loading: configLoading } = useSystemConfig();

    // 🔥 Refactored: Fetch Dynamic Features from API to match Admin Library
    // Merge Fallback (Standard IDs) with Config (Rich Data)
    const dbFeatures = (config?.features && Object.keys(config.features).length > 0) ? Object.values(config.features) : [];

    // (ID_MAPPING Removed - Imported)
    // (KNOWN_LIMIT_IDS Removed - Imported)

    // 1. Get Limits from DB (if they exist)
    const dbLimits = dbFeatures.filter((f: any) =>
        (f.category === 'limits' || f.category === 'usage' || f.type === 'numeric' || f.location === 'limits') ||
        KNOWN_LIMIT_IDS.includes(f.id) ||
        !f.id.startsWith('_') && Object.keys(ID_MAPPING).includes(f.id)
    );

    // 2. Merge with Standard Limits (Fallback for missing definitions)
    const limitsFeatures = [...STANDARD_LIMITS];

    // Add any DB-only limits that aren't in Standard
    dbLimits.forEach((dbF: any) => {
        if (!limitsFeatures.find(sf => sf.id === dbF.id)) {
            limitsFeatures.push(dbF);
        }
    });

    const moduleFeatures = dbFeatures.filter((f: any) => !limitsFeatures.includes(f));

    const featuresLoading = false;

    // Async fetch removed to prevent empty state.

    const maxTokenLimit = config?.maxTokenLimit || 12000000;

    // ✅ USE SHARED HOOK - Replaces manual logic for price, themes, permissions & quota
    // This ensures consistency with Admin Editor logic
    const {
        finalPrice,
        permissions,
        planName,
        allQuotaFeatures,
        quotaFeatures, // ✅ Added missing destructure
        theme,
        isFree,
        loading // ⏳ Consume Loading State
    } = usePlanCalculations({
        plan: plan,
        tokenLimit: tokenLimit,
        costMultiplier: costMultiplier,
        // STRICT: No manual price override. Always calculate live.
        planTiers: config?.planTiers,
        tierDefinitions: config?.tierDefinitions, // Pass Full Definitions for Permissions
        features: config?.features
    });

    // Filter All Features to EXCLUDE Modules (keep Quota + Policies) for the Top Grid
    const configList = config?.features ? Object.values(config.features) : [];
    // Resource Limits Tab: Uses Standard FALLBACK IDs that match permissions directly
    const displayFeatures = limitsFeatures.filter((f: any) => {
        const key = ID_MAPPING[f.id] || f.id;
        // EXCLUDE redundant module-level IDs from the "Limits" grid to avoid duplicates
        if (f.id === 'smart_forms' || f.id === 'analytics_suite') return false;

        const val = (permissions.permissions as any)?.[key];
        return val !== undefined || key === 'remove_branding'; // Branding is boolean so false is valid
    });
    // console.log("displayFeatures ❗❗❗❗", displayFeatures);
    // Debug: Log to confirm it works
    useEffect(() => {
        // console.log('🎨 Hook Result:', { theme, finalPrice, isFree });
    }, [theme, finalPrice]);

    // Debug: Log when values update
    useEffect(() => {
        // console.log('🔄 PlanViewerModal - Dynamic update:', {
        //     tokenLimit,
        //     quotaFeaturesCount: quotaFeatures.length
        // });
    }, [tokenLimit, quotaFeatures]);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', value);
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    // (Duplicate useEffect removed)

    if (!plan) return null;

    if (!plan) return null;

    const handleProceedToBilling = () => {
        // Direct Redirect - Auth handled on Billing Page
        proceedToBilling();
    };

    const proceedToBilling = () => {
        console.log("🚀 Redirecting to Billing...");
        // 🔐 Secure Checkout Navigation
        // 1. Save Preference to Store (Memory)
        useCheckoutStore.getState().setBillingCycle(activeTab === 'yearly' ? 'yearly' : 'monthly');

        // 2. Generate Encrypted Payload (Tokens + PlanID)
        const securePayload = encodeBillingPayload(tokenLimit, plan.id);

        // 3. Navigate with ONLY the secure payload
        router.push(`/billing?q=${securePayload}`);
    }


    const handleLoginSuccess = () => {
        // Session refresh handled inside modal or auto-propagated
        // Proceed directly after brief delay or immediately
        proceedToBilling();
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onClose} modal={true}>
                <AnimatePresence>
                    {open && (
                        <>
                            <DialogOverlay className="fixed inset-0 z-[99999] bg-black/50 backdrop-blur-md" />
                            <DialogContent className={cn("fixed left-[50%] top-[50%] z-[99999] translate-x-[-50%] translate-y-[-50%] w-full max-w-5xl h-[95vh] overflow-hidden flex flex-col bg-gradient-to-br p-0 gap-0 shadow-2xl duration-200 sm:rounded-2xl border-2")} style={{ borderColor: theme.accentColor, background: `linear-gradient(to bottom right, #0f172a, ${theme.accentColor}20, #0f172a)` }}>
                                <DialogTitle className="sr-only">Customize {planName} Plan</DialogTitle>
                                <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col h-full w-full">

                                    {/* Header Section with Meteors */}
                                    <div className={cn("relative overflow-hidden border-b p-6 shrink-0 z-20")} style={{ borderColor: `${theme.accentColor}50`, backgroundColor: `${theme.accentColor}10` }}>
                                        <Meteors number={20} className="opacity-30" />
                                        <div className="relative z-10 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <motion.div
                                                    initial={{ scale: 0.8, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    className={cn("p-3 rounded-xl border bg-slate-950 shadow-lg", theme.border)}
                                                >
                                                    <Calculator className="w-6 h-6" style={{ color: theme.accentColor }} />
                                                </motion.div>
                                                <div>
                                                    <SparklesText className="text-2xl font-bold leading-none text-white/90" colors={{ first: "#fff", second: "#94a3b8" }} sparklesCount={5}>
                                                        {planName}
                                                    </SparklesText>
                                                    <div className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                                                        Customizing <Badge variant="secondary" className="ml-1 border" style={{ backgroundColor: `${theme.accentColor}20`, color: theme.accentColor, borderColor: `${theme.accentColor}50` }}>
                                                            {planName}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Tabs List */}
                                            <TabsList className="border rounded-full h-10 p-1 mr-6" style={{ borderColor: `${theme.accentColor}50`, backgroundColor: `${theme.accentColor}10` }}>
                                                <TabsTrigger value="customize-plan" className="rounded-full hover:text-black/80 px-4 text-xs font-medium data-[state=active]:text-black/80 " style={{ backgroundColor: activeTab === 'customize-plan' ? theme.accentColor : 'transparent' }}>
                                                    Customize Plan
                                                </TabsTrigger>
                                                <span className="border h-8 p-0 mx-1" style={{ borderColor: `${theme.accentColor}30` }}></span>
                                                <TabsTrigger value="features" className="rounded-full hover:text-black/80 px-4 text-xs font-medium data-[state=active]:text-black/80" style={{ backgroundColor: activeTab === 'features' ? theme.accentColor : 'transparent' }}>
                                                    Features
                                                </TabsTrigger>
                                            </TabsList>
                                        </div>
                                    </div>

                                    {/* Content Area */}
                                    {/* Ambient Glow */}
                                    <div className={cn("absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-10 pointer-events-none", theme.bg.replace('/30', ''))} />

                                    <ScrollArea className="  scrollbar-hide scrollbar-thin">
                                        <div className="p-6">
                                            <TabsContent value="customize-plan" className="mt-0 space-y-8 data-[state=inactive]:hidden">
                                                {/* Price & Token Overview */}
                                                <div className="flex flex-col gap-6">
                                                    {/* Token Control */}
                                                    <Card className="p-6 bg-slate-900/40 backdrop-blur-xl border-slate-700/50 relative overflow-hidden group shadow-2xl">
                                                        {/* Animated gradient background */}
                                                        <motion.div
                                                            className={cn("absolute inset-0 opacity-10", theme.bgGradient)}
                                                            animate={{
                                                                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                                                            }}
                                                            transition={{
                                                                duration: 5,
                                                                repeat: Infinity,
                                                                ease: "linear"
                                                            }}
                                                            style={{ backgroundSize: "200% 200%" }}
                                                        />
                                                        <div className="flex items-center justify-between mb-8">
                                                            <div>
                                                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                                    <Coins className={cn("w-5 h-5", theme.primary)} />
                                                                    Token Limit
                                                                </h3>
                                                                <p className="text-sm text-slate-400">Scale your AI capacity</p>
                                                            </div>
                                                            <div className={cn("px-4 py-2 rounded-lg border bg-slate-950 flex items-center gap-2", theme.border)}>
                                                                <span style={{ color: theme.accentColor }}>
                                                                    {loading ? (
                                                                        <div className="h-8 w-24 bg-slate-800 animate-pulse rounded" />
                                                                    ) : (
                                                                        <NumberTicker value={tokenLimit} className="text-2xl font-mono font-bold" />
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <Slider
                                                            value={[tokenLimit]}
                                                            onValueChange={(val) => {
                                                                console.log('🎚️ Slider changed:', val[0]);
                                                                setTokenLimit(val[0]);
                                                            }}
                                                            min={300000}
                                                            max={maxTokenLimit}
                                                            step={10000}
                                                            disabled={isFree}
                                                            className={cn("w-full mb-2", theme.color === 'emerald' ? 'dark' : '', isFree && 'opacity-50 cursor-not-allowed')}
                                                        />
                                                        <div className="flex justify-between text-xs text-slate-500 font-mono">
                                                            <span>3L</span>
                                                            <span>2M</span>
                                                            <span>3.5M</span>
                                                            <span>5M</span>
                                                            <span>7M</span>
                                                            <span>8.5M</span>
                                                            <span>10M</span>
                                                            <span>12M</span>
                                                        </div>

                                                        {/* Strict Caps Section */}
                                                        <motion.div
                                                            className="mt-6"

                                                        >
                                                            <Card className="p-6 border-2 backdrop-blur-xl shadow-2xl relative overflow-hidden bg-gradient-to-br from-slate-900/20 via-slate-800/10 to-slate-900/10" style={{ borderColor: `${theme.accentColor}50` }}>
                                                                {/* Plan-colored ambient glow */}
                                                                <div className="absolute inset-0 opacity-[0.08] pointer-events-none bg-gradient-to-br" style={{ background: theme.accentColor }} />
                                                                <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-15" style={{ background: theme.accentColor }} />
                                                                <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full blur-3xl opacity-10" style={{ background: theme.accentColor }} />

                                                                <div className="flex items-center justify-between mb-6 relative z-10">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={cn("p-2.5 rounded-xl shadow-lg", theme.bg)} style={{ color: theme.accentColor }}>
                                                                            <LucideIcons.Shield className="w-5 h-5" />
                                                                        </div>
                                                                        <div>
                                                                            <h3 className="text-lg font-bold text-white">Resource Limits</h3>
                                                                            <p className="text-xs text-slate-400">Maximum usage caps per billing cycle</p>
                                                                        </div>
                                                                    </div>
                                                                    <Badge variant="outline" className="text-[10px] font-bold px-3 py-1" style={{ borderColor: `${theme.accentColor}50`, color: theme.accentColor }}>
                                                                        {displayFeatures.length} Limits
                                                                    </Badge>
                                                                </div>

                                                                {displayFeatures.length == 0 ? (
                                                                    <div className="text-center flex flex-col py-12 relative z-10">
                                                                        <p className="text-sm font-medium">No limits configured</p>
                                                                    </div>
                                                                ) : (

                                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                                                                        {displayFeatures.map((feature, idx) => {
                                                                            const IconComponent = feature.icon && (LucideIcons as any)[feature.icon]
                                                                                ? (LucideIcons as any)[feature.icon]
                                                                                : LucideIcons.Shield;

                                                                            // Value Calculation
                                                                            const permKey = ID_MAPPING[feature.id] || feature.id;
                                                                            const val = (permissions.permissions as any)[permKey];
                                                                            let displayVal: React.ReactNode = val?.toLocaleString() || 0;

                                                                            if (feature.type === 'boolean') {
                                                                                const isEnabled = val === true;
                                                                                if (feature.id === 'remove_branding') {
                                                                                    displayVal = isEnabled ? "None" : "Watermark";
                                                                                } else {
                                                                                    displayVal = isEnabled ? "Yes" : "No";
                                                                                }
                                                                            } else if (feature.type === 'enum') {
                                                                                displayVal = typeof val === 'string' ? val.replace(/_/g, ' ').toUpperCase() : 'DEFAULT';
                                                                            }

                                                                            return (
                                                                                <div key={`${feature.id}-${idx}`} className="group">
                                                                                    <Card className="p-5 border transition-all duration-300 relative overflow-hidden bg-gradient-to-br from-slate-800/40 via-slate-900/50 to-slate-800/40 backdrop-blur-sm hover:shadow-xl h-full" style={{ borderColor: `${theme.accentColor}30` }}>
                                                                                        {/* Plan-colored hover glow */}
                                                                                        <div className={cn(
                                                                                            "absolute inset-0 opacity-0 group-hover:opacity-15 transition-opacity pointer-events-none bg-gradient-to-br",
                                                                                            theme.bg
                                                                                        )} />

                                                                                        <div className="relative z-10 flex flex-col h-full">
                                                                                            {/* Icon and Name */}
                                                                                            <div className="flex items-start gap-3 mb-3">
                                                                                                <div className={cn(
                                                                                                    "p-2 rounded-lg transition-transform group-hover:scale-110 shrink-0",
                                                                                                    theme.bg.replace('/30', '/20')
                                                                                                )} style={{ color: theme.accentColor }}>
                                                                                                    <IconComponent className="w-4 h-4" />
                                                                                                </div>
                                                                                                <div className="flex-1 min-w-0">
                                                                                                    <div className="text-sm font-bold text-white mb-1">
                                                                                                        {feature.label}
                                                                                                    </div>
                                                                                                    <p className="text-xs text-slate-400 leading-relaxed">
                                                                                                        {feature.description}
                                                                                                    </p>
                                                                                                </div>
                                                                                            </div>

                                                                                            {/* Value Display */}
                                                                                            <div className="mt-auto pt-3 border-t border-slate-700/50">
                                                                                                <div className="flex items-baseline gap-2">
                                                                                                    <span className="text-xl font-black font-mono" style={{ color: theme.accentColor }}>
                                                                                                        {displayVal}
                                                                                                    </span>
                                                                                                    {feature.unit && (
                                                                                                        <span className="text-[10px] text-slate-500 font-medium uppercase">
                                                                                                            {feature.unit}
                                                                                                        </span>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </Card>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </Card>
                                                        </motion.div>




                                                    </Card>
                                                </div>
                                            </TabsContent>

                                            <TabsContent value="features" className="flex-1 mt-6 data-[state=inactive]:hidden">
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                                    {configLoading ? (
                                                        <div className="flex items-center justify-center py-12">
                                                            <motion.div
                                                                className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"
                                                                animate={{ rotate: 360 }}
                                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                            />
                                                        </div>
                                                    ) : moduleFeatures.length > 0 ? (
                                                        moduleFeatures
                                                            .map((feature: any, idx) => {
                                                                const IconComp = feature.icon && (LucideIcons as any)[feature.icon] ? (LucideIcons as any)[feature.icon] : LucideIcons.Shield;
                                                                const isEmoji = !IconComp || (typeof feature.icon === 'string' && feature.icon.length <= 2);

                                                                // Use Mapping to find Value for Rich Features
                                                                const permKey = ID_MAPPING[feature.id] || feature.id;
                                                                const value = (permissions.permissions as any)[permKey];
                                                                const hasValue = value !== undefined;

                                                                let sellPrice = 0;
                                                                if (feature.includes) feature.includes.forEach((item: any) => sellPrice += (item.sellMultiplier || 0));

                                                                // Extract color from feature
                                                                const rawColor = feature.color || "blue";
                                                                const colorName = rawColor.includes("-") ? rawColor.split("-")[1] : rawColor;
                                                                const headerGradient = getThemeColorClasses(colorName);

                                                                return (
                                                                    <motion.div
                                                                        key={`${feature.id}-${idx}`}
                                                                        initial={{ opacity: 0, y: 20 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                                                                    >
                                                                        <Card className="overflow-hidden border-2 border-slate-700/50 bg-gradient-to-br from-slate-900/90 to-slate-950 w-full">
                                                                            {/* Feature Header with Category Gradient */}
                                                                            <div className={`p-6 border-b  bg-gradient-to-b ${headerGradient} relative`}>
                                                                                <div className="flex items-start gap-4">
                                                                                    <div className={cn(
                                                                                        "p-4 rounded-2xl shadow-lg ring-1 ring-black/5 dark:ring-white/10 bg-background transition-transform group-hover:scale-110",
                                                                                        feature.color
                                                                                    )}>
                                                                                        {isEmoji ? <span className="text-4xl">{feature.icon}</span> : <IconComp className="w-8 h-8" strokeWidth={1.5} />}
                                                                                    </div>
                                                                                    <div className="flex-1">
                                                                                        <div className="flex items-center justify-between gap-3 mb-2">
                                                                                            <h3 className="text-2xl font-bold text-foreground">{feature.label || feature.name || feature.id}</h3>
                                                                                            <div className="flex items-center gap-2">

                                                                                                {sellPrice > 0 && (
                                                                                                    <Badge className="bg-red-500/15 text-red-300 border-red-500/30 font-mono">
                                                                                                        <LucideIcons.Flame className="w-3 h-3 mr-1" />
                                                                                                        {sellPrice}x Tokens
                                                                                                    </Badge>
                                                                                                )}
                                                                                                <Badge variant="secondary" className="text-xs uppercase font-mono bg-background/80 backdrop-blur border-border/50">
                                                                                                    {FEATURE_CATEGORIES[feature.category as keyof typeof FEATURE_CATEGORIES]?.label || feature.category}
                                                                                                </Badge>
                                                                                            </div>
                                                                                        </div>
                                                                                        <p className="text-sm font-mono text-muted-foreground/80 flex items-center gap-2">
                                                                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-[pulse_3s_infinite]" />
                                                                                            {feature.location || "/dashboard/..."}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {/* ABOUT FEATURE Section */}
                                                                            <div className="p-6 border-b border-slate-800/50 bg-slate-950/30">
                                                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                                                                                    About Feature
                                                                                </h4>
                                                                                <p className="text-base leading-relaxed text-slate-300">
                                                                                    {feature.description}
                                                                                </p>
                                                                            </div>

                                                                            {/* COST STRUCTURE & COMPONENTS Section */}
                                                                            {feature.includes && feature.includes.length > 0 && (
                                                                                <div className="p-6 bg-slate-950/30">
                                                                                    <div className="flex items-center justify-between mb-5">
                                                                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                                                            Cost Structure & Components
                                                                                        </h4>
                                                                                        <Badge variant="outline" className="font-mono text-[10px] border-slate-700 text-slate-400">
                                                                                            {feature.includes.length} SUB-FEATURES
                                                                                        </Badge>
                                                                                    </div>

                                                                                    <div className="space-y-4">
                                                                                        {feature.includes.map((sub: any, sIdx: number) => {
                                                                                            const SIcon = (LucideIcons as any)[sub.icon] || LucideIcons.CheckCircle2;
                                                                                            return (
                                                                                                <div
                                                                                                    key={sIdx}
                                                                                                    className="group relative overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/30 hover:bg-slate-900/50 hover:border-slate-700 hover:shadow-lg transition-all duration-300"
                                                                                                >
                                                                                                    {/* Sub-feature Content */}
                                                                                                    <div className="p-4 flex gap-4">
                                                                                                        <div className={cn(
                                                                                                            "mt-1 p-2 rounded-lg bg-slate-800/50 text-slate-400 group-hover:text-primary transition-colors h-fit",
                                                                                                            theme.primary
                                                                                                        )}>
                                                                                                            <SIcon className="w-5 h-5" />
                                                                                                        </div>

                                                                                                        <div className="flex-1 space-y-2">
                                                                                                            <div className="flex items-center justify-between">
                                                                                                                <span className="font-semibold text-base text-white">
                                                                                                                    {sub.name}
                                                                                                                </span>
                                                                                                            </div>

                                                                                                            {/* Description */}
                                                                                                            {sub.desc && (
                                                                                                                <div className="text-sm text-slate-400 leading-snug">
                                                                                                                    {sub.desc}
                                                                                                                </div>
                                                                                                            )}

                                                                                                            {/* Cost Reason (Internal) */}
                                                                                                            {sub.costReason && (
                                                                                                                <div className="relative pl-3 text-xs italic text-slate-500 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[2px] before:bg-primary/20 before:rounded-full">
                                                                                                                    <span className="font-medium text-primary/60 not-italic mr-1">Why Burn Tokens:</span>
                                                                                                                    {sub.costReason}
                                                                                                                </div>
                                                                                                            )}
                                                                                                        </div>
                                                                                                    </div>

                                                                                                    {/* Pricing Bar - Only Burn Tokens for Marketing */}
                                                                                                    <div className="px-4 py-2.5 bg-slate-950/50 border-t border-slate-800/50 flex items-center justify-center text-xs sm:text-sm font-mono group-hover:bg-slate-900/30 transition-colors">
                                                                                                        <div className="flex items-center gap-2">
                                                                                                            <LucideIcons.Flame className="w-4 h-4 text-red-400" />
                                                                                                            <span className="text-red-400/80 font-medium">Burn Tokens:</span>
                                                                                                            <span className="font-bold text-red-300">{sub.sellMultiplier || 0}x</span>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </Card>
                                                                    </motion.div>
                                                                );
                                                            })
                                                    ) : (
                                                        <div className="text-center py-12"><p className="text-slate-400">No features available</p></div>
                                                    )}
                                                </motion.div>
                                            </TabsContent>
                                        </div>
                                    </ScrollArea >

                                    <div className="border-t pt-6 mt-auto p-6 relative z-20 shrink-0 flex items-center justify-between" style={{ borderColor: `${theme.accentColor}50`, backgroundColor: `${theme.accentColor}10` }}>
                                        <div className="flex items-baseline gap-2">
                                            {isFree ? (
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-4xl font-black text-white tracking-widest uppercase">FREE</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-baseline gap-1">
                                                    {loading ? (
                                                        <div className="h-10 w-32 bg-slate-800 animate-pulse rounded-lg" />
                                                    ) : (
                                                        <>
                                                            <span className="text-xs text-slate-400">{geo.currency.symbol}</span>
                                                            <NumberTicker value={finalPrice} decimalPlaces={2} className="text-4xl font-black text-white" />
                                                            <span className="text-sm text-slate-400">/mo</span>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-3">
                                            <Button variant="outline" onClick={onClose} className="border-slate-600 text-slate-300 hover:bg-slate-800">Cancel</Button>
                                            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                                                <Button
                                                    onClick={handleProceedToBilling}
                                                    className={cn("text-white shadow-xl relative overflow-hidden group border-0")}
                                                    style={{ background: `linear-gradient(135deg, ${theme.accentColor}, ${theme.accentLight})` }}
                                                >
                                                    <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" animate={{ x: ["-100%", "100%"] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />
                                                    <span className={cn("relative z-10 flex items-center gap-2 text-white font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]")}>
                                                        Proceed to Billing <ArrowRight className="w-4 h-4" />
                                                    </span>
                                                </Button>
                                            </motion.div>
                                        </div>
                                    </div>
                                </Tabs >
                            </DialogContent >
                        </>
                    )
                    }
                </AnimatePresence >
            </Dialog >
        </>
    );
}

