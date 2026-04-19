import mongoose from 'mongoose';

/**
 * 🧠 PageIndex Model — Scalable Neural Storage
 * This collection stores the heavy YAML trees (Neural Trees) for every 
 * individual page/document to keep the main Site/Document models lightweight.
 * 
 * Prevents the MongoDB 16MB document size limit.
 */
const PageIndexSchema = new mongoose.Schema({
    sourceId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true, index: true }, // The Site ID
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    pages: [{
        url: { type: String, required: true },
        page_index: { type: String, required: true },
        page_index_meta: {
            node_count: Number,
            confidence: Number,
            indexed_at: { type: Date, default: Date.now }
        },
        vector_ids: [String]
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Remove old compound index
// PageIndexSchema.index({ sourceId: 1, url: 1 }, { unique: true });

export const PageIndex = mongoose.model('PageIndex', PageIndexSchema, 'site_page_indexes');
