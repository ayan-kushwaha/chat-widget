import mongoose, { Schema, Document } from 'mongoose';

export interface ILearningMemory extends Document {
    organizationId: mongoose.Types.ObjectId;

    // Memory Classification
    type: string;
    category: string;

    // Content
    title: string;
    content: string;
    confidence: number;

    // Source References
    source: string;
    sourceChatSessionIds: mongoose.Types.ObjectId[];
    sourceUserIds: mongoose.Types.ObjectId[];

    // Status & Approval
    status: string;
    approvedBy: mongoose.Types.ObjectId | null;
    approvedAt: Date | null;

    // Duplicate Handling
    isDuplicate: boolean;
    duplicateOf: mongoose.Types.ObjectId | null;
    mergedWith: mongoose.Types.ObjectId[];

    // Expiry
    expiresAt: Date | null;
    isPermanent: boolean;

    // Timestamps
    generatedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const LearningMemorySchema = new Schema<ILearningMemory>({
    organizationId: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true
    },
    type: {
        type: String,
        required: true,
        enum: ['pattern', 'fact', 'rule', 'gap'],
        index: true
    },
    category: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    confidence: {
        type: Number,
        required: true,
        min: 0,
        max: 1
    },
    source: {
        type: String,
        required: true,
        enum: ['chat_analysis', 'user_behavior', 'manual']
    },
    sourceChatSessionIds: {
        type: [Schema.Types.ObjectId],
        default: []
    },
    sourceUserIds: {
        type: [Schema.Types.ObjectId],
        default: []
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'approved', 'rejected', 'merged'],
        default: 'pending',
        index: true
    },
    approvedBy: {
        type: Schema.Types.ObjectId,
        default: null
    },
    approvedAt: {
        type: Date,
        default: null
    },
    isDuplicate: {
        type: Boolean,
        default: false,
        index: true
    },
    duplicateOf: {
        type: Schema.Types.ObjectId,
        default: null
    },
    mergedWith: {
        type: [Schema.Types.ObjectId],
        default: []
    },
    expiresAt: {
        type: Date,
        default: null,
        index: true
    },
    isPermanent: {
        type: Boolean,
        default: false
    },
    generatedAt: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

// Indexes
LearningMemorySchema.index({ organizationId: 1, status: 1, createdAt: -1 });
LearningMemorySchema.index({ organizationId: 1, type: 1 });
LearningMemorySchema.index({ organizationId: 1, expiresAt: 1 });
LearningMemorySchema.index({ organizationId: 1, isDuplicate: 1 });

export const LearningMemory = mongoose.model<ILearningMemory>('LearningMemory', LearningMemorySchema);
