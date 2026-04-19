

//src/modle/content
import mongoose, { Schema, Document } from 'mongoose';

// 💡 New TypeScript Interface for Content Document
export interface IContent extends Document {
  siteId: mongoose.Types.ObjectId;
  url: string;
  hash?: string;
  html?: string;
  text?: string;
  title?: string;
  meta?: any;
  lastCrawled?: Date;

  // 🔥 NEW EMBEDDING TRACKING FIELDS 🔥
  embeddingStatus: 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'FAILED'; // Status
  embeddedWordCount: number; // For resilience: tracks word index
  nextGlobalChunkIndex: number; // For resilience: tracks chunk ID
}

const ContentSchema: Schema = new Schema({
  siteId: { type: Schema.Types.ObjectId, ref: 'Site', required: true, index: true },
  url: { type: String, required: true, index: true },
  hash: { type: String },
  html: { type: String },
  text: { type: String },
  title: { type: String },
  meta: { type: Schema.Types.Mixed },
  lastCrawled: { type: Date, default: Date.now },

  // 🔥 ADDING NEW FIELDS TO MONGOOSE SCHEMA 🔥
  embeddingStatus: {
    type: String,
    enum: ['PENDING', 'IN_PROGRESS', 'DONE', 'FAILED'],
    default: 'PENDING',
    required: true,
  },
  embeddedWordCount: {
    type: Number,
    default: 0,
    required: true,
  },
  nextGlobalChunkIndex: {
    type: Number,
    default: 0,
    required: true,
  },
}, { timestamps: true });

// Mongoose Model Export
export default mongoose.model<IContent>('Content', ContentSchema);