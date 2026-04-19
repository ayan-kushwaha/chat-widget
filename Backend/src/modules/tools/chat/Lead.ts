import mongoose from "mongoose";

const LeadSchema = new mongoose.Schema(
    {
        orgId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        formId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "LeadForm",
        },
        // Core Contact Info (Extracted from data for easy access)
        name: { type: String, trim: true },
        email: { type: String, trim: true, lowercase: true },
        phone: { type: String, trim: true },
        company: { type: String, trim: true },

        // Dynamic Data (Flexible Schema for any business type)
        // Stores key-value pairs like { name: "Aryan", budget: "50k" }
        data: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        // Meta Info
        ai_confidence: { type: Number, default: 0 }, // Confidence score (0-1)
        score: { type: Number, default: 0 }, // Lead Score (0-100)
        score_breakdown: { type: String }, // AI reasoning for the score
        status: {
            type: String,
            enum: ["New", "Contacted", "In Discussion", "Converted", "Lost", "On-Hold"],
            default: "New",
        },
        source: { type: String, default: "Chat" }, // Chat, Form, API

        // Tracking
        chatSessionId: { type: String }, // Link to the chat session
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

export const Lead = mongoose.model("Lead", LeadSchema);
