import mongoose from 'mongoose';

const CluaizAdminSchema = new mongoose.Schema({
    total_revenue: { type: Number, default: 0 },

    global_stats: {
        total_orgs: { type: Number, default: 0 },
        active_bots: { type: Number, default: 0 },
        total_messages_processed: { type: Number, default: 0 }
    },

    error_logs: [{
        timestamp: { type: Date, default: Date.now },
        message: String,
        stack: String,
        severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] }
    }],

    master_keys: {
        openai_api_key: String,
        anthropic_api_key: String,
        sendgrid_api_key: String
    },

    updated_at: { type: Date, default: Date.now }
});

export const CluaizAdmin = mongoose.model('CluaizAdmin', CluaizAdminSchema);
