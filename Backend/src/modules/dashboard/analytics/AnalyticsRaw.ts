import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalyticsRaw extends Document {
    websiteId: mongoose.Types.ObjectId;
    visitorId: string;
    sessionId: string;
    eventType: 'page_view' | 'click' | 'scroll' | 'custom' | 'form_submit';
    url: string;
    path: string; // Extracted path for easier aggregation
    referrer?: string;
    deviceType: 'mobile' | 'desktop' | 'tablet' | 'unknown';
    browser?: string;
    os?: string;
    country?: string;
    city?: string;
    duration?: number; // For time-on-page events
    metadata?: Record<string, any>; // Flexible for extra data
    timestamp: Date;
}

const AnalyticsRawSchema: Schema = new Schema({
    websiteId: { type: Schema.Types.ObjectId, ref: 'Site', required: true, index: true },
    visitorId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    eventType: {
        type: String,
        enum: ['page_view', 'click', 'scroll', 'custom', 'form_submit'],
        required: true
    },
    url: { type: String, required: true },
    path: { type: String, required: true, index: true },
    referrer: { type: String },
    deviceType: { type: String, enum: ['mobile', 'desktop', 'tablet', 'unknown'], default: 'unknown' },
    browser: { type: String },
    os: { type: String },
    country: { type: String, index: true },
    city: { type: String },
    duration: { type: Number }, // Seconds
    metadata: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now, index: true }
});

// TTL Index: Automatically delete raw logs after 7 days to save space
// We rely on the Aggregation Worker to summarize this data before it's deleted.
AnalyticsRawSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

export const AnalyticsRaw = mongoose.model<IAnalyticsRaw>('AnalyticsRaw', AnalyticsRawSchema);
