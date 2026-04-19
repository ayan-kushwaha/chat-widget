// 🎯 MASTER "SAAS-LEVEL" MODEL CONFIGURATION
// Is file me saari AI Model pricing aur profit margins set hoti hain.
// Sabhi rates "Per 1,000,000 (1 Million) Tokens" ke hisaab se hain.

export interface ModelMeta {
    name: string;
    provider: 'google' | 'openai' | 'ollama';
    api_model: string;

    // 💰 Base Cost: Jo Google ya AI provider humse charge karta hai ($ per 1M tokens)
    base_input_rate: number;
    base_output_rate: number;

    // 📈 Profit Margin: User se kitna extra charge karna hai (1.30 = 30% Profit)
    margin: number;

    tier: 'cheap' | 'balanced' | 'quality' | 'premium' | 'local';
    is_local: boolean;
}

export const MODEL_MASTER_CONFIG: Record<string, ModelMeta> = {
    // Sasta model: India/Mass audience ke liye
    'gemini-2.0-flash-lite': {
        name: 'Gemini 2.0 Flash Lite',
        provider: 'google',
        api_model: 'gemini-2.0-flash-lite-001',
        base_input_rate: 0.075,
        base_output_rate: 0.30,
        margin: 1.50,
        tier: 'cheap',
        is_local: false
    },
    // Balanced model: Performance aur cost ka mix
    'gemini-2.0-flash': {
        name: 'Gemini 2.0 Flash',
        provider: 'google',
        api_model: 'gemini-2.0-flash',
        base_input_rate: 0.15,
        base_output_rate: 0.60,
        margin: 1.50,
        tier: 'balanced',
        is_local: false
    },
    // Quality model: Zyada accurate results ke liye
    'gemini-2.5-flash-lite': {
        name: 'Gemini 2.5 Flash Lite',
        provider: 'google',
        api_model: 'gemini-2.5-flash-lite',
        base_input_rate: 0.10,
        base_output_rate: 0.40,
        margin: 1.50,
        tier: 'quality',
        is_local: false
    },
    // Premium model: Sabse mahanga aur sabse best
    'gemini-2.5-flash': {
        name: 'Gemini 2.5 Flash',
        provider: 'google',
        api_model: 'gemini-2.5-flash',
        base_input_rate: 0.30,
        base_output_rate: 2.50,
        margin: 1.50,
        tier: 'premium',
        is_local: false
    },
    // Local Model: Hamare apne server pe chalta hai (Bohot sasta)
    'qwen-local': {
        name: 'Qwen 3.5 (Local)',
        provider: 'ollama',
        api_model: 'qwen3.5:4b',
        base_input_rate: 0.005,
        base_output_rate: 0.005,
        margin: 1.50,
        tier: 'local',
        is_local: true
    }
};

/**
 * 🧮 Calculate Tokens to Burn (Professional Burn Accounting)
 * 
 * Logic:
 * 1. Pehle hum 'Sell Rate' nikalte hain: (Base Cost * Margin)
 * 2. Phir 'Total Burn' nikalte hain: (Usage * Sell Rate)
 * 
 * Example:
 * Agar user ne 1M tokens use kiye Flash Lite pe (Base 0.075, Margin 1.50):
 * Sell Rate = 0.075 * 1.50 = 0.1125 
 * Total Burn = 1,000,000 * 0.1125 = 112,500 Tokens User ke wallet se katenge.
 * Google humse sirf 75,000 tokens lega, toh 37,500 Tokens tumhara Net Profit hua. (33.33% Net Margin)
 */
export const calculateTokensToBurn = (
    modelKey: string,
    inputTokens: number,
    outputTokens: number
): number => {
    const model = MODEL_MASTER_CONFIG[modelKey];

    // Safety Fallback: Agar model na mile toh sasta model use karo
    const activeModel = model || MODEL_MASTER_CONFIG['gemini-2.0-flash-lite'];

    // Sell rates calculate karo (Margin add karke)
    const sellInputRate = activeModel.base_input_rate * activeModel.margin;
    const sellOutputRate = activeModel.base_output_rate * activeModel.margin;

    // Final Calculation: (Usage * sellRate)
    const inputBurn = (inputTokens * sellInputRate);
    const outputBurn = (outputTokens * sellOutputRate);

    const totalBurned = (inputBurn + outputBurn);

    // Kam se kam 1 token toh katega hi
    return Math.max(1, Math.round(totalBurned));
};

// 📋 UI ke liye models ki list fetch karne ka function
export const getAvailableModels = () => {
    return Object.entries(MODEL_MASTER_CONFIG).map(([key, model]) => ({
        key,
        name: model.name,
        provider: model.provider,
        tier: model.tier,
        is_local: model.is_local
    }));
};