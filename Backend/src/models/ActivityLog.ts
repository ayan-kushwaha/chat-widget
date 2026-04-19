import mongoose, { Document, Schema } from 'mongoose';

export enum ActivityType {
    AI_CHAT = 'AI_CHAT',
    BRAIN_CRAWL = 'BRAIN_CRAWL',       
    BRAIN_UPLOAD = 'BRAIN_UPLOAD',
    MANUAL_TRAINING = 'MANUAL_TRAINING',
    LIVE_API_FETCH = 'LIVE_API_FETCH',
    HUMAN_HANDOFF = 'HUMAN_HANDOFF',
    IMAGE_GENERATION = 'IMAGE_GENERATION',
    VOICE_SYNTHESIS = 'VOICE_SYNTHESIS',
    STORAGE_RENT = 'STORAGE_RENT',
    AI_INSIGHTS = 'AI_INSIGHTS',
    WORKFORCE_HIRE = 'WORKFORCE_HIRE',
    // 🛠️ Skill Based Actions
    SKILL_OUTREACH = 'SKILL_OUTREACH',         // WhatsApp/Email
    SKILL_ANALYSIS = 'SKILL_ANALYSIS',         // Business Logic/ROI
    SKILL_AUTOMATION = 'SKILL_AUTOMATION',     // Tasks/Fulfillment
    SKILL_NAVIGATION = 'SKILL_NAVIGATION',     // Page Shifting
    WEB_SEARCH = 'WEB_SEARCH',                  // External Web Search
    // 🏛️ Consolidated Dual-Buckets
    INFRASTRUCTURE = 'INFRASTRUCTURE',
    AI_MODEL = 'AI_MODEL'
}

// Optimized entry structure (compact field names)
export interface IActivityEntry {
    t: number;  // timestamp (Unix)
    b: number;  // burned tokens
    d?: string; // details (contextual description)
}

export interface IActivityTypeData {
    total: number;      // Total tokens burned for this type
    count: number;      // Number of entries
    history: IActivityEntry[];
}

export interface IActivityLog extends Document {
    organizationId: mongoose.Types.ObjectId;
    date: string; // Format: YYYY-MM-DD
    activities: Map<string, IActivityTypeData>; // Dynamic keys for each ActivityType
    createdAt: Date;
    updatedAt: Date;
}

const activityLogSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    activities: {
        type: Map,
        of: {
            total: { type: Number, default: 0 },
            count: { type: Number, default: 0 },
            history: [{
                t: { type: Number, required: true },  // Unix timestamp
                b: { type: Number, required: true },  // burned tokens
                d: { type: String }                   // details
            }]
        }
    }
}, { timestamps: true });

// Unique index - ONE document per organization per day
activityLogSchema.index({ organizationId: 1, date: 1 }, { unique: true });

export const ActivityLog = mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', activityLogSchema);
