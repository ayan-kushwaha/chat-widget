import mongoose, { Schema, Document } from 'mongoose';

export interface IMessageItem {
    messageId: string;
    sender: 'user' | 'agent' | 'ai' | 'system' | 'bot';
    senderName: string;
    type: 'text' | 'image' | 'audio' | 'call_log' | 'form_submission' | 'booking_card' | 'note' | 'system_alert';
    content: string;
    
    // Optional / Nullable fields
    replyTo?: {
        originalMessageId: string;
        originalSender: string;
        originalDate: Date;
    } | null;
    attachment?: any | null;
    
    // Rich Data & Analytics
    metadata?: any;
    ai_metadata?: any;
    
    // Engagement & Lifecycle
    reactions?: Record<string, string[]>; // Emoji -> Array of User IDs
    is_starred?: boolean;
    isDeleted?: boolean;
    deletedFor?: string[];
    isWiped?: boolean;
    wipedFor?: string[];
    wipedForUserSide?: boolean;
    wipedAt?: Date;
    
    createdAt: Date;
}

export interface IChatTurn {
    turnId: string;
    channelSource: string; // e.g. 'whatsapp', 'web', 'instagram'
    messages: IMessageItem[];
}

export interface IDailyChatBucket extends Document {
    organizationId: mongoose.Types.ObjectId;
    chatSessionId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    
    date: string; // Format: YYYY-MM-DD
    total_turns: number;
    chattingTo: string; // E.g., 'customer (Aryan)'
    
    chat_turns: IChatTurn[];
    
    createdAt: Date;
    updatedAt: Date;
}

const MessageItemSchema = new Schema<IMessageItem>({
    messageId: { type: String, required: true },
    sender: {
        type: String,
        required: true,
        enum: ['user', 'agent', 'ai', 'system', 'bot']
    },
    senderName: { type: String, default: "Unknown" },
    type: {
        type: String,
        required: true,
        enum: ['text', 'image', 'audio', 'call_log', 'form_submission', 'booking_card', 'note', 'system_alert'],
        default: 'text'
    },
    content: { type: String, required: true },
    
    replyTo: {
        type: {
            originalMessageId: String,
            originalSender: String,
            originalDate: Date
        },
        default: null
    },
    attachment: { type: Schema.Types.Mixed, default: null },
    
    metadata: { type: Schema.Types.Mixed, default: {} },
    ai_metadata: { type: Schema.Types.Mixed, default: null },
    reactions: { type: Schema.Types.Mixed, default: {} },
    
    is_starred: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    deletedFor: { type: [String], default: [] },
    isWiped: { type: Boolean, default: false },
    wipedFor: { type: [String], default: [] },
    wipedForUserSide: { type: Boolean, default: false },
    wipedAt: { type: Date }
}, { _id: false }); // Disable automatic _id since we supply custom messageId 

const ChatTurnSchema = new Schema<IChatTurn>({
    turnId: { type: String, required: true },
    channelSource: { type: String, default: 'web' },
    messages: { type: [MessageItemSchema], default: [] }
}, { _id: false }); // Disable automatic _id for chat turns

const DailyChatBucketSchema = new Schema<IDailyChatBucket>({
    organizationId: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true
    },
    chatSessionId: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true
    },
    date: {
        type: String, // YYYY-MM-DD
        required: true
    },
    total_turns: {
        type: Number,
        default: 0
    },
    chattingTo: {
        type: String,
        default: "customer"
    },
    chat_turns: {
        type: [ChatTurnSchema],
        default: []
    }
}, {
    timestamps: true
});

// ⚡ PERFORMANCE INDEXES
// Crucial for instantly finding the day's bucket for a specific chat.
DailyChatBucketSchema.index({ chatSessionId: 1, date: 1 }, { unique: true });

// Background cleanup: TTL index to delete entire buckets roughly 6 months after they were created,
// ASSUMING they have no starred messages. (Complex logic usually belongs in a cron worker).
// For now, pure performance indexes are key.

export const DailyChatBucket = mongoose.model<IDailyChatBucket>('DailyChatBucket', DailyChatBucketSchema);
