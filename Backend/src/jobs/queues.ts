import { Queue } from "bullmq";
import { redisConnection } from "../modules/shared/libs/redis.js";

// Default options for all queues - prevents Delayed loop
const defaultOpts = {
    defaultJobOptions: {
        attempts: 1,  // CRITICAL: No retries = jobs fail immediately instead of going to Delayed
        removeOnComplete: true,  // Keep Redis clean
        removeOnFail: 100  // Keep last 100 failed jobs for debugging
    }
};

// 1. Crawling
export const crawlQueue = new Queue("crawlQueue", {
    connection: redisConnection,
    ...defaultOpts
});

// 2. Crawl किए गए डेटा को एक साथ जोड़ने के लिए (Aggregation)
export const aggregateQueue = new Queue("aggregateQueue", {
    connection: redisConnection,
    ...defaultOpts
});

// 3. एम्बेडिंग (RAG) बनाने के लिए
export const embedQueue = new Queue("embedQueue", {
    connection: redisConnection,
    ...defaultOpts
});

// 4. Learning Queue
export const learningQueue = new Queue("learning-queue", {
    connection: redisConnection,
    ...defaultOpts
});

// 5. Summarize Queue
export const summarizeQueue = new Queue("summarize-queue", {
    connection: redisConnection,
    ...defaultOpts
});

// 6. Analytics Queue (High volume ingestion)
export const analyticsQueue = new Queue("analytics-queue", {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 1,
        removeOnComplete: true,
        removeOnFail: 1000  // Analytics needs more history
    }
});

// 7. Analysis Queue (Intelligence Engine)
export const analysisQueue = new Queue("analysis-queue", {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3, // Retry 3 times as per Master Blueprint
        backoff: {
            type: 'exponential',
            delay: 5000 // 5s, 10s, 20s
        },
        removeOnComplete: true,
        removeOnFail: false // Keep failed jobs for DLQ inspection
    }
});

// 8. Training Queue (Legacy - being replaced by Workforce Queue)
export const trainingQueue = new Queue("training-queue", {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3, // Retry if Gemini API fails
        backoff: {
            type: 'exponential',
            delay: 3000 // 3s, 6s, 12s
        },
        removeOnComplete: false, // Keep completed jobs for audit trail
        removeOnFail: false // Keep failed jobs for debugging
    }
});

// 9. Workforce Queue (AI Employee Deployment & Neural Blueprinting)
export const workforceQueue = new Queue("workforce-queue", {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000
        },
        removeOnComplete: false,
        removeOnFail: false
    }
});