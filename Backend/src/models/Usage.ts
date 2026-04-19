import mongoose, { Document, Schema } from 'mongoose';

export interface IUsage extends Document {
    userId: mongoose.Types.ObjectId;
    planId: string;
    month: string;

    // Counters
    tokens_burned: number;
    websites_added: number;
    team_seats_used: number;
    files_uploaded: number;
    forms_created: number;

    // Storage
    storage: {
        minio_bytes: number;
        vector_bytes: number;
        mongo_bytes: number;
        total_mb: number;
    };

    lastUpdated: Date;
}

const usageSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    planId: { type: String, required: true }, // Snapshot of plan at billing start
    month: { type: String, required: true, index: true }, // Format: "YYYY-MM"

    // ⚡ Live Activity Counters (Reset every billing cycle/month)
    tokens_burned: { type: Number, default: 0 },

    // 🛡️ Resource Limits Usage
    websites_added: { type: Number, default: 0 },
    team_seats_used: { type: Number, default: 0 },
    files_uploaded: { type: Number, default: 0 },
    forms_created: { type: Number, default: 0 },

    // 🗄️ Unified Cloud Storage (Permanent / Running Totals)
    storage: {
        minio_bytes: { type: Number, default: 0 },    // Raw Files (PDF, Images)
        vector_bytes: { type: Number, default: 0 },   // ChromaDB/Pinecone
        mongo_bytes: { type: Number, default: 0 },    // Text Data (Chat Logs, Metadata)

        // Calculated Total: (minio + vector + mongo) / 1024^2
        total_mb: { type: Number, default: 0 }
    },

    lastUpdated: { type: Date, default: Date.now }
});

// Compound index for frequent lookups
usageSchema.index({ userId: 1, month: 1 }, { unique: true });

export const Usage = mongoose.model<IUsage>('Usage', usageSchema);
