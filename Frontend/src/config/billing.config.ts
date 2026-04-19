export const MARKUP_FACTOR = 1.5; // 50% Markup for "Market Price"

export const CYCLE_OPTIONS = [
    { id: 'monthly', label: '1 Month', months: 1, discount: 0 },
    { id: '3_months', label: '3 Months', months: 3, discount: 0.05 }, // 5%
    { id: '6_months', label: '6 Months', months: 6, discount: 0.10 }, // 10%
    { id: 'yearly', label: '1 Year', months: 12, discount: 0.15 }, // 15%
];

export const getDurationDiscount = (cycleId: string) => {
    return CYCLE_OPTIONS.find(c => c.id === cycleId)?.discount || 0;
};

export const getCycleLabel = (cycleId: string) => {
    return CYCLE_OPTIONS.find(c => c.id === cycleId)?.label || 'Monthly';
};
