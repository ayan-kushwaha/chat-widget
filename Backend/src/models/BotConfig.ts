import mongoose, { Schema, Document } from 'mongoose';

export interface IBotConfig extends Document {
    orgId: string;
    botId: string;
    brandConfig: any;     // Using Mixed for flexibility as the config structure evolves
    homeConfig: any;      // Using Mixed for flexibility
    securityConfig: any;  // Using Mixed for flexibility
    personalityConfig: any; // Using Mixed for flexibility
    widgetConfig: any;      // Stores visual design settings (colors, icons, motion)

    // --- Flow Architect (Journey) ---
    journeyEnabled: boolean; // Master Switch for the Graph Logic
    journey: any[];          // Array of Steps (Nodes) with Triggers & Instructions

    // --- Memory Lifecycle (Rule 11) ---
    memoryPolicy: 'SESSION_ONLY' | '30_DAY' | 'LIFETIME';

    createdAt: Date;
    updatedAt: Date;
}

const BotConfigSchema = new Schema<IBotConfig>({
    orgId: {
        type: String,
        required: true,
        index: true
    },
    botId: {
        type: String,
        required: true,
        index: true
    },
    brandConfig: {
        type: Schema.Types.Mixed,
        default: {}
    },
    homeConfig: {
        type: Schema.Types.Mixed,
        default: {}
    },
    securityConfig: {
        type: Schema.Types.Mixed,
        default: {}
    },
    personalityConfig: {
        type: Schema.Types.Mixed,
        default: {}
    },
    widgetConfig: {
        type: Schema.Types.Mixed,
        default: {}
    },
    // --- Flow Architect ---
    journeyEnabled: {
        type: Boolean,
        default: true
    },
    journey: {
        type: Schema.Types.Mixed, // Storing as Mixed array to avoid TS issues
        default: []
    },
    memoryPolicy: {
        type: String,
        enum: ['SESSION_ONLY', '30_DAY', 'LIFETIME'],
        default: '30_DAY'
    }
}, {
    timestamps: true,
    strict: false // FIX: Allow fields to be saved even if Mongoose is confused about the definition
});

// Compound index to ensure one config per bot per org (though botId should be unique globally usually, scoping by org is safe)
BotConfigSchema.index({ orgId: 1, botId: 1 }, { unique: true });

export const BotConfig = mongoose.model<IBotConfig>('BotConfig', BotConfigSchema);
