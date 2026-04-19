import mongoose, { Schema, Document } from 'mongoose';

export interface IPushSubscription extends Document {
    userId?: string;
    orgId?: string; // For agents
    subscription: {
        endpoint: string;
        expirationTime: number | null;
        keys: {
            p256dh: string;
            auth: string;
        };
    };
    deviceType: 'mobile' | 'desktop';
    createdAt: Date;
}

const PushSubscriptionSchema: Schema = new Schema({
    userId: { type: String, index: true },
    orgId: { type: String, index: true },
    subscription: {
        endpoint: { type: String, required: true },
        expirationTime: { type: Number, default: null },
        keys: {
            p256dh: { type: String, required: true },
            auth: { type: String, required: true }
        }
    },
    deviceType: { type: String, enum: ['mobile', 'desktop'], default: 'desktop' },
    createdAt: { type: Date, default: Date.now }
});

// Avoid duplicate subscriptions for the same endpoint
PushSubscriptionSchema.index({ 'subscription.endpoint': 1 }, { unique: true });

export default mongoose.model<IPushSubscription>('PushSubscription', PushSubscriptionSchema);
