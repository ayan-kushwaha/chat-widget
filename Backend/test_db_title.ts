import mongoose from 'mongoose';
import { resolve } from 'path';
import { conf } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { config } from 'dotenv';
config({ path: resolve(__dirname, '.env') });

const CustomTextSchema = new mongoose.Schema({
    title: String,
    description: String,
    content: String,
    isActive: { type: Boolean, default: true },
    status: { type: String, enum: ['draft', 'pending', 'training', 'active', 'failed'], default: 'active' },
    tags: [String],
    intent_summary: String,
    priority: { type: String, enum: ['high', 'normal', 'low'], default: 'high' },
    createdAt: { type: Date, default: Date.now },
    last_updated: Date,
    token_count: Number,
    chunk_count: Number,
    chunk_ids: [{ type: String }],
    chunk_hashes: [{ type: String }]
});

const BrainSchema = new mongoose.Schema({
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, unique: true, index: true },
    knowledge_base: {
        custom_text: [CustomTextSchema]
    }
}, { timestamps: true });

const Brain = mongoose.model('Brain', BrainSchema);

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    // Hardcoded sourceId from the user's screenshot URL: 69ad091a16b5eb3d9459e4c9
    // Wait, the URL is ?type=knowledge-doc&edit=69ad091a16b5eb3d9459e4c9
    // Wait, let's find the orgId first, or just query all brains and find that custom_text

    const brains = await Brain.find({});
    let found = false;
    for (const b of brains) {
        if (b.knowledge_base && b.knowledge_base.custom_text) {
            for (const ct of b.knowledge_base.custom_text) {
                if (ct._id.toString() === "69ad091a16b5eb3d9459e4c9" || ct.title?.includes("qwen") || ct.title?.includes("Dual")) {
                    console.log("FOUND ENTRY:");
                    console.log(`ID: ${ct._id}`);
                    console.log(`Title: ${ct.title}`);
                    // console.log(`Content length: ${ct.content?.length}`);
                    found = true;
                }
            }
        }
    }
    if (!found) console.log("Entry not found.");
    mongoose.disconnect();
}

run().catch(console.error);
