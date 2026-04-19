import fs from 'fs';
import path from 'path';

/**
 * Supported MIME types for file uploads

/**
 * Supported MIME types for file uploads
 */
export const SUPPORTED_MIME_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc (legacy, will attempt)
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/json',
    'text/html'
];

/**
 * Extracts clean, readable text from various file formats
 * Prevents binary garbage from being stored in the database
 */
export async function parseFile(filePath: string, mimetype?: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();
    const fileBuffer = fs.readFileSync(filePath);

    try {
        // 📄 PDF Files
        if (ext === '.pdf' || mimetype === 'application/pdf') {
            console.log(`📄 Parsing PDF via AI Engine: ${path.basename(filePath)}`);
            // Use Python Proxy
            const { extractTextFromPDF } = await import("./pdfReader.js");
            const text = await extractTextFromPDF(fileBuffer);

            if (!text || text.length < 10) {
                // Fallback or Error? Python usually throws if empty.
                throw new Error('PDF processed by AI Engine returned empty text.');
            }

            return cleanText(text);
        }

        // 📝 DOCX Files (Word Documents)
        if (ext === '.docx' || mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            console.log(`📝 Parsing DOCX: ${path.basename(filePath)}`);
            let mammoth;
            try {
                // @ts-ignore
                mammoth = await import('mammoth');
            } catch (e) {
                throw new Error("DOCX parsing requires 'mammoth' (not installed).");
            }

            const result = await mammoth.default.extractRawText({ buffer: fileBuffer });
            const text = result.value.trim();

            if (!text || text.length < 10) {
                throw new Error('DOCX appears to be empty or contains only images');
            }

            if (result.messages.length > 0) {
                console.warn('⚠️ DOCX parsing warnings:', result.messages);
            }

            return cleanText(text);
        }

        // 📋 Plain Text Files
        if (['.txt', '.md', '.csv'].includes(ext) || mimetype === 'text/plain') {
            console.log(`📋 Parsing Text File: ${path.basename(filePath)}`);
            const text = fileBuffer.toString('utf-8').trim();

            if (!text || text.length < 10) {
                throw new Error('File appears to be empty');
            }

            return cleanText(text);
        }

        // 🔧 JSON Files
        if (ext === '.json' || mimetype === 'application/json') {
            console.log(`🔧 Parsing JSON: ${path.basename(filePath)}`);
            const content = fileBuffer.toString('utf-8');
            const json = JSON.parse(content);
            return JSON.stringify(json, null, 2);
        }

        // 🌐 HTML Files
        if (ext === '.html' || ext === '.htm' || mimetype === 'text/html') {
            console.log(`🌐 Parsing HTML: ${path.basename(filePath)}`);
            const text = fileBuffer.toString('utf-8').trim();
            return cleanText(text);
        }

        // ❌ Unsupported File Type
        throw new Error(
            `Unsupported file type: ${ext || mimetype}. ` +
            `Supported formats: PDF, DOCX, TXT, MD, CSV, JSON, HTML`
        );

    } catch (error: any) {
        console.error(`❌ File parsing failed for ${path.basename(filePath)}:`, error.message);
        throw new Error(`File parsing failed [${ext}]: ${error.message}`);
    }
}

/**
 * Cleans extracted text by:
 * - Removing excessive whitespace
 * - Normalizing line breaks
 * - Trimming
 */
function cleanText(text: string): string {
    return text
        .replace(/\r\n/g, '\n')           // Normalize line endings
        .replace(/\n{3,}/g, '\n\n')       // Max 2 consecutive newlines
        .replace(/[ \t]+/g, ' ')          // Collapse spaces/tabs
        .replace(/\n /g, '\n')            // Remove leading spaces after newline
        .trim();
}

/**
 * Validates file before upload
 * Returns error message if invalid, null if valid
 */
export function validateFile(mimetype: string, size: number): string | null {
    // Check file type
    if (!SUPPORTED_MIME_TYPES.includes(mimetype)) {
        return `File type '${mimetype}' not supported. Please upload PDF, DOCX, TXT, MD, CSV, JSON, or HTML files.`;
    }

    // Check file size (max 5MB to prevent infinite chunking)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (size > MAX_SIZE) {
        return `File too large (${(size / 1024 / 1024).toFixed(2)}MB). Maximum size is 5MB.`;
    }

    return null; // Valid
}
