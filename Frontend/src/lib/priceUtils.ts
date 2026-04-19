
// ----------------------------------------------------------------------
// 🧮 Centralized Pricing Utilities
// Single Source of Truth for all Price & Token Math
// ----------------------------------------------------------------------

import { decryptStorage } from '@/utils/storageCrypto';

// Shared Constants (Used by Admin & User Side)
export const MARKUP_FACTOR = 1.5;
export const MAX_TOKENS_GLOBAL = 12000000; // 12M

/**
 * Calculates the exact price for a given token count and multiplier.
 * RULE: Precision of 2 decimal places. NO Rounding up/down (Floor/Ceil).
 *
 * @param tokens - Number of tokens (e.g. 100000)
 * @param multiplier - Cost per token (e.g. 0.0004)
 * @returns number - Precise price (e.g. 7.99)
 */
// Helper: Centralized Auto-Detection
const getEffectiveCurrency = (providedCurrency: string): string => {
    // Only auto-detect if default 'USD' is passed AND we are in browser
    if (providedCurrency === 'USD' && typeof window !== 'undefined') {
        try {
            const stored = localStorage.getItem('cluaiz_geo_config');
            if (stored) {
                const data = decryptStorage(stored);
                if (data?.currency?.code === 'INR') {
                    return 'INR';
                }
            }
        } catch (e) {
            // Sshhh... silence
        }
    }
    return providedCurrency;
};

export const calculatePrice = (tokens: number, multiplier: number | undefined, currency: string = 'USD'): number => {
    if (!multiplier || multiplier <= 0) return 0;

    const rawPrice = tokens * multiplier;
    let precisePrice = Number(rawPrice.toFixed(2));

    // 🟢 Apply Centralized Detection
    const effectiveCurrency = getEffectiveCurrency(currency);

    // 🟢 INR Rounding Rule
    if (effectiveCurrency === 'INR') {
        precisePrice = Math.floor(precisePrice);
    }

    return Math.max(0.01, precisePrice);
};

export const calculateOriginalPrice = (finalPrice: number, currency: string = 'USD'): number => {
    if (finalPrice <= 0) return 0;

    let originalPrice = finalPrice * MARKUP_FACTOR;

    // 🟢 Apply Centralized Detection
    const effectiveCurrency = getEffectiveCurrency(currency);

    // 🟢 INR Rounding Rule
    if (effectiveCurrency === 'INR') {
        return Math.floor(originalPrice);
    }

    return Number(originalPrice.toFixed(2));
};

/**
 * Formats token counts into human-readable strings.
 * e.g. 1000000 -> "1M", 250000 -> "250k"
 */
export const formatTokenCount = (tokens: number): string => {
    if (tokens >= 1000000) {
        // e.g. 1.5M, 2M (Remove trailing zeros)
        return (tokens / 1000000).toFixed(2).replace(/\.?0+$/, '') + 'M';
    }
    if (tokens >= 1000) {
        return (tokens / 1000).toFixed(0) + 'k';
    }
    return tokens.toString();
};
