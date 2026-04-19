"use client";

import { useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { subscriptionsAPI } from "@/api/subscriptions.api";
import { PlanComparisonService } from "@/services/plan-comparison.service";
import * as LucideIcons from "lucide-react";

interface FeatureUpgradeModalProps {
    open: boolean;
    onClose: () => void;
    lockedFeature: {
        id: string;
        name: string;
        icon: string;
        description: string;
    };
    currentSnapshot: any;
    latestPlan: any;
    organizationId: string;
    onUpgradeSuccess: () => void;
}

export default function FeatureUpgradeModal({
    open,
    onClose,
    lockedFeature,
    currentSnapshot,
    latestPlan,
    organizationId,
    onUpgradeSuccess
}: FeatureUpgradeModalProps) {
    const [isUpgrading, setIsUpgrading] = useState(false);

    const comparison = PlanComparisonService.compare(currentSnapshot, latestPlan);

    // Get icon component
    const FeatureIcon = (LucideIcons as any)[lockedFeature.icon] || (LucideIcons as any).Box;

    const handleUpgrade = async () => {
        try {
            setIsUpgrading(true);

            // Call renewal API to create new snapshot
            await subscriptionsAPI.renew(organizationId, {
                plan_id: latestPlan.id,
                name: latestPlan.name,
                price: latestPlan.price,
                billing_cycle: latestPlan.billing_cycle || 'monthly',
                feature_ids: latestPlan.features.map((f: any) => f.id),
                limits: latestPlan.limits
            });

            toast.success("🎉 Plan upgraded! New features unlocked.");
            onUpgradeSuccess();
            onClose();

        } catch (error: any) {
            console.error('Upgrade failed:', error);
            toast.error("Failed to upgrade plan. Please try again.");
        } finally {
            setIsUpgrading(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onClose}>
            <AlertDialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-3 text-xl">
                        <FeatureIcon className="h-6 w-6" />
                        🔓 Unlock "{lockedFeature.name}" & More!
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-base">
                        Your plan has been updated since you subscribed. Here's what changed:
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-4">
                    {/* Price Comparison */}
                    <div className="bg-muted/50 rounded-lg p-4 border">
                        <h3 className="font-semibold mb-3">💰 Pricing</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm text-muted-foreground">Your Current Price</div>
                                <div className="text-2xl font-bold">₹{currentSnapshot.price_paid}</div>
                                <div className="text-xs text-muted-foreground">per month</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">New Price</div>
                                <div className="text-2xl font-bold flex items-baseline gap-2">
                                    ₹{latestPlan.price}
                                    {comparison.priceChange !== 0 && (
                                        <span className={`text-sm ${comparison.priceChange > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                                            {comparison.priceDelta}
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-muted-foreground">per month</div>
                            </div>
                        </div>
                    </div>

                    {/* New Features */}
                    {comparison.newFeatures.length > 0 && (
                        <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 border border-green-200 dark:border-green-900">
                            <h3 className="font-semibold mb-3 text-green-700 dark:text-green-400">
                                ✨ What You'll Gain ({comparison.newFeatures.length} new features)
                            </h3>
                            <div className="space-y-2">
                                {comparison.newFeatures.map((feat: any) => {
                                    const Icon = (LucideIcons as any)[feat.icon] || (LucideIcons as any).Box;
                                    return (
                                        <div key={feat.id} className="flex items-start gap-2">
                                            <Icon className="h-5 w-5 mt-0.5 text-green-600" />
                                            <div>
                                                <div className="font-medium">{feat.name}</div>
                                                <div className="text-sm text-muted-foreground">{feat.description}</div>
                                            </div>
                                            <Badge variant="secondary" className="ml-auto">NEW</Badge>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Removed Features */}
                    {comparison.removedFeatures.length > 0 && (
                        <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4 border border-red-200 dark:border-red-900">
                            <h3 className="font-semibold mb-3 text-red-700 dark:text-red-400">
                                ⚠️ Features No Longer Available
                            </h3>
                            <div className="space-y-2">
                                {comparison.removedFeatures.map((feat: any) => (
                                    <div key={feat.id} className="flex items-center gap-2">
                                        <span>❌</span>
                                        <span className="font-medium">{feat.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Limit Changes */}
                    {comparison.limitChanges.length > 0 && (
                        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-900">
                            <h3 className="font-semibold mb-3 text-blue-700 dark:text-blue-400">
                                📊 Quota Changes
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-2">Limit</th>
                                            <th className="text-right py-2">Current</th>
                                            <th className="text-center py-2"></th>
                                            <th className="text-right py-2">New</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {comparison.limitChanges.map((change) => (
                                            <tr key={change.key} className="border-b">
                                                <td className="py-2">{change.label}</td>
                                                <td className="text-right font-mono">
                                                    {PlanComparisonService.formatLimitValue(change.key, change.oldValue)}
                                                </td>
                                                <td className="text-center">
                                                    {change.increased ? '→ ⬆️' : '→ ⬇️'}
                                                </td>
                                                <td className={`text-right font-mono font-semibold ${change.increased ? 'text-green-600' : 'text-amber-600'
                                                    }`}>
                                                    {PlanComparisonService.formatLimitValue(change.key, change.newValue)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Rate Changes */}
                    {comparison.rateChanges.length > 0 && (
                        <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4 border border-purple-200 dark:border-purple-900">
                            <h3 className="font-semibold mb-3 text-purple-700 dark:text-purple-400">
                                💸 Pricing Rate Changes
                            </h3>
                            <div className="space-y-2 text-sm">
                                {comparison.rateChanges.map((change, idx) => (
                                    <div key={idx} className="flex justify-between items-center">
                                        <span className="font-medium">
                                            {change.featureName} - {change.componentName}
                                        </span>
                                        <div className={`font-mono ${change.increased ? 'text-amber-600' : 'text-green-600'
                                            }`}>
                                            {change.oldRate}x → {change.newRate}x
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* No Changes */}
                    {!comparison.hasChanges && (
                        <div className="bg-muted/50 rounded-lg p-6 text-center">
                            <p className="text-muted-foreground">
                                No significant changes found between your plan and the latest version.
                            </p>
                        </div>
                    )}
                </div>

                <AlertDialogFooter className="gap-3 mt-6">
                    <AlertDialogCancel disabled={isUpgrading}>
                        Keep My Old Plan
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleUpgrade}
                        disabled={isUpgrading}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                        {isUpgrading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Upgrading...
                            </>
                        ) : (
                            'Upgrade & Unlock Features'
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
