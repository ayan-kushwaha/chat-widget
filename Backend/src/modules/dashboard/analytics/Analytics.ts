import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalytics extends Document {
    type: string;
    data: any;
    timestamp: Date;
}

const AnalyticsSchema: Schema = new Schema({
    type: { type: String, required: true, index: true },
    data: { type: Schema.Types.Mixed, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
});

export const AnalyticsModel = mongoose.model<IAnalytics>('Analytics', AnalyticsSchema);
