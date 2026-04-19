import mongoose, { Schema, Document } from 'mongoose';

export interface IWidgetDeployment extends Document {
    orgId: string;
    url: string;
    hostname: string;
    lastSeen: Date;
    userAgent?: string;
    status: 'active' | 'inactive';
    createdAt: Date;
    updatedAt: Date;
}

const WidgetDeploymentSchema = new Schema<IWidgetDeployment>({
    orgId: {
        type: String,
        required: true,
        index: true
    },
    url: {
        type: String,
        required: true
    },
    hostname: {
        type: String,
        required: true
    },
    lastSeen: {
        type: Date,
        required: true,
        default: Date.now
    },
    userAgent: {
        type: String
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Compound index for fast lookups and uniqueness
WidgetDeploymentSchema.index({ orgId: 1, url: 1 }, { unique: true });

// TTL index - auto-delete records older than 30 days
WidgetDeploymentSchema.index({ lastSeen: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const WidgetDeployment = mongoose.model<IWidgetDeployment>('WidgetDeployment', WidgetDeploymentSchema);
