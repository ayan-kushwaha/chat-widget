import mongoose, { Schema, Document } from 'mongoose';

export interface IUserDevice extends Document {
    user_id: mongoose.Types.ObjectId;
    device_type: 'web' | 'android' | 'ios';
    push_token: string;
    last_active: Date;
    createdAt: Date;
    updatedAt: Date;
}

const UserDeviceSchema = new Schema<IUserDevice>({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    device_type: {
        type: String,
        enum: ['web', 'android', 'ios'],
        required: true
    },
    push_token: {
        type: String,
        required: true,
        index: true // Fast lookup for sending notifications
    },
    last_active: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index to ensure one token doesn't get duplicated across users (optional, but good for hygiene)
// Or one user can have multiple devices of same type? Yes (e.g. Chrome + Firefox). 
// But a specific push_token is unique to a device instance.
UserDeviceSchema.index({ push_token: 1 }, { unique: true });
UserDeviceSchema.index({ user_id: 1, device_type: 1 }); // Efficient querying for "Send to all Android devices of User X"

export const UserDevice = mongoose.model<IUserDevice>('UserDevice', UserDeviceSchema);
