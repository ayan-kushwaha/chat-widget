
import "dotenv/config"; // Load env vars
import { redis } from "../src/modules/shared/libs/redis.js";
import { analysisQueue } from "../src/jobs/queues.js";
import { connectDB } from "../src/modules/shared/libs/mongo.js";
import mongoose from "mongoose";

// Mock Data
const MOCK_CHAT_ID = "test-verification-" + Date.now();
// const MOCK_ORG_ID = "678e1c6b1234567890abcdef"; // Replace with a REAL Org ID from your DB for best results
const MOCK_ORG_ID = new mongoose.Types.ObjectId().toString(); // Random for dry run, might fail foreign key checks if strict

async function runVerification() {
    console.log("🧪 Starting Intelligence Engine Verification...");

    try {
        await connectDB();
        console.log("✅ DB Connected");

        // 1. Simulate Chat History in Redis
        // Scenario: A User asking about something specific (to trigger value) but also some garbage
        const messages = [
            { role: "user", content: "Hi, how are you?", timestamp: Date.now() },
            { role: "ai", content: "I am good. How can I help?", timestamp: Date.now() },
            { role: "user", content: "Tell me about Cluaiz pricing plans for enterprise.", timestamp: Date.now() }, // Important
            { role: "ai", content: "We have custom enterprise plans...", timestamp: Date.now() }
        ];

        const redisKey = `chat_history:${MOCK_CHAT_ID}`;

        // Clear previous if any
        await redis.del(redisKey);

        for (const msg of messages) {
            await redis.rpush(redisKey, JSON.stringify(msg));
        }
        console.log(`✅ Mock Chat History Seeded in Redis: ${redisKey}`);

        // 2. Trigger Queue (Simulate Socket Disconnect)
        console.log("🚀 Triggering Analysis Queue...");
        const job = await analysisQueue.add("analyze-chat", {
            chatId: MOCK_CHAT_ID,
            orgId: MOCK_ORG_ID
        });

        console.log(`✅ Job Added with ID: ${job.id}`);
        console.log("⏳ Waiting 10 seconds for worker to process...");

        // 3. Wait and Check Result (Polling would be better, but sleep is simple)
        await new Promise(r => setTimeout(r, 10000));

        // 4. Verify MongoDB - Chat Record
        // (Dynamic import to avoid TS path issues in script mode if not compiled)
        const { Chat } = await import("../src/models/Chat.js");
        const chat = await Chat.findOne({ chatId: MOCK_CHAT_ID });

        if (chat) {
            console.log("\n📊 --- VERIFICATION RESULT ---");
            console.log(`✅ Chat Record Found: ${chat._id}`);
            console.log(`🔹 Retention Policy: ${chat.retention_policy}`);
            console.log(`🔹 Is Garbage: ${chat.is_garbage}`);
            console.log(`🔹 Summary: ${chat.summary}`);
            console.log(`🔹 Expiry Date: ${chat.expireAt}`);

            if (chat.retention_policy === '7_DAY' || chat.retention_policy === '24_HOURS') {
                console.log("⚠️ Note: Defaulted to Short Term (Expected if AI thinks it is casual)");
            } else {
                console.log("🌟 Success! Long term retention assigned.");
            }
        } else {
            console.error("❌ Chat Record NOT Found. Worker might have failed.");
        }

    } catch (err) {
        console.error("❌ Verification Failed:", err);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

runVerification();
