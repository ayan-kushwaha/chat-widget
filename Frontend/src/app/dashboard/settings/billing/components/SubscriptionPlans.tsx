'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Pricing } from '@/components/marketing/Pricing';

interface SubscriptionPlansProps {
    hasUsedFreePlan: boolean;
    currentPlanId?: string;
}

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ hasUsedFreePlan, currentPlanId }) => {
    const router = useRouter();

    return (
        <div className="py-6">
            <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Available Plans</h2>
                <p className="text-gray-500">Upgrade to unlock more power or top-up your existing plan.</p>
            </div>

            {/* 
        We pass a special flag or prop to Pricing component if needed, 
        but since Pricing component fetches its own data usually, 
        we might need to wrap it or modify it to accept a filter.
        
        For now, assuming Pricing component handles display, we wrap it 
        to provide context or control.
        
        If Pricing component is strictly for marketing page, we might need 
        to adapt it to accept 'showFree={!hasUsedFreePlan}' prop.
      */}
            <div className={hasUsedFreePlan ? "hide-free-tier" : ""}>
                <Pricing
                    disableUrlParams={true}
                    disableLocalModal={true}
                    onPlanSelect={(plan) => {
                        // Redirect to Pricing Page with Return URL
                        router.push(`/pricing?tab=${plan.key}&planId=${plan.key}&returnTo=${encodeURIComponent('/dashboard/settings/billing?tab=plans')}`);
                    }}
                />
            </div>

            <style jsx global>{`
        .hide-free-tier .pricing-card-free {
          display: none !important;
        }
      `}</style>
        </div>
    );
};
