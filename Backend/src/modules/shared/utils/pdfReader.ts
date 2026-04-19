import axios from 'axios';
import FormData from 'form-data';
import { Readable } from 'stream';
import fs from 'fs';

// AI Engine URL from Environment Variables (set in docker-compose)
// Force IPv4 for Windows Node -> Python communication
let AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://127.0.0.1:5000';
if (AI_ENGINE_URL.includes('localhost')) {
    AI_ENGINE_URL = AI_ENGINE_URL.replace('localhost', '127.0.0.1');
}

export async function extractTextFromPDF(fileInput: Buffer | string): Promise<string> {
    try {
        console.log(`📡 [Node.js] Sending PDF to AI Engine: ${AI_ENGINE_URL}/api/v1/docs/parse-pdf`);

        const formData = new FormData();

        if (typeof fileInput === 'string') {
            // It's a file path
            if (!fs.existsSync(fileInput)) {
                throw new Error(`File not found at path: ${fileInput}`);
            }
            const fileStream = fs.createReadStream(fileInput);
            formData.append('file', fileStream);
        } else {
            // It's a buffer
            const stream = Readable.from(fileInput);
            formData.append('file', stream, { filename: 'upload.pdf', contentType: 'application/pdf' });
        }

        const response = await axios.post(`${AI_ENGINE_URL}/api/v1/docs/parse-pdf`, formData, {
            headers: {
                ...formData.getHeaders(),
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        // Python returns: { filename, total_chars, chunks, ... }
        // We join chunks to maintain backward compatibility (return string)
        if (response.data && response.data.chunks) {
            console.log(`✅ [Node.js] Received ${response.data.chunks.length} chunks from AI Engine`);
            return response.data.chunks.join('\n\n');
        }

        return "";

    } catch (error: any) {
        console.error("❌ Python AI Engine PDF Parse Error:", error.message);
        if (error.response) {
            console.error("Details:", error.response.data);
        }
        throw new Error(`AI Engine Failed: ${error.message}`);
    }
}
