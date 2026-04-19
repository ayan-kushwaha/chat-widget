'use client';

import React from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
    Zap, RefreshCw, Calendar, Globe, Folder, Users, Bot,
    CheckCircle2, ChevronRight, Settings, FileText, Plus, Activity,
    CreditCard, Download, HelpCircle, Info, Shield,
    Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MARKUP_FACTOR, CYCLE_OPTIONS, getDurationDiscount } from '@/config/billing.config';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react'; // Added useState and useEffect
import { TopUpModal } from '@/app/billing/components/TopUpModal'; // Added TopUpModal
import { useSession } from 'next-auth/react';
import { formatInvoiceFromTransaction } from '@/utils/billingUtils'; // 🟢 Added import
import { transactionsAPI } from '@/api/transactions.api'; // 🟢 Added for local fetch
import { useOrganization } from '@/hooks/useOrganization'; // 🟢 Added for org ID

// Dynamic import for InvoiceDownloadButton to avoid SSR issues
const InvoiceDownloadButton = dynamic(() => import('./InvoiceGenerator'), { ssr: false });

// --- Props Interface ---
export interface DashboardData {
    plan: {
        id?: string; // 🟢 Added to fix Type Error in page.tsx
        name: string;
        price: number;
        currency: string;
        periodStart: string | null;
        expiresAt: string | null;
        status: string;
        billingCycle: string;
        couponCode?: string;
        renewsInDays?: number;
        price_offer?: number;  // 🟢 New Architecture
        price_market?: number; // 🟢 New Architecture
    };
    customer?: {
        name: string;
        email: string;
        address?: string;  // address_line1
        city?: string;
        state?: string;
        country?: string;
        pincode?: string;
        taxId?: string;
        phone?: string;
    };
    usage: {
        tokens: { used: number; limit: number; percentage: number };
        rollover: { current: number; percentage: number; validityDays?: number };
        topup: { balance: number; limit?: number }; // 🟢 Added limit
        websites: { used: number; limit: number; pagesLimit: number; pagesCount?: number };
        files: { used: number; limit: number; sizeLimitMB: number };
        team: { used: number; limit: number };
        smartFeatures: {
            chatsLimit: number;
            formsLimit: number;
            botsLimit: number;
            manualQALimit: number;
        };
        counters?: {
            botsUsed: number;
            formsUsed: number;
            manualQAUsed?: number;
        };
        storageBreakdown?: {
            documents: number;
            websites: number;
            training: number;
            chatHistory: number;
            forms: number;
            autoLearning: number;
            total: number;
        };
        storageBySystem?: {
            minio: number;
            minio_breakdown?: {
                file_bucket_count: number;
                raw_bucket_count: number;
            };
            mongodb: number;
            chroma: number;
            total: number;
        };
    };
    financial: {
        subtotal?: number;
        savings: number;
        finalTotal?: number;
        retentionDays: number;
        couponDiscount?: number;
        durationDiscount?: number;
    };
}

interface UsageOverviewProps {
    data: DashboardData;
    isLoading?: boolean;
    onUpgradeClick?: () => void;
}



// --- Helpers ---
const formatCompact = (num: number) => Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num);
const formatDate = (dateString: string | null) => dateString ? new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';

// --- Visual Styles ---
const glassCardClass = "bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]";

// --- Components ---

const ProgressBar = ({ current, max, colorClass }: { current: number, max: number, colorClass: string }) => {
    const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0;
    return (
        <div className="h-2 w-full rounded-full bg-slate-800 mt-2 overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className={cn("h-full rounded-full transition-all duration-500", colorClass)}
            />
        </div>
    );
};

// 1. THE COCKPIT HEADER
const CockpitHeader = ({ plan, usage, onUpgradeClick, latestTransaction }: { plan: DashboardData['plan'], usage: DashboardData['usage'], onUpgradeClick?: () => void, latestTransaction?: any }) => {
    // 🟢 FIXED: Check expiry date instead of unreliable status field
    // User has NO plan if: no expiry date OR expiry is in past OR is 'free' plan with 0 price
    const hasNoPlan = !plan.expiresAt ||
        new Date(plan.expiresAt) <= new Date() ||
        (plan.id === 'free' && plan.price === 0);

    const percentage = hasNoPlan ? 0 : Math.min(Math.max(usage.tokens.percentage, 0), 100);
    // Format Numbers (India Format as per user request e.g. 10,00,000)
    const formatNum = (num: number) => new Intl.NumberFormat('en-IN').format(num);

    return (
        <div className="relative w-full overflow-hidden rounded-[32px] border border-white/10 bg-[#0A0A0A] shadow-2xl group transition-all duration-500 hover:border-white/20">

            {/* Background Ambient Glow */}
            <div className="absolute right-0 top-0 h-[500px] w-[500px] -translate-y-1/2 translate-x-1/3 rounded-full bg-blue-600/10 blur-[120px] pointer-events-none group-hover:bg-blue-600/20 transition-all duration-1000"></div>

            <div className="flex flex-col md:flex-row h-full relative z-10">

                {/* LEFT SIDE: Plan Info */}
                <div className="flex flex-1 flex-col justify-center p-8 md:p-10 space-y-6">
                    <div className="flex items-center gap-4">
                        {/* 🟢 Fix: "No Active Plan" instead of "Free Tier" */}
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase tabular-nums">
                            {hasNoPlan ? 'No Active Plan' : `${plan.name} Tier`}
                        </h1>
                        {/* 🟢 Fix: Hide LIVE badge for inactive/free */}
                        {!hasNoPlan && (
                            <span className="rounded-full bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)] animate-pulse">LIVE</span>
                        )}
                    </div>

                    {/* 🟢 Hide entire expiry/price line when no plan */}
                    {!hasNoPlan && (
                        <div className="text-xl text-slate-400 font-medium tracking-wide flex items-center gap-3">
                            <>Renewing in <span className="text-white font-bold">{plan.renewsInDays} Days</span></>
                            <span className="text-slate-600">|</span>
                            <span className="text-indigo-400 font-mono font-bold">
                                {plan.name?.toLowerCase().includes('free') ?
                                    <span className="text-emerald-400">FREE</span> :
                                    <>{plan.currency === 'INR' ? '₹' : '$'}<CountUp start={0} end={plan.price} decimals={2} duration={1.5} preserveValue /></>
                                    // <>{plan.currency === 'INR' ? '₹' : '$'}<CountUp start={0} end={financial?.finalTotal || plan.price} decimals={2} duration={1.5} preserveValue /></>

                                }
                            </span>
                        </div>
                    )}

                    <div className="flex gap-4 pt-2">
                        <Button
                            onClick={onUpgradeClick}
                            className="h-12 px-8 rounded-xl bg-white text-black hover:bg-slate-200 font-bold text-base shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all hover:-translate-y-0.5 border-0"
                        >
                            <Zap className="mr-2 h-5 w-5 fill-black" /> {hasNoPlan ? 'Add Plan' : 'Upgrade Plan'}
                        </Button>
                        {/* 🟢 Hide Systems Checks button when no plan */}
                        {!hasNoPlan && (
                            <Button variant="outline" className="h-12 px-6 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold backdrop-blur-md">
                                <Activity className="mr-2 h-4 w-4 text-emerald-400" /> Systems Checks
                            </Button>
                        )}
                    </div>
                </div>

                {/* RIGHT SIDE: The "HUD" Performance Cluster */}
                <div className="relative flex flex-1 items-center justify-center p-8 md:p-10">

                    <div className="flex items-center gap-8 md:gap-12">

                        {/* 1. The GLOWING ARC with PERCENTAGE */}
                        <div className="relative h-32 w-32 shrink-0">
                            {/* Background Circle */}
                            <svg className="h-full w-full -rotate-90 transform overflow-visible">
                                <defs>
                                    <linearGradient id="gradientArc" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#3b82f6" />
                                        <stop offset="100%" stopColor="#22d3ee" />
                                    </linearGradient>
                                </defs>
                                <circle cx="50%" cy="50%" r="58" stroke="#1f2937" strokeWidth="12" fill="transparent" />
                                <motion.circle
                                    cx="50%" cy="50%" r="58"
                                    stroke="url(#gradientArc)"
                                    strokeWidth="12"
                                    fill="transparent"
                                    strokeDasharray="364"
                                    strokeDashoffset={364}
                                    animate={{ strokeDashoffset: 364 - (364 * percentage) / 100 }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    strokeLinecap="round"
                                    style={{ filter: "drop-shadow(0 0 10px rgba(59,130,246,0.5))" }}
                                />
                            </svg>
                            {/* Percentage Inside Circle */}
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                <span className="text-2xl font-black text-white">{percentage.toFixed(1)}%</span>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Used</span>
                            </div>
                        </div>

                        {/* 2. THE REAL DATA */}
                        <div className="flex flex-col">
                            <span className="text-xs font-bold tracking-[0.2em] text-blue-400 uppercase mb-2">
                                AI Compute Token
                            </span>

                            {/* The Big Number (Usage) */}
                            <div className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none drop-shadow-xl mb-3 tabular-nums">
                                <CountUp start={0} end={usage.tokens.used} duration={2} formattingFn={formatNum} />
                            </div>

                            {/* The Divider & Total Limit */}
                            <div className="h-1.5 w-16 rounded-full bg-slate-800 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                                />
                            </div>
                            {/* 🟢 Fix: Force limit to 0 if No Plan */}
                            <CountUp start={0} end={hasNoPlan ? 0 : usage.tokens.limit} duration={2} formattingFn={formatNum} className="text-xl font-bold text-slate-500 tabular-nums" />
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};

// ... (Imports)

// 2. ASSETS ROW
const AssetsRow = ({ usage, plan, financial, customer, onAddFunds, latestTransaction }: {
    usage: DashboardData['usage'],
    plan: DashboardData['plan'],
    financial: DashboardData['financial'],
    customer: DashboardData['customer'],
    onAddFunds: () => void,
    latestTransaction?: any
}) => {
    // 🧠 Duration Calculation for UI
    const start = new Date(plan.periodStart || new Date()).getTime(); // Handle null periodStart
    const end = plan.expiresAt ? new Date(plan.expiresAt).getTime() : new Date().getTime();
    // Rough month diff
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    let durationLabel = "";

    if (diffDays > 360) durationLabel = "(Yearly)";
    else if (diffDays > 30) durationLabel = `(${Math.round(diffDays / 30)} Months)`;
    else durationLabel = "(Monthly)";

    // 🟢 Logic Reverted to Backend-Source (DB) as per user request
    // The backend now calculates min(unused, 20% limit) and stores it in usage.rollover.current

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT COLUMN: Stacked Assets */}
            <div className="flex flex-col gap-6">
                <Card className="bg-zinc-950 border-white/10 p-6 relative overflow-hidden group transition-all rounded-[24px] shadow-2xl flex-1">
                    {/* Background Grid Effect */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-950/90 to-indigo-950/20"></div>
                    <div className="relative z-10 h-full flex flex-col">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400"><RefreshCw className="w-6 h-6" /></div>
                            <div className="text-3xl font-black text-white tracking-tight tabular-nums">
                                {/* 🟢 Fix: Force 0 Rollover for Free/No Plan users */}
                                <CountUp start={0} end={plan.price === 0 ? 0 : usage.rollover.current} duration={2} separator="," />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Renewed Rollover Balance</h3>
                        </div>
                        <div className="mt-auto pt-4">
                            <p className="text-[10px] text-indigo-400/80 font-medium bg-indigo-500/10 inline-block px-2 py-1 rounded-md border border-indigo-500/10">
                                Rollover Cap of {usage.rollover.percentage}% • Valid till {formatDate(new Date(new Date(plan.expiresAt || new Date()).getTime() + ((usage.rollover.validityDays || 0) * 24 * 60 * 60 * 1000)).toISOString())}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="bg-amber-950/20 border-amber-500/20 backdrop-blur-md p-6 relative overflow-hidden group hover:border-amber-500/40 transition-all rounded-[24px] flex-1">
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-amber-500/10 rounded-full blur-[50px] group-hover:bg-amber-500/20 transition-colors" />
                    <div className="relative z-10 h-full flex flex-col">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400"><Zap className="w-6 h-6" /></div>
                            <div className="flex flex-col">
                                <div className="text-3xl font-black text-white tracking-tight tabular-nums flex items-baseline gap-1">
                                    {(usage.topup as any).limit > 0 ? (
                                        <>
                                            <span className="text-amber-400">
                                                <CountUp start={0} end={(usage.topup as any).limit - usage.topup.balance} duration={2} separator="," formattingFn={formatCompact} />
                                            </span>
                                            <span className="text-lg text-slate-500 font-medium">/</span>
                                            <span className="text-xl text-slate-400">
                                                <CountUp start={0} end={(usage.topup as any).limit} duration={2} separator="," formattingFn={formatCompact} />
                                            </span>
                                        </>
                                    ) : (
                                        <CountUp start={0} end={usage.topup.balance} duration={2} separator="," formattingFn={formatCompact} />
                                    )}
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-amber-200 text-xs font-bold uppercase tracking-wider mb-1">
                                {(usage.topup as any).limit > 0 ? "Top-up Used" : "Top-up Wallet"}
                            </h3>
                        </div>
                        <div className="mt-auto pt-4 flex items-center gap-2">
                            {(usage.topup as any).limit > 0 && (
                                <p className="text-[10px] text-amber-400/80 font-medium bg-amber-500/10 inline-block px-2 py-1 rounded-md border border-amber-500/10">
                                    Bal: <CountUp end={usage.topup.balance} formattingFn={formatCompact} />
                                </p>
                            )}
                            <Button
                                size="sm"
                                className="h-6 text-[10px] bg-amber-500 hover:bg-amber-600 text-black font-bold px-3 ml-auto"
                                onClick={onAddFunds}
                            >
                                + Add Tokens
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            {/* RIGHT COLUMN: Billing Details (Full Height) */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-md p-6 relative overflow-hidden group hover:bg-white/10 transition-all rounded-[24px] h-full flex flex-col">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-400 border border-emerald-500/20"><CreditCard size={20} /></div>
                        <div>
                            <div className="text-sm font-bold text-white">Visa •••• XX</div>
                            <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1"><CheckCircle2 size={10} /> Default Method</div>
                        </div>
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-white"><Settings size={16} /></Button>
                </div>
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Plan Price</span>
                        <span className="text-slate-400 line-through">
                            {plan.name?.toLowerCase().includes('free') ?
                                '₹0' :
                                <>{plan.currency === 'INR' ? '₹' : '$'}<CountUp start={0} end={plan.price} decimals={2} duration={1.5} preserveValue /></>
                            }
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-emerald-400">Savings</span>
                        <span className="text-emerald-400 font-bold">-{plan.currency === 'INR' ? '₹' : '$'}<CountUp start={0} end={financial?.savings || 0} decimals={2} duration={1.5} preserveValue /></span>
                    </div>
                    <div className="h-px bg-white/10 my-2"></div>
                    <div className="flex justify-between items-center text-base">
                        <span className="text-white font-bold">Amount Paid</span>
                        <span className="text-white font-black text-lg">
                            {plan.name?.toLowerCase().includes('free') ?
                                '₹0' :
                                <>{plan.currency === 'INR' ? '₹' : '$'}<CountUp start={0} end={financial?.finalTotal || plan.price} decimals={2} duration={1.5} preserveValue /></>
                            }
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-2">
                        <span className="text-slate-400">Subscribed On</span>
                        {/* 🟢 Fix: Hide date if No Active Plan */}
                        <span className="text-slate-200">
                            {plan.price === 0 ? <span className="text-slate-500 italic">N/A</span> : formatDate(plan.periodStart)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Next Renewal</span>
                        {/* 🟢 Fix: Hide renewal date if No Active Plan */}
                        <span className="text-slate-200">
                            {plan.price === 0 ? <span className="text-slate-500 italic">N/A</span> : formatDate(plan.expiresAt)}
                        </span>
                    </div>
                </div>
                <div className="mt-auto pt-5 grid grid-cols-2 gap-2">
                    {/* 🟢 Show Invoice Button based on Active Status (User Requirement) */}
                    {plan.status === 'active' ? (
                        <InvoiceDownloadButton
                            transaction={latestTransaction}
                            className="w-full text-xs border  border-white/10 bg-black/20 hover:bg-white/10 text-slate-300 flex items-center justify-center py-2 px-3 rounded-md transition-colors"
                        />
                    ) : (
                        <div className="w-full text-xs border border-white/10 bg-black/20 text-slate-600 flex items-center justify-center py-2 px-3 rounded-md opacity-30 cursor-not-allowed">
                            <Download size={12} className="mr-2" /> No Invoice
                        </div>
                    )}
                    <Button variant="outline" size="sm" className="w-full text-xs border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300"><HelpCircle size={12} className="mr-2" /> Help</Button>
                </div>
            </Card>
        </div>
    )
};

// 3. BILLING TIMELINE
const BillingTimeline = ({ plan, financial }: { plan: DashboardData['plan'], financial: DashboardData['financial'] }) => {
    const start = new Date(plan.periodStart || new Date()).getTime(); // Handle null periodStart
    const end = plan.expiresAt ? new Date(plan.expiresAt).getTime() : new Date().getTime() + (30 * 24 * 60 * 60 * 1000);
    const now = new Date().getTime();
    const totalDuration = end - start;
    const elapsed = now - start;
    const percentage = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);

    return (
        <Card className={cn("p-6 relative overflow-hidden", glassCardClass)}>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-800/80 rounded-lg text-slate-300 border border-white/5"><Calendar size={18} /></div>
                    <div><h3 className="text-sm font-bold text-white uppercase tracking-wide">Current Billing Cycle</h3><p className="text-xs text-slate-400">Manage your subscription timeline</p></div>
                </div>
                <div className="text-right">
                    <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">{plan.renewsInDays} Days Remaining</span>
                </div>
            </div>
            <div className="relative h-12 flex items-center px-4">
                <div className="absolute left-0 right-0 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-gradient-to-r from-blue-500 to-purple-500" initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 1.5, delay: 0.5 }} />
                </div>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full bg-slate-900 border-2 border-slate-600 z-10" />
                    <span className="absolute top-6 text-[10px] font-medium text-slate-500 whitespace-nowrap">{formatDate(plan.periodStart)}</span>
                </div>
                <motion.div className="absolute top-1/2 -translate-y-1/2 z-20 flex flex-col items-center" initial={{ left: 0 }} animate={{ left: `${percentage}%` }} transition={{ duration: 1.5, delay: 0.5 }}>
                    <div className="w-6 h-6 rounded-full bg-white border-4 border-indigo-600 shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                    <div className="absolute -top-8 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap">Today<div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-indigo-600" /></div>
                </motion.div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full bg-slate-900 border-2 border-slate-600 z-10" />
                    <span className="absolute top-6 text-[10px] font-medium text-slate-500 whitespace-nowrap">{formatDate(plan.expiresAt)}</span>
                </div>
            </div>
            <div className="mt-8 flex items-center gap-2 text-[10px] text-slate-500 justify-center">
                <Info size={12} /><span>Auto-deletion of data occurs on <span className="text-rose-400 font-bold">{plan.expiresAt ? formatDate(new Date(new Date(plan.expiresAt).getTime() + (financial.retentionDays * 24 * 60 * 60 * 1000)).toISOString()) : 'Expiry + Retention'}</span> if not renewed.</span>
            </div>
        </Card>
    );
};

// 4. NEW FEATURE CONSOLE (Replaces old Grid)
const FeatureConsole = ({ usage, financial, plan }: { usage: DashboardData['usage'], financial: DashboardData['financial'], plan: DashboardData['plan'] }) => (<>
    <div className="space-y-6">
        {/* ROW 1: Neural Spectrum Storage (iPhone Style) */}
        <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-zinc-950 shadow-2xl p-6">
            {/* Background Grid Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-950/90 to-emerald-950/20"></div>

            <div className="relative z-10">
                {/* Header Section */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-500/30">
                            <Database className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-black text-2xl text-white flex items-center gap-2">
                                Neural Brain Storage
                            </h3>
                            <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Million Tokens Context</p>
                        </div>
                    </div>

                    {/* Big Usage Number */}
                    <div className="text-right">
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-white tabular-nums"><CountUp end={usage.storageBySystem?.total || 0} decimals={2} duration={2} /></span>
                            <span className="text-2xl text-slate-500 font-medium">/</span>
                            <span className="text-3xl font-black text-emerald-400 tabular-nums"><CountUp end={usage.files.sizeLimitMB} duration={2} /></span>
                            <span className="text-xl text-slate-400 font-bold">MB</span>
                        </div>
                        <div className="flex items-center gap-2 justify-end mt-1">
                            <span className="text-xs text-emerald-400/70 font-medium">Space Used</span>
                            <div className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-black animate-pulse">
                                🎁 FREE
                            </div>
                        </div>
                    </div>
                </div>




                {/* The Spectrum Bar (Multi-Color iPhone Style) */}
                <div className="relative h-6 w-full bg-slate-900/50 rounded-full overflow-hidden mb-6 border border-white/10 shadow-inner">
                    {/* Multi-segment bar - each category with different color */}
                    <div className="flex h-full">
                        {(() => {
                            const total = usage.storageBySystem?.total || 0;
                            const limit = usage.files.sizeLimitMB || 110;

                            // Calculate percentages (relative to limit, not total)
                            const docsPct = total > 0 ? ((usage.storageBreakdown?.documents || 0) / limit) * 100 : 0;
                            const websPct = total > 0 ? ((usage.storageBreakdown?.websites || 0) / limit) * 100 : 0;
                            const trainPct = total > 0 ? ((usage.storageBreakdown?.training || 0) / limit) * 100 : 0;
                            const chatPct = total > 0 ? ((usage.storageBreakdown?.chatHistory || 0) / limit) * 100 : 0;
                            const formsPct = total > 0 ? ((usage.storageBreakdown?.forms || 0) / limit) * 100 : 0;
                            const autoLearnPct = total > 0 ? ((usage.storageBreakdown?.autoLearning || 0) / limit) * 100 : 0;

                            // Calculate Other/System (Total - Sum of Breakdown)
                            const breakdownSum = (usage.storageBreakdown?.documents || 0) +
                                (usage.storageBreakdown?.websites || 0) +
                                (usage.storageBreakdown?.training || 0) +
                                (usage.storageBreakdown?.chatHistory || 0) +
                                (usage.storageBreakdown?.forms || 0) +
                                (usage.storageBreakdown?.autoLearning || 0);

                            const otherMB = Math.max(0, total - breakdownSum);
                            const otherPct = total > 0 ? (otherMB / limit) * 100 : 0;

                            return (
                                <>
                                    {/* Documents - Blue */}
                                    {docsPct > 0 && (
                                        <div
                                            className="bg-blue-500 transition-all duration-1000 relative group hover:opacity-80"
                                            style={{ width: `${docsPct}%` }}
                                            title={`Documents: ${(usage.storageBreakdown?.documents || 0).toFixed(2)} MB`}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400"></div>
                                        </div>
                                    )}
                                    {/* Websites - Purple */}
                                    {websPct > 0 && (
                                        <div
                                            className="bg-purple-500 transition-all duration-1000 relative group hover:opacity-80"
                                            style={{ width: `${websPct}%` }}
                                            title={`Websites: ${(usage.storageBreakdown?.websites || 0).toFixed(2)} MB`}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-400"></div>
                                        </div>
                                    )}
                                    {/* Custom Training - Orange */}
                                    {trainPct > 0 && (
                                        <div
                                            className="bg-orange-500 transition-all duration-1000 relative group hover:opacity-80"
                                            style={{ width: `${trainPct}%` }}
                                            title={`Custom Training: ${(usage.storageBreakdown?.training || 0).toFixed(2)} MB`}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-400"></div>
                                        </div>
                                    )}
                                    {/* Chat History - Green */}
                                    {chatPct > 0 && (
                                        <div
                                            className="bg-emerald-500 transition-all duration-1000 relative group hover:opacity-80"
                                            style={{ width: `${chatPct}%` }}
                                            title={`Chat History: ${(usage.storageBreakdown?.chatHistory || 0).toFixed(2)} MB`}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-400"></div>
                                        </div>
                                    )}
                                    {/* Forms - Yellow */}
                                    {formsPct > 0 && (
                                        <div
                                            className="bg-yellow-500 transition-all duration-1000 relative group hover:opacity-80"
                                            style={{ width: `${formsPct}%` }}
                                            title={`Forms & Leads: ${(usage.storageBreakdown?.forms || 0).toFixed(2)} MB`}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-yellow-400"></div>
                                        </div>
                                    )}
                                    {/* Auto-Learning - Cyan */}
                                    {autoLearnPct > 0 && (
                                        <div
                                            className="bg-cyan-500 transition-all duration-1000 relative group hover:opacity-80"
                                            style={{ width: `${autoLearnPct}%` }}
                                            title={`Auto-Learning: ${(usage.storageBreakdown?.autoLearning || 0).toFixed(2)} MB`}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-cyan-400"></div>
                                        </div>
                                    )}
                                    {/* System/Other - Slate/Gray */}
                                    {otherPct > 0.01 && (
                                        <div
                                            className="bg-slate-600 transition-all duration-1000 relative group hover:opacity-80"
                                            style={{ width: `${otherPct}%` }}
                                            title={`System & Other: ${otherMB.toFixed(2)} MB`}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-slate-600 to-slate-500"></div>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                </div>

                {/* Detailed Legend Grid (Storage Breakdown) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Box 1: External Knowledge */}
                    <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-3">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">External Knowledge</h4>

                        {/* Documents */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
                                <span className="text-xs text-slate-300">Documents</span>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-white"><CountUp end={usage.files.used} duration={1.5} /> Files</div>
                                <div className="text-[10px] font-black text-blue-400"><CountUp end={usage.storageBreakdown?.documents || 0} decimals={2} duration={1.5} /> MB</div>
                            </div>
                        </div>

                        {/* Websites */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]"></span>
                                <span className="text-xs text-slate-300">Websites</span>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-white"><CountUp end={usage.websites.pagesCount || 0} duration={1.5} /> Pages</div>
                                <div className="text-[10px] font-black text-purple-400"><CountUp end={usage.storageBreakdown?.websites || 0} decimals={2} duration={1.5} /> MB</div>
                            </div>
                        </div>
                    </div>

                    {/* Box 2: Internal Training */}
                    <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-3">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Internal Training</h4>

                        {/* Manual QA */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"></span>
                                <span className="text-xs text-slate-300">Manual Q&A</span>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-white"><CountUp end={usage.counters?.manualQAUsed || 0} duration={1.5} /> Pairs</div>
                                <div className="text-[10px] font-black text-orange-400"><CountUp end={usage.storageBreakdown?.training || 0} decimals={2} duration={1.5} /> MB</div>
                            </div>
                        </div>

                        {/* Smart Forms */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]"></span>
                                <span className="text-xs text-slate-300">Smart Forms</span>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-white"><CountUp end={usage.counters?.formsUsed || 0} duration={1.5} /> Active</div>
                                <div className="text-[10px] font-black text-yellow-400"><CountUp end={usage.storageBreakdown?.forms || 0} decimals={2} duration={1.5} /> MB</div>
                            </div>
                        </div>
                    </div>

                    {/* Box 3: System Memory */}
                    <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-3">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">System Memory</h4>

                        {/* Chat History */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                                <span className="text-xs text-slate-300">Chat History</span>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-white">∞ Msgs</div>
                                <div className="text-[10px] font-black text-emerald-400"><CountUp end={usage.storageBreakdown?.chatHistory || 0} decimals={2} duration={1.5} /> MB</div>
                            </div>
                        </div>

                        {/* Auto-Learning */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]"></span>
                                <span className="text-xs text-slate-300">Auto-Learning</span>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-white">Active</div>
                                <div className="text-[10px] font-black text-cyan-400"><CountUp end={usage.storageBreakdown?.autoLearning || 0} decimals={2} duration={1.5} /> MB</div>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Storage by System Breakdown (Enhanced 3-Card Display) */}
                <div className="mt-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">📦 Storage by System Type</h4>
                    <div className="grid grid-cols-3 gap-4">
                        {/* MinIO Card */}
                        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 hover:border-blue-500/40 transition-all">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">📦</span>
                                <span className="text-xs text-blue-400 font-bold">File Storage</span>
                            </div>
                            <div className="text-3xl font-black text-blue-400 mb-1">
                                <CountUp end={usage.storageBySystem?.minio || 0} decimals={2} duration={2} />
                                <span className="text-sm text-slate-500 ml-1">MB</span>
                            </div>
                            <div className="text-[10px] text-slate-400 space-y-0.5">
                                <div>📄 {(usage.storageBySystem as any)?.minio_breakdown?.file_bucket_count || usage.files.used} Files + {(usage.storageBySystem as any)?.minio_breakdown?.raw_bucket_count || 0} Raw Items</div>
                                <div className="text-slate-500">MinIO (Uploads + Website Cache)</div>
                            </div>
                        </div>

                        {/* MongoDB Card */}
                        <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 hover:border-green-500/40 transition-all">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">🗄️</span>
                                <span className="text-xs text-green-400 font-bold">Database</span>
                            </div>
                            <div className="text-3xl font-black text-green-400 mb-1">
                                <CountUp end={usage.storageBySystem?.mongodb || 0} decimals={2} duration={2} />
                                <span className="text-sm text-slate-500 ml-1">MB</span>
                            </div>
                            <div className="text-[10px] text-slate-400 space-y-0.5">
                                <div>🌐 {usage.websites.used} Sites + {usage.websites.pagesCount || 0} Pages</div>
                                <div className="text-slate-500">MongoDB Collections</div>
                            </div>
                        </div>

                        {/* ChromaDB Card */}
                        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 hover:border-purple-500/40 transition-all">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">🧠</span>
                                <span className="text-xs text-purple-400 font-bold">Vector DB</span>
                            </div>
                            <div className="text-3xl font-black text-purple-400 mb-1">
                                <CountUp end={usage.storageBySystem?.chroma || 0} decimals={2} duration={2} />
                                <span className="text-sm text-slate-500 ml-1">MB</span>
                            </div>
                            <div className="text-[10px] text-slate-400 space-y-0.5">
                                <div>🔮 Embeddings & Vectors</div>
                                <div className="text-slate-500">ChromaDB Collections</div>
                            </div>
                        </div>
                    </div>
                    {/* Total Summary with Progress Bar - REMOVED as per user request (unified with top) */}
                </div>

                {/* Token Logic Warning */}
                <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-emerald-500/10 border border-amber-500/30">
                    <div className="text-center space-y-2">
                        <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                            ✅ First {usage.files.sizeLimitMB} MB = 100% FREE (No Token Deduction)
                        </p>
                        <div className="h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent"></div>
                        <p className="text-xs font-black text-amber-300">
                            ⚠️ Usage Beyond {usage.files.sizeLimitMB} MB: Each 1 MB = 1 Token Deducted
                        </p>
                    </div>
                </div>
            </div>
        </div>


        {/* ROW 2: Unified System Capabilities Panel */}
        <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-zinc-950 shadow-2xl mt-8">
            {/* Background Grid Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/95 to-zinc-900/90"></div>

            {/* Header */}
            <div className="relative z-10 px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    🎛️ System Capabilities
                </h3>
                <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Active Resources</span>
            </div>

            {/* 3-Column Grid */}
            {/* 3-Column Grid */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">

                {/* COLUMN 1: KNOWLEDGE BASE */}
                <div className="p-6 space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-blue-400 bg-blue-500/10 p-1.5 rounded-md text-sm">🌐</span>
                        <span className="text-sm font-bold text-slate-300">Knowledge Sources</span>
                    </div>

                    {/* Websites */}
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400">Live Websites</span>
                            <span className="text-white font-mono"><CountUp end={usage.websites.used} duration={1.5} /> / {usage.websites.limit}</span>
                        </div>
                        <ProgressBar current={usage.websites.used} max={usage.websites.limit} colorClass="bg-blue-500" />
                        <p className="text-[10px] text-slate-600 mt-2">Max {usage.websites.pagesLimit} Pages/Site</p>
                    </div>

                    {/* Files */}
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400">Knowledge Documents</span>
                            <span className="text-white font-mono"><CountUp end={usage.files.used} duration={1.5} /> / {usage.files.limit}</span>
                        </div>
                        <ProgressBar current={usage.files.used} max={usage.files.limit} colorClass="bg-cyan-400" />
                        <p className="text-[10px] text-slate-600 mt-2">Max {usage.files.limit * 5} MB/File</p>
                    </div>
                </div>

                {/* COLUMN 2: SMART TOOLS */}
                <div className="p-6 space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-purple-400 bg-purple-500/10 p-1.5 rounded-md text-sm">🧠</span>
                        <span className="text-sm font-bold text-slate-300">Training & Tools</span>
                    </div>

                    {/* QA Pairs */}
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400">Custom Training (Q&A)</span>
                            <span className="text-white font-mono"><CountUp end={usage.counters?.manualQAUsed || 0} duration={1.5} /> / {usage.smartFeatures.manualQALimit}</span>
                        </div>
                        <ProgressBar current={usage.counters?.manualQAUsed || 0} max={usage.smartFeatures.manualQALimit} colorClass="bg-purple-500" />
                    </div>

                    {/* Forms */}
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400">Lead Gen Forms</span>
                            <span className="text-white font-mono"><CountUp end={usage.counters?.formsUsed || 0} duration={1.5} /> / {usage.smartFeatures.formsLimit}</span>
                        </div>
                        <ProgressBar current={usage.counters?.formsUsed || 0} max={usage.smartFeatures.formsLimit} colorClass="bg-emerald-500" />
                    </div>
                </div>

                {/* COLUMN 3: TEAM & ACCESS */}
                <div className="p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-amber-400 bg-amber-500/10 p-1.5 rounded-md text-sm">👥</span>
                            <span className="text-sm font-bold text-slate-300">Workspace Access</span>
                        </div>

                        {/* Big Team Number */}
                        <div className="mt-6 text-center">
                            <div className="text-5xl font-black text-white">
                                <CountUp end={usage.team.used} duration={1.5} />
                                <span className="text-xl text-slate-600"> / {usage.team.limit}</span>
                            </div>
                            <div className="text-xs text-amber-500 font-bold tracking-wider mt-2 uppercase">Seats Occupied</div>
                        </div>

                        <div className="mt-4">
                            <ProgressBar current={usage.team.used} max={usage.team.limit} colorClass="bg-amber-500" />
                        </div>


                    </div>

                    {/* Quick Action Button */}
                    <button className="w-full mt-6 py-2 rounded-lg border border-white/10 text-xs font-medium text-slate-400 hover:bg-white/5 transition-colors">
                        Manage Team Members →
                    </button>
                </div>

            </div>
        </div>

    </div>

</>);


// --- MAIN LAYOUT ASSEMBLY ---
// --- MAIN LAYOUT ASSEMBLY ---
export const UsageOverview: React.FC<UsageOverviewProps & { billingLogs?: any[] }> = ({ data, isLoading, onUpgradeClick, billingLogs: propLogs = [] }) => {
    const [showTopUp, setShowTopUp] = useState(false);
    const [fetchedLogs, setFetchedLogs] = useState<any[]>([]);
    const { organization, refreshOrganization } = useOrganization();

    // 🟢 Fetch Real Logs (Self-Sufficient Component)
    // Fixes "Button Disabled" issue if parent doesn't pass logs
    useEffect(() => {
        const fetchLogs = async () => {
            const orgId = (organization as any)?._id || (organization as any)?.id;
            if (!orgId) return;

            try {
                const res = await transactionsAPI.getHistory(orgId, 1, 10); // Fetch latest 10
                if (res.success) {
                    setFetchedLogs(res.data);
                }
            } catch (e) {
                console.error("Failed to fetch logs for overview", e);
            }
        };
        fetchLogs();
    }, [(organization as any)?._id, (organization as any)?.id]);

    // Combine props (if any) and fetched logs
    const billingLogs = fetchedLogs.length > 0 ? fetchedLogs : propLogs;

    // 🟢 FIND ACTIVE INVOICE (Pure DB Link)
    // Find the latest successful transaction that matches the current plan
    // This ensures we download the *correct* invoice for the current active subscription
    const latestTransaction = React.useMemo(() => {
        if (!billingLogs || billingLogs.length === 0) return null;

        // Filter for success and matching plan (logic can be relaxed if plan IDs change frequently, but this is safest)
        const relevant = billingLogs.filter(t => t.status === 'success' && (t.planName === data.plan.id || data.plan.id === 'free'));

        // Sort by date desc (just in case)
        return relevant.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    }, [billingLogs, data.plan.id]);

    if (isLoading) return <div className="animate-pulse h-96 bg-slate-900 rounded-3xl" />;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };
    const itemVariants = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } } } as any;

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8 mb-12">
            {/* 🟢 pass data.plan directly - NO merging with transaction snapshot for UI */}
            <motion.div variants={itemVariants}><CockpitHeader plan={data.plan} usage={data.usage} onUpgradeClick={onUpgradeClick} latestTransaction={latestTransaction} /></motion.div>

            <motion.div variants={itemVariants}>
                <AssetsRow
                    usage={data.usage}
                    plan={data.plan}
                    financial={data.financial}
                    customer={data.customer}
                    onAddFunds={() => setShowTopUp(true)}
                    latestTransaction={latestTransaction}
                />
            </motion.div>

            <motion.div variants={itemVariants}><BillingTimeline plan={data.plan} financial={data.financial} /></motion.div>

            {/* NEW Feature Console replaces old Resource Grid */}
            <motion.div variants={itemVariants}>
                <FeatureConsole usage={data.usage} financial={data.financial} plan={data.plan} />
            </motion.div>

            {/* MODAL */}
            <TopUpModal
                open={showTopUp}
                onClose={() => setShowTopUp(false)}
                onSuccess={() => {
                    refreshOrganization();
                    setShowTopUp(false);
                }}
            />

        </motion.div>
    );
};
