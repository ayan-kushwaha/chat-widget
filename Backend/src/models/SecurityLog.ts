import mongoose from 'mongoose';

const SecurityLogSchema = new mongoose.Schema({
    type: { type: String, required: true }, // 'FRAUD_SIGNATURE', 'FRAUD_PRICE_MISMATCH', 'UNAUTHORIZED_ACCESS'
    orgId: { type: String },
    userId: { type: String },
    details: { type: mongoose.Schema.Types.Mixed },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    ip: String,
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export const SecurityLog = mongoose.model('SecurityLog', SecurityLogSchema);
