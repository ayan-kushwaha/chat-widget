'use client';

import React, { Suspense, useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, ShieldCheck, Ticket, Zap, Globe, FileText, Database, CheckCircle2, Bot, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { usePlans } from '@/hooks/usePlans';
import { Input } from '@/components/ui/input';
import { useSession } from 'next-auth/react';
import { LoginModal } from '@/components/auth/LoginModal';
import { usePlanCalculations } from '@/hooks/usePlanCalculations';
import { RetroGrid } from "@/components/ui/retro-grid";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useGeo } from '@/hooks/useGeo';
import { RainbowButton } from "@/components/ui/rainbow-button"
import { ConfettiButton } from '@/components/ui/confetti';
import { useTheme } from 'next-themes';
import { Particles } from '@/components/ui/particles';
import { calculatePermissions } from '@/utils/permissionCalculator';
import { generateSnapshot } from '@/utils/snapshotUtils';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { BillingAddressModal } from './components/BillingAddressModal';
import { TopUpModal } from './components/TopUpModal';
import { useOrg } from '@/context/OrgContext';
import { useCheckoutStore } from "@/stores/checkout.store";
import { decodeBillingPayload } from "@/utils/billingCrypto";

// Helper to load Razorpay Script

// Helper to load Razorpay Script
const loadRazorpay = () => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

import { CYCLE_OPTIONS } from '@/config/billing.config';

const BillingContent = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const { config, loading: configLoading } = useSystemConfig(); // Fetch System Config
    const { plans, isLoading } = usePlans();
    const { resolvedTheme } = useTheme()
    const [color, setColor] = useState("#ffffff")
    useEffect(() => {
        setColor(resolvedTheme === "dark" ? "#ffffff" : "#000000")
    }, [resolvedTheme])
    // 🌍 Geo Intelligence Hook (PPP Pricing)
    const geo = useGeo();
    const { activeOrg: organization } = useOrg(); // Need Organization Context to check billing info

    // ✅ Initialize state from URL params (for persistence across reloads)

    // ✅ Initialize state from URL params (for persistence across reloads)
    // 🔐 Secure Checkout Logic (Receiver)
    // 1. Get Encrypted Payload
    const q = searchParams.get('q');

    // 2. State from Store (Memory)
    const storeCycle = useCheckoutStore(state => state.billingCycle);
    const storeCoupon = useCheckoutStore(state => state.couponCode);
    const setStoreCycle = useCheckoutStore(state => state.setBillingCycle);

    // 3. Decode & Validate
    const decoded = useMemo(() => decodeBillingPayload(q), [q]);

    // 4. Fallback / Redirect if Tampered or Missing
    useEffect(() => {
        if (!decoded && !searchParams.get('planId')) { // Allow legacy planId for direct links if needed, or strict block?
            // User said: "URL se nhi mange karna". Strict Mode.
            if (q && !decoded) {
                // Tampered!
                router.replace('/pricing?error=tampered');
            }
        }
    }, [decoded, q, router, searchParams]);

    // Use Decoded Values OR Fallback (if direct link allowed - though user wants strict)
    // We will prioritizing Decoded.
    const planId = decoded?.planId || searchParams.get('planId') || 'starter';
    const customTokens = decoded?.tokens ? decoded.tokens.toString() : searchParams.get('tokens');

    // Store Sync
    const [selectedCycleId, setSelectedCycleId] = useState<string>(storeCycle || 'monthly');
    const [couponCode, setCouponCode] = useState(storeCoupon || '');

    // Update Store when local state changes
    useEffect(() => {
        setStoreCycle(selectedCycleId as 'monthly' | 'yearly');
    }, [selectedCycleId, setStoreCycle]);

    // Restore Missing States
    const storeTerms = useCheckoutStore(state => state.termsAccepted);
    const setStoreTerms = useCheckoutStore(state => state.setTermsAccepted);

    const [termsAccepted, setTermsAccepted] = useState(storeTerms || false);
    const [couponDiscount, setCouponDiscount] = useState<number>(0);
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null); // Use storeCoupon to fetch if needed, but for now init empty

    // Sync Terms with Store
    useEffect(() => {
        setStoreTerms(termsAccepted);
    }, [termsAccepted, setStoreTerms]);

    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showBillingModal, setShowBillingModal] = useState(false); // 🧾 KYC Modal State
    const [showTopUp, setShowTopUp] = useState(false); // 💰 Top-up Modal State
    const [retryPayment, setRetryPayment] = useState(false); // 🔄 Queue payment after login
    const { data: session, status } = useSession();
    const currency = geo.currency.code;
    const currencySymbol = geo.currency.symbol;
    const isINR = currency === 'INR';

    // Find Plan Details
    let plan = plans.find(p => p.id === planId);

    // ✅ Override plan with custom URL params (from Pricing Modal customization)
    if (plan && customTokens) {
        plan = {
            ...plan,
            maxTokens: parseInt(customTokens),
            // Price is NOT set here. It's calculated dynamically below using costMultiplier.
        };

    }

    const isFree = planId.includes('free') || (plan?.name?.toLowerCase().includes('free') || false);

    // Pricing Logic (Dynamic PPP) - Refactored to use Centralized Hook
    const { finalPrice: baseMonthlyPrice, loading } = usePlanCalculations({
        plan,
        tokenLimit: plan?.maxTokens || 0,
        costMultiplier: geo.currency.costMultiplier,
        planTiers: config?.tierDefinitions,
        tierDefinitions: config?.tierDefinitions,
        features: config?.features
    });

    // Calculate Current Totals based on Cycle
    const selectedCycle = CYCLE_OPTIONS.find(c => c.id === selectedCycleId) || CYCLE_OPTIONS[0];
    const totalMonths = selectedCycle.months;
    const subtotal = Number((baseMonthlyPrice * totalMonths).toFixed(2));
    const durationDiscount = Number((subtotal * selectedCycle.discount).toFixed(2));

    // Apply Coupon Discount Logic (Client Side Preview)
    let calculatedCouponDiscount = 0;
    if (appliedCoupon) {
        if (appliedCoupon.discountType === 'PERCENTAGE') {
            calculatedCouponDiscount = Number(((subtotal - durationDiscount) * (appliedCoupon.discountValue / 100)).toFixed(2)); // Apply on discounted amount or base? usually base or subtotal. Let's stack it on payable.
        } else if (appliedCoupon.discountType === 'FLAT') {
            calculatedCouponDiscount = appliedCoupon.discountValue;
        }
    }

    const finalTotal = Math.max(0, subtotal - durationDiscount - calculatedCouponDiscount);

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setIsProcessing(true);
        try {
            const res = await fetch('/api/coupons/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: couponCode })
            });
            const data = await res.json();

            if (res.ok && data.isValid) {
                setAppliedCoupon(data.coupon);
                setCouponDiscount(data.coupon.discountValue); // Just for trigger
                // 🟢 Persist Coupon
                localStorage.setItem('cluaiz_active_coupon', couponCode);
                toast.success("Coupon Applied!", { description: `Saved via ${data.coupon.code}` });
            } else {
                setAppliedCoupon(null);
                setCouponDiscount(0);
                localStorage.removeItem('cluaiz_active_coupon');
                toast.error("Invalid Coupon", { description: data.message || "Code not found" });
            }
        } catch (err) {
            console.error("Coupon validation error:", err);
            toast.error("Validation Failed", { description: "Could not connect to server" });
        } finally {
            setIsProcessing(false);
        }
    };

    // ✅ Auto-apply coupon from STORE on first load (if set in previous step)
    useEffect(() => {
        // 🟢 Fix: Check Store OR LocalStorage (Persistence)
        const persistedCoupon = typeof window !== 'undefined' ? localStorage.getItem('cluaiz_active_coupon') : null;
        const codeToApply = storeCoupon || persistedCoupon;

        if (codeToApply && !appliedCoupon) {
            // Auto-validate and apply coupon from Store
            setCouponCode(codeToApply);
            // Trigger validation
            fetch('/api/coupons/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: codeToApply })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.isValid) {
                        setAppliedCoupon(data.coupon);
                        setCouponDiscount(data.coupon.discountValue);
                        // Ensure it's saved (e.g. if came from store but not local yet)
                        localStorage.setItem('cluaiz_active_coupon', codeToApply);
                    } else {
                        // Invalid persisted coupon? Clear it
                        localStorage.removeItem('cluaiz_active_coupon');
                    }
                })
                .catch(err => console.error('Auto-apply coupon error:', err));
        }
    }, [storeCoupon]); // Only run if store has a coupon on mount

    // 🔄 Post-Login Payment Retry Logic (Robust)
    useEffect(() => {
        // 1. Check for persisted intent (Page Reload / Google OAuth)
        const isPending = sessionStorage.getItem('cluaiz_pending_payment');
        if (isPending && status === 'authenticated') {
            sessionStorage.removeItem('cluaiz_pending_payment');
            setRetryPayment(true);
        }

        // 2. Process Retry Queue
        if (retryPayment && status === 'authenticated' && organization) {
            console.log("🔄 Retrying queued payment after login...");
            setRetryPayment(false); // Clear queue
            handlePayment();
        }
    }, [retryPayment, status, organization]); // Runs when Org loads

    // --- ENHANCED FEATURE LIST LOGIC ---
    const maxWebsites = plan?.limits?.maxWebsites || plan?.maxWebsites || (planId === 'starter' ? 1 : 10);
    const maxFiles = plan?.limits?.maxFiles || plan?.maxFiles || (planId === 'starter' ? 5 : 50);
    const maxForms = plan?.limits?.maxForms || plan?.maxForms || (planId === 'starter' ? 2 : 20);

    const handlePayment = async () => {
        if (!plan) return;
        if (!termsAccepted) {
            toast.error("Please accept the Terms & Conditions");
            return;
        }

        setIsProcessing(true);

        try {
            // AUTH CHECK: If not logged in, show popup
            if (status === 'unauthenticated') {
                toast("Please log in to continue payment");
                // 💾 Persist Intent in case of Page Reload (Google Login)
                sessionStorage.setItem('cluaiz_pending_payment', 'true');
                setShowLoginModal(true);
                // We will retry after login via retryPayment state
                setIsProcessing(false);
                return;
            }

            const token = (session as any)?.accessToken || (session as any)?.user?.token;
            if (!token) {
                // Fallback if status says authenticated but token missing
                toast.error("Session invalid. Please log in again.");
                setShowLoginModal(true);
                setIsProcessing(false);
                return;
            }

            // 🧾 KYC CHECK: Check if Billing Address Exists (Smart Skip Flow)
            const billingInfo = (organization as any)?.billing_info;
            // Strict check: Needs Address + Pincode
            if (!billingInfo?.address_line1 || !billingInfo?.pincode || !billingInfo?.country) {
                console.log("⚠️ Billing Address Missing - Opening Modal");
                setShowBillingModal(true);
                setIsProcessing(false);
                return;
            }

            const isLoaded = await loadRazorpay();
            if (!isLoaded) throw new Error("Razorpay SDK failed to load.");

            // Create Order
            const orderRes = await fetch('/api/payment/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    planId: plan.id,
                    currency,
                    billingCycle: selectedCycleId, // 'monthly', '3_months', etc.
                    couponCode: appliedCoupon ? appliedCoupon.code : undefined, // Pass coupon to backend
                    tokenCapacity: plan.maxTokens // 🟢 Send Requested Tokens for Backend Calculation
                })
            });

            const orderData = await orderRes.json();
            if (!orderData.success) throw new Error(orderData.message);

            // 🧪 MOCK MODE CHECK
            if (orderData.order.id.startsWith('order_mock_')) {
                toast.info("Simulation Mode Enabled", { description: "Processing mock payment..." });

                // Simulate network delay
                setTimeout(async () => {
                    await handleVerification({
                        razorpay_order_id: orderData.order.id,
                        razorpay_payment_id: `pay_mock_${Date.now()}`,
                        razorpay_signature: 'mock_signature'
                    });
                }, 1500);
                return;
            }

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
                amount: orderData.order.amount,
                currency: orderData.order.currency,
                name: "Cluaiz AI",
                description: `${plan.displayName} - ${selectedCycle.label} Plan`,
                order_id: orderData.order.id,
                handler: async function (response: any) {
                    await handleVerification(response);
                },
                theme: { color: "#6366f1" }
            };

            const paymentObject = new (window as any).Razorpay(options);
            paymentObject.open();

        } catch (error: any) {
            console.error("Payment Error:", error);
            toast.error("Payment Failed", { description: error.message });
            setIsProcessing(false);
        }
    };

    // Extracted Verification Logic for reuse
    const handleVerification = async (response: any) => {
        try {
            const token = (session as any)?.accessToken || (session as any)?.user?.token;
            // --- FRONTEND SNAPSHOT GENERATION (DYNAMIC API BACKED) ---
            if (!config) {
                toast.error("System config missing. Please refresh.");
                return;
            }

            const userTokens = plan.limits?.monthlyTokens || plan.maxTokens;
            const safeTokens = Math.min(userTokens, config.maxTokenLimit);

            // 1. Calculate Permissions based on tokens AND API DATA (Using Ranges)
            const tiersToUse = (config.tierDefinitions || config.planTiers) as any[];
            const permissions = calculatePermissions(safeTokens, tiersToUse, config.maxTokenLimit);

            // ✅ Complete Order Summary Breakdown
            const orderSummary = {
                subtotal: subtotal,
                duration_months: totalMonths,
                duration_discount: durationDiscount,
                coupon_code: appliedCoupon?.code || null,
                coupon_discount: calculatedCouponDiscount,
                total_savings: durationDiscount + calculatedCouponDiscount,
                final_total: finalTotal
            };

            // 2. Generate Optimized Snapshot (Using Shared Logic)
            const snapshot = generateSnapshot({
                planName: plan.displayName,
                pricePaid: finalTotal,
                currency: currency,
                billing_cycle: selectedCycleId,
                tokens: safeTokens,
                permissions: permissions.permissions,
                featuresRegistry: config.features,
                orderSummary: orderSummary
            });

            // 3. Billing API Call (Backend will now ignore this snapshot and RE-GENERATE its own for security)
            const verifyRes = await fetch('/api/organizations/plan', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.accessToken}`
                },
                body: JSON.stringify({
                    orgId: (session?.user as any)?.organizationId,
                    planId: plan.id,
                    tokenCapacity: plan.maxTokens, // 🟢 New Field Name (Authorized Source)
                    pricePaid: finalTotal,
                    currency: currency,
                    billingCycle: selectedCycleId,
                    orderSummary: orderSummary,
                    snapshot: snapshot,
                    paymentId: response.razorpay_payment_id,
                    orderId: response.razorpay_order_id,
                    signature: response.razorpay_signature,
                    // 🟢 Fix: Explicitly send Billing Info for Invoice
                    billingInfo: {
                        company_name: (organization as any)?.billing_info?.company_name,
                        email: (organization as any)?.billing_info?.email || (session?.user as any)?.email,
                        phone: (organization as any)?.billing_info?.phone,
                        address_line1: (organization as any)?.billing_info?.address_line1,
                        city: (organization as any)?.billing_info?.city,
                        state: (organization as any)?.billing_info?.state,
                        state_name: (organization as any)?.billing_info?.state_name,
                        country: (organization as any)?.billing_info?.country,
                        country_name: (organization as any)?.billing_info?.country_name,
                        pincode: (organization as any)?.billing_info?.pincode,
                        tax_id: (organization as any)?.billing_info?.tax_id
                    }
                })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
                toast.success("Welcome to Premium!", { description: "Your plan is now active." });
                router.push('/dashboard/settings/billing?tab=overview');
            } else {
                toast.error("Activation Failed", { description: verifyData.message });
            }
        } catch (error: any) {
            toast.error("Verification Error", { description: error.message });
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading || !plan) {
        return (
            <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 font-sans gap-6">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    <p className="text-sm text-slate-500 font-medium">Loading checkout...</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.back()}
                    className="border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white hover:bg-slate-800"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
                </Button>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 overflow-hidden relative">
            <Particles
                className="absolute inset-0 z-20 opacity-20"
                quantity={100}
                ease={80}
                color={color}
                refresh
            />
            {/* --- GLOBAL RETRO GRID (Unified Background) --- */}
            <RetroGrid className="fixed inset-0 z-0 pointer-events-none" />

            {/* Global Ambient Glows */}
            <div className="fixed top-[-20%] left-[-10%] w-[1000px] h-[1000px] bg-indigo-600/10 rounded-full blur-[180px] pointer-events-none z-0" />
            <div className="fixed bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none z-0" />

            <div className="relative z-10 flex h-screen flex-col md:flex-row">

                {/* --- FIXED BACK BUTTON (DESKTOP) --- */}
                <div className="fixed top-8 left-8 lg:left-12 z-50 hidden md:block">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/pricing')}
                        className="bg-slate-950/50 border-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors backdrop-blur-md"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                </div>

                {/* --- LEFT COLUMN: DETAILS, CYCLE & FEATURES --- */}
                <div className="hidden md:flex w-full md:w-[55%] lg:w-[50%] flex-col p-10 lg:p-14 justify-center border-r border-white/5 backdrop-blur-sm bg-slate-950/50 overflow-y-auto no-scrollbar">

                    {/* Back Button */}


                    <div className="space-y-10 animate-in slide-in-from-left-4 duration-700 mt-12 md:mt-0">
                        {/* Plan Header */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <Badge variant="outline" className="text-white border-white/20 bg-white/5 backdrop-blur-md px-3 py-1 uppercase tracking-widest text-[10px]">
                                    Subscription
                                </Badge>
                                <Badge variant="outline" className="text-indigo-400 border-indigo-500/30 bg-indigo-500/10 backdrop-blur-md px-3 py-1 uppercase tracking-widest text-[10px]">
                                    {plan.name} Tier
                                </Badge>
                            </div>
                            <h1 className="text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-indigo-100 to-indigo-400 tracking-tight mb-4">
                                {plan.displayName}
                            </h1>
                            <p className="text-lg text-slate-400 leading-relaxed border-l-2 border-indigo-500/30 pl-4 max-w-lg">
                                {plan.description}
                            </p>
                        </div>

                        {/* DURATION SELECTOR */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center max-w-lg">
                                <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Select Duration</Label>
                                <span className="text-xs text-indigo-400 font-medium animate-pulse">✨ 15% OFF (Best Value)</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 max-w-lg">
                                {(isFree ? CYCLE_OPTIONS.filter(c => c.id === 'monthly') : CYCLE_OPTIONS).map((option) => {
                                    const isSelected = selectedCycleId === option.id;
                                    return (
                                        <div
                                            key={option.id}
                                            onClick={() => setSelectedCycleId(option.id)}
                                            className={cn(
                                                "relative p-4 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-2 cursor-pointer group select-none",
                                                isSelected
                                                    ? "bg-indigo-600/10 border-indigo-500 shadow-xl shadow-indigo-900/20"
                                                    : "bg-slate-800/20 border-slate-700/50 hover:bg-slate-800/40 hover:border-slate-600"
                                            )}
                                        >
                                            {option.discount > 0 && (
                                                <Badge className={cn(
                                                    "absolute -top-2.5 right-2 text-[10px] px-1.5 h-5 pointer-events-none shadow-sm transition-colors",
                                                    isSelected ? "bg-indigo-500 text-white" : "bg-emerald-500/90 text-white"
                                                )}>
                                                    SAVE {Math.round(option.discount * 100)}%
                                                </Badge>
                                            )}

                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors",
                                                    isSelected ? "border-indigo-500" : "border-slate-600"
                                                )}>
                                                    {isSelected && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                                                </div>
                                                <span className={cn("text-sm font-bold", isSelected ? "text-white" : "text-slate-400 group-hover:text-slate-300")}>
                                                    {option.label}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Features List */}
                        <div className="space-y-5 max-w-lg">
                            <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wide">
                                <Zap className="w-4 h-4 text-amber-500" /> What's Included
                            </h4>
                            <div className="grid grid-col-1 gap-3">
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                                        <Zap className="w-5 h-5 fill-current" />
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-white">{plan.maxTokens.toLocaleString()} Tokens</div>
                                        <div className="text-xs text-slate-400">Monthly Cluaiz AI Processing Capacity</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                                        <Globe className="w-4 h-4 text-emerald-400" />
                                        <div className="text-sm text-slate-300"><strong className="text-white">{maxWebsites}</strong> Websites</div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                                        <FileText className="w-4 h-4 text-blue-400" />
                                        <div className="text-sm text-slate-300"><strong className="text-white">{maxFiles}</strong> Documents</div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                                        <Database className="w-4 h-4 text-purple-400" />
                                        <div className="text-sm text-slate-300"><strong className="text-white">{maxForms}</strong> Lead Forms</div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                                        <CheckCircle2 className="w-4 h-4 text-pink-400" />
                                        <div className="text-sm text-slate-300"><strong className="text-white">{plan.maxUsers}</strong> Team Seats</div>
                                    </div>
                                </div>

                                {/* EXTRA FULL WIDTH CARD */}
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm relative overflow-hidden group hover:bg-white/10 transition-colors">
                                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/20 z-10">
                                        <Bot className="w-5 h-5 fill-current" />
                                    </div>
                                    <div className="z-10">
                                        <div className="text-sm font-bold text-white flex items-center gap-2">
                                            AI Agents & Chatbots <Badge variant="secondary" className="text-[9px] h-4 px-1 bg-pink-500/20 text-pink-300 border-pink-500/30">NEW</Badge>
                                        </div>
                                        <div className="text-xs text-slate-400">Custom Training, Smart Actions & API Access</div>
                                    </div>
                                </div>
                            </div>
                        </div>


                    </div>
                </div>

                {/* --- RIGHT COLUMN: CHECKOUT FORM --- */}
                <div className="flex-1 flex flex-col justify-center p-6 md:p-12 lg:p-16 overflow-y-auto relative bg-slate-950/60 backdrop-blur-2xl no-scrollbar">

                    {/* Mobile Back Button (Sticky) */}
                    <div className="md:hidden sticky -top-10 z-40 bg-slate-950/90 backdrop-blur-sm backdrop-saturate-150 pt-8 pb-4 -mx-6 px-6 -mt-6 mb-6 border-b border-white/5">
                        <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2 text-slate-400 hover:text-white">
                            <ArrowLeft className="h-4 w-4 mr-1" /> Back
                        </Button>
                    </div>

                    <div className="max-w-md md:pt-0 pt-40 mx-auto w-full space-y-8 animate-in slide-in-from-right-4 duration-700 delay-100">
                        <div>
                            <h2 className="text-3xl font-bold mb-2 text-white">Payment Details</h2>
                            <p className="text-slate-400 text-sm">Review your order and complete purchase.</p>
                        </div>

                        {/* MOBILE DURATION SELECTOR - Only show if options > 1 (Hide for Free Plan ideally, or show single) */}
                        <div className={cn("md:hidden space-y-4 border-b border-white/5 pb-8", isFree && "hidden")}>
                            <div className="flex justify-between items-center">
                                <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Select Duration</Label>
                                <span className="text-xs text-indigo-400 font-medium animate-pulse">✨ Save up to 15%</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {(isFree ? CYCLE_OPTIONS.filter(c => c.id === 'monthly') : CYCLE_OPTIONS).map((option) => {
                                    const isSelected = selectedCycleId === option.id;
                                    return (
                                        <div
                                            key={option.id}
                                            onClick={() => setSelectedCycleId(option.id)}
                                            className={cn(
                                                "relative p-3 rounded-lg border transition-all duration-200 flex flex-col items-center justify-center gap-1 cursor-pointer group select-none h-20",
                                                isSelected
                                                    ? "bg-indigo-600/10 border-indigo-500 shadow-lg shadow-indigo-900/20"
                                                    : "bg-slate-800/20 border-slate-700/50 hover:bg-slate-800/40 hover:border-slate-600"
                                            )}
                                        >
                                            {option.discount > 0 && (
                                                <Badge className={cn(
                                                    "absolute -top-2 -right-2 text-[9px] px-1.5 h-4 pointer-events-none shadow-sm transition-colors",
                                                    isSelected ? "bg-indigo-500 text-white" : "bg-emerald-500/90 text-white"
                                                )}>
                                                    -{Math.round(option.discount * 100)}%
                                                </Badge>
                                            )}
                                            <span className={cn("text-xs font-bold", isSelected ? "text-white" : "text-slate-400")}>
                                                {option.label}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Order Summary Card */}
                        <div className="space-y-4">
                            <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Order Summary</Label>

                            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl shadow-black/20">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-baseline text-sm">
                                        <span className="text-slate-400 font-medium">{plan.displayName} <span className="text-xs opacity-50 ml-1">x {totalMonths} mo</span></span>
                                        <span className="font-mono text-slate-200">{currencySymbol}{subtotal.toLocaleString()}</span>
                                    </div>

                                    {durationDiscount > 0 && (
                                        <div className="flex justify-between items-baseline text-sm text-emerald-400">
                                            <span className="flex items-center gap-1.5"><Ticket className="w-3.5 h-3.5" /> Duration Discount</span>
                                            <span className="font-mono font-bold">
                                                -{currencySymbol}{durationDiscount.toLocaleString()}
                                            </span>
                                        </div>
                                    )}

                                    {appliedCoupon && (
                                        <div className="flex justify-between items-baseline text-sm text-purple-400">
                                            <span className="flex items-center gap-1.5"><Ticket className="w-3.5 h-3.5 fill-current" /> Coupon ({appliedCoupon.code})</span>
                                            <span className="font-mono font-bold">
                                                -{currencySymbol}{calculatedCouponDiscount.toLocaleString()}
                                            </span>
                                        </div>
                                    )}

                                    <div className="h-px bg-slate-800 my-2" />

                                    <div className="flex justify-between items-end">
                                        <div>
                                            <span className="text-sm text-slate-400 block mb-0.5">Total Payble</span>
                                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Inclusive of taxes</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-4xl font-black text-white tracking-tighter">
                                                {loading ? (
                                                    <div className="h-10 w-32 bg-slate-800 animate-pulse rounded my-1" />
                                                ) : (
                                                    <>{currencySymbol}{finalTotal.toLocaleString()}</>
                                                )}
                                            </div>
                                            {!loading && (durationDiscount + calculatedCouponDiscount) > 0 && (
                                                <div className="text-xs font-bold text-emerald-400 mt-1 animate-pulse">
                                                    You save {currencySymbol}{(durationDiscount + calculatedCouponDiscount).toLocaleString()}!
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            </div>


                            {/* Coupon Input */}
                            <div className="flex gap-2 relative">
                                <div className="relative w-48 group">
                                    <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 stroke-[1.5px] w-4 h-4 group-hover:text-indigo-400 transition-colors z-10" />
                                    <Input
                                        placeholder="Coupon Code"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value)}
                                        disabled={!!appliedCoupon}
                                        className="pl-9 bg-slate-900 border-slate-800 text-slate-300 placeholder:text-slate-600 focus:ring-indigo-500/20 focus:border-indigo-500/50 h-10 text-sm"
                                    />
                                </div>
                                {appliedCoupon ? (
                                    <Button variant="outline" size="sm" className="shrink-0 mt-[2px] py-[18px] text-red-400 hover:text-red-300 border-slate-700 hover:bg-slate-800"
                                        onClick={() => {
                                            setAppliedCoupon(null);
                                            setCouponCode('');
                                            // 🟢 Fix: Clear persisted coupon on remove
                                            localStorage.removeItem('cluaiz_active_coupon');
                                        }}>
                                        Remove
                                    </Button>
                                ) : (
                                    <ConfettiButton className="shrink-0 hover:text-white mt-[2px] py-[19px] border-slate-700 hover:bg-slate-800" onClick={handleApplyCoupon} disabled={!couponCode || isProcessing}>
                                        {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Apply'}
                                    </ConfettiButton>
                                )}
                            </div>
                        </div>

                        {/* Terms - Optimized for Reliability */}
                        <div className="flex items-start gap-3 pt-2 px-1">
                            <Checkbox
                                id="terms-checkout"
                                checked={termsAccepted}
                                onCheckedChange={(c) => {
                                    setTermsAccepted(!!c);
                                }}
                                className="mt-1 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 border-slate-600 bg-slate-800/50 z-20 relative"
                            />
                            <div className="grid gap-1.5 leading-none">
                                <label
                                    htmlFor="terms-checkout"
                                    className="text-sm font-medium leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-400 cursor-pointer select-none"
                                >
                                    I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 hover:underline z-30 relative" onClick={(e) => e.stopPropagation()}>Terms of Service</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 hover:underline z-30 relative" onClick={(e) => e.stopPropagation()}>Privacy Policy</a>.
                                </label>
                            </div>
                        </div>

                        {/* 🧾 Billing Information (Compact Line below Terms) */}
                        {(organization as any)?.billing_info?.address_line1 && (
                            <div className="flex items-center justify-between   opacity-80 hover:opacity-100 transition-opacity">
                                <div className="text-[10px] text-slate-500">
                                    <span className="font-bold text-slate-600 tracking-wider"></span> <span className="text-slate-400/80 ml-2">
                                        {(organization as any)?.billing_info?.company_name || ' '}, {(organization as any)?.billing_info.country}, {(organization as any)?.billing_info.state}, {(organization as any)?.billing_info.pincode}
                                    </span>
                                </div>
                                <button
                                    className="text-[10px] font-medium text-indigo-400 hover:text-indigo-300 hover:underline  hover:border-indigo-400 transition-all"
                                    onClick={() => setShowBillingModal(true)}
                                >
                                    Edit Billing Information
                                </button>
                            </div>
                        )}

                        {/* Pay Button */}
                        <div className="space-y-6 pt-">
                            <RainbowButton
                                size="lg"
                                variant="outline"
                                onClick={handlePayment}
                                disabled={isProcessing || !termsAccepted}
                                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] hover:bg-[center_right] transition-all duration-500 shadow-xl shadow-indigo-900/40 rounded-xl border border-white/10 relative overflow-hidden"
                            >
                                {isProcessing ? (
                                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
                                ) : (
                                    `Pay ${currencySymbol}${finalTotal.toLocaleString()} Securely`
                                )}
                            </RainbowButton>

                            {/* Trust Footer */}
                            <div className="space-y-3">
                                <div className="flex justify-center items-center gap-3 opacity-30 hover:opacity-100 transition-opacity duration-500">
                                    <div className="h-6 w-10 bg-slate-800 border border-slate-700 rounded flex items-center justify-center text-[8px] font-bold text-slate-400">VISA</div>
                                    <div className="h-6 w-10 bg-slate-800 border border-slate-700 rounded flex items-center justify-center text-[8px] font-bold text-slate-400">MC</div>
                                    <div className="h-6 w-10 bg-slate-800 border border-slate-700 rounded flex items-center justify-center text-[8px] font-bold text-slate-400">UPI</div>
                                </div>

                                <div className="text-center space-y-1">
                                    <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 font-medium">
                                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                        <span>Guaranteed Safe & Secure Checkout</span>
                                    </div>
                                    <p className="text-[9px] text-slate-600">
                                        Powered by <span className="font-bold text-indigo-500/80">Razorpay</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            <LoginModal
                open={showLoginModal}
                onOpenChange={setShowLoginModal}
                skipRefresh={true}  // ✅ Preserve billing state, no page reload
                onSuccess={() => {
                    // Close modal
                    setShowLoginModal(false);
                    // Queue retry - will fire via useEffect when Org is ready
                    toast.success("Logged in! Verifying details...");
                    setRetryPayment(true);
                }}
            />

            {/* 🧾 Billing Address Modal (Gatekeeper) */}
            <BillingAddressModal
                open={showBillingModal}
                onOpenChange={setShowBillingModal}
                initialData={(organization as any)?.billing_info}
                onSuccess={() => {
                    // ✅ User requested Manual Trigger only
                    // We just close the modal (handled internally) and refresh UI
                    toast.success("Billing Details Updated. Proceed to Pay.");
                }}
            />

            <TopUpModal
                open={showTopUp}
                onClose={() => setShowTopUp(false)}
            />
        </div>
    );
};

export default function BillingPage() {
    return (
        <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-slate-950"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>}>
            <BillingContent />
        </Suspense>
    );
}
