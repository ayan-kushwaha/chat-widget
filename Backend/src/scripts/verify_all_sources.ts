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
    console.log(`🚀 Triggering Verification Jobs on queue: ${embedQueue.name}...`);

    // 1. MANUAL Source Test
    const manualText = "Cluaiz is an autonomous AI agent platform that helps businesses automate workflows using natural language.";
    await embedQueue.add("verify-manual", {
        orgId: "6969c657ec474f8bfe771ba6",
        text: manualText,
        title: "Manual Test Entry",
        metadata: {
            type: "manual",
            fileId: "507f1f77bcf86cd799439014", // Mock ID to prevent CastError
            fixedTokenCost: null
        }
    });
    console.log("✅ Added MANUAL job");

    // 2. WEBSITE Source Test (Simulated Post-Crawl)
    const websiteText = "Cluaiz Features: 1. RAG Engine 2. Workflow Automation 3. Voice Agents. Our pricing is competitive.";
    await embedQueue.add("verify-website", {
        orgId: "6969c657ec474f8bfe771ba6",
        text: websiteText,
        title: "Cluaiz Home Page",
        url: "https://cluaiz.com",
        siteId: "507f1f77bcf86cd799439012",
        metadata: {
            type: "website",
            siteId: "507f1f77bcf86cd799439012",
            url: "https://cluaiz.com",
            fixedTokenCost: null
        }
    });
    console.log("✅ Added WEBSITE job");

    // 3. FILE Source Test (Simulated Post-Extraction)
    const fileText = "Agreement between Party A and Party B. Terms: 1. Confidentiality 2. Payment Terms 3. Termination.";
    await embedQueue.add("verify-file", {
        orgId: "6969c657ec474f8bfe771ba6",
        text: fileText,
        fileName: "contract_v1.pdf",
        metadata: {
            type: "file",
            fileId: "507f1f77bcf86cd799439013",
            fileName: "contract_v1.pdf",
            fixedTokenCost: null
        }
    });
    console.log("✅ Added FILE job");

    const counts = await embedQueue.getJobCounts();
    console.log("📊 Queue Counts:", counts);

    console.log("⏳ Jobs added! Check logs.");
    process.exit(0);
}

main();
