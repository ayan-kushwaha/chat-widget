import mongoose, { Schema, Document } from 'mongoose';

export interface IBillingLog extends Document {
    organizationId: mongoose.Types.ObjectId;
    planId: string;
    amount: number;
    currency: string;
    type: 'purchase' | 'upgrade' | 'topup';
    status: 'success' | 'failed' | 'pending';
    invoiceUrl?: string; // Optional URL from Razorpay/Stripe
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    createdAt: Date;
}

const BillingLogSchema = new Schema<IBillingLog>({
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    planId: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        required: true,
        default: 'INR'
    },
    type: {
        type: String,
        enum: ['purchase', 'upgrade', 'topup'],
        required: true
    },
    status: {
        type: String,
        enum: ['success', 'failed', 'pending'],
        default: 'pending'
    },
    invoiceUrl: {
        type: String
    },
    razorpay_order_id: {
        type: String
    },
    razorpay_payment_id: {
        type: String
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

export const BillingLog = mongoose.model<IBillingLog>('BillingLog', BillingLogSchema);
