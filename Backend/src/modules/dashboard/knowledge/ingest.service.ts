import { embedQueue } from "../../../jobs/queues.js";

interface IngestOptions {
    orgId: string;
    content: string;
    title: string;
    type: 'manual' | 'pdf' | 'docx';
    url?: string;
    metadata?: any;
}

export const ingestContent = async (opts: IngestOptions) => {
    const { orgId, content, title, type, url, metadata } = opts;

    if (!content || content.length < 5) {
        throw new Error("Content too short to ingest");
    }

    // Push to Embed Queue
    await embedQueue.add("embed-content", {
        orgId,
        text: content,
        url: url || 'manual-upload',
        title,
        metadata: {
            type,
            ...metadata
        }
    }, { removeOnComplete: true });

    return { success: true, message: "Content queued for ingestion" };
};
