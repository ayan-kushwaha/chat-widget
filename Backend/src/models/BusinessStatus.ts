import mongoose, { Schema, Document } from 'mongoose';

export interface IBusinessStatus extends Document {
    organizationId: mongoose.Types.ObjectId;
    type: 'text' | 'image' | 'video';
    content: string; // URL for media or the text itself
    caption?: string;
    styling?: {
        fontFamily?: string;
        backgroundColor?: string;
        textColor?: string;
        textOverlay?: string;
        stickerPosition?: { x: number; y: number };
        backgroundBlur?: number;
        backgroundOpacity?: number;
        aspectRatio?: number;
    };
    music?: {
        title: string;
        artist: string;
        coverUrl: string;
        previewUrl: string;
        trimStart?: number;
        trimDuration?: number;
    };
    musicVolume?: number;
    views: mongoose.Types.ObjectId[]; // List of user IDs who viewed
    startTime: Date;
    endTime: Date;
    createdAt: Date;
    updatedAt: Date;
}

const BusinessStatusSchema = new Schema<IBusinessStatus>({
    organizationId: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true
    },
    type: {
        type: String,
        required: true,
        enum: ['text', 'image', 'video'],
        default: 'text'
    },
    content: {
        type: String,
        required: true
    },
    caption: {
        type: String,
        default: ""
    },
    styling: {
        fontFamily: { type: String, default: 'Inter' },
        backgroundColor: { type: String, default: '#000000' },
        textColor: { type: String, default: '#ffffff' },
        textOverlay: { type: String },
        stickerStyle: { type: String, enum: ['pill', 'card', 'minimal', 'hidden'], default: 'pill' },
        stickerPosition: {
            x: { type: Number, default: 0 },
            y: { type: Number, default: 0 }
        },
        backgroundBlur: { type: Number, default: 20 },
        backgroundOpacity: { type: Number, default: 50 },
        aspectRatio: { type: Number, default: 9 / 16 }
    },
    music: {
        title: { type: String },
        artist: { type: String },
        coverUrl: { type: String },
        previewUrl: { type: String },
        trimStart: { type: Number },
        trimDuration: { type: Number }
    },
    musicVolume: { type: Number, default: 1 },
    views: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    startTime: {
        type: Date,
        default: Date.now,
        index: true
    },
    endTime: {
        type: Date,
        required: true,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Performance Index
BusinessStatusSchema.index({ organizationId: 1, createdAt: -1 });

// 🔥 MAGIC: Auto-delete when 'endTime' is reached
BusinessStatusSchema.index({ endTime: 1 }, { expireAfterSeconds: 0 });

export const BusinessStatus = mongoose.model<IBusinessStatus>('BusinessStatus', BusinessStatusSchema);
