import { Worker } from "bullmq";
import { Server } from "socket.io";
// Use dynamic imports or ensure these export the worker instance
import { crawlWorker } from "./crawl.worker.js";
import { embedWorker } from "./embed.worker.js";

export const initQueueListeners = (io: Server) => {
    console.log("🎧 Initializing Queue Listeners for Socket.IO...");

    const setupWorkerListeners = (worker: Worker, queueName: string) => {
        console.log(`🔌 [Listeners] Attaching events to worker: ${queueName}`);
        worker.on("completed", async (job) => {
            const { orgId, siteId, type, url } = job.data;
            // 🔥 FIX: Handle both siteId and fileId in metadata
            const safeId = siteId || job.data.sourceId || job.data.metadata?.fileId;

            console.log(`✅ [${queueName}] Job ${job.id} Completed for ${safeId}`);

            // Extract status
            // 🔥 CRITICAL FIX: Add page URL to message
            const pageUrl = job.returnvalue?.pageUrl || job.data.url || job.data.startUrl;

            // NEW Status Logic: Crawl -> Embedding (not processing)
            const returnStatus = job.returnvalue?.status;
            const status = returnStatus || (queueName === 'crawl' ? 'embedding' : 'synced');
            console.log(`📣 [Listeners] Final Status for Emission: ${status}`);

            let msg = status === 'synced' ? 'Active & Ready' : (queueName === 'crawl' ? 'Analysis Complete' : 'Processing...');
            if (pageUrl) {
                const pageName = pageUrl.split('/').filter(Boolean).pop() || pageUrl;
                if (status === 'embedding') msg = `Learning: ${pageName}`;
            }

            console.log(`🚀 [Listeners] Emitting brain:progress to room ${orgId} with sourceId ${safeId}`);
            io.to(orgId).emit("brain:progress", {
                orgId,
                id: safeId,
                sourceId: safeId,
                progress: 100,
                status: status,
                pageUrl: pageUrl, // 🔥 CRITICAL: Frontend needs this to match row
                message: msg,
                jobId: job.id,
                chunks: job.returnvalue?.chunks,
                tokens: job.returnvalue?.tokens
            });
        });

        worker.on("progress", (job, progress: any) => {
            const { orgId, siteId } = job.data;
            // 🔥 FIX: Handle both siteId and fileId in metadata
            const safeId = siteId || job.data.sourceId || job.data.metadata?.fileId;
            const pageUrl = job.data.url || job.data.startUrl;

            // Handle numeric or object progress
            const percent = typeof progress === 'object' ? (progress as any).percent : progress;
            const message = typeof progress === 'object' ? (progress as any).message : "Processing...";
            const pgStatus = (progress as any).status || (queueName === 'crawl' ? 'crawling' : 'embedding');

            io.to(orgId).emit("brain:progress", {
                orgId,
                id: safeId,
                sourceId: safeId,
                progress: percent,
                status: pgStatus,
                pageUrl: pageUrl, // 🔥 CRITICAL
                message: message,
                jobId: job.id
            });
        });

        worker.on("failed", (job, err) => {
            if (!job) return;
            const { orgId, siteId } = job.data;
            // 🔥 FIX: Handle both siteId and fileId in metadata
            const safeId = siteId || job.data.sourceId || job.data.metadata?.fileId;
            const pageUrl = job.data.url || job.data.startUrl;

            console.error(`❌ [${queueName}] Job ${job.id} Failed: ${err.message}`);

            console.log(`🚀 [Listeners] Emitting FAILURE event for ${safeId} (Page: ${pageUrl})`);
            io.to(orgId).emit("brain:progress", {
                orgId,
                id: safeId,
                sourceId: safeId,
                status: 'failed',
                pageUrl: pageUrl, // 🔥 CRITICAL
                message: `Failed: ${err.message}`, // Frontend uses this
                progress: 0,
                jobId: job.id
            });
        });
    }

    setupWorkerListeners(crawlWorker, "crawl");
    setupWorkerListeners(embedWorker, "embed");

    console.log("✅ Queue Listeners Attached");
};
