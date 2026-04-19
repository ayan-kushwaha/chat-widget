import mongoose from 'mongoose';

const planSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    displayName: { type: String }, // UI Display Name (e.g. "Pro ⭐")
    description: { type: String }, // UI Description
    theme: { type: String, default: 'slate' }, // UI Theme (emerald, blue, etc.)
    badge: { type: String }, // 'Popular', 'Entry', etc.
    pricing: {
        inr: { type: Number, required: true, default: 0 },
        usd: { type: Number, required: true, default: 0 },
        interval: { type: String, default: 'month' } // 'month', 'year'
    },
    maxTokens: { type: Number, default: 0 }, // The primary currency of the plan
    maxUsers: { type: Number, default: 1 }, // Team Seats
    features: [{ type: String }], // Array of Feature IDs
    limits: { type: Map, of: Object }, // Dynamic limits object

    // Master Rules
    // Master Rules
    rolloverPercentage: { type: Number, default: 0 },
    rolloverValidity: { type: Number, default: 0 }, // Days
    retentionPeriod: { type: Number, default: 14 }, // Days
    canRemoveBranding: { type: Boolean, default: false },

    // 🛡️ Strict Resource Caps (New Source of Truth)
    maxWebsites: { type: Number, default: 1 },
    maxFiles: { type: Number, default: 5 },
    maxForms: { type: Number, default: 0 },
    maxManualEntries: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
    isPublic: { type: Boolean, default: true },
    sortingOrder: { type: Number, default: 0 }, // For UI ordering
    metadata: { type: Map, of: mongoose.Schema.Types.Mixed }, // Flexible UI flags (isMostPopular, etc)
    createdAt: { type: Date, default: Date.now }
});

export const Plan = mongoose.model('Plan', planSchema);
