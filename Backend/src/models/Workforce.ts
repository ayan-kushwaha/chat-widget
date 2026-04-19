import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkforce extends Document {
    user_id: string; // Changed from ObjectId to string to match auth system format
    org_id: string;
    agent_id: string; // e.g. "CLZ-SAL-001"
    name: string;
    role: string;
    department: string;
    avatar_url: string;

    // The Personnel Constitution (Synthesized)
    constitution: {
        identity_core: {
            role_definition: string;
            tone_voice: string;
        };
        protocols: {
            responsibilities: Array<{
                name: string;
                description: string;
                explanation: string;
            }>;
        };
    };

    // Operational Stats
    status: 'training' | 'active' | 'paused' | 'failed';

    created_at: Date;
    updated_at: Date;
}

const WorkforceSchema = new Schema<IWorkforce>({
    user_id: { type: String, required: true, index: true }, // Changed to String
    org_id: { type: String, required: true, index: true },
    agent_id: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    department: { type: String, required: true },
    avatar_url: { type: String },

    constitution: {
        identity_core: {
            role_definition: { type: String, required: true },
            tone_voice: { type: String, required: true }
        },
        protocols: {
            responsibilities: [{
                name: { type: String },
                description: { type: String },
                explanation: { type: String }
            }]
        }
    },


    status: {
        type: String,
        enum: ['training', 'active', 'paused', 'failed'],
        default: 'training',
        index: true
    },

}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'workforce' // Explicitly set collection name
});

// Indexes for fast retrieval
WorkforceSchema.index({ org_id: 1, status: 1 });
WorkforceSchema.index({ user_id: 1, agent_id: 1 });

export const Workforce = mongoose.model<IWorkforce>('Workforce', WorkforceSchema);
