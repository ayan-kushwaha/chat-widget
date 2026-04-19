import mongoose, { Document, Schema } from 'mongoose';

export interface IFeature extends Document {
    id: string; // The textual ID e.g. 'smart_form'
    name: string;
    category: string;
    icon?: string; // Lucide Icon Name or Emoji
    color?: string; // Custom Hex/Tailwind Color
    baseMultiplier: number;
    sellMultiplier: number;
    unit: string; // 'FORM', 'WORDS', 'MB', 'LOGS'
    costType: 'per_unit' | 'fixed_monthly';
    description?: string;
    includes?: {
        name: string;
        desc?: string;          // User-facing description
        description?: string;   // Alternative field
        costReason?: string;    // Internal pricing justification
        baseMultiplier: number;
        sellMultiplier: number;
        unit: string;
    }[];
    status: 'active' | 'coming_soon' | 'inactive';
    order: number;
    location?: string; // Path e.g. '/dashboard/ai-studio/forms'
}

const FeatureSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    icon: { type: String, default: 'Box' },
    color: { type: String, default: null },
    baseMultiplier: { type: Number, required: true },
    sellMultiplier: { type: Number, required: true },
    unit: { type: String, required: true },
    costType: { type: String, enum: ['per_unit', 'fixed_monthly'], default: 'per_unit' },
    description: String,
    includes: [{
        name: String,
        desc: String,           // User-facing description (short)
        description: String,    // Alternative field name (for compatibility)
        costReason: String,     // Internal justification for pricing
        baseMultiplier: Number,
        sellMultiplier: Number,
        unit: String
    }],
    status: { type: String, enum: ['active', 'coming_soon', 'inactive'], default: 'active' },
    order: { type: Number, default: 0 },
    location: String
}, {
    timestamps: true
});

export const Feature = mongoose.model<IFeature>('Feature', FeatureSchema);
