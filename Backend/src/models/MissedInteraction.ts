import mongoose, { Schema, Document } from 'mongoose';

export interface IMissedInteraction extends Document {
    organizationId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    chatSessionId: mongoose.Types.ObjectId | null;

    type: 'call' | 'chat';
    status: 'pending' | 'recovered' | 'forwarded';

    metadata: {
        reason?: string;
        callDuration?: number;
    } | null;

    missedAt: Date;
    recoveredAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const MissedInteractionSchema = new Schema<IMissedInteraction>({
    organizationId: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true
    },
    chatSessionId: {
        type: Schema.Types.ObjectId,
        default: null,
        index: true
    },
    type: {
        type: String,
        required: true,
        enum: ['call', 'chat'],
        index: true
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'recovered', 'forwarded'],
        default: 'pending',
        index: true
    },
    metadata: {
        reason: String,
        callDuration: Number
    },
    missedAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    recoveredAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Indexes for Recovery Loop Dashboard
MissedInteractionSchema.index({ organizationId: 1, status: 1, missedAt: -1 });

export const MissedInteraction = mongoose.model<IMissedInteraction>('MissedInteraction', MissedInteractionSchema);
