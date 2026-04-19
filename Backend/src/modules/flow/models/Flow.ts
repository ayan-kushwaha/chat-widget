import mongoose from 'mongoose';

// Flexible Schema for Nodes (React Flow Structure)
const NodeSchema = new mongoose.Schema({
    id: { type: String, required: true },
    type: { type: String, required: true }, // 'trigger', 'message', 'decision', etc.
    position: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 }
    },
    data: { type: mongoose.Schema.Types.Mixed, default: {} }, // Stores label, icon, config, etc.
    width: Number,
    height: Number,
    selected: Boolean,
    dragging: Boolean
}, { _id: false });

// Flexible Schema for Edges
const EdgeSchema = new mongoose.Schema({
    id: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
    sourceHandle: String,
    targetHandle: String,
    type: String, // 'smart', 'default'
    animated: Boolean,
    label: String,
    style: mongoose.Schema.Types.Mixed,
    data: mongoose.Schema.Types.Mixed
}, { _id: false });

const FlowSchema = new mongoose.Schema({
    // Ownership
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Identity
    name: { type: String, required: true, default: "Untitled Flow" },
    description: String,
    isActive: { type: Boolean, default: false }, // Is this flow live?
    sourceTemplate: { type: String, index: true }, // Slug of the template this flow was created from

    // The Graph (Source of Truth for Builder)
    nodes: [NodeSchema],
    edges: [EdgeSchema],

    // Viewport State (for opening in same specific position)
    viewport: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 },
        zoom: { type: Number, default: 1 }
    },

    // High-Level Trigger Index (For fast lookup by Runtime Engine)
    // We extract these from nodes upon save for performance
    triggerIndex: {
        urls: [String],        // List of URLs this flow triggers on
        keywords: [String],    // List of keywords (flattened)
        elementIds: [String],  // List of DOM IDs to watch
        events: [String]       // List of custom events
    },

    version: { type: Number, default: 1 },

}, { timestamps: true });

// Compound Index for quick lookup of active flows by org
FlowSchema.index({ organizationId: 1, isActive: 1 });

export const Flow = mongoose.model('Flow', FlowSchema);
