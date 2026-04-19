// src/components/browser-voice/LocalBrain.ts
// Handles local API requests to Ollama (Qwen3:0.6b)

export interface BrainResponse {
    reply: string;
    emotion: string;
}

const OLLAMA_URL = "http://localhost:11434/api/generate";
const MODEL_NAME = "qwen3:1.7b";

const SYSTEM_PROMPT = `
You are Cluaiz, a helpful robotic AI assistant living in the user's browser.
You must respond with completely valid JSON only. No markdown formatting, no backticks, no extra text.
The JSON must have this exact structure:
{
  "reply": "your conversational response here",
  "emotion": "one word from this list: [idle, happy, sad, angry, surprised, sleep, wink, curious, love, star, dizzy, error, cute, excited, smug, mindblown, blank, frustrated, shook, greeting, listening]"
}
If the user asks "how are you", reply with happy. If they insult you, reply with angry or sad.
Keep replies strictly under 15 words.
`;

export class LocalBrain {
    /**
     * Sends user text to local Ollama and guarantees a BrainResponse.
     * Fails gracefully to a default response if the server is down.
     */
    static async process(transcript: string): Promise<BrainResponse> {
        try {
            const response = await fetch(OLLAMA_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: MODEL_NAME,
                    prompt: `${SYSTEM_PROMPT}\n\nUser: ${transcript}\n\nRobot JSON:`,
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`Ollama Server Error: ${response.status}`);
            }

            const data = await response.json();

            console.log("RAW OLLAMA OUTPUT:", data.response);

            let parsed: any = {};

            try {
                // Models like qwen3-vl sometimes output ```json { ... } ``` instead of raw JSON
                let rawText = data.response.trim();
                // Strip markdown blocks if present
                if (rawText.startsWith("```json")) {
                    rawText = rawText.substring(7);
                    if (rawText.endsWith("```")) {
                        rawText = rawText.substring(0, rawText.length - 3);
                    }
                } else if (rawText.startsWith("```")) {
                    rawText = rawText.substring(3);
                    if (rawText.endsWith("```")) {
                        rawText = rawText.substring(0, rawText.length - 3);
                    }
                }

                parsed = JSON.parse(rawText.trim());
            } catch (parseError) {
                console.warn("Failed to parse strict JSON from Ollama:", data.response);
                // Fallback attempt: extract anything that looks like JSON
                const match = data.response.match(/\{[\s\S]*?\}/);
                if (match) {
                    try {
                        parsed = JSON.parse(match[0]);
                    } catch (e) {
                        // Still failed
                    }
                }
            }

            return {
                reply: parsed.reply || "I didn't quite catch that.",
                emotion: this.sanitizeEmotion(parsed.emotion)
            };

        } catch (error) {
            console.error("LocalBrain API Error:", error);
            // Fallback gracefully if Ollama is not running
            return {
                reply: "My local brain seems to be disconnected.",
                emotion: "error"
            };
        }
    }

    /**
     * Fallback to ensure we always return a valid emotion key for the UI
     */
    private static sanitizeEmotion(emo?: string): string {
        const valid = ["idle", "happy", "sad", "angry", "surprised", "sleep", "wink", "curious", "love", "star", "dizzy", "error", "cute", "excited", "smug", "mindblown", "blank", "frustrated", "shook", "peeking", "rolling", "weary", "tornado"];
        if (emo && valid.includes(emo.toLowerCase())) {
            return emo.toLowerCase();
        }
        return "idle";
    }
}
