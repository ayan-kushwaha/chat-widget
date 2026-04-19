import { ChromaClient } from 'chromadb';
// import { embedQueue } from '../jobs/queues.js'; // Future optimization: Queue embedding
import axios from 'axios';

// Configuration
const CHROMA_URL = process.env.CHROMA_DB_URL || 'http://localhost:8000';
const COLLECTION_NAME = "cluaiz_memory";

export class ChromaService {
    private static client: ChromaClient;

    private static getClient() {
        if (!this.client) {
            this.client = new ChromaClient({ path: CHROMA_URL });
        }
        return this.client;
    }

    /**
     * Store Memory Vector
     * Stores a chat summary as a vector for long-term recall.
     */
    static async upsertMemory(data: {
        id: string; // Chat ID or Unique ID
        text: string; // The Summary
        metadata: any; // { orgId, type, date, ... }
    }) {
        try {
            const client = this.getClient();

            // 1. Get or Create Collection
            const collection = await client.getOrCreateCollection({
                name: COLLECTION_NAME
            });

            // 2. Generate Embedding (Using Python Engine or Local)
            // Ideally, we ask Python Engine to embed the text to ensure consistency with query
            const embedding = await this.generateEmbedding(data.text);

            if (!embedding) {
                console.error(`[ChromaService] Failed to generate embedding for ${data.id}`);
                return;
            }

            // 3. Upsert into Chroma
            await collection.upsert({
                ids: [data.id],
                embeddings: [embedding],
                metadatas: [data.metadata],
                documents: [data.text]
            });

            console.log(`[ChromaService] ✅ Stored Vector for ${data.id} in ${COLLECTION_NAME}`);

        } catch (error: any) {
            console.error(`[ChromaService] ❌ Error storing vector:`, error.message);
        }
    }

    /**
     * Helper to generate embedding via Python Engine
     */
    private static async generateEmbedding(text: string): Promise<number[] | null> {
        try {
            const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://127.0.0.1:5000';
            const engineUrl = AI_ENGINE_URL.endsWith('/api/v1') ? AI_ENGINE_URL : `${AI_ENGINE_URL}/api/v1`;

            const response = await axios.post(`${engineUrl}/embeddings`, {
                texts: [text],
                model: "text-embedding-004" // Or whatever model is standard
            });

            if (response.data && response.data.embeddings && response.data.embeddings[0]) {
                return response.data.embeddings[0];
            }
            return null;
        } catch (e: any) {
            console.error(`[ChromaService] Embedding Generation Failed: ${e.message}`);
            return null;
        }
    }
}
