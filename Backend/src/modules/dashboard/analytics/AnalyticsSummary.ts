import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalyticsSummary extends Document {
  websiteId: mongoose.Types.ObjectId;
  date: Date; // Normalized to midnight (YYYY-MM-DD 00:00:00)
  
  // Overview Stats
  totalPageViews: number;
  uniqueVisitors: number;
  totalSessions: number;
  bounceRate: number; // Calculated percentage
  avgSessionDuration: number; // Seconds

  // Bot Stats
  totalChats: number;
  totalMessages: number;
  avgResponseTime: number; // Seconds

  // Breakdowns
  hourlyStats: {
    hour: number; // 0-23
    visitors: number;
    pageViews: number;
  }[];

  hourlyChatStats: {
    hour: number;
    chats: number;
    messages: number;
  }[];

  geoStats: {
    country: string;
    code: string;
    visitors: number;
    percentage: number;
  }[];

  deviceStats: {
    device: 'mobile' | 'desktop' | 'tablet' | 'unknown';
    visitors: number;
    percentage: number;
  }[];

  pageStats: {
    path: string;
    views: number;
    uniqueVisitors: number;
    avgTime: number;
    bounceRate: number;
  }[];

  customStats?: Record<string, any>;
}

const AnalyticsSummarySchema: Schema = new Schema({
  websiteId: { type: Schema.Types.ObjectId, ref: 'Site', required: true, index: true },
  date: { type: Date, required: true, index: true }, // Compound index with websiteId recommended

  totalPageViews: { type: Number, default: 0 },
  uniqueVisitors: { type: Number, default: 0 },
  totalSessions: { type: Number, default: 0 },
  bounceRate: { type: Number, default: 0 },
  avgSessionDuration: { type: Number, default: 0 },

  totalChats: { type: Number, default: 0 },
  totalMessages: { type: Number, default: 0 },
  avgResponseTime: { type: Number, default: 0 },

  hourlyStats: [{
    hour: Number,
    visitors: Number,
    pageViews: Number
  }],

  hourlyChatStats: [{
    hour: Number,
    chats: Number,
    messages: Number
  }],

  geoStats: [{
    country: String,
    code: String,
    visitors: Number,
    percentage: Number
  }],

  deviceStats: [{
    device: String,
    visitors: Number,
    percentage: Number
  }],

  pageStats: [{
    path: String,
    views: Number,
    uniqueVisitors: Number,
    avgTime: Number,
    bounceRate: Number
  }],

  customStats: { type: Schema.Types.Mixed }
});

// Compound index for fast lookup of a site's data for a specific date range
AnalyticsSummarySchema.index({ websiteId: 1, date: 1 }, { unique: true });

export const AnalyticsSummary = mongoose.model<IAnalyticsSummary>('AnalyticsSummary', AnalyticsSummarySchema);
