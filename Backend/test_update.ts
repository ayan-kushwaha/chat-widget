import mongoose from 'mongoose';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '.env') });

const CustomTextSchema = new mongoose.Schema({
    title: String,
    content: String,
    isActive: { type: Boolean, default: true },
    status: { type: String, default: 'active' },
    last_updated: Date
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
    console.log("Connected to DB.");

    const sourceId = "69ad091a16b5eb3d9459e4c9";
    const brain = await Brain.findOne({ "knowledge_base.custom_text._id": sourceId });
    if (!brain) {
        console.log("Brain not found for sourceId.");
        process.exit(0);
    }

    console.log("Executing raw MongoDB positional update ($)...");
    const result = await Brain.updateOne(
        { _id: brain._id, "knowledge_base.custom_text._id": sourceId },
        { $set: { "knowledge_base.custom_text.$.title": "Dual-Database Strategy..." } }
    );

    console.log("Update matched:", result.matchedCount, "Modified:", result.modifiedCount);

    // Verify it updated:
    const updatedBrain = await Brain.findOne({ _id: brain._id });
    const entry = (updatedBrain.knowledge_base.custom_text as any).find((e: any) => e._id.toString() === sourceId);
    console.log("NEW TITLE IN DB:", entry?.title);

    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
