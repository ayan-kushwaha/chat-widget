import mongoose, { Document, Schema } from 'mongoose';

export interface ICoupon extends Document {
    code: string;
    discountType: 'PERCENTAGE' | 'FLAT';
    discountValue: number;
    validUntil: Date;
    usageLimit: number;
    usedCount: number;
    appliedCount: number; // 🟢 Track how many times it was validated
    isActive: boolean;
    description: string;
    minOrderValue?: number;
    style?: number;
}

const CouponSchema: Schema = new Schema({
    code: { type: String, required: true, unique: true, trim: true },
    discountType: { type: String, enum: ['PERCENTAGE'], required: true },
    discountValue: { type: Number, required: true },
    validUntil: { type: Date },
    usageLimit: { type: Number, default: null }, // Null means unlimited
    usedCount: { type: Number, default: 0 },
    appliedCount: { type: Number, default: 0 }, // 🟢 Default to 0
    isActive: { type: Boolean, default: true },
    description: { type: String },
    minOrderValue: { type: Number, default: 0 },
    style: { type: Number, default: 0 }
}, {
    timestamps: true
});

export const Coupon = mongoose.model<ICoupon>('Coupon', CouponSchema);
