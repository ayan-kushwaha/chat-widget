import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    organizationId: mongoose.Types.ObjectId;
    userId: string;
    name: string;
    email: string | null;
    phone: string | null;
    avatar: string | null;

    // Profile Metadata
    ipAddress: string | null;
    location: {
        country: string | null;
        city: string | null;
        region: string | null;
        coordinates: {
            lat: number;
            lng: number;
        } | null;
    } | null;
    device: {
        type: string;
        os: string | null;
        browser: string | null;
    };
    timezone: string;
    language: string;

    // 🆔 Device Identity
    deviceId: string;
    shadow_id: string | null;
    identities: string[];

    // 📲 Push Subscription
    push_subscription: {
        endpoint: string | null;
        keys: {
            p256dh: string | null;
            auth: string | null;
        };
        userAgent: string | null;
    };

    // Aggregated Stats
    stats: {
        totalChats: number;
        totalMessages: number;
        totalLeads: number;
        averageSentiment: string;
        sentimentBreakdown: {
            positive: number;
            negative: number;
            neutral: number;
        };
        riskScore: number;
        lastChannel: string;
        channels: string[];
    };

    // Recent Chat Summaries (Embedded)
    recentChats: Array<{
        chatId: mongoose.Types.ObjectId;
        chatIdString: string;
        type: string;
        channel: string;
        topic: string;
        summary: string;
        sentiment: string;
        tags: string[];
        duration: string;
        messageCount: number;
        timestamp: Date;
    }>;

    // Timestamps
    firstSeen: Date;
    lastActive: Date;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
    organizationId: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    // 🎨 IDENTITY HIERARCHY: Name > Phone > Email > Unknown
    name: {
        type: String,
        required: true,
        default: "Unknown User"
    },
    email: {
        type: String,
        default: null,
        index: true
    },
    phone: {
        type: String,
        default: null,
        index: true
    },
    avatar: {
        type: String,
        default: null
    },
    ipAddress: {
        type: String,
        default: null
    },
    location: {
        country: String,
        city: String,
        region: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    device: {
        type: {
            type: String,
            required: true,
            default: 'web'
        },
        os: String,
        browser: String
    },
    timezone: {
        type: String,
        required: true,
        default: 'UTC'
    },
    language: {
        type: String,
        required: true,
        default: 'en'
    },
    // 🆔 SOLID IDENTITY LAYER
    deviceId: {
        type: String,
        required: true,
        index: true // Key for persistent guest tracking
    },
    shadow_id: {
        type: String, // Public Guest Fingerprint (stays same even if name changes)
        required: true,
        index: true
    },
    identities: {
        type: [String], // History of specific Device IDs merged into this user
        default: []
    },

    // 📲 VAPID PUSH SUBSCRIPTION (₹0 forever notification system)
    push_subscription: {
        endpoint: { type: String, default: null },
        keys: {
            p256dh: { type: String, default: null },
            auth: { type: String, default: null }
        },
        userAgent: { type: String, default: null }
    },

    stats: {
        totalChats: { type: Number, default: 0 },
        totalMessages: { type: Number, default: 0 },
        totalLeads: { type: Number, default: 0 },
        averageSentiment: { type: String, default: 'Neutral' },
        sentimentBreakdown: {
            positive: { type: Number, default: 0 },
            negative: { type: Number, default: 0 },
            neutral: { type: Number, default: 0 }
        },
        riskScore: { type: Number, default: 0 },
        lastChannel: { type: String, default: 'web' },
        channels: { type: [String], default: ['web'] }
    },
    recentChats: [{
        chatId: { type: Schema.Types.ObjectId, required: true },
        chatIdString: { type: String, required: true },
        type: { type: String, required: true },
        channel: { type: String, required: true },
        topic: { type: String, required: true },
        summary: { type: String, required: true },
        sentiment: { type: String, required: true },
        tags: [String],
        duration: { type: String, required: true },
        messageCount: { type: Number, required: true },
        timestamp: { type: Date, required: true }
    }],
    firstSeen: {
        type: Date,
        required: true,
        default: Date.now
    },
    lastActive: {
        type: Date,
        required: true,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes
UserSchema.index({ organizationId: 1, userId: 1 }, { unique: true });
UserSchema.index({ organizationId: 1, email: 1 }); // Fast Email Lookup (Login)
UserSchema.index({ organizationId: 1, phone: 1 });
UserSchema.index({ organizationId: 1, deviceId: 1 }); // ⚡ Fast Device ID Lookup (Socket Handshake)
UserSchema.index({ organizationId: 1, lastActive: -1 }); // Showing "Online Users"
UserSchema.index({ organizationId: 1, 'stats.totalChats': -1 }); // Top Users

// Text search index
UserSchema.index({
    name: 'text',
    email: 'text',
    phone: 'text',
    userId: 'text'
});

export const User = mongoose.model<IUser>('User', UserSchema);
