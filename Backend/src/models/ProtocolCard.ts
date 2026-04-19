import mongoose, { Schema, Document } from 'mongoose';

export interface IProtocolCard extends Document {
    user_id: mongoose.Types.ObjectId;
    agent_id: string;                      // e.g., "rocky_sales", "support_lead"
    card_id: string;                       // Unique card identifier
    title: string;                         // e.g., "REFUND_POLICY", "PRICING_TIER_B2B"
    description: string;                   // Human-readable explanation
    rule_type: 'policy' | 'workflow' | 'knowledge' | 'constraint';
    priority: 'critical' | 'high' | 'medium' | 'low';

    // Content
    content: string;                       // The actual rule/knowledge text
    keywords: string[];                    // Searchable keywords
    intent: string[];                      // Related intents (e.g., "refund_request", "pricing_query")

    // Metadata
    data_source: string;                   // Where this came from (e.g., "user_upload", "metadata_extraction")
    confidence: number;                    // 0.0-1.0 confidence score from AI

    // Vector embedding (for ChromaDB/Qdrant sync)
    embedding?: number[];                  // Optional: store embedding in MongoDB too

    // Status
    status: 'active' | 'draft' | 'archived';
    verified: boolean;                     // User confirmed accuracy

    // Versioning
    version: number;
    previous_version_id?: mongoose.Types.ObjectId;

    // Audit
    created_at: Date;
    updated_at: Date;
    created_by: 'ai' | 'user';
    last_used_at?: Date;                   // Track card usage
    usage_count: number;                   // How many times retrieved
}

const ProtocolCardSchema = new Schema<IProtocolCard>({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    agent_id: { type: String, required: true, index: true },
    card_id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    rule_type: { type: String, enum: ['policy', 'workflow', 'knowledge', 'constraint'], required: true },
    priority: { type: String, enum: ['critical', 'high', 'medium', 'low'], default: 'medium' },

    content: { type: String, required: true },
    keywords: [{ type: String }],
    intent: [{ type: String }],

    data_source: { type: String, required: true },
    confidence: { type: Number, min: 0, max: 1, default: 0.8 },

    embedding: [{ type: Number }],

    status: { type: String, enum: ['active', 'draft', 'archived'], default: 'active', index: true },
    verified: { type: Boolean, default: false },

    version: { type: Number, default: 1 },
    previous_version_id: { type: Schema.Types.ObjectId, ref: 'ProtocolCard' },

    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    created_by: { type: String, enum: ['ai', 'user'], required: true },
    last_used_at: { type: Date },
    usage_count: { type: Number, default: 0 }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for performance
ProtocolCardSchema.index({ user_id: 1, agent_id: 1 });
ProtocolCardSchema.index({ user_id: 1, status: 1 });
ProtocolCardSchema.index({ keywords: 1 });
ProtocolCardSchema.index({ intent: 1 });
ProtocolCardSchema.index({ card_id: 1 }, { unique: true });

// Methods
ProtocolCardSchema.methods.incrementUsage = function () {
    this.usage_count += 1;
    this.last_used_at = new Date();
    return this.save();
};

ProtocolCardSchema.methods.createNewVersion = async function (updatedData: Partial<IProtocolCard>) {
    const ProtocolCard = mongoose.model<IProtocolCard>('ProtocolCard');

    const newVersion = new ProtocolCard({
        ...this.toObject(),
        _id: new mongoose.Types.ObjectId(),
        card_id: `${this.card_id}_v${this.version + 1}`,
        version: this.version + 1,
        previous_version_id: this._id,
        ...updatedData,
        created_at: new Date(),
        updated_at: new Date()
    });

    await newVersion.save();

    // Archive old version
    this.status = 'archived';
    await this.save();

    return newVersion;
};

export const ProtocolCard = mongoose.model<IProtocolCard>('ProtocolCard', ProtocolCardSchema);
