export function generateChunks(text: string, options: { chunkSize?: number, overlap?: number } = {}): string[] {
    const { chunkSize = 4000, overlap = 200 } = options;

    if (!text || text.length === 0) return [];
    if (text.length <= chunkSize) return [text.trim()];

    const chunks: string[] = [];
    let startIndex = 0;

    // Hierarchy of separators for semantic chunking
    // Supports English, Hindi/Sanskrit (।), Chinese/Japanese (。), Urdu/Arabic (۔)
    const separators = ['\n\n', '\n', '。', '۔', '।', '.', '?', '!', ' '];

    while (startIndex < text.length) {
        let endIndex = startIndex + chunkSize;

        if (endIndex >= text.length) {
            chunks.push(text.substring(startIndex).trim());
            break;
        }

        // Try to find the best semantic break point
        let breakFound = false;
        const slice = text.substring(startIndex, endIndex);

        for (const separator of separators) {
            const separatorIndex = slice.lastIndexOf(separator);

            // Only break if the separator is in the second half of the chunk
            // This ensures we don't make tiny chunks just because there's a paragraph early on
            if (separatorIndex !== -1 && separatorIndex > (chunkSize * 0.5)) {
                // Keep the separator attached to the chunk
                endIndex = startIndex + separatorIndex + separator.length;
                breakFound = true;
                break;
            }
        }

        const chunk = text.substring(startIndex, endIndex).trim();
        if (chunk.length > 0) {
            chunks.push(chunk);
        }

        // Move start index for next chunk, accounting for overlap
        startIndex = endIndex - overlap;

        // Safety check to prevent infinite loop if overlap >= chunkSize (shouldn't happen with defaults)
        if (startIndex >= endIndex) {
            startIndex = endIndex;
        }
    }

    return chunks;
}
