
import mongoose from 'mongoose';


const VisionMemorySchema = new mongoose.Schema({
    url: String,
    ai_description: String,
    tags: [String]
});

const CompetitorIntelSchema = new mongoose.Schema({
    target_url: String,
    weakness: String,
    scraped_data_summary: String,
    last_scan: Date
});

const BrainSchema = new mongoose.Schema({
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, unique: true, index: true },

    personality_config: {
        name: { type: String, default: 'AI Assistant' },
        tone: { type: String, default: 'Professional' },
        language_mode: { type: String, enum: ['english', 'hindi', 'hinglish', 'hybrid'], default: 'hybrid' },
        response_length: { type: String, enum: ['short', 'medium', 'detailed', 'auto'], default: 'medium' },
        use_emojis: { type: Boolean, default: true },
        closing_line: { type: String, default: 'Let me know if you need more help!' },
        restriction_rules: {
            type: [String],
            default: [
                'Always prioritize Knowledge Base. Never invent prices.',
                'If answer is missing, ask for the user\'s email to follow up.',
                'Do not discuss politics or religion.'
            ]
        },
        example_training: [{
            user_message: String,
            good_response: String,
            bad_response: String
        }],
        banned_words: {
            type: [String],
            default: ['stupid', 'idiot', 'hate']
        },
        handoff_triggers: {
            enabled: { type: Boolean, default: false },
            keywords: [String],
            escalation_message: { type: String, default: "Let me connect you to a human expert." }
        },
        safety_settings: {
            profanity_filter: { type: Boolean, default: true },
            negative_prompts: [String],
            censor_sensitive_pii: { type: Boolean, default: true },
            strict_mode: { type: Boolean, default: true }, // "Pizza Defense"
            jailbreak_protection: { type: Boolean, default: true }, // "Injection Shield"
            anti_hallucination: { type: Boolean, default: true }, // "Confidence Lock"
            max_risk_level: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
        },
        fallback_settings: {
            strategy: { type: String, enum: ['default_ai', 'static_message', 'handoff'], default: 'static_message' },
            custom_message: { type: String, default: "I apologize, I don't have that information right now. Could you leave your email or phone number? My human colleague will update you shortly." }
        },
        temperature: { type: Number, min: 0, max: 1, default: 0.5 }
    },

    policy_core: {
        motivation: { type: String, default: "To assist visitors politely, answer their queries from the Knowledge Base, and guide them towards booking a service or contacting support." },
        goals: {
            type: [String],
            default: ['Lead Generation', 'Customer Support', 'Service Booking']
        },
        rules: {
            type: [String],
            default: [
                'Never make up facts.',
                'Be concise and polite.',
                'If user is angry, apologize and stay professional.'
            ]
        },
        tone: { type: String, default: "Professional yet friendly" }
    },

    insights: [{
        type: { type: String, enum: ['knowledge_gap', 'pattern', 'suggestion', 'optimization'], required: true },
        question: String,
        ai_proposed_answer: String,
        context: String,
        frequency: { type: Number, default: 1 },
        pattern_description: String,
        supporting_evidence: [String],
        confidence_score: Number,
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
        created_at: { type: Date, default: Date.now },
        reviewed_at: Date,
        reviewed_by: String
    }],

    // REMOVED WEBSITES & DOCUMENTS (They have their own collections)
    knowledge_base: {
        vision_memory: [VisionMemorySchema],
        competitor_intel: [CompetitorIntelSchema]
    },

    // 🔥 Global Knowledge Profile (Smart Tagging System)
    // Stores aggregated trends from all files/sites for Ticker & Analytics
    knowledge_profile: {
        topics: [{
            name: { type: String, required: true },
            score: { type: Number, default: 1 }, // Weight (Votes)
            category: { type: String, default: 'general' }, // finance, tech, etc.
            lastSeen: { type: Date, default: Date.now }
        }]
    },

    auto_learned_facts: [{
        fact: String,
        source: String,
        confidence: Number,
        learnedAt: { type: Date, default: Date.now }
    }],

    neural_connectors: {
        whatsapp: { status: String, phone: String, webhook_url: String },
        instagram: { status: String, page_id: String, auto_reply: Boolean },
        gmail: { status: String, email: String, scopes: [String] },
        slack: { status: String, webhook_url: String },
        telegram: { status: String, bot_token: String }
    },

    automation_cortex: [{
        trigger: String,
        action: String,
        enabled: Boolean
    }]
}, { timestamps: true });

export const Brain = mongoose.model('Brain', BrainSchema);
