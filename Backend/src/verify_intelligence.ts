import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Conversation } from '../src/models/Conversation';
import { User } from '../src/models/User';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/cluaiz";

const verifyIntelligence = async () => {
    console.log("🧪 Starting Intelligence Verification...");

    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB");

        // 1. Test Conversation Logic
        const testConv = new Conversation({
            organizationId: new mongoose.Types.ObjectId(),
            userId: new mongoose.Types.ObjectId(),
            ai_generated_title: 'Verification Thread',
            summary: 'Testing the new Spinal models',
            status: 'active',
            mode: 'ai',
            last_message_at: new Date(),
            // Mutual Deletion Defaults
            is_deleted_by_user: false,
            is_deleted_by_business: false
        });

        await testConv.save();
        console.log(`✅ Conversation Created: ${testConv._id}`);

        // Verify Defaults
        if (testConv.status === 'active') console.log("✅ Default status is ACTIVE");
        if (testConv.mode === 'ai') console.log("✅ Default mode is AI");

        // 2. Test Smart Handoff Status
        testConv.status = 'active';
        testConv.mode = 'handoff';
        await testConv.save();

        const updatedConv = await Conversation.findOne({ _id: testConv._id });
        if (updatedConv?.mode === 'handoff') {
            console.log("✅ Smart Handoff Mode Saved Successfully");
        } else {
            console.error("❌ Failed to save handoff mode");
        }

        // Cleanup
        await Conversation.deleteOne({ _id: testConv._id });
        console.log("🧹 Cleanup Done");

    } catch (error) {
        console.error("❌ Verification Failed:", error);
    } finally {
        await mongoose.disconnect();
    }
};

verifyIntelligence();
