import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
    organizationId: mongoose.Types.ObjectId;
    userId?: mongoose.Types.ObjectId; // User who initiated (if manual)
    amount: number;
    currency: string;
    status: 'pending' | 'success' | 'failed' | 'refunded';
    type: 'subscription_create' | 'subscription_renew' | 'topup' | 'manual_adjustment' | 'purchase';
    planId?: string; // e.g. 'pro_monthly'
    planName?: string; // Snapshot name e.g. 'Pro Plan'
    interval?: 'month' | 'year' | 'one_time';
    invoiceUrl?: string;

    // Professional Billing Fields
    invoiceNumber?: string;
    billingPeriod?: {
        start: Date;
        end: Date;
    };
    // Snapshot (Legal)
    billingDetails?: {
        customerName?: string;
        companyName?: string;
        taxId?: string;
        email?: string; // 🟢 Added to match Schema
        phone?: string; // 🟢 Added to match Schema
        addressLine1?: string; // 🟢 Added to match Schema
        address?: string;
        city?: string; // 🟢 Added to match Schema
        state?: string;
        stateName?: string; // 🟢 Added for full name
        country?: string;
        countryName?: string; // 🟢 Added for full name
        pincode?: string; // 🟢 Added to match Schema
    };
    paymentMethod?: string;
    subTotal?: number;
    taxAmount?: number;

    // Payment Gateway Details
    paymentGatewayId?: string; // Generic
    razorpay_payment_id?: string; // Specific (User Request)
    razorpay_order_id?: string;   // Specific (User Request)

    metadata?: any;
    snapshot?: any; // 🟢 Fix: Added missing interface definition
    createdAt: Date;
    updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>({
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true // Index for fast filtering by org
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
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
    status: {
        type: String,
        enum: ['pending', 'success', 'failed', 'refunded'],
        default: 'pending',
        index: true
    },
    type: {
        type: String,
        enum: ['subscription_create', 'subscription_renew', 'topup', 'manual_adjustment', 'purchase'],
        required: true
    },
    planId: String,
    planName: String,
    interval: {
        type: String,
        enum: ['month', 'year', 'one_time']
    },
    invoiceUrl: String,
    paymentGatewayId: String,
    // Professional Billing Fields
    invoiceNumber: { type: String }, // e.g. "INV-2026-001"
    billingPeriod: {
        start: { type: Date },
        end: { type: Date }
    },
    // Snapshot of Customer Details (Legal Requirement)
    billingDetails: {
        customerName: { type: String },
        companyName: { type: String },
        taxId: { type: String },
        email: { type: String },       // 🟢 Added
        phone: { type: String },       // 🟢 Added
        addressLine1: { type: String }, // 🟢 Added
        address: { type: String },     // Keep for legacy
        city: { type: String },        // 🟢 Added
        state: { type: String },
        stateName: { type: String },   // 🟢 Added
        country: { type: String },
        countryName: { type: String }, // 🟢 Added
        pincode: { type: String }      // 🟢 Added
    },

    subTotal: { type: Number },      // Base amount
    taxAmount: { type: Number },     // GST/Tax

    razorpay_payment_id: String,
    razorpay_order_id: String,
    metadata: Schema.Types.Mixed,

    // 🟢 Fix: Store complete Plan Snapshot for historical accuracy
    snapshot: Schema.Types.Mixed
}, {
    timestamps: true
});

// Index for sorting by date (Newest first)
// Index for sorting by date (Newest first)
TransactionSchema.index({ organizationId: 1, createdAt: -1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema, 'billinglogs');
