import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
    organizationId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;

    // Brain Metadata
    ai_generated_title: string; // ✨ The 'Soul' of the thread in sidebar
    summary: string;           // Overall relationship summary
    tags: string[];

    // Real-Time Inbox Logic
    last_message_at: Date;     // ✨ Key for WhatsApp-style Top Jumping
    last_message_preview: string; // ✨ Snippet for sidebar (e.g. "Price kya hai?")
    last_message_sender: 'user' | 'agent' | 'ai'; // ✨ Who sent the last message
    last_message_status: 'sent' | 'delivered' | 'read'; // ✨ WhatsApp-style status
    unread_count: number;
    is_pinned: boolean; // ✨ NEW: Lock important chats to top
    is_favourite: boolean; // ✨ NEW: Mark chats as favourite

    // Status & Modes
    status: 'active' | 'resolved' | 'archived';
    mode: 'ai' | 'human' | 'handoff';
    assignedTo: mongoose.Types.ObjectId | null;

    // --- 🛡️ Smart Deletion (Mutual Logic) ---
    is_deleted_by_user: boolean;
    is_deleted_by_business: boolean;

    // --- 🔒 User-Side Hide (Time-Based) ---
    userSideHiddenBefore: Date | null; // Messages before this are hidden from user

    createdAt: Date;
    updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>({
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
    ai_generated_title: {
        type: String,
        required: true,
        default: "New Relationship"
    },
    summary: {
        type: String,
        default: "Starting the journey..."
    },
    tags: {
        type: [String],
        default: [],
        index: true
    },
    last_message_at: {
        type: Date,
        required: true,
        default: Date.now,
        index: true // Efficient Inbox Sorting
    },
    last_message_preview: {
        type: String,
        default: ""
    },
    last_message_sender: {
        type: String,
        enum: ['user', 'agent', 'ai'],
        default: 'user'
    },
    last_message_status: {
        type: String,
        enum: ['sent', 'delivered', 'read'],
        default: 'sent'
    },
    unread_count: {
        type: Number,
        default: 0
    },
    is_pinned: {
        type: Boolean,
        default: false,
        index: true
    },
    is_favourite: {
        type: Boolean,
        default: false,
        index: true
    },
    status: {
        type: String,
        required: true,
        enum: ['active', 'resolved', 'archived'],
        default: 'active',
        index: true
    },
    mode: {
        type: String,
        required: true,
        enum: ['ai', 'human', 'handoff'],
        default: 'ai',
        index: true
    },
    assignedTo: {
        type: Schema.Types.ObjectId,
        default: null,
        index: true
    },
    is_deleted_by_user: {
        type: Boolean,
        default: false
    },
    is_deleted_by_business: {
        type: Boolean,
        default: false
    },
    userSideHiddenBefore: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// ⚡ PERFORMANCE INDEXES
// User + Org = Unique Eternal Thread
ConversationSchema.index({ organizationId: 1, userId: 1 }, { unique: true });
ConversationSchema.index({ organizationId: 1, last_message_at: -1 }); // Top Sorting
ConversationSchema.index({ organizationId: 1, status: 1 });

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);
