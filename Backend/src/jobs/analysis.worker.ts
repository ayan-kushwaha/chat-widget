import { Worker } from "bullmq";
import { redisConnection } from "../modules/shared/libs/redis.js";
import { MemoryService } from "../services/memory.service.js";

const WORKER_NAME = "AnalysisWorker";

export const analysisWorker = new Worker("analysis-queue", async (job) => {
    console.log(`[${WORKER_NAME}] 🚀 Processing Job ${job.id}: ${job.name}`);

    try {
        if (job.name === 'analyze-chat') {
            const { chatId, orgId } = job.data;
            if (!chatId || !orgId) {
                throw new Error("Missing chatId or orgId in job data");
            }

            console.log(`[${WORKER_NAME}] 🧠 Analyzing Chat ID: ${chatId}`);
            await MemoryService.processChatSessionCompletion(chatId, orgId);

            console.log(`[${WORKER_NAME}] ✅ Job ${job.id} Completed.`);
        } else {
            console.warn(`[${WORKER_NAME}] ⚠️ Unknown job name: ${job.name}`);
        }
    } catch (error: any) {
        console.error(`[${WORKER_NAME}] ❌ Job ${job.id} Failed:`, error.message);
        throw error; // Throwing triggers BullMQ retry mechanism
    }
}, {
    connection: redisConnection,
    concurrency: 5 // Parallel processing limit
});

// Event Listeners for Better Monitoring
analysisWorker.on('completed', (job) => {
    console.log(`[${WORKER_NAME}] 🟢 Job ${job.id} finished successfully.`);
});

analysisWorker.on('failed', (job, err) => {
    console.error(`[${WORKER_NAME}] 🔴 Job ${job?.id} failed with error: ${err.message}`);
});
