'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UsageOverview } from '@/app/dashboard/settings/billing/components/UsageOverview';
import { SubscriptionPlans } from './components/SubscriptionPlans';
import { BillingLogs } from './components/BillingLogs';
import { BillingCalculator } from './components/BillingCalculator';
import { useOrganization } from '@/hooks/useOrganization';
import { useOrg } from '@/context/OrgContext';

import { Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

export default function BillingPage() {
    const { organization, isLoading } = useOrganization();
    const { userProfileInActiveOrg } = useOrg();

    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // Sync Tab with URL
    const defaultTab = 'overview';
    const currentTab = searchParams?.get('tab') || defaultTab;
    const [activeTab, setActiveTab] = useState(currentTab);

    // Update URL when State Changes (if triggered by user interaction)
    const handleTabChange = (value: string) => {
        setActiveTab(value);
        const params = new URLSearchParams(searchParams?.toString());
        params.set('tab', value);
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    // Keep state in sync if URL changes externally (e.g. back button)
    useEffect(() => {
        const tabFromUrl = searchParams?.get('tab');
        if (tabFromUrl && tabFromUrl !== activeTab) {
            setActiveTab(tabFromUrl);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    // Handle Upgrade Button Click -> Navigate to 'plans' tab
    const handleUpgradeClick = () => {
        handleTabChange('plans');
    };

    if (isLoading || !organization) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    // Derived Data
    const hasUsedFreePlan = organization.hasUsedFreePlan || false; // Will be added to schema later
    const currentPlanId = organization.subscription?.plan_id;

    // Transform Usage Data
    const usageData = {
        tokensUsed: organization.usage?.tokensUsed || 0,
        words_limit: organization.usage?.words_limit || 0,
        rollover_tokens: organization.usage?.rollover_tokens || 0,
        topup_balance: organization.usage?.topup_balance || 0,
        usage_percentage: Math.min(100, Math.round(
            ((organization.usage?.tokensUsed || 0) /
                ((organization.usage?.words_limit || 1) + (organization.usage?.rollover_tokens || 0) + (organization.usage?.topup_balance || 0))
            ) * 100
        )),
        planName: organization.subscription?.snapshot?.plan_name || 'Free Trial',
        expires_at: organization.subscription?.expires_at,
        rollover_expires_at: organization.usage?.rollover_expires_at
    };

    return (
        <div className="container mx-auto  ">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Billing & Plans</h1>
                <p className="text-gray-500 mt-2">Manage your subscription, view usage, and download invoices.</p>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-8">
                    <TabsTrigger value="overview">Usage Overview</TabsTrigger>
                    <TabsTrigger value="logs">Billing History</TabsTrigger>
                    <TabsTrigger value="plans">Available Plans</TabsTrigger>
                    <TabsTrigger value="simulator">Usage Simulator</TabsTrigger>
                </TabsList>

                {/* Tab 1: Overview */}
                <TabsContent value="overview" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <UsageOverview
                        isLoading={isLoading}
                        onUpgradeClick={handleUpgradeClick}
                        data={{
                            plan: {
                                id: organization?.subscription?.plan_id || 'free',
                                name: (organization?.subscription?.plan_id?.split('_')[0] || 'free').charAt(0).toUpperCase() + (organization?.subscription?.plan_id?.split('_')[0] || 'free').slice(1),
                                // 🟢 FIXED: Use DB snapshot price (no hardcoded dummy values)
                                price: (() => {
                                    const orderSummary = (organization?.subscription?.snapshot as any)?.order_summary;
                                    return orderSummary?.subtotal ||
                                        organization?.subscription?.snapshot?.price_paid ||
                                        0;
                                })(),
                                currency: organization?.subscription?.snapshot?.currency || '',
                                status: organization?.subscription?.status || 'inactive',
                                periodStart: organization?.planStartDate || new Date().toISOString(),
                                expiresAt: organization?.subscription?.expires_at || null,
                                renewsInDays: organization?.subscription?.expires_at ? (() => {
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0); // Reset to midnight
                                    const expiryDate = new Date(organization.subscription.expires_at);
                                    expiryDate.setHours(0, 0, 0, 0); // Reset to midnight
                                    const diffTime = expiryDate.getTime() - today.getTime();
                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                    return Math.max(0, diffDays);
                                })() : 0,
                                billingCycle: organization?.subscription?.snapshot?.billing_cycle || 'month',
                                couponCode: (organization?.subscription?.snapshot as any)?.coupon_code || (organization?.subscription as any)?.metadata?.coupon_code || null,
                                // 🟢 FIX: Pass explicit pricing fields from DB with fallback for old subscriptions
                                price_offer: (() => {
                                    const snapshot = organization?.subscription?.snapshot as any;
                                    // New subscriptions have price_offer in snapshot
                                    if (snapshot?.price_offer) return snapshot.price_offer;
                                    // Old subscriptions: fallback to order_summary.final_total or price_paid
                                    return snapshot?.order_summary?.final_total || snapshot?.price_paid || 0;
                                })(),
                                price_market: (() => {
                                    const snapshot = organization?.subscription?.snapshot as any;
                                    // New subscriptions have price_market in snapshot
                                    if (snapshot?.price_market) return snapshot.price_market;
                                    // Old subscriptions: calculate from base price
                                    const basePrice = snapshot?.order_summary?.subtotal || snapshot?.price_paid || 0;
                                    return basePrice * 1.5; // Market = Base * 1.5
                                })(),
                            },
                            usage: {
                                tokens: {
                                    used: organization?.usage?.tokensUsed || 0,
                                    limit: organization?.subscription?.snapshot?.limits?.max_tokens || 0,
                                    percentage: (organization?.subscription?.snapshot?.limits?.max_tokens || 0) > 0
                                        ? ((organization?.usage?.tokensUsed || 0) / (organization?.subscription?.snapshot?.limits?.max_tokens || 1)) * 100
                                        : 0
                                },
                                rollover: {
                                    current: organization?.usage?.rollover_tokens || 0,
                                    percentage: organization?.subscription?.snapshot?.limits?.rollover_percentage || 0,
                                    validityDays: organization?.subscription?.snapshot?.limits?.rollover_validity_days || 30
                                },
                                topup: {
                                    balance: organization?.usage?.topup_balance || 0,
                                    limit: organization?.usage?.topup_limit || 0, // 🟢 Added Map
                                },
                                websites: {
                                    used: (organization?.usage as any)?.sites_count || 0,
                                    limit: organization?.subscription?.snapshot?.limits?.max_websites || 0,
                                    pagesLimit: organization?.subscription?.snapshot?.limits?.max_website_pages || 0,
                                    pagesCount: (organization?.usage as any)?.total_pages || 0
                                },
                                files: {
                                    used: (organization?.usage as any)?.files_count || 0,
                                    limit: organization?.subscription?.snapshot?.limits?.max_file_uploads || 0,
                                    sizeLimitMB: organization?.subscription?.snapshot?.limits?.brain_capacity_mb || organization?.subscription?.snapshot?.limits?.max_kb_size_mb || 0
                                },
                                team: {
                                    used: organization?.users_access?.length || organization?.usage?.team_members || 1,
                                    limit: organization?.subscription?.snapshot?.limits?.max_team_members || 0
                                },
                                smartFeatures: {
                                    chatsLimit: organization?.subscription?.snapshot?.limits?.max_chats || 0,
                                    formsLimit: organization?.subscription?.snapshot?.limits?.max_forms || 0,
                                    botsLimit: organization?.subscription?.snapshot?.limits?.max_bots || 0,
                                    manualQALimit: organization?.subscription?.snapshot?.limits?.max_manual_qa || 0
                                },
                                counters: {
                                    botsUsed: (organization?.usage as any)?.chatbotsCreated || 0,
                                    formsUsed: (organization?.usage as any)?.forms_count || 0,
                                    manualQAUsed: (organization?.usage as any)?.manual_qa_count || 0
                                },
                                storageBreakdown: {
                                    documents: (organization?.usage as any)?.storage_breakdown?.documents_mb || 0,
                                    websites: (organization?.usage as any)?.storage_breakdown?.websites_mb || 0,
                                    training: (organization?.usage as any)?.storage_breakdown?.training_mb || 0,
                                    chatHistory: (organization?.usage as any)?.storage_breakdown?.chat_history_mb || 0,
                                    forms: (organization?.usage as any)?.storage_breakdown?.forms_mb || 0,
                                    autoLearning: (organization?.usage as any)?.storage_breakdown?.auto_learning_mb || 0,
                                    total: (organization?.usage as any)?.storage_breakdown?.total_mb || 0
                                },
                                storageBySystem: {
                                    minio: (organization?.usage as any)?.storage_by_system_calculated?.minio_mb || 0,
                                    minio_breakdown: (organization?.usage as any)?.storage_by_system_calculated?.minio_breakdown,
                                    mongodb: (organization?.usage as any)?.storage_by_system_calculated?.mongodb_mb || 0,
                                    chroma: (organization?.usage as any)?.storage_by_system_calculated?.chroma_mb || 0,
                                    total: (organization?.usage as any)?.storage_by_system_calculated?.total_mb || 0
                                },
                            },
                            financial: {
                                subtotal: (organization?.subscription?.snapshot as any)?.order_summary?.subtotal || 0,
                                savings: (organization?.subscription?.snapshot as any)?.order_summary?.total_savings || 0,
                                finalTotal: (organization?.subscription?.snapshot as any)?.order_summary?.final_total || organization?.subscription?.snapshot?.price_paid || 0,
                                retentionDays: organization?.subscription?.snapshot?.limits?.data_retention_days || 30,
                                // Pass exact values to avoid floating point drift
                                couponDiscount: (organization?.subscription?.snapshot as any)?.order_summary?.coupon_discount,
                                durationDiscount: (organization?.subscription?.snapshot as any)?.order_summary?.duration_discount
                            },
                            // Pass User Details for Invoice
                            customer: {
                                name: (organization as any)?.billing_info?.company_name || userProfileInActiveOrg?.name || organization?.name || "Valued Customer",
                                email: (organization as any)?.billing_info?.email || userProfileInActiveOrg?.email || "",
                                address: (organization as any)?.billing_info?.address_line1 || "",
                                city: (organization as any)?.billing_info?.city || "",
                                state: (organization as any)?.billing_info?.state_name || "",
                                country: (organization as any)?.billing_info?.country_name || "",
                                pincode: (organization as any)?.billing_info?.pincode || "",
                                taxId: (organization as any)?.billing_info?.tax_id || "",
                                phone: (organization as any)?.billing_info?.phone || ""
                            }
                        }}
                        billingLogs={organization.billingLogs || []}
                    />
                </TabsContent>

                {/* Tab 2: Plans */}
                <TabsContent value="plans" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <SubscriptionPlans
                        hasUsedFreePlan={hasUsedFreePlan}
                        currentPlanId={currentPlanId}
                    />
                </TabsContent>

                {/* Tab 3: Logs */}
                <TabsContent value="logs" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* TODO: Fetch Real Logs */}
                    <BillingLogs />
                </TabsContent>

                {/* Tab 4: Simulator */}
                <TabsContent value="simulator" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <BillingCalculator />
                </TabsContent>
            </Tabs>
        </div>
    );
}
