// src/components/browser-voice/BrowserSTT.ts
// Handles strictly WebKit Speech Recognition for real-time transcription

export class BrowserSTT {
    private recognition: any = null;
    private onResultCallback: ((text: string, isFinal: boolean) => void) | null = null;
    private onEndCallback: (() => void) | null = null;
    private onErrorCallback: ((error: string) => void) | null = null;

    constructor() {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

            if (SpeechRecognition) {
                this.recognition = new SpeechRecognition();
                this.recognition.continuous = true;
                this.recognition.interimResults = true;
                this.recognition.lang = 'en-US';

                this.recognition.onresult = this.handleResult.bind(this);
                this.recognition.onerror = this.handleError.bind(this);
                this.recognition.onend = this.handleEnd.bind(this);
            } else {
                console.error("BrowserSTT: Speech Recognition API is not supported in this browser.");
            }
        }
    }

    private handleResult(event: any) {
        if (!this.onResultCallback) return;

        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        // Prioritize final, but provide interim for real-time UI feel
        if (finalTranscript) {
            this.onResultCallback(finalTranscript.trim(), true);
        } else if (interimTranscript) {
            this.onResultCallback(interimTranscript.trim(), false);
        }
    }

    private handleError(event: any) {
        // "no-speech" is a normal timeout event when using continuous listening in a silent room. 
        // We suppress the console error to keep the developer tools clean, but still pass it up.
        if (event.error !== 'no-speech') {
            console.error("BrowserSTT Error:", event.error);
        }
        if (this.onErrorCallback) this.onErrorCallback(event.error);
    }

    private handleEnd() {
        if (this.onEndCallback) this.onEndCallback();
    }

    public start(
        onResult: (text: string, isFinal: boolean) => void,
        onEnd?: () => void,
        onError?: (err: string) => void
    ) {
        if (!this.recognition) return;

        this.onResultCallback = onResult;
        this.onEndCallback = onEnd || null;
        this.onErrorCallback = onError || null;

        try {
            this.recognition.start();
        } catch (e) {
            console.warn("BrowserSTT: Could not start, might already be running.", e);
        }
    }

    public stop() {
        if (this.recognition) {
            this.recognition.stop();
        }
    }
}

// Singleton instance for easy app-wide use
export const browserSTT = new BrowserSTT();
