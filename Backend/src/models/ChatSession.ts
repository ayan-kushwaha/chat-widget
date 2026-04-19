import mongoose, { Schema, Document } from 'mongoose';

export interface IChatSession extends Document {
    organizationId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;

    // Entry Type
    type: string; // "chat" or "lead"

    // Chat/Lead Identity
    chatId: string;

    // Channel Info
    channel: string;
    channelMetadata: {
        source: string;
        externalId: string | null;
        threadId: string | null;
    };

    // Content & Analysis
    ai_generated_title: string; // ✨ NEW: Smart Title for Sidebar
    summary: string;
    fullTranscript: string;
    tags: string[];

    // Sentiment Analysis
    sentiment: string;
    sentimentScore: number;
    intent: string;

    // Timeline Events (Embedded)
    events: Array<{
        type: string;
        title: string;
        description: string;
        severity: string;
        timestamp: Date;
        resolved: boolean;
        metadata: any;
    }>;

    // Metrics
    messageCount: number;
    duration: string;
    durationSeconds: number;

    // Status
    status: string;
    isSpam: boolean;
    spamReason: string | null;

    // --- 🤝 Handoff & Modes ---
    mode: string; // 'ai' | 'human' | 'handoff'
    assignedTo: mongoose.Types.ObjectId | null;
    ai_disabled_until: Date | null; // 🤖 NEW: Auto-reset AI after 24h

    // --- 🤖 AI Toggle Controls ---
    aiEnabledByAdmin: boolean; // Admin can disable AI for specific user
    aiEnabledByUser: boolean;  // User can disable AI (auto-resets on refresh)

    // Lead-Specific Fields
    leadInfo: {
        score: number;
        status: string;
        priority: string;
        company: string | null;
        dealValue: number | null;
        convertedFromChatId: mongoose.Types.ObjectId | null;
        lastContactedAt: Date | null;
        notes: string | null;
    } | null;

    // --- 🧠 Intelligence Engine Fields ---
    retention_policy: string;
    is_garbage: boolean;
    learning_needed: boolean;
    missing_topic: string | null;
    expireAt?: Date;

    // --- 🛡️ Smart Deletion Policy (Mutual Logic) ---
    is_deleted_by_user: boolean;
    is_deleted_by_business: boolean;
    last_active_at: Date;

    // --- Flow Architect State ---
    flowState: {
        currentStepId: string | null;
        lastStepChange: Date | null;
        history: Array<{
            stepId: string;
            timestamp: Date;
            trigger: string;
        }>;
    };

    // Timestamps
    startedAt: Date;
    endedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ChatSessionSchema = new Schema<IChatSession>({
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
    type: {
        type: String,
        required: true,
        enum: ['chat', 'lead'],
        default: 'chat',
        index: true
    },
    chatId: {
        type: String,
        required: true,
        index: true
    },
    channel: {
        type: String,
        required: true,
        default: 'web',
        index: true
    },
    channelMetadata: {
        source: { type: String, default: 'web_widget' },
        externalId: String,
        threadId: String
    },
    ai_generated_title: {
        type: String,
        required: true,
        default: "New Conversation"
    },
    summary: {
        type: String,
        required: true,
        default: "Conversation started..."
    },
    fullTranscript: {
        type: String,
        required: true,
        default: ""
    },
    tags: {
        type: [String],
        default: [],
        index: true
    },
    sentiment: {
        type: String,
        required: true,
        enum: ['Positive', 'Negative', 'Neutral'],
        default: 'Neutral',
        index: true
    },
    sentimentScore: {
        type: Number,
        required: true,
        min: -1,
        max: 1,
        default: 0
    },
    intent: {
        type: String,
        required: true,
        default: 'general'
    },
    events: [{
        type: {
            type: String,
            required: true,
            enum: ['friction', 'insight', 'gap', 'lead']
        },
        title: { type: String, required: true },
        description: { type: String, required: true },
        severity: {
            type: String,
            required: true,
            enum: ['low', 'medium', 'high', 'critical']
        },
        timestamp: { type: Date, required: true },
        resolved: { type: Boolean, default: false },
        metadata: Schema.Types.Mixed
    }],
    messageCount: {
        type: Number,
        default: 0
    },
    duration: {
        type: String,
        default: "0s"
    },
    durationSeconds: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        required: true,
        enum: ['active', 'resolved', 'spam', 'archived', 'pending_handoff'],
        default: 'active',
        index: true
    },
    isSpam: {
        type: Boolean,
        default: false
    },
    spamReason: {
        type: String,
        default: null
    },

    // --- 🤝 Handoff ---
    mode: {
        type: String,
        enum: ['ai', 'human', 'handoff'],
        default: 'ai',
        index: true
    },
    assignedTo: {
        type: Schema.Types.ObjectId,
        default: null,
        index: true
    },
    ai_disabled_until: {
        type: Date,
        default: null
    },

    // --- 🤖 AI Toggle Controls ---
    aiEnabledByAdmin: {
        type: Boolean,
        default: true,
        index: true
    },
    aiEnabledByUser: {
        type: Boolean,
        default: true
    },

    leadInfo: {
        score: { type: Number, min: 0, max: 100 },
        status: {
            type: String,
            enum: ['new', 'contacted', 'qualified', 'converted', 'lost']
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high']
        },
        company: String,
        dealValue: Number,
        convertedFromChatId: Schema.Types.ObjectId,
        lastContactedAt: Date,
        notes: String
    },

    // --- 🧠 Intelligence Engine (Policy Fields) ---
    retention_policy: {
        type: String,
        enum: ['24_HOURS', '7_DAY', '14_DAY', '30_DAY', '90_DAY', '180_DAY', '270_DAY', '365_DAY', 'ALL_TIME'],
        default: '7_DAY',
        index: true
    },
    is_garbage: {
        type: Boolean,
        default: false,
        index: true
    },
    learning_needed: {
        type: Boolean,
        default: false,
        index: true
    },
    missing_topic: {
        type: String,
        default: null
    },
    expireAt: {
        type: Date,
        index: { expireAfterSeconds: 0 }
    },

    // --- 🛡️ Smart Deletion (Mutual Logic) ---
    is_deleted_by_user: { type: Boolean, default: false },
    is_deleted_by_business: { type: Boolean, default: false },
    last_active_at: { type: Date, default: Date.now, index: true },

    startedAt: { type: Date, required: true, default: Date.now },
    endedAt: { type: Date, required: true, default: Date.now }
}, {
    timestamps: true
});

// Indexes for High-Performance Inbox
ChatSessionSchema.index({ organizationId: 1, chatId: 1 }, { unique: true });
ChatSessionSchema.index({ organizationId: 1, last_active_at: -1 }); // ✨ IMPORTANT: WhatsApp Sorting
ChatSessionSchema.index({ organizationId: 1, status: 1, mode: 1 });
ChatSessionSchema.index({ organizationId: 1, userId: 1, last_active_at: -1 });

// Text search index (Hybrid Search Foundation)
ChatSessionSchema.index({
    ai_generated_title: 'text',
    summary: 'text',
    tags: 'text',
    fullTranscript: 'text'
});

export const ChatSession = mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);
