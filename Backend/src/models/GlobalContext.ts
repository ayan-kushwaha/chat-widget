import mongoose, { Schema, Document } from 'mongoose';

export interface IGlobalContext extends Document {
    session_id: string; // Could be Socket ID or a generated Session UUID
    user_id: mongoose.Types.ObjectId;

    // History of Phases visited (for debugging and context backtracking)
    phases_history: string[];

    // The "Bag of Variables" - Dynamic Key-Value storage
    // Stores injected values like 'tone', 'refund_policy_days', 'allow_booking', etc.
    variables: Map<string, any>;

    last_updated: Date;
    createdAt: Date;
    updatedAt: Date;
}

const GlobalContextSchema = new Schema<IGlobalContext>({
    session_id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    phases_history: {
        type: [String],
        default: []
    },
    variables: {
        type: Map,
        of: Schema.Types.Mixed,
        default: {}
    },
    last_updated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Auto-expire context after 24 hours of inactivity to save space (Self-Cleaning)
GlobalContextSchema.index({ last_updated: 1 }, { expireAfterSeconds: 86400 });

export const GlobalContext = mongoose.model<IGlobalContext>('GlobalContext', GlobalContextSchema);
