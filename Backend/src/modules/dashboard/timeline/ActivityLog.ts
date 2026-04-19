import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema({
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    timestamp: { type: Date, default: Date.now },

    type: {
        type: String,
        enum: ['conversation', 'lead', 'automation_run', 'trend_alert', 'error', 'chat_summary', 'daily_digest', 'voice_call'],
        required: true
    },

    context: {
        user_id: String, // Guest ID or User ID
        platform: { type: String, enum: ['web', 'whatsapp', 'instagram', 'email'] },
        location: String, // "Mumbai, India"
        session_id: String,
        ip_address: String,
        user_agent: String
    },

    data: {
        user_msg: String,
        bot_msg: String,
        thinking_process: String, // "User asked price -> Checked Rules -> Found Discount -> Replied."
        error_details: String
    },

    ai_insight: {
        summary: String,
        sentiment: { type: String, enum: ['positive', 'neutral', 'negative'] },
        action_taken: String, // "Coupon Sent", "Escalated to Human"
        tags: [String]
    }
});

export const ActivityLog = mongoose.models.TimelineLog || mongoose.model('TimelineLog', ActivityLogSchema);
