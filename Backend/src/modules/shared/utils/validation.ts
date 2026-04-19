/**
 * Utility for backend validation of Knowledge Source inputs.
 */

/**
 * Robust word counter.
 * Matches words consisting of alphanumeric characters.
 */
export const countWords = (text: string): number => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

export interface ValidationResult {
    success: boolean;
    message?: string;
}

export const LIMITS = {
    TITLE_CHARS: 140,
    DESCRIPTION_WORDS: 300,
    AI_INTENT_WORDS: 250,
    TAGS_COUNT: 24,
    MAIN_CONTENT_WORDS: 10000,
};

/**
 * Validates metadata and content against defined limits.
 */
export const validateKnowledgeInput = (data: {
    title?: string;
    description?: string;
    intent_summary?: string;
    tags?: string[];
    content?: string;
}): ValidationResult => {
    if (data.title && data.title.length > LIMITS.TITLE_CHARS) {
        return { success: false, message: `Title exceeds maximum limit of ${LIMITS.TITLE_CHARS} characters.` };
    }

    if (data.description) {
        const wordCount = countWords(data.description);
        if (wordCount > LIMITS.DESCRIPTION_WORDS) {
            return { success: false, message: `Description exceeds maximum limit of ${LIMITS.DESCRIPTION_WORDS} words (Current: ${wordCount}).` };
        }
    }

    if (data.intent_summary) {
        const wordCount = countWords(data.intent_summary);
        if (wordCount > LIMITS.AI_INTENT_WORDS) {
            return { success: false, message: `AI Intent exceeds maximum limit of ${LIMITS.AI_INTENT_WORDS} words (Current: ${wordCount}).` };
        }
    }

    if (data.tags && data.tags.length > LIMITS.TAGS_COUNT) {
        return { success: false, message: `Maximum of ${LIMITS.TAGS_COUNT} tags allowed.` };
    }

    if (data.content) {
        const wordCount = countWords(data.content);
        if (wordCount > LIMITS.MAIN_CONTENT_WORDS) {
            return { success: false, message: `Main content exceeds maximum limit of ${LIMITS.MAIN_CONTENT_WORDS} words (Current: ${wordCount}).` };
        }
    }

    return { success: true };
};
