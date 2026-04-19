import axios from 'axios';

// Define types for the configuration parts
// These should ideally match the interface in your components or a shared types file
interface GenericConfig {
    [key: string]: any;
}

export interface BotConfig {
    _id?: string;
    orgId: string;
    botId: string;
    brandConfig?: GenericConfig;
    homeConfig?: GenericConfig;
    securityConfig?: GenericConfig;
    personalityConfig?: GenericConfig;
    behaviorConfig?: GenericConfig;
    faqConfig?: GenericConfig;
    formConfig?: GenericConfig;
    widgetConfig?: GenericConfig; // Persistence for design settings
    createdAt?: string;
    updatedAt?: string;
    journey?: any[]; // Flow Architect Step Array
    journeyEnabled?: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

export const botConfigService = {
    /**
     * Fetch the configuration for a specific bot
     */
    getBotConfig: async (botId: string, orgId?: string): Promise<BotConfig> => {
        try {
            const headers: any = {};
            if (orgId) headers['x-org-id'] = orgId;

            const fullUrl = `${API_URL}/bots/${botId}/config`;
            console.log("🔗 Fetching Config from:", fullUrl);
            const response = await axios.get(fullUrl, { headers });
            return response.data;
        } catch (error) {
            console.error(`Error fetching config for bot ${botId}:`, error);
            throw error;
        }
    },

    /**
     * Save (Upsert) the configuration for a specific bot
     */
    saveBotConfig: async (botId: string, data: {
        brandConfig?: GenericConfig,
        homeConfig?: GenericConfig,
        faqConfig?: GenericConfig,
        formConfig?: GenericConfig,
        widgetConfig?: GenericConfig,
        securityConfig?: GenericConfig,
        personalityConfig?: GenericConfig,
        behaviorConfig?: GenericConfig,
        orgId?: string,
        journey?: any[],
        journeyEnabled?: boolean
    }): Promise<BotConfig> => {
        try {
            const response = await axios.post(`${API_URL}/bots/${botId}/config`, data);
            return response.data;
        } catch (error) {
            console.error(`Error saving config for bot ${botId}:`, error);
            throw error;
        }
    }
};
