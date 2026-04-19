import { S3Client, PutObjectCommand, CreateBucketCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import fs from 'fs';

// --- CONFIGURATION ---
const MINIO_CONFIG = {
    region: "us-east-1", // MinIO requirement (any string works)
    endpoint: process.env.MINIO_ENDPOINT || "http://127.0.0.1:9000",
    credentials: {
        accessKeyId: process.env.MINIO_ROOT_USER || "admin",
        secretAccessKey: process.env.MINIO_ROOT_PASSWORD || "password123"
    }, 
    forcePathStyle: true, // REQUIRED for MinIO
    bucketName: "cluaiz-storage"
};

// --- INITIALIZE CLIENT ---
const s3 = new S3Client(MINIO_CONFIG);

// --- HELPER: ENSURE BUCKET EXISTS & PUBLIC POLICY ---
const ensureBucket = async () => {
    try {
        await s3.send(new HeadBucketCommand({ Bucket: MINIO_CONFIG.bucketName }));
    } catch (error: any) {
        if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
            console.log(`🪣 Bucket '${MINIO_CONFIG.bucketName}' not found. Creating...`);
            try {
                await s3.send(new CreateBucketCommand({ Bucket: MINIO_CONFIG.bucketName }));
                console.log(`✅ Bucket '${MINIO_CONFIG.bucketName}' created.`);
            } catch (createErr) {
                console.error("❌ Failed to create bucket:", createErr);
                return; // Exit if creation failed
            }
        }
    }

    // 🔥 ALWAYS SET POLICY (To fix 403 Errors even if bucket exists)
    try {
        const policy = {
            Version: "2012-10-17",
            Statement: [
                {
                    Effect: "Allow",
                    Principal: { AWS: ["*"] },
                    Action: ["s3:GetObject"],
                    Resource: [`arn:aws:s3:::${MINIO_CONFIG.bucketName}/*`]
                }
            ]
        };

        const { PutBucketPolicyCommand } = await import("@aws-sdk/client-s3");
        await s3.send(new PutBucketPolicyCommand({
            Bucket: MINIO_CONFIG.bucketName,
            Policy: JSON.stringify(policy)
        }));
        console.log(`🔓 Public Access Policy ENFORCED for: ${MINIO_CONFIG.bucketName}`);
    } catch (policyErr) {
        console.error("❌ Failed to set bucket policy:", policyErr);
    }
};

// Initialize on load
ensureBucket();

// --- UPLOAD FUNCTION ---
export const uploadFile = async (file: Express.Multer.File): Promise<string> => {
    const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;

    const params = {
        Bucket: MINIO_CONFIG.bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        // ACL: 'public-read' // MinIO might strip this if not configured, better manage via bucket policy
    };

    try {
        await s3.send(new PutObjectCommand(params));

        // Return Public URL
        // If Docker: http://localhost:9000/cluaiz-storage/...
        // In Production: https://storage.cluaiz.com/cluaiz-storage/...
        const publicUrl = `${MINIO_CONFIG.endpoint}/${MINIO_CONFIG.bucketName}/${fileName}`;
        return publicUrl;
    } catch (error) {
        console.error("Storage Upload Error:", error);
        throw new Error("Failed to upload file to storage.");
    }
};

// --- DELETE FUNCTION ---
export const deleteFile = async (fileUrl: string): Promise<void> => {
    try {
        if (!fileUrl) return;

        // Parse URL to get Bucket and Key dynamically
        // Format: http://localhost:9000/bucket-name/path/to/file.ext
        const urlObj = new URL(fileUrl);
        const pathParts = urlObj.pathname.split('/').filter(p => p.length > 0); // Remove empty strings

        if (pathParts.length < 2) {
            console.warn(`⚠️ Invalid MinIO URL path for deletion: ${urlObj.pathname}`);
            return;
        }

        const bucket = pathParts[0];
        // Join the rest as key (handle folders)
        const key = decodeURIComponent(pathParts.slice(1).join('/'));

        const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");

        console.log(`🗑️ Deleting from MinIO -> Bucket: ${bucket}, Key: ${key}`);

        await s3.send(new DeleteObjectCommand({
            Bucket: bucket,
            Key: key
        }));

        console.log(`✅ Successfully deleted object: ${key}`);

    } catch (error) {
        console.error("❌ Storage Delete Error:", error);
    }
};
