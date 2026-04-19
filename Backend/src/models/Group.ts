import mongoose, { Schema, Document } from 'mongoose';

export interface IGroup extends Document {
    organizationId: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    emoji: string;
    members: string[]; // Conversation IDs
    isSmart: boolean;
    criteria?: any;

    // 🔐 Privacy & Permissions
    isPrivate: boolean;
    onlyAdminsCanPost: boolean;
    requiresApproval: boolean;
    hideMemberList: boolean;

    // ⏳ Ephemeral Settings
    ephemeralSignals: boolean;
    ephemeralDuration: string; // '24h', '1w', etc.

    // 🤖 AI Intelligence
    canAiAutoAdd: boolean;
    aiIntent?: string;
    aiTags?: string[];

    isArchived: boolean;

    createdAt: Date;
    updatedAt: Date;
}

const groupSchema = new Schema<IGroup>({
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    emoji: {
        type: String,
        default: '👥'
    },
    members: [{
        type: String, // Storing Conversation IDs
        ref: 'Conversation'
    }],
    isSmart: {
        type: Boolean,
        default: false
    },
    criteria: {
        type: Schema.Types.Mixed,
        default: null
    },

    // 🔐 Privacy & Permissions
    isPrivate: { type: Boolean, default: true },
    onlyAdminsCanPost: { type: Boolean, default: false },
    requiresApproval: { type: Boolean, default: true },
    hideMemberList: { type: Boolean, default: false },

    // ⏳ Ephemeral Settings
    ephemeralSignals: { type: Boolean, default: false },
    ephemeralDuration: { type: String, default: '24h' },

    // 🤖 AI Intelligence
    canAiAutoAdd: { type: Boolean, default: false },
    aiIntent: { type: String, trim: true, default: '' },
    aiTags: [{ type: String }],
    isArchived: { type: Boolean, default: false }
}, {
    timestamps: true
});

// Index for faster lookups
groupSchema.index({ organizationId: 1 });

export const Group = mongoose.model<IGroup>('Group', groupSchema);
export default Group;
