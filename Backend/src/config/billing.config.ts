/**
 * 🏛️ CLUAIZ MASTER BILLING CONFIGURATION (PHASE 5: ENERGY MODEL)
 * 
 * Logic:
 * 1. AI Brain (Gemini) -> Tokens-based (per 1M)
 * 2. Activity (Compute/Network) -> Resource-based (Energy Units)
 * 3. Storage (Rent) -> Volumetric-based (MB/Month)
 */

export const RESOURCE_ENERGY_RATES = {
    // ⚡ CPU & COMPUTE (The "Brain Power" cost)
    // Range: 10 - 100 Tokens per second
    CPU_SECOND: { MIN: 10, MAX: 100 },

    // 🌐 NETWORK & IO (The "Physical Action" cost)
    // Range: 5 - 20 Tokens per MB
    NETWORK_MB: { MIN: 5, MAX: 20 },

    // 📞 EXTERNAL API (Fixed Third-Party Costs)
    // Range: 10 - 300 Tokens per call
    EXTERNAL_API_CALL: { MIN: 10, MAX: 300 }
};

export const STORAGE_RENT_CONFIG = {
    RATE_PER_MB_PER_DAY: 1, // 1 MB = 1 Token Rent
    FREE_QUOTA_STARTER: 40, // 40MB Free
    FREE_QUOTA_GLOBAL: 100  // 100MB Free
};

export const MARKUP_FACTOR = 1.5; // GLOBAL PROFIT (50% Markup = 33% Net Margin)

