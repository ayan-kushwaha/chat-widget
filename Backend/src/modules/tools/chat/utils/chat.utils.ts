import { jsonrepair } from "jsonrepair";

export function getPriority(meta: any): number {
    if (!meta) return 5;
    const type = meta.content_type || meta.type || 'website';
    if (type === 'manual' || type === 'text_input') return 3;
    if (type === 'pdf' || type === 'docx') return 4;
    return 5; // website
}

export function getLastFormStatus(history: { role: string; content: string; form?: any; formData?: any }[]): { formId: string, formData: any, isSubmitted: boolean, formName: string } | null {
    // Reverse history to find recent bot message with form
    // Note: The history passed here might be simplified, so we might need to rely on the raw message content if form object isn't preserved in history array passed to this function.
    // However, assuming we can parse the [FORM: ...] tag from content if the object isn't there.

    for (let i = history.length - 1; i >= 0; i--) {
        const msg = history[i];
        if (msg.role === 'model' || msg.role === 'bot' || msg.role === 'ai') {
            // Check for [FORM: ...] tag in content
            const formMatch = msg.content.match(/\[FORM:\s*(\{[\s\S]*?\})\]/i);
            if (formMatch) {
                try {
                    const data = JSON.parse(jsonrepair(formMatch[1]));
                    return {
                        formId: data.form?.id || data.form?._id || data.formId,
                        formData: data.formData || {},
                        isSubmitted: false, // We don't track submission in history text yet, frontend handles this mostly
                        formName: data.form?.name || "Form"
                    };
                } catch (e) {
                    console.error("Error parsing form from history:", e);
                }
            }
        }
        // Check for "I have submitted..." message from user (which we hide in UI but send to backend)
        if (msg.role === 'user' && msg.content.startsWith('I have submitted the form')) {
            // This implies the LAST form was submitted.
            // We can try to extract data from this message too if needed.
            return {
                formId: "unknown", // We might not know ID easily unless we track it better
                formData: {},
                isSubmitted: true,
                formName: "Form"
            };
        }
    }
    return null;
}
