import { marked } from 'marked';
import removeMd from 'remove-markdown';

export type ChannelType = 'WEB' | 'EMAIL' | 'WHATSAPP' | 'SMS';

/**
 * Universal Adapter: Formats AI Markdown response for specific channels.
 * @param aiText - The raw markdown text from AI.
 * @param channel - The target channel (WEB, EMAIL, WHATSAPP, SMS).
 */
export function formatResponse(aiText: string, channel: ChannelType): string {
    if (!aiText) return "";

    switch (channel) {

        case 'WEB':
            // Web handles markdown natively (ReactMarkdown)
            return aiText;

        case 'EMAIL':
            // Convert Markdown -> HTML (Table/Bold support)
            // marked returns a Promise in newer versions if configured async, 
            // but sync by default. We assume sync usage here or await if needed.
            // For safety in TS, casting to string (marked.parse returns string | Promise<string>)
            return marked.parse(aiText) as string;

        case 'WHATSAPP':
            // Custom Regex for WhatsApp (*Bold*, _Italic_, No Tables)
            return convertToWhatsApp(aiText);

        case 'SMS':
            // Strip everything (No bold, no links, plain text)
            return removeMd(aiText);

        default:
            return aiText;
    }
}

/**
 * Helper: Converts Standard Markdown to WhatsApp Format
 */
function convertToWhatsApp(text: string): string {
    return text
        // 1. Bold: **text** -> *text*
        .replace(/\*\*(.*?)\*\*/g, '*$1*')
        // 2. Heading: ### Text -> *Text*
        .replace(/### (.*)/g, '*$1*')
        // 3. Links: [Label](URL) -> URL
        .replace(/\[(.*?)\]\((.*?)\)/g, '$2')
        // 4. Tables: Replace pipes | with dashes -
        .replace(/\|/g, ' - ')
        // 5. Remove horizontal rules
        .replace(/---/g, '');
}
