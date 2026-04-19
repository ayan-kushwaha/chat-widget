
interface ActivationTrigger {
    type: 'sequential' | 'keyword' | 'intent' | 'fallback';
    keywords?: string[];
    exclude_keywords?: string[];
    match_type?: 'any' | 'all' | 'exact';
    confidence?: number;
}

interface JourneyStep {
    id: string;
    title: string;
    type: string;
    enabled: boolean;
    activation: ActivationTrigger;
    system_instruction: string;
}

export class StepManager {

    /**
     * Analyzes user input against all steps to find a TRIGGER match.
     * Returns the ID of the step to Jump TO, or null if no trigger.
     */
    static checkTriggers(userInput: string, steps: JourneyStep[]): string | null {
        if (!steps || steps.length === 0) return null;
        const normalizedInput = userInput.trim().toLowerCase();

        // Priority 1: Keyword Triggers
        for (const step of steps) {
            if (!step.enabled || step.activation.type !== 'keyword') continue;

            // 1. Check Negative Keywords (Exclusion)
            if (this.hasNegativeMatch(normalizedInput, step.activation.exclude_keywords)) {
                continue; // Skip this step if negative keyword present
            }

            // 2. Check Positive Matches
            if (this.isMatch(normalizedInput, step.activation.keywords, step.activation.match_type)) {
                return step.id; // JUMP!
            }
        }

        return null;
    }

    /**
     * Determines the next sequential step if no jump occurred.
     */
    static getNextSequentialStep(currentStepId: string | null, steps: JourneyStep[]): string | null {
        if (!steps || steps.length === 0) return null;

        // If no current step, start with first enabled step
        if (!currentStepId) {
            const firstStep = steps.find(s => s.enabled);
            return firstStep ? firstStep.id : null;
        }

        const currentIndex = steps.findIndex(s => s.id === currentStepId);
        if (currentIndex === -1) return null; // Current step not found?

        // Find next ENABLED step
        for (let i = currentIndex + 1; i < steps.length; i++) {
            if (steps[i].enabled) return steps[i].id;
        }

        return currentStepId; // End of line, stay here
    }

    /**
     * Retrieves the AI instruction for a specific step.
     */
    static getSystemInstruction(stepId: string | null, steps: JourneyStep[]): string {
        if (!stepId) return "";
        const step = steps.find(s => s.id === stepId);
        return step ? step.system_instruction : "";
    }

    // --- HELPER METHODS ---

    private static hasNegativeMatch(input: string, negatives?: string[]): boolean {
        if (!negatives || negatives.length === 0) return false;
        return negatives.some(neg => input.includes(neg.toLowerCase()));
    }

    private static isMatch(input: string, keywords?: string[], matchType: 'any' | 'all' | 'exact' = 'any'): boolean {
        if (!keywords || keywords.length === 0) return false;

        const lowerKeywords = keywords.map(k => k.toLowerCase());

        if (matchType === 'exact') {
            return lowerKeywords.some(k => input === k || input.includes(k)); // "Exact phrase" logic
        }

        if (matchType === 'all') {
            return lowerKeywords.every(k => input.includes(k));
        }

        // Default: 'any'
        return lowerKeywords.some(k => input.includes(k));
    }
}
