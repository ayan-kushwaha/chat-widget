import { Queue } from "bullmq";
import dotenv from 'dotenv';
dotenv.config();

const redisConnection = {
    host: "127.0.0.1",
    port: 6379,
    maxRetriesPerRequest: null
};

// Queue name must match worker exactly
const embedQueue = new Queue("embedQueue", { connection: redisConnection });

async function main() {
    console.log(`🚀 Triggering Test Embed Job on queue: ${embedQueue.name}...`);

    // Check initial count
    const initialCounts = await embedQueue.getJobCounts();
    console.log("📊 Initial Queue Counts:", initialCounts);

    const text = "Cluaiz is an autonomous AI agent platform that helps businesses automate workflows using natural language.";

    await embedQueue.add("test-job", {
        orgId: "test-org",
        text: text,
        title: "Test Manual Entry",
        metadata: {
            type: "manual",
            fixedTokenCost: null
        }
    });

    const finalCounts = await embedQueue.getJobCounts();
    console.log("📊 Final Queue Counts:", finalCounts);

    console.log("✅ Job added!");
    process.exit(0);
}

main();
