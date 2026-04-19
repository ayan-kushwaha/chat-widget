import { Organization } from "../../core/organization/Organization.js";

/**
 * 📊 Update Storage Breakdown for Organization
 * Tracks MB usage across different storage categories
 */
export const updateStorageBreakdown = async (
    orgId: string,
    category: 'documents' | 'websites' | 'training' | 'chat_history' | 'forms' | 'auto_learning',
    sizeMB: number,
    operation: 'add' | 'subtract' = 'add'
): Promise<void> => {
    try {
        const org = await Organization.findOne({ _id: orgId });
        if (!org || !org.usage) {
            console.warn(`⚠️ Organization ${orgId} not found or missing usage data`);
            return;
        }

        // Initialize storage_breakdown if missing
        if (!(org as any).usage.storage_breakdown) {
            (org as any).usage.storage_breakdown = {
                documents_mb: 0,
                websites_mb: 0,
                training_mb: 0,
                chat_history_mb: 0,
                forms_mb: 0,
                auto_learning_mb: 0,
                total_mb: 0
            };
        }

        const fieldMap: Record<typeof category, string> = {
            documents: 'documents_mb',
            websites: 'websites_mb',
            training: 'training_mb',
            chat_history: 'chat_history_mb',
            forms: 'forms_mb',
            auto_learning: 'auto_learning_mb'
        };

        const field = fieldMap[category];
        const currentValue = ((org as any).usage.storage_breakdown as any)[field] || 0;

        // Update category value
        const newValue = operation === 'add' ? currentValue + sizeMB : Math.max(0, currentValue - sizeMB);
        ((org as any).usage.storage_breakdown as any)[field] = Math.round(newValue * 100) / 100; // Round to 2 decimals

        // Recalculate total
        (org as any).usage.storage_breakdown.total_mb = Math.round(
            (((org as any).usage.storage_breakdown.documents_mb || 0) +
                ((org as any).usage.storage_breakdown.websites_mb || 0) +
                ((org as any).usage.storage_breakdown.training_mb || 0) +
                ((org as any).usage.storage_breakdown.chat_history_mb || 0) +
                ((org as any).usage.storage_breakdown.forms_mb || 0) +
                ((org as any).usage.storage_breakdown.auto_learning_mb || 0)) * 100
        ) / 100;

        await org.save();
        console.log(`✅ Storage updated [${category}]: ${operation} ${sizeMB} MB → Total: ${(org as any).usage.storage_breakdown.total_mb} MB`);
    } catch (error: any) {
        console.error(`❌ updateStorageBreakdown failed for ${orgId}:`, error.message);
        throw error;
    }
}

/**
 * Update storage by system type (MinIO, MongoDB, ChromaDB)
 */
export async function updateSystemStorage(
    orgId: string,
    system: 'minio' | 'mongodb' | 'chroma',
    sizeMB: number,
    operation: 'add' | 'subtract' | 'set' = 'add'
) {
    try {
        const org = await Organization.findById(orgId);
        if (!org) {
            throw new Error(`Organization ${orgId} not found`);
        }

        // Initialize usage if needed
        if (!org.usage) {
            org.usage = {} as any;
        }

        // Initialize storage_by_system if needed
        if (!(org as any).usage.storage_by_system) {
            (org as any).usage.storage_by_system = {
                minio_mb: 0,
                mongodb_mb: 0,
                chroma_mb: 0,
                total_mb: 0
            };
        }

        const storageBySystem = (org as any).usage.storage_by_system as any;
        const fieldName = `${system}_mb`;

        // Apply operation
        if (operation === 'set') {
            storageBySystem[fieldName] = Math.round(sizeMB * 100) / 100;
        } else if (operation === 'add') {
            storageBySystem[fieldName] = Math.round((storageBySystem[fieldName] + sizeMB) * 100) / 100;
        } else if (operation === 'subtract') {
            storageBySystem[fieldName] = Math.round(Math.max(0, storageBySystem[fieldName] - sizeMB) * 100) / 100;
        }

        // Update total
        storageBySystem.total_mb = Math.round(
            (storageBySystem.minio_mb + storageBySystem.mongodb_mb + storageBySystem.chroma_mb) * 100
        ) / 100;

        await org.save();

        console.log(`✅ Updated ${system} storage for ${orgId}: ${storageBySystem[fieldName]} MB (total: ${storageBySystem.total_mb} MB)`);
    } catch (error: any) {
        console.error(`❌ updateSystemStorage failed for ${orgId}:`, error.message);
        throw error;
    }
}

/**
 * Calculate ACTUAL MinIO storage size from all buckets
 */
export async function calculateMinIOSize(orgId: string): Promise<{ totalMB: number, breakdown: { storageObjects: number, rawObjects: number } }> {
    try {
        const { S3Client, ListObjectsV2Command } = await import('@aws-sdk/client-s3');

        const s3 = new S3Client({
            region: 'us-east-1',
            endpoint: process.env.MINIO_ENDPOINT || 'http://127.0.0.1:9000',
            credentials: {
                accessKeyId: process.env.MINIO_ROOT_USER || 'admin',
                secretAccessKey: process.env.MINIO_ROOT_PASSWORD || 'password123'
            },
            forcePathStyle: true
        });

        // 🚨 CRITICAL FIX: S3 Keys do NOT contain orgId (Uploaded to root).
        // Strict isolation via S3 ListObjects is IMPOSSIBLE without key prefixes.
        // We MUST rely on the MongoDB metadata which reliably tracks file ownership.

        const { Organization } = await import("../../core/organization/Organization.js");
        const org = await Organization.findById(orgId);

        // Summing up File-based storage from DB breakdown
        // MinIO = Documents (Files) + Training Images (potentially)
        const dbMinioUsage = (org?.usage?.storage_breakdown?.documents_mb || 0) +
            (org?.usage?.storage_breakdown?.training_mb || 0);

        console.log(`📦 MinIO Calculation (DB Fallback): ${dbMinioUsage.toFixed(2)} MB`);

        return {
            totalMB: dbMinioUsage,
            breakdown: {
                storageObjects: (org?.usage as any)?.files_uploaded || 0,
                rawObjects: (org?.usage as any)?.storage_breakdown?.minio_mb || 0
            }
        };

        /* 
        // DISABLED: Legacy Scan Code (Leak Risk)
        const buckets = ['cluaiz-storage', 'cluaiz-raw-data'];
        let totalBytes = 0;
        let storageObjects = 0;
        // ... (Original Code Preserved in Git History)
        */
    } catch (error: any) {
        console.error('❌ calculateMinIOSize failed:', error.message);
        // Fallback
        const { Organization } = await import("../../core/organization/Organization.js");
        const org = await Organization.findById(orgId);
        return {
            totalMB: org?.usage?.storage_by_system?.minio_mb || 0,
            breakdown: { storageObjects: 0, rawObjects: 0 }
        };
    }
}

/**
 * Calculate MongoDB size (simplified estimation)
 */
export async function calculateMongoDBSize(orgId: string): Promise<number> {
    try {
        const { Site } = await import('./models/Site.js');
        const { KnowledgeDocument } = await import('./models/KnowledgeDocument.js');

        const sitesCount = await Site.countDocuments({ orgId: orgId.toString() });
        const docsCount = await KnowledgeDocument.countDocuments({ orgId: orgId.toString() });

        // Estimate: Sites ~10KB each, Docs ~2KB each
        const estimatedKB = (sitesCount * 10) + (docsCount * 2);
        const MB = estimatedKB / 1024;

        console.log(`🗄️ MongoDB: ${sitesCount} sites (×10KB) + ${docsCount} docs (×2KB) = ${MB.toFixed(2)} MB`);
        return MB;
    } catch (error: any) {
        console.error('❌ calculateMongoDBSize failed:', error.message);
        return 0;
    }
}

/**
 * Calculate ChromaDB size (estimated from embeddings)
 */
export async function calculateChromaDBSize(orgId: string): Promise<number> {
    try {
        const { Brain } = await import('../brain/models/Brain.js');
        const brain = await Brain.findOne({ orgId });

        const brainAny = brain as any;
        if (brain && brainAny.token_count && brainAny.token_count > 0) {
            // 1 token ≈ 1 word, ~200 words per chunk
            // Each chunk: 1536 dims × 4 bytes = 6KB + 2KB metadata = 8KB
            const estimatedChunks = Math.ceil(brainAny.token_count / 200);
            const sizeKB = estimatedChunks * 8;
            const MB = sizeKB / 1024;

            console.log(`🧠 ChromaDB: ${brainAny.token_count} tokens → ${estimatedChunks} chunks (×8KB) = ${MB.toFixed(2)} MB`);
            return MB;
        }


        // Fallback: Estimate from file storage (embeddings are ~5x file size)
        const { Organization } = await import("../../core/organization/Organization.js");
        const org = await Organization.findById(orgId);
        const orgAny = org as any;

        if (orgAny?.usage?.storage_breakdown?.documents_mb || orgAny?.usage?.storage_breakdown?.websites_mb) {
            const docsMB = orgAny.usage.storage_breakdown.documents_mb || 0;
            const webMB = orgAny.usage.storage_breakdown.websites_mb || 0;
            const totalTextMB = docsMB + webMB;

            // Embeddings are typically larger than raw text (approx 3-5x)
            const estimatedMB = totalTextMB * 5;
            console.log(`🧠 ChromaDB (fallback): ${totalTextMB.toFixed(2)} MB (Docs+Web) × 5 = ${estimatedMB.toFixed(2)} MB`);
            return estimatedMB;
        }

        console.log('🧠 ChromaDB: No data = 0 MB');
        return 0;
    } catch (error: any) {
        console.error('❌ calculateChromaDBSize failed:', error.message);
        return 0;
    }
};
