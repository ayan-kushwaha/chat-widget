export const PLANS = {
    FREE: {
        id: 'free',
        name: 'Free',
        limits: {
            max_websites: 1,
            max_files: 5,
            max_storage_mb: 50,
            chat_history_days: 7,
            team_members: 1,
            remove_branding: false,
            api_access: false,
            monthly_tokens: 10000
        }
    },
    STARTER: {
        id: 'starter',
        name: 'Starter',
        limits: {
            max_websites: 3,
            max_files: 20,
            max_storage_mb: 500,
            chat_history_days: 30,
            team_members: 3,
            remove_branding: true,
            api_access: false,
            monthly_tokens: 500000
        }
    },
    PRO: {
        id: 'pro',
        name: 'Pro',
        limits: {
            max_websites: 10,
            max_files: 100,
            max_storage_mb: 2000,
            chat_history_days: 90,
            team_members: 10,
            remove_branding: true,
            api_access: true,
            monthly_tokens: 2000000
        }
    },
    SCALE: {
        id: 'scale',
        name: 'Scale',
        limits: {
            max_websites: 50,
            max_files: 500,
            max_storage_mb: 10000,
            chat_history_days: 365,
            team_members: 50,
            remove_branding: true,
            api_access: true,
            monthly_tokens: 10000000
        }
    }
};

export const getPlanLimits = (planId: string) => {
    // Normalize logic if needed
    const key = Object.keys(PLANS).find(k => PLANS[k as keyof typeof PLANS].id === planId);
    return key ? PLANS[key as keyof typeof PLANS].limits : PLANS.FREE.limits;
};
