"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MoveRight, PhoneCall, Zap, Check, X, Info, Crown, Sparkles, Coins, ShieldCheck, Rocket, Database, Cpu, MessageSquareText, Star, FileSpreadsheet, Mail, Globe, BrainCircuit, Code2, Users as UsersIcon, FileText, Keyboard, CheckCircle2, Layers, History, Infinity as InfinityIcon, Lock, Activity, Clock, Calculator, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from "framer-motion";
import { calculatePrice, calculateOriginalPrice, MARKUP_FACTOR, formatTokenCount } from "@/lib/priceUtils";
import PlanViewerModal from "@/app/(marketing)/pricing/components/PlanViewerModal";
import * as LucideIcons from "lucide-react";

// Premium MagicUI Components
import { NumberTicker } from "@/components/ui/number-ticker";
import { SparklesText } from "@/components/ui/sparkles-text";
import { BorderBeam } from "@/components/ui/border-beam";
import { RetroGrid } from "@/components/ui/retro-grid";
import { Meteors } from "@/components/ui/meteors";

// API Imports
import { plansAPI } from "@/api/plans.api";
import { featuresAPI } from "@/api/features.api";

import { getThemeByIndex } from "@/config/planTiers.config";
import { useGeo } from '@/hooks/useGeo';
import { useSystemConfig } from '@/hooks/useSystemConfig';


// --- Components ---

const LimitCycler = ({ texts }: { texts: string[] }) => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % texts.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [texts.length]);

    return (
        <div className="h-4 relative overflow-hidden">
            <AnimatePresence mode="wait">
                <motion.p
                    key={index}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-[10px] opacity-70 mt-0.5 font-mono absolute top-0 left-0 w-full"
                >
                    {texts[index]}
                </motion.p>
            </AnimatePresence>
        </div>
    );
};

// --- Data Mapping Logic ---

// Helper to map API Plan to UI Plan structure
// --- THEME CONFIGURATION ---


// Helper to map API Plan to UI Plan structure
const mapPlanToUI = (apiPlan: any, featuresRegistry: any, index: number, previousPlan: any = null, costMultiplier: number = 0, currencySymbol: string = '₹', tierDefinitions: any[] = [], currencyCode: string = 'USD') => {
    // ✅ Calculate permissions from tierDefinitions based on plan's maxTokens
    const matchingTier = tierDefinitions.find((tier: any) =>
        apiPlan.maxTokens >= tier.minTokens && apiPlan.maxTokens <= (tier.maxTokens || Infinity)
    );
    const permissions = matchingTier?.permissions || {};
    // 1. ALWAYS Calculate Price Dynamically (PPP Pricing)
    // STRICT: Ignoring DB Stored Prices to ensure consistency with Admin Simulator
    // Formula: Tokens * Global Rate
    const isFreeName = apiPlan.name.toLowerCase().includes("free");
    const removeBranding = permissions?.remove_branding;

    let price = 0;

    if (!isFreeName && apiPlan.maxTokens > 0) {
        // Dynamic Calculation Only
        price = calculatePrice(apiPlan.maxTokens, costMultiplier, currencyCode);
        price = Math.max(1, price);
    }

    const isFree = isFreeName || price === 0;
    const isPro = price >= 999;

    // Select Theme: If Free -> Slate. Else -> Cycle through Paid Themes based on Index.
    // We modify index for paid themes to start from 0 if Free is at index 0.
    const theme = getThemeByIndex(index, isFree);

    // Logic for Buttons/Badges (Still kept for legacy reference, but Theme controls visual)
    const isStarter = !isFree && !isPro;


    // Map Features
    let planFeatures: any[] = [];

    // --- STACKING STRATEGY ---
    // If there is a previous plan, we add "Everything in X..." and filter redundant items



    // --- DYNAMIC FEATURE ENGINE ---
    // 1. Definition of Special Formatting & Behavior
    // This Engine allows adding new features via Backend without code changes,
    // while preserving the specific "Stacking" and "Text" logic for core features.

    const STACKABLE_KEYS = ['max_websites', 'max_team_seats', 'max_files', 'max_forms'];

    // Custom Formatters to preserve Exact Design text (e.g. "X Website Links" instead of just "5 Websites")
    const CUSTOM_FORMATTERS: Record<string, (val: any) => any> = {
        'max_websites': (val) => ({
            text: `${val} Website Link${val > 1 ? 's' : ''}`,
            icon: Globe,
            sub: `Max ${permissions?.max_website_pages || 0} Pages`,
            iconBg: "bg-rose-500/10",
            iconColor: "text-rose-500",
            borderColor: "border-rose-500/20"
        }),
        'max_team_seats': (val) => ({
            text: `${val} Team Seat${val > 1 ? 's' : ''}`,
            icon: UsersIcon,
            highlight: isPro,
            iconBg: "bg-indigo-500/10",
            iconColor: "text-indigo-500",
            borderColor: "border-indigo-500/20"
        }),
        'max_files': (val) => ({
            text: `${val} AI Knowledge File${val > 1 ? 's' : ''}`,
            icon: FileText,
            iconBg: "bg-orange-500/10",
            iconColor: "text-orange-500",
            borderColor: "border-orange-500/20"
        }),
        'max_forms': (val) => ({
            text: `${val} Lead Gen Form${val > 1 ? 's' : ''}`,
            icon: FileSpreadsheet,
            iconBg: "bg-pink-500/10",
            iconColor: "text-pink-500",
            borderColor: "border-pink-500/20"
        }),
        'brain_capacity_mb': (val) => ({
            text: `${val} Million Tokens Context`,
            icon: LucideIcons.Database,
            iconBg: "bg-cyan-500/10",
            iconColor: "text-cyan-500",
            borderColor: "border-cyan-500/20"
        }),
        'data_retention_days': (val) => ({
            text: `${val} Day Data Retention`, // Fixed text
            icon: LucideIcons.Archive,
            iconBg: "bg-slate-900/30 dark:bg-slate-900/50",
            iconColor: "text-slate-400",
            borderColor: "border-slate-700/50"
        }),
        'rollover_percentage': (val) => ({
            text: `${val}% Rollover`,
            sub: permissions?.rollover_validity_days > 0 ? `Valid for ${permissions?.rollover_validity_days} days` : undefined,
            icon: LucideIcons.RefreshCw,
            highlight: true,
            iconBg: "bg-green-900/30 dark:bg-green-900/50",
            iconColor: "text-green-400",
            borderColor: "border-green-700/50"
        }),
        'remove_branding': (val) => val ? ({
            text: "No Cluaiz Watermark",
            icon: Check,
            highlight: true
        }) : ({
            text: "Cluaiz Watermark",
            icon: Info,
            negative: true
        }),
        'max_manual_qa': (val) => ({
            text: `${val} Manual Q&A Pairs`,
            icon: MessageSquareText,
            iconBg: "bg-teal-500/10",
            iconColor: "text-teal-500",
            borderColor: "border-teal-500/20"
        }),
        'auto_learning_frequency': (val) => ({
            text: `Auto-Learning: ${val.charAt(0).toUpperCase() + val.slice(1)}`,
            icon: BrainCircuit,
            iconBg: "bg-purple-500/10",
            iconColor: "text-purple-500",
            borderColor: "border-purple-500/20"
        })
    };

    // keys that are used as "Sub-text" in other features, so shouldn't appear alone
    const HIDDEN_KEYS = ['max_website_pages', 'rollover_validity_days'];

    // 2. Iterate Registry (Source of Truth)
    // We process ALL features in the registry order.
    // If a feature is NOT in CUSTOM_FORMATTERS, we use a Generic Render.





    // Loop through Features Registry (This handles BOTH defined logic and future Dynamic features)
    // We combine 'featuresRegistry' (metadata) with 'permissions' (values)
    const allFeatureKeys = featuresRegistry ? featuresRegistry.map((f: any) => f.id) : [];

    // Also include specific permission keys if not in registry but exist (Legacy safety)
    Object.keys(permissions).forEach(k => {
        if (!allFeatureKeys.includes(k) && !k.startsWith('_')) allFeatureKeys.push(k);
    });

    // Use a Set to avoid duplicates if iterating combined list
    const processedKeys = new Set();

    // Prefer Registry Order, but MUST include extra permission keys
    const registryKeys = featuresRegistry ? featuresRegistry.map((f: any) => f.id) : [];
    const extraKeys = Object.keys(permissions).filter(k => !registryKeys.includes(k) && !k.startsWith('_'));

    // Combine: Registry Items + Extra Keys (as pseudo-defs)
    const iterationSource = [
        ...(featuresRegistry || []),
        ...extraKeys.map(k => ({ id: k, label: k, type: 'boolean' }))
    ];

    iterationSource.forEach((featureDef: any) => {
        const key = featureDef.id;
        if (processedKeys.has(key)) return;
        processedKeys.add(key);

        // Hide specific keys that are shown as sub-text elsewhere
        if (HIDDEN_KEYS.includes(key)) return;

        const val = permissions[key];
        const prevVal = previousPlan ? (previousPlan[key] || previousPlan.permissions?.[key] || 0) : 0; // Check plan root AND permissions

        // Logic A: Stacking (Only show if improved)
        if (STACKABLE_KEYS.includes(key)) {
            if (val <= prevVal && previousPlan) return; // Skip if not better
            if (val <= 0) return; // Skip if 0
        }

        // Logic B: Boolean/Numeric Check
        // Show if true (boolean) or > 0 (numeric)
        // Exception: remove_branding (show even if false, handled by formatter)
        const isBranding = key === 'remove_branding';
        if (!isBranding && !val) return;

        // RENDER
        if (CUSTOM_FORMATTERS[key]) {
            const formatted = CUSTOM_FORMATTERS[key](val);
            if (formatted) planFeatures.push(formatted);
        } else {
            // GENERIC RENDER (For new future features)
            // Uses Registry Metadata

            // Check dynamic features list (from API plan arrays) if acts as toggle
            // But here we rely on PERMISSIONS map. 
            // If permission exists and is >0/true, we render.

            const Icon = (LucideIcons as any)[featureDef.icon] || Star;
            let text = featureDef.label || key;

            if (typeof val === 'number') {
                text = `${val} ${featureDef.unit || ''} ${text}`;
            }

            planFeatures.push({
                text: text,
                icon: Icon,
                highlight: false
            });
        }
    });

    // Handle "Dynamic Features" from Plan Array (e.g. 'unlimited_projects') if NOT covered by permissions
    // Legacy support for 'features' array on plan object
    const apiFeatureIds = apiPlan.features || apiPlan.featureIds || [];
    const prevFeatureIds = previousPlan?.features || previousPlan?.featureIds || [];

    const newFeatureIds = previousPlan
        ? apiFeatureIds.filter((id: string) => !prevFeatureIds.includes(id))
        : apiFeatureIds;

    // Filter out IDs that were already processed via permissions (avoid double render)
    const uniqueNewIds = newFeatureIds.filter((id: string) => !processedKeys.has(id));

    const includedApiFeatures = featuresRegistry.filter((f: any) => uniqueNewIds.includes(f.id));

    includedApiFeatures.forEach((f: any) => {
        const Icon = (LucideIcons as any)[f.icon] || Star;
        planFeatures.push({
            text: f.name || f.label,
            icon: Icon,
            highlight: false
        });
    });

    // 📉 Original Price (Discount Logic) - Centralized
    const originalPriceNum = calculateOriginalPrice(price);
    const discountPercent = originalPriceNum > 0 ? Math.round(((originalPriceNum - price) / originalPriceNum) * 100) : 0;

    const originalPrice = isFree ? null : `${currencySymbol}${originalPriceNum.toLocaleString()}`;
    const discountBadge = isFree ? null : `${discountPercent}% OFF`;

    // --- DESCRIPTION LOGIC ---
    const planName = apiPlan.name?.toLowerCase() || "";
    let description = "Unlock the power of AI.";
    if (planName.includes("free")) description = "Get started with essential AI tools.";
    else if (planName.includes("starter")) description = "Level up your daily productivity.";
    else if (planName.includes("basic")) description = "The most popular choice for professionals.";
    else if (planName.includes("pro")) description = "Maximum power for heavy workflows.";
    else if (planName.includes("enterprise")) description = "Ultimate security and control.";
    else if (planName.includes("ultimate")) description = "Limitless possibilities for scale.";

    return {
        key: apiPlan.id,
        name: apiPlan.name,
        description: description,
        price: `${currencySymbol}${price}`,
        originalPrice: originalPrice,
        discount: discountBadge,
        period: apiPlan.price?.interval === "forever" ? "/forever" : "/month",
        badge: planName.includes("basic") ? "Most Popular" : null,
        badgeColor: "bg-indigo-600 text-white border-indigo-400 border shadow-indigo-500/40",
        buttonText: isFree ? "Start for Free" : isStarter ? "Get Limited Deal" : "Upgrade to Pro",
        theme: theme,
        features: planFeatures,
        highlight: isPro,
        maxTokensBadge: apiPlan.maxTokens > 0
            ? `${formatTokenCount(apiPlan.maxTokens)} Tokens`
            : null,
        // ✅ Calculate total available features for "Explore X+ more features"
        totalFeatureCount: featuresRegistry ? featuresRegistry.length : 0,
        displayedFeatureCount: planFeatures.length,
        // Raw Data for Modal
        rawData: apiPlan,
        // ✅ Direct Access for Plan Viewer
        maxTokens: apiPlan.maxTokens,
        numericPrice: price // Required for NumberTicker
    };
};


// Helper to get Plan Icon based on Name
const getIconForPlan = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes("free")) return Sparkles;
    if (name.includes("starter")) return Rocket;
    if (name.includes("basic")) return Layers;
    if (name.includes("pro")) return Crown;
    if (name.includes("business")) return LucideIcons.BriefcaseBusiness;
    if (name.includes("enterprise")) return ShieldCheck;
    if (name.includes("ultimate")) return InfinityIcon;

    // Fallback based on price or generic
    return Star;
};


// Mouse Spotlight Card Component (ORIGINAL)
function PricingCard({ plan, idx, setHoveredIndex, hoveredIndex, onPlanClick, currencySymbol, isEmbedded, geo }: any) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: any) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    const { theme } = plan;
    const PlanIcon = getIconForPlan(plan.name);
    console.log('plan🗝️🗝️🗝️🗝️🗝️', plan)
    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={cn(
                "group relative rounded-[24px] border-transparent transition-all duration-300 h-full flex flex-col",
                isEmbedded
                    ? "bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm"
                    : "bg-slate-900"
            )}
            onMouseMove={handleMouseMove}
        >
            {/* SPOTLIGHT BORDER LAYER */}
            <motion.div
                className="absolute inset-0 rounded-[24px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                    background: useMotionTemplate`
                        radial-gradient(
                          600px circle at ${mouseX}px ${mouseY}px,
                          ${theme.glowColor},
                          transparent 40%
                        )
                    `
                }}
            />

            {/* Static Border */}
            <div className={cn(
                "absolute inset-0 rounded-[24px] border pointer-events-none",
                theme.border
            )} />

            {/* BorderBeam for Pro Plan */}
            {plan.highlight && (
                <>
                    <BorderBeam
                        size={300}
                        duration={15}
                        colorFrom="#6366f1"
                        colorTo="#a855f7"
                        borderWidth={2}
                    />
                    <div className="absolute inset-0 overflow-hidden rounded-[24px] pointer-events-none opacity-50">
                        <Meteors number={20} />
                    </div>
                </>
            )}

            {/* ABSOLUTE BADGE (Top Center) */}
            {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-lg shadow-black/50 backdrop-blur-md border animate-shimmer-slide bg-[length:200%_100%]",
                            plan.badgeColor || "bg-slate-900 border-slate-700 text-slate-300"
                        )}
                    >
                        {plan.badge}
                    </motion.div>
                </div>
            )}

            {/* Inner Content */}
            <div
                className="relative mx-[1px] my-[1px] h-[calc(100%-2px)] opacity-95 w-[calc(100%-3px)] rounded-[23px] bg-slate-950 overflow-hidden"
            >
                <div className="p-6 lg:p-8 flex flex-col h-full pt-12">

                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className={cn("text-xl font-bold", theme.nameColor)}>{plan.name}</h3>
                                <p className="text-slate-500 text-xs mt-1">{plan.description}</p>
                            </div>
                            <div className={cn("p-2 rounded-xl bg-slate-900 border",
                                plan.highlight ? "border-indigo-500/30" : theme.bg === "bg-slate-950" ? "border-slate-800" : `border-${theme.glowColor}/20`
                            )}>
                                <PlanIcon className={cn("w-6 h-6",
                                    plan.highlight ? "text-indigo-400" : theme.primary
                                )} />
                            </div>
                        </div>
                    </div>

                    {/* Pricing with NumberTicker */}
                    <div className="mb-8">
                        <div className="flex items-end gap-2">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: idx * 0.1, type: "spring" }}
                                className="flex items-baseline"
                            >
                                {(!plan.id?.includes('free') && (!geo.currency.costMultiplier || geo.loading)) ? (
                                    <div className="h-12 w-40 bg-slate-800/50 animate-pulse rounded-lg" />
                                ) : (
                                    <>
                                        <span className={cn("text-2xl font-bold", theme.priceColor)}>{currencySymbol}</span>
                                        <NumberTicker
                                            decimalPlaces={2}
                                            value={plan.numericPrice || 0}
                                            className={cn("text-5xl font-bold tracking-tighter", theme.priceColor)}
                                        />
                                    </>
                                )}
                            </motion.div>
                            <span
                                className="text-slate-500 text-sm mb-1.5 font-medium">{plan.period}</span>
                        </div>
                        {plan.originalPrice && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 + 0.2 }}
                                className="flex items-center gap-2 mt-2"
                            >
                                <span className="text-sm text-slate-500 line-through decoration-slate-700 decoration-1">{plan.originalPrice}</span>
                                <motion.span
                                    className="text-[10px] font-bold text-green-400 px-1.5 py-0.5 rounded bg-green-900/20 border border-green-500/20"
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    {plan.discount}
                                </motion.span>
                            </motion.div>
                        )}
                    </div>


                    {/* Tokens Badge (Top Position as requested) */}
                    {plan.maxTokensBadge && (
                        <div className="flex justify-center mb-8">
                            <div className={cn(
                                "px-4 py-1 rounded-full text-xs font-bold border flex items-center gap-2",
                                plan.theme.badge // Uses the robust theme definition from mapPlanToUI
                            )}>
                                <Zap className="w-3 h-3 fill-current" />
                                <span>{plan.maxTokensBadge}</span>
                            </div>
                        </div>
                    )}

                    {/* Features Separator */}
                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className={cn("w-full border-t border-dashed opacity-30", theme.separator)} />
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                            <span className={cn("bg-slate-950 px-2", theme.separator.split(" ")[1])}>Included Features</span>
                        </div>
                    </div>

                    {/* Features List */}
                    <ul className="space-y-4 mb-4 flex-1">
                        {plan.features.map((feature: any, fIdx: number) => (
                            <li key={fIdx} className={cn("flex items-start gap-4", feature.negative && "opacity-40 grayscale")}>
                                <div className={cn(
                                    "w-5 h-5 rounded-full flex items-center justify-center shrink-0 border mt-0.5 transition-colors duration-300",
                                    // Custom Feature Color OR Dynamic Theme
                                    feature.iconBg ? `${feature.iconBg} ${feature.borderColor || 'border-transparent'}` :
                                        plan.highlight
                                            ? "bg-indigo-500/10 border-indigo-500/30"
                                            : theme.bg === "bg-slate-950"
                                                ? "bg-slate-900 border-slate-800"
                                                : `bg-${theme.glowColor}/10 border-${theme.glowColor}/20`
                                )}>
                                    {/* Feature Icon */}
                                    <feature.icon className={cn("w-3 h-3",
                                        feature.iconColor ? feature.iconColor :
                                            plan.key.includes("free") ? "text-slate-400" :
                                                plan.key.includes("starter") ? "text-cyan-400" :
                                                    "text-indigo-400"
                                    )} />
                                </div>
                                <div className="flex-1">
                                    <span className={cn("text-sm font-medium block",
                                        feature.highlight ? "text-indigo-200" : feature.negative ? "text-slate-500" : "text-slate-300"
                                    )}>
                                        {feature.text}
                                    </span>
                                    {feature.subOptions && <LimitCycler texts={feature.subOptions} />}
                                    {feature.sub && <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{feature.sub}</span>}
                                </div>
                            </li>
                        ))}
                    </ul>

                    {/* Explore More Link */}
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            onPlanClick(plan, 'features');
                        }}
                        // onClick={() => onPlanClick(plan)}
                        className={cn(
                            "flex items-center justify-center gap-2 mb-6 text-xs font-bold cursor-pointer hover:underline underline-offset-4 transition-all opacity-80 hover:opacity-100",
                            theme.primary
                        )}
                    >
                        <span>
                            Explore included {plan.totalFeatureCount > 0
                                ? `${plan.totalFeatureCount}+`
                                : ''} more features
                        </span>
                        <LucideIcons.ArrowRight className="w-3 h-3" />
                    </div>

                    {/* Button (mt-auto forces bottom alignment) */}
                    <div className="mt-auto">
                        <div
                            onClick={() => onPlanClick(plan)}
                            className={cn(
                                `w-full py-3 active:scale-95 rounded-[14px] text-base font-bold transition-all duration-300 relative overflow-hidden group/btn cursor-pointer`,
                                theme.button
                            )}
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {plan.buttonText}
                                <MoveRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                            </span>
                        </div>
                        <p className="text-[10px] text-center text-slate-600 mt-3 font-medium opacity-60">
                            {plan.name === "Free Trial" ? "No credit card required" : "14-day money back guarantee"}
                        </p>
                    </div>

                </div>
            </div>
        </motion.div>
    );
}

export function Pricing({ onPlanSelect, disableUrlParams = false, disableLocalModal = false }: { onPlanSelect?: (plan: any) => void; disableUrlParams?: boolean; disableLocalModal?: boolean }) {
    const searchParams = useSearchParams();
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [modalOpen, setModalOpen] = useState(false);

    // 🌍 Geo Intelligence for PPP Pricing
    const geo = useGeo(); // Returns geo object directly
    const { config, loading: configLoading } = useSystemConfig(); // ✅ Get tierDefinitions
    const router = useRouter();
    const costMultiplier = geo?.currency?.costMultiplier;
    const currencySymbol = geo?.currency?.symbol || '₹';
    const currencyCode = geo?.currency?.code || 'USD';

    // Dynamic State
    const [plans, setPlans] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    // Detect scroll position and update arrow visibility
    useEffect(() => {
        const checkScrollPosition = () => {
            const container = document.getElementById('pricing-carousel');
            if (container) {
                const { scrollLeft, scrollWidth, clientWidth } = container;

                // Can scroll left if not at start
                setCanScrollLeft(scrollLeft > 0);

                // Can scroll right if not at end (with small tolerance for rounding)
                setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
            }
        };

        const container = document.getElementById('pricing-carousel');
        if (container) {
            // Check on load
            checkScrollPosition();

            // Check on scroll
            container.addEventListener('scroll', checkScrollPosition);

            // Check on resize
            window.addEventListener('resize', checkScrollPosition);

            return () => {
                container.removeEventListener('scroll', checkScrollPosition);
                window.removeEventListener('resize', checkScrollPosition);
            };
        }
    }, [plans]); // Re-check when plans change

    // Handle URL-based Modal Opening
    useEffect(() => {
        if (disableUrlParams) return; // SKIP if embedded mode

        const tab = searchParams.get('tab');
        const planId = searchParams.get('planId'); // Get Plan ID from URL

        if (tab && plans.length > 0 && !modalOpen && !selectedPlan) {
            let targetPlan = null;

            // 1. Try to find plan by ID from URL
            if (planId) {
                targetPlan = plans.find((p: any) => p.key === planId || p.id === planId);
            }

            // 2. Fallback to Starter or first paid plan if no ID or plan not found
            if (!targetPlan) {
                targetPlan = plans.find((p: any) => p.key === 'starter') || plans.find((p: any) => p.price !== '₹0') || plans[0];
            }

            if (targetPlan) {
                // Re-construct the mock object structure locally to avoid circular dependencies
                const raw = targetPlan.rawData || {};
                const mockPlan = {
                    id: targetPlan.key,
                    name: targetPlan.name,
                    maxTokens: targetPlan.maxTokens || raw.maxTokens || 0,
                    price: {
                        amount: (targetPlan.numericPrice || 0), // STRICT: Use Numeric Price
                        interval: 'month'
                    },
                    ...raw
                };
                setModalOpen(true);
                setSelectedPlan(mockPlan);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [plans, searchParams]);

    // Fetch Logic - Use SystemConfig
    useEffect(() => {
        if (!config || !config.planTiers || !config.tierDefinitions) {
            console.log('⚠️ Waiting for config...', { hasConfig: !!config });
            return;
        }

        try {
            const allFeatures = config.features ? Object.values(config.features) : [];

            // Filter ACTIVE plans from config
            const activePlans = config.planTiers.filter((p: any) => p.isActive === true);

            // Sort by maxTokens (proxy for price tier)
            activePlans.sort((a: any, b: any) => (a.maxTokens || 0) - (b.maxTokens || 0));

            const uiPlans = activePlans.map((p: any, index: number) =>
                mapPlanToUI(p, allFeatures, index, activePlans[index - 1], costMultiplier, currencySymbol, config.tierDefinitions || [], currencyCode)
            );
            setPlans(uiPlans);
        } catch (error) {
            console.error("Failed to load plans from config", error);
        } finally {
            setIsLoading(false);
        }
    }, [config, costMultiplier, currencySymbol]);
    // Re-map when geo data loads


    const handlePlanClick = (uiPlan: any, plan: string) => {
        // If external handler provided (e.g. Dashboard), use it
        if (onPlanSelect) {
            onPlanSelect(uiPlan);
        }

        if (disableUrlParams) {
            // Embedded Mode: Open Modal Directly without URL change
            if (disableLocalModal) return;

            const raw = uiPlan.rawData || {};
            const mockPlan = {
                id: uiPlan.key,
                name: uiPlan.name,
                maxTokens: uiPlan.maxTokens || raw.maxTokens || 0,
                price: {
                    amount: (uiPlan.numericPrice || 0),
                    interval: 'month'
                },
                ...raw
            };
            setSelectedPlan(mockPlan);
            setModalOpen(true);
            return;
        }

        // Navigate to Pricing Page with Customize Tab
        router.push(`/pricing?tab=${plan}&planId=${uiPlan.key || uiPlan.id}`);
    };


    return (
        <section className={cn(
            "relative overflow-hidden",
            disableUrlParams ? "py-4 bg-transparent" : "py-32 bg-slate-950"
        )}>
            {/* Retro Grid Background for Premium Feel - Hide if Embedded */}
            {!disableUrlParams && <RetroGrid className="absolute inset-0 z-0 opacity-10" />}

            {/* Background - Minimal Static Glows (Retained but subtle) - Hide if Embedded */}
            {!disableUrlParams && (
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px]" />
                    <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-800/10 rounded-full blur-[120px]" />
                </div>
            )}

            <div className="container relative z-10 mx-auto px-4 md:px-8">

                {/* Header with SparklesText - Hide if Embedded */}
                {!disableUrlParams && (
                    <div className="text-center max-w-6xl mx-auto mb-24">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold mb-6"
                        >
                            <Rocket className="w-3 h-3 text-indigo-400" /> Exclusive Beta Access
                        </motion.div>

                        <div className="flex justify-center mb-6">
                            <SparklesText
                                className="text-4xl md:text-7xl font-bold text-white tracking-tight leading-tight"
                                colors={{ first: "#818cf8", second: "#22d3ee" }}
                                sparklesCount={12}
                            >
                                Unlock Your AI Brain
                            </SparklesText>
                        </div>

                        <motion.h3
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-2xl md:text-3xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 mb-6"
                        >
                            Beta Price Locked Forever.
                        </motion.h3>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
                        >
                            Get full access at a fraction of the cost.
                            <br className="hidden md:block" /> Lock in the Beta rate today, and never pay full price later.
                        </motion.p>
                    </div>
                )}

                {/* --- FULL WIDTH CAROUSEL SECTION --- */}
            </div>

            <div className="relative z-10 w-full group/carousel">
                {/* Fade Masks (Smoke Effect) - Adaptive */}
                <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-16 md:w-32 z-20 pointer-events-none bg-gradient-to-r to-transparent",
                    disableUrlParams
                        ? "from-white via-white/80 dark:from-neutral-950 dark:via-neutral-950/80" // 🔥 Dashboard Match (Neutral)
                        : "from-slate-950 via-slate-950/80" // 🌑 Marketing Match
                )} />
                <div className={cn(
                    "absolute right-0 top-0 bottom-0 w-16 md:w-32 z-20 pointer-events-none bg-gradient-to-l to-transparent",
                    disableUrlParams
                        ? "from-white via-white/80 dark:from-neutral-950 dark:via-neutral-950/80" // 🔥 Dashboard Match (Neutral)
                        : "from-slate-950 via-slate-950/80" // 🌑 Marketing Match
                )} />

                {/* Scroll Buttons (Desktop) - Show based on scroll position */}
                {!isLoading && plans.length > 0 && canScrollLeft && (
                    <button
                        onClick={() => {
                            const container = document.getElementById('pricing-carousel');
                            if (container) container.scrollBy({ left: -350, behavior: 'smooth' });
                        }}
                        className="absolute left-8 md:left-12 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-slate-900/80 border border-slate-700 text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity disabled:opacity-0 hidden md:flex hover:bg-slate-800 backdrop-blur-sm"
                        aria-label="Scroll Left"
                    >
                        <LucideIcons.ChevronLeft className="w-6 h-6" />
                    </button>
                )}
                {!isLoading && plans.length > 0 && canScrollRight && (
                    <button
                        onClick={() => {
                            const container = document.getElementById('pricing-carousel');
                            if (container) container.scrollBy({ left: 350, behavior: 'smooth' });
                        }}
                        className="absolute right-8 md:right-12 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-slate-900/80 border border-slate-700 text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity disabled:opacity-0 hidden md:flex hover:bg-slate-800 backdrop-blur-sm"
                        aria-label="Scroll Right"
                    >
                        <LucideIcons.ChevronRight className="w-6 h-6" />
                    </button>
                )}

                <div
                    id="pricing-carousel"
                    className="flex flex-nowrap gap-4 md:gap-6 overflow-y-hidden overflow-x-auto pb-12 pt-10 px-6 md:px-[calc(25vw-190px)] snap-x snap-mandatory scrollbar-hide items-end"
                >
                    {isLoading ? (
                        // Skeleton Loader
                        [1, 2, 3].map((i) => (
                            <div key={i} className="min-w-[320px] md:min-w-[380px] snap-center flex flex-col h-full mx-auto transform transition-transform duration-300">
                                <div className="rounded-[24px] bg-slate-900/50 border border-slate-800 h-full p-8 flex flex-col gap-6 animate-pulse">
                                    {/* Header Skeleton */}
                                    <div className="space-y-3">
                                        <div className="h-4 w-24 bg-slate-800 rounded mx-auto md:mx-0" />
                                        <div className="h-8 w-48 bg-slate-800 rounded mx-auto md:mx-0" />
                                        <div className="h-3 w-32 bg-slate-800/50 rounded mx-auto md:mx-0" />
                                    </div>
                                    {/* Price Skeleton */}
                                    <div className="flex items-baseline gap-2 mt-4">
                                        <div className="h-10 w-32 bg-slate-800 rounded" />
                                        <div className="h-4 w-12 bg-slate-800/50 rounded" />
                                    </div>
                                    {/* Feature List Skeleton */}
                                    <div className="space-y-4 mt-8 flex-1">
                                        {[1, 2, 3, 4, 5].map((j) => (
                                            <div key={j} className="flex items-center gap-3">
                                                <div className="w-5 h-5 rounded-full bg-slate-800 shrink-0" />
                                                <div className="h-3 w-full bg-slate-800/50 rounded" />
                                            </div>
                                        ))}
                                    </div>
                                    {/* Button Skeleton */}
                                    <div className="h-12 w-full bg-slate-800 rounded-xl mt-auto" />
                                </div>
                            </div>
                        ))
                    ) : plans.length === 0 ? (
                        // Premium Empty State
                        <div className="min-w-full flex justify-center py-20">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                className="max-w-2xl mx-auto text-center"
                            >
                                <div className="relative bg-gradient-to-br from-slate-900/90 via-indigo-900/20 to-slate-900/90 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-12 overflow-hidden shadow-2xl">
                                    {/* Animated Background Gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 animate-pulse opacity-50"></div>

                                    {/* Glow Effect */}
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>

                                    {/* Content */}
                                    <div className="relative z-10">
                                        {/* Icon */}
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                            className="mb-8 flex justify-center"
                                        >
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
                                                <div className="relative p-6 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full border-2 border-indigo-400/50 backdrop-blur-sm">
                                                    <LucideIcons.Ticket className="w-16 h-16 text-indigo-300" strokeWidth={1.5} />
                                                </div>
                                            </div>
                                        </motion.div>

                                        {/* Title */}
                                        <motion.h3
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-purple-300 mb-4 tracking-tight"
                                        >
                                            No Plans Available Yet
                                        </motion.h3>

                                        {/* Subtitle */}
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.4 }}
                                            className="text-slate-300 text-lg mb-10 leading-relaxed max-w-md mx-auto"
                                        >
                                            We're currently setting up our pricing plans.
                                            <br />
                                            <span className="text-indigo-300 font-semibold">Check back soon</span> for exclusive <span className="text-purple-300 font-semibold">  pricing!</span>
                                        </motion.p>

                                        {/* Buttons */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.5 }}
                                            className="flex gap-4 justify-center flex-wrap"
                                        >
                                            <button
                                                onClick={() => window.location.href = '/contact'}
                                                className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold transition-all duration-300 shadow-lg shadow-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/70 hover:scale-105"
                                            >
                                                <span className="relative z-10 flex items-center gap-2">
                                                    <Mail className="w-5 h-5" />
                                                    Contact Us
                                                </span>
                                                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity blur"></div>
                                            </button>
                                            <button
                                                onClick={() => window.location.reload()}
                                                className="px-8 py-4 border-2 border-indigo-400/50 text-indigo-200 hover:text-white hover:border-indigo-300 rounded-xl font-bold transition-all duration-300 backdrop-blur-sm hover:bg-indigo-500/10 flex items-center gap-2"
                                            >
                                                <LucideIcons.RefreshCw className="w-5 h-5" />
                                                Refresh
                                            </button>
                                        </motion.div>

                                        {/* Footer Badge */}
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.6 }}
                                            className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-400/30 rounded-full text-indigo-300 text-sm font-semibold backdrop-blur-sm"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            Coming Soon -   Exclusive Pricing
                                        </motion.div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    ) : (
                        plans.map((plan, idx) => (
                            <div key={idx} className="min-w-[320px] md:min-w-[380px] snap-center flex flex-col">
                                <PricingCard
                                    plan={plan}
                                    idx={idx}
                                    hoveredIndex={hoveredIndex}
                                    setHoveredIndex={setHoveredIndex}
                                    onPlanClick={handlePlanClick}
                                    currencySymbol={currencySymbol}
                                    isEmbedded={disableUrlParams}
                                    geo={geo}
                                />
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Trust Indicators - Hide when no plans */}
            {!isLoading && plans.length > 0 && (
                <div className="container relative z-10 flex justify-center mx-auto px-8 md:px-12">
                    <div className="inline-flex items-center justify-center gap-8 text-slate-600 text-sm font-medium flex-wrap">
                        <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Secure Payment</span>
                        <span className="hidden md:flex h-4 w-px bg-slate-800"></span>
                        <span className="flex items-center gap-2"><InfinityIcon className="w-4 h-4" /> Cancel Anytime</span>
                        <span className="hidden md:flex h-4 w-px bg-slate-800"></span>
                        <div
                            onClick={(e) => {
                                e.preventDefault();
                                const starterPlan = plans.find(p => p.key === 'starter') || plans.find(p => p.price !== '₹0') || plans[0];
                                if (starterPlan) {
                                    const url = new URL(window.location.href);
                                    url.searchParams.set('tab', 'customize-plan');
                                    window.history.pushState({}, '', url);
                                    // handlePlanClick(starterPlan);
                                }
                            }}
                            className="flex items-center gap-2 hover:text-slate-400 transition-colors cursor-pointer"
                        >
                            <Calculator className="w-4 h-4" /> Customize Plan
                        </div>
                        <span className="hidden md:flex h-4 w-px bg-slate-800"></span>
                        <a href="/pricing?tab=customize-plan" className="flex items-center gap-2 hover:text-slate-400 transition-colors"><Lock className="w-4 h-4" /> Privacy Policy</a>
                    </div>
                </div>
            )}


            {/* Plan Viewer Modal */}
            <PlanViewerModal
                open={modalOpen}
                plan={selectedPlan}
                onClose={() => {
                    setModalOpen(false);
                    setSelectedPlan(null); // Reset selected plan to allow re-selection

                    if (!disableUrlParams) {
                        // Check for returnTo param
                        const returnTo = searchParams.get('returnTo');
                        if (returnTo) {
                            router.push(returnTo);
                            return;
                        }

                        // Clear URL params to allow re-opening
                        const url = new URL(window.location.href);
                        url.searchParams.delete('tab');
                        url.searchParams.delete('planId');
                        window.history.replaceState({}, '', url.pathname);
                    }
                }}
            />
        </section >
    );
}
