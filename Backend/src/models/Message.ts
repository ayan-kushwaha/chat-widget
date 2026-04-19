import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
    organizationId: mongoose.Types.ObjectId;
    conversationId: mongoose.Types.ObjectId;

    sender: 'user' | 'agent' | 'ai' | 'system' | 'bot';
    senderName: string;

    // 🔥 POLYMORPHIC TYPE (The 'Action Stream' Engine)
    type: 'text' | 'image' | 'audio' | 'call_log' | 'form_submission' | 'booking_card' | 'note' | 'system_alert';
    content: string; // The primary display text (e.g. "User filled Lead Form")

    metadata: any;   // ✨ Rich data: { form_fields: {}, call_status: 'missed', duration: 12 }
    reactions: Map<string, string[]>; // Emoji -> [UserIDs]

    is_starred: boolean; // Protect from TTL deletion
    isDeleted: boolean;  // 🧼 Soft Deletion Flag (Shows "Deleted" label)
    deletedFor: string[]; // 👤 Restricted visibility (Delete for me)
    isWiped: boolean;    // 🌪️ Zero-Trace Wipe (Hidden completely, NO label)
    wipedFor: string[];  // 👤 Zero-Trace per user
    wipedForUserSide: boolean; // 🎯 Hide from user/widget side only (Admin can see)
    wipedAt: Date;       // ⏳ Expiry for Undo window (24h)
    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
    organizationId: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true
    },
    conversationId: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true
    },
    sender: {
        type: String,
        required: true,
        enum: ['user', 'agent', 'ai', 'system', 'bot'],
        index: true
    },
    senderName: {
        type: String,
        default: "Unknown"
    },
    type: {
        type: String,
        required: true,
        enum: ['text', 'image', 'audio', 'call_log', 'form_submission', 'booking_card', 'note', 'system_alert'],
        default: 'text',
        index: true
    },
    content: {
        type: String,
        required: true
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    },
    reactions: {
        type: Map,
        of: [String], // Array of User IDs who reacted with this emoji
        default: {}
    },
    is_starred: {
        type: Boolean,
        default: false,
        index: true
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    },
    deletedFor: {
        type: [String],
        default: [],
        index: true
    },
    isWiped: {
        type: Boolean,
        default: false,
        index: true
    },
    wipedFor: {
        type: [String],
        default: [],
        index: true
    },
    wipedForUserSide: {
        type: Boolean,
        default: false,
        index: true
    },
    wipedAt: {
        type: Date,
        index: true
    }
}, {
    timestamps: true
});

// ⚡ PERFORMANCE & SPACE INDEXES
MessageSchema.index({ conversationId: 1, createdAt: 1 }); // Fast chronological stream

// ♻️ AUTO-CLEANUP (Space Bachao)
// Delete unstarred messages after 180 days (6 months)
// Note: Logic for 'is_starred' exclusion will be handled in a background cleaner job 
// because MongoDB TTL indices can't have partial conditions like "only if is_starred is false".
// For now, setting a broad TTL on indexed 'updatedAt' isn't safe for starred ones.
// I will create a dedicated cleanup cron logic instead of a raw TTL index.

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
