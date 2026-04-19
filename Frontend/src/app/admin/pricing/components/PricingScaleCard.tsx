import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';

export function PricingScaleCard() {
    const [credits, setCredits] = useState(5000000); // Default: 5M

    // Credit pack options
    const packs = [
        {
            id: 'starter',
            name: 'Starter',
            baseCredits: 1000000, // 1M
            basePrice: 199,
            color: 'bg-blue-100 dark:bg-blue-900/20 border-blue-500',
            textColor: 'text-blue-600 dark:text-blue-400',
        },
        {
            id: 'growth',
            name: 'Growth',
            baseCredits: 5000000, // 5M
            basePrice: 899,
            color: 'bg-purple-100 dark:bg-purple-900/20 border-purple-500',
            textColor: 'text-purple-600 dark:text-purple-400',
            badge: 'Popular',
        },
        {
            id: 'pro',
            name: 'Pro',
            baseCredits: 20000000, // 20M
            basePrice: 2999,
            color: 'bg-emerald-100 dark:bg-emerald-900/20 border-emerald-500',
            textColor: 'text-emerald-600 dark:text-emerald-400',
            badge: 'Best Value',
        },
    ];

    // Calculate price for selected credits
    const calculatePrice = (targetCredits: number, packData: typeof packs[0]) => {
        const ratio = targetCredits / packData.baseCredits;
        // Strict Precision: No Rounding
        const price = Math.floor(packData.basePrice * ratio);
        const perMillion = Number(((price / targetCredits) * 1000000).toFixed(2));
        const discount = packData.baseCredits === 20000000 ? 33 : packData.baseCredits === 5000000 ? 25 : 0;

        return {
            totalPrice: price,
            perMillionPrice: perMillion,
            savings: discount > 0 ? Number((price * (discount / 100)).toFixed(2)) : 0,
            discount,
        };
    };

    return (
        <div className="space-y-8 p-6">
            {/* Scale Selector */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-foreground">Select Credit Amount</h3>
                    <Badge variant="secondary" className="text-lg font-mono">
                        {(credits / 1000000).toFixed(1)}M Credits
                    </Badge>
                </div>

                <Slider
                    value={[credits]}
                    onValueChange={(value) => setCredits(value[0])}
                    min={1000000}
                    max={20000000}
                    step={100000}
                    className="w-full"
                />

                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1M</span>
                    <span>5M</span>
                    <span>10M</span>
                    <span>15M</span>
                    <span>20M</span>
                </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {packs.map((pack) => {
                    const pricing = calculatePrice(credits, pack);
                    const profit = pricing.savings;
                    const profitPercent = pricing.discount; // Use pricing.discount, not pack.discount

                    return (
                        <Card
                            key={pack.id}
                            className={`relative overflow-hidden border-2 ${pack.color} transition-all hover:scale-105 cursor-pointer`}
                        >
                            {pack.badge && (
                                <div className="absolute top-3 right-3">
                                    <Badge className="bg-primary text-primary-foreground">
                                        {pack.badge}
                                    </Badge>
                                </div>
                            )}

                            <div className="p-6 space-y-4">
                                {/* Pack Name */}
                                <div>
                                    <h4 className={`text-xl font-bold ${pack.textColor}`}>
                                        {pack.name}
                                    </h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {(credits / 1000000).toFixed(1)}M Credits
                                    </p>
                                </div>

                                {/* Price */}
                                <div className="space-y-2">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black text-foreground">
                                            ₹{pricing.totalPrice.toLocaleString()}
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            total
                                        </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        ≈ ₹{pricing.perMillionPrice}/1M credits
                                    </div>
                                </div>

                                {/* Discount & Profit */}
                                {profitPercent > 0 && (
                                    <div className="bg-white/50 dark:bg-zinc-900/50 rounded-lg p-3 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-medium text-muted-foreground">
                                                Discount
                                            </span>
                                            <span className={`text-sm font-bold ${pack.textColor}`}>
                                                {profitPercent}% OFF
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-medium text-muted-foreground">
                                                You Save
                                            </span>
                                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                                ₹{profit.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* CTA Button */}
                                <button
                                    className={`w-full py-3 px-4 rounded-lg font-bold transition-all ${pack.textColor} ${pack.color} hover:opacity-80`}
                                >
                                    Purchase {pack.name}
                                </button>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
