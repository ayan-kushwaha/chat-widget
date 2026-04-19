import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Omit<Document, 'model'> {
    organizationId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId | null;
    chatSessionId: mongoose.Types.ObjectId | null;

    // Telemetry Core
    input: string;      // User Message
    output: string;     // AI Response
    model: string;      // Model Name (e.g. gemini-1.5-flash) — schema field, override allowed

    // Fine-Tuning Data
    accepted: boolean;  // Did user/agent like this response?
    corrected: string | null; // Manual correction for training

    metadata: {
        tokensUsed?: number;
        latency?: number;
        intent?: string;
        phase?: string;
    } | null;

    createdAt: Date;
    updatedAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
    organizationId: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        default: null,
        index: true
    },
    chatSessionId: {
        type: Schema.Types.ObjectId,
        default: null,
        index: true
    },
    input: {
        type: String,
        required: true
    },
    output: {
        type: String,
        required: true
    },
    model: {
        type: String,
        required: true,
        index: true
    },
    accepted: {
        type: Boolean,
        default: true
    },
    corrected: {
        type: String,
        default: null
    },
    metadata: {
        tokensUsed: Number,
        latency: Number,
        intent: String,
        phase: String
    }
}, {
    timestamps: true
});

// Indexes for Dataset Extraction
AuditLogSchema.index({ organizationId: 1, accepted: 1, createdAt: -1 });
AuditLogSchema.index({ model: 1, accepted: 1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
