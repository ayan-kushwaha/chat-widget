import mongoose from "mongoose";

export type InsightType = "DAILY" | "WEEKLY" | "MONTHLY";

const BusinessInsightSchema = new mongoose.Schema(
    {
        siteId: { type: mongoose.Schema.Types.ObjectId, ref: "Site", required: true },
        type: {
            type: String,
            enum: ["DAILY", "WEEKLY", "MONTHLY"],
            required: true,
        },
        date: { type: Date, required: true }, // The date/week/month this report represents
        summary: { type: String, required: true }, // The AI generated summary
        keyTopics: [{ type: String }], // Extracted topics
        sentiment: { type: String, enum: ["POSITIVE", "NEUTRAL", "NEGATIVE"], default: "NEUTRAL" },
        metrics: {
            totalChats: { type: Number, default: 0 },
            avgDuration: { type: Number, default: 0 }, // in seconds
        },
        // For lineage (optional, to know what data formed this insight)
        sourceIds: [{ type: mongoose.Schema.Types.ObjectId }],
    },
    { timestamps: true }
);

// Compound index for efficient querying
BusinessInsightSchema.index({ siteId: 1, type: 1, date: -1 });

export default mongoose.model("BusinessInsight", BusinessInsightSchema);
