export interface PlanTier {
    id: string;
    name: string;
    maxTokens: number;
    price: {
        amount: number;
        currency: string;
    };
    pricing?: { // Backend Source of Truth
        inr: number;
        usd: number;
        interval: string;
    };
    features: string[]; // List of Feature IDs
    limits?: {
        monthlyTokens: number;
        maxWebsites: number;
        maxFiles: number;
        maxForms: number;
    };
    isActive?: boolean;
    isPublic?: boolean;
    permissions?: any; // The calculated permissions object from Backend
}

export const MAX_TOKEN_LIMIT_FALLBACK = 12000000;
