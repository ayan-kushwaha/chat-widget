// src/components/browser-voice/useBrowserVoice.ts
import { useState, useRef, useCallback, useEffect } from 'react';
import { BrowserTTS, TTSConfig } from './BrowserTTS';
import { browserSTT } from './BrowserSTT';

interface UseBrowserVoiceReturn {
    // State
    isListening: boolean;
    isProcessing: boolean;
    isSpeaking: boolean;
    transcript: string;
    interimTranscript: string;
    botReply: string;
    currentEmotion: string;
    activeWordIndex: number;

    // Actions
    startInteraction: () => void;
    stopInteraction: () => void;
    forceSpeak: (text: string, overrideEmotion?: string) => void;
    speakSegment: (text: string, onEnd?: () => void) => void; // 🎙️ NEW: Add for streaming
    greetAndListen: (greetingText: string, emotion?: string) => void;
}

export const useBrowserVoice = (
    onSpeechFinal?: (text: string) => void,
    ttsConfig?: TTSConfig
): UseBrowserVoiceReturn => {
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [botReply, setBotReply] = useState('');
    const [currentEmotion, setCurrentEmotion] = useState('idle');
    const [activeWordIndex, setActiveWordIndex] = useState(-1);

    // Prevent overlap - use refs so no stale closures
    const interactionActive = useRef(false);
    const isContinuousRef = useRef(false); // 🔥 REF instead of state so resumeListening never closes over stale values
    const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

    /**
     * Hard stops everything (mic + speech + continuous loop)
     */
    const stopInteraction = useCallback(() => {
        isContinuousRef.current = false; // Break the loop - using ref so always fresh
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        
        browserSTT.stop();
        BrowserTTS.stop();
        setIsListening(false);
        setIsProcessing(false);
        setIsSpeaking(false);
        setCurrentEmotion('idle');
        interactionActive.current = false;
    }, []);

    /**
     * Resets the 60-second inactivity timer.
     * If this timer triggers, the interaction is completely stopped.
     */
    const resetInactivityTimer = useCallback(() => {
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = setTimeout(() => {
            console.log("useBrowserVoice: 60s silence reached, auto-stopping interaction.");
            stopInteraction();
        }, 60000); // 60 seconds
    }, [stopInteraction]);

    /**
     * Internal method to process text via Ollama and then Speak
     * @deprecated Gemini backend now handles processing via Socket
     */
    /*
    const processAndSpeak = async (text: string) => {
        // ... (truncated for brevity in actual file)
    };
    */

    /**
     * Internal helper to restart the mic securely
     */
    const resumeListening = useCallback(() => {
        // 🔥 Read from ref, not state - avoids stale closure bug
        if (!isContinuousRef.current) {
            console.log("resumeListening: isContinuousRef is false, aborting.");
            return;
        }

        interactionActive.current = true;
        setIsListening(true);
        setTranscript('');
        setInterimTranscript('');

        browserSTT.start(
            (text, isFinal) => {
                if (isFinal) {
                    setTranscript(text);
                    setInterimTranscript('');
                    setIsListening(false);
                    browserSTT.stop();
                    // 🚀 NEW: Call backend via onSpeechFinal
                    if (onSpeechFinal) {
                        onSpeechFinal(text);
                    } else {
                        // Fallback logic if no callback provided
                        // processAndSpeak(text); 
                    }
                } else {
                    setInterimTranscript(text);
                }
            },
            () => {
                // If STT kills itself due to silence, reboot it if still continuous
                if (isContinuousRef.current && !interactionActive.current) {
                    setTimeout(() => resumeListening(), 300);
                } else {
                    setIsListening(false);
                    interactionActive.current = false;
                }
            },
            (err) => {
                if (err !== 'no-speech') {
                    console.error("STT Restart Failed:", err);
                    setCurrentEmotion('error');
                }
                setIsListening(false);
                interactionActive.current = false;
                // Auto-retry on simple errors and no-speech silence timeouts
                if (isContinuousRef.current) setTimeout(() => resumeListening(), 100);
            }
        );
    }, []); // No deps - reads fresh values from refs always

    /**
     * Initiates the microphone recording (starts the continuous loop)
     */
    const startInteraction = useCallback(() => {
        if (interactionActive.current) return;

        BrowserTTS.stop();
        setIsSpeaking(false);
        isContinuousRef.current = true; // 🔥 Set ref so resumeListening reads it fresh
        resetInactivityTimer();
        resumeListening();
    }, [resumeListening, resetInactivityTimer]);

    /**
     * Speaks a greeting first, then automatically enters continuous listening mode.
     */
    const greetAndListen = useCallback((greetingText: string, emotion: string = 'happy') => {
        if (interactionActive.current) return;
        
        stopInteraction();

        setBotReply(greetingText);
        setCurrentEmotion(emotion);
        setActiveWordIndex(-1);
        
        // Temporarily lock so 'startInteraction' logic doesn't interrupt speech
        interactionActive.current = true;
        isContinuousRef.current = true;

        BrowserTTS.speak(
            greetingText,
            ttsConfig,
            () => setIsSpeaking(true),
            () => {
                setIsSpeaking(false);
                setActiveWordIndex(-1);
                
                // Release the lock before kickstarting mic
                interactionActive.current = false;
                
                // As soon as greeting finishes, kickstart the mic loop
                resumeListening();
                resetInactivityTimer();
            },
            (charIndex) => {
                const textUpToBoundary = greetingText.substring(0, charIndex);
                const wordIndex = textUpToBoundary.split(/\s+/).length - 1;
                setActiveWordIndex(wordIndex);
            }
        );
    }, [ttsConfig, resumeListening, stopInteraction, resetInactivityTimer]);

    // stopInteraction moved above resetInactivityTimer

    /**
     * Manual override to just make the bot say something immediately without STT
     */
    const forceSpeak = useCallback((text: string, overrideEmotion: string = 'idle') => {
        // Stop everything else
        stopInteraction();

        setBotReply(text);
        setCurrentEmotion(overrideEmotion);
        setActiveWordIndex(-1);

        BrowserTTS.speak(
            text,
            ttsConfig,
            () => setIsSpeaking(true),
            () => {
                setIsSpeaking(false);
                setActiveWordIndex(-1);
            },
            (charIndex) => {
                const textUpToBoundary = text.substring(0, charIndex);
                const wordIndex = textUpToBoundary.split(/\s+/).length - 1;
                setActiveWordIndex(wordIndex);
            }
        );
    }, [ttsConfig, stopInteraction]);

    /**
     * Speaks a segment without stopping the interaction (continuous mode)
     */
    const speakSegment = useCallback((text: string, onEnd?: () => void) => {
        setIsSpeaking(true);
        BrowserTTS.speak(
            text,
            ttsConfig,
            () => setIsSpeaking(true),
            () => {
                setIsSpeaking(false);
                if (onEnd) onEnd();
            },
            (charIndex) => {
                const textUpToBoundary = text.substring(0, charIndex);
                const wordIndex = textUpToBoundary.split(/\s+/).length - 1;
                setActiveWordIndex(wordIndex);
            }
        );
    }, [ttsConfig]);

    // Cleanup on unmount
    useEffect(() => {
        return () => stopInteraction();
    }, [stopInteraction]);

    // Track activity to reset the timer
    useEffect(() => {
        if (isContinuousRef.current && (isListening || isSpeaking || isProcessing) && !botReply) {
             resetInactivityTimer();
        }
    }, [transcript, interimTranscript, isSpeaking, isProcessing, resetInactivityTimer, botReply]);

    return {
        isListening,
        isProcessing,
        isSpeaking,
        transcript,
        interimTranscript,
        botReply,
        currentEmotion,
        activeWordIndex,
        startInteraction,
        stopInteraction,
        forceSpeak,
        speakSegment,
        greetAndListen
    };
};
