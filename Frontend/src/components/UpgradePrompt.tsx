import React from 'react';
import { Crown, Zap, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface UpgradePromptProps {
    open: boolean;
    onClose: () => void;
    feature: string;
    currentPlan: string;
    message?: string;
    suggestedPlans?: string[];
}

export function UpgradePrompt({
    open,
    onClose,
    feature,
    currentPlan,
    message,
    suggestedPlans = ['Pro', 'Business']
}: UpgradePromptProps) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500">
                            <Crown className="h-5 w-5 text-white" />
                        </div>
                        <DialogTitle>Upgrade Required</DialogTitle>
                    </div>
                    <DialogDescription className="pt-4">
                        {message || `This feature requires a higher plan.`}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/20">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                                    Current Plan: {currentPlan}
                                </p>
                                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                                    {feature} is not available on your current plan.
                                </p>
                            </div>
                        </div>
                    </div>

                    {suggestedPlans.length > 0 && (
                        <div>
                            <p className="text-sm font-medium mb-2">Unlock with these plans:</p>
                            <div className="flex flex-wrap gap-2">
                                {suggestedPlans.map((plan) => (
                                    <Badge
                                        key={plan}
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                                    >
                                        <Zap className="h-3 w-3 mr-1" />
                                        {plan}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Maybe Later
                    </Button>
                    <Button
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                        onClick={() => {
                            // Navigate to billing page
                            window.location.href = '/dashboard/settings/billing';
                        }}
                    >
                        <Crown className="h-4 w-4 mr-2" />
                        Upgrade Now
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
