import React, { useState, useRef, useEffect } from 'react';
import { Volume2, Loader2, Square, Pause, Play, Check } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { audioManager } from '@/utils/audioManager';
import { toast } from "sonner";
import { cn } from '@/lib/utils';

interface VoicePlayerProps {
    text: string;
    orgId?: string | null;
    tokenCount?: number; // Pass original text token count for accurate billing
    autoPlay?: boolean; // Trigger auto-play from external source (e.g., context menu)
    color?: string; // Dynamic color for theme matching
    className?: string;
}

const audioCache = new Map<string, string>(); // 🧠 Global RAM Cache (Client-Side)

// 🧹 Utility to strip Markdown for clean TTS
const cleanMarkdown = (text: string) => {
    return text
        .replace(/(\*\*|__)(.*?)\1/g, '$2') // Bold
        .replace(/(\*|_)(.*?)\1/g, '$2') // Italic
        .replace(/#+\s+(.*)/g, '$1') // Headings
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Links
        .replace(/[`]{1,3}[^`]*[`]{1,3}/g, '') // Code blocks
        .replace(/\|\s*(.*?)\s*\|/g, '$1') // Table cells
        .replace(/[-|:]/g, ' ') // Table borders
        .replace(/\n+/g, ' ') // Newlines to spaces
        .trim();
};

export const VoicePlayer: React.FC<VoicePlayerProps> = ({ text, orgId, tokenCount, autoPlay, color = "currentColor", className }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isSessionActive, setIsSessionActive] = useState(false); // 🌟 New State: Keeps UI expanded
    const [isLoading, setIsLoading] = useState(false);
    const [hasPlayedOnce, setHasPlayedOnce] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // 🎬 Auto-play trigger from external source (e.g., context menu)
    useEffect(() => {
        if (autoPlay && !isPlaying && !isLoading) {
            handlePlay();
        }
    }, [autoPlay]);

    // 🗣️ FALLBACK: Browser Native TTS
    const speakNative = (textToSpeak: string) => {
        console.warn("⚠️ Switching to Native Browser TTS (Fallback)");
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Stop valid speech
            const utterance = new SpeechSynthesisUtterance(cleanMarkdown(textToSpeak));

            // Try to select a good voice
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.lang.includes('en-US') && v.name.includes('Google')) || voices[0];
            if (preferredVoice) utterance.voice = preferredVoice;

            utterance.rate = 1.0;
            utterance.pitch = 1.0;

            utterance.onstart = () => {
                setIsPlaying(true);
                setIsSessionActive(true);
                // Register with Audio Manager (Mocking HTMLAudioElement behavior)
                // We create a fake "stop" callback for the manager
                audioManager.register({ pause: () => window.speechSynthesis.cancel() } as any, () => {
                    window.speechSynthesis.cancel();
                    setIsPlaying(false);
                    setIsSessionActive(false);
                });
            };

            utterance.onend = () => {
                setIsPlaying(false);
                setIsSessionActive(false);
                setHasPlayedOnce(true);
            };

            utterance.onerror = (e) => {
                console.error("Native TTS Error", e);
                setIsPlaying(false);
                setIsSessionActive(false);
            };

            window.speechSynthesis.speak(utterance);
        } else {
            toast.error("Audio playback failed (No TTS support)");
        }
    };

    const handlePlay = async () => {
        if (!orgId || isLoading) return;

        // ⏯️ TOGGLE LOGIC: Pause / Resume
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioManager.play(audioRef.current, true);
            }
            return;
        }

        // If native is speaking, stop it (Toggle behavior)
        if (window.speechSynthesis.speaking && isPlaying) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
            return;
        }

        // Case 3: No Audio -> Initialize & Fetch
        setIsLoading(true);
        setIsSessionActive(true);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s Timeout (Increased for slower networks)

        try {
            let url = audioCache.get(text);

            if (url) {
                console.log("⚡ Playing from Client Cache (Zero Cost)");
            } else {
                console.log("⬇️ Fetching Audio from Server...");
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

                const response = await fetch(`${API_URL.replace('/v1', '')}/v1/voice/stream`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-org-id': orgId
                    },
                    body: JSON.stringify({
                        text: cleanMarkdown(text),
                        textTokenCount: tokenCount || Math.ceil(text.length / 4)
                    }),
                    signal: controller.signal // Bind Timeout
                });

                clearTimeout(timeoutId);

                if (!response.ok) throw new Error("Voice generation failed");

                const blob = await response.blob();
                url = URL.createObjectURL(blob);
                audioCache.set(text, url);
            }

            if (url) {
                const audio = new Audio(url);
                audioRef.current = audio;

                audioManager.register(audio, () => {
                    audio.pause();
                    setIsPlaying(false);
                    setIsSessionActive(false);
                });

                audio.onplay = () => {
                    setIsPlaying(true);
                    setIsSessionActive(true);
                };
                audio.onpause = () => setIsPlaying(false);
                audio.onended = () => {
                    setIsPlaying(false);
                    setIsSessionActive(false);
                    setHasPlayedOnce(true);
                    audioRef.current = null;
                };

                audioManager.play(audio, true);
            }

        } catch (error: any) {
            console.error("Audio Playback Error/Timeout:", error);
            // 🔥 FALLBACK TRIGGER
            if (error.name === 'AbortError' || error.message) {
                speakNative(text);
            }
        } finally {
            setIsLoading(false);
            clearTimeout(timeoutId);
        }
    };

    // 🎵 Visualizer Bars (Animated only when Playing)
    const AudioVisualizer = () => (
        <div className="flex items-center gap-0.5 h-3 px-1">
            {[1, 2, 3, 4, 5].map((i) => (
                <motion.div
                    key={i}
                    animate={isPlaying ? {
                        height: [4, 18, 2, 16, 4], // Increased intensity
                        opacity: [0.8, 1, 0.6, 1, 0.8] // Higher opacity
                    } : {
                        height: 4,
                        opacity: 0.4
                    }}
                    transition={isPlaying ? {
                        duration: 0.7, // Even faster
                        repeat: Infinity,
                        delay: i * 0.07, // Tighter stagger
                        ease: "linear"
                    } : { duration: 0.1 }}
                    className="w-1 rounded-full bg-current shadow-[0_0_8px_rgba(255,255,255,0.4)]" // Added thickness and subtle glow
                />
            ))}
        </div>
    );

    return (
        <div className="relative">
            <AnimatePresence mode="wait">
                {isSessionActive || isPlaying ? ( // 🌟 Keep Open if Session Active
                    <motion.button
                        key="playing"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        onClick={handlePlay}
                        className={cn(
                            "flex items-center gap-2 pl-2 pr-1 h-7 rounded-full shadow-sm group transition-all",
                            "bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20",
                            className
                        )}
                        style={{ color }}
                    >
                        {/* Animated Waveform */}
                        <AudioVisualizer />

                        {/* Pause/Play or Loader inside Capsule */}
                        <div
                            className="h-5 w-5 rounded-full flex items-center justify-center shadow-sm flex-shrink-0"
                            style={{ backgroundColor: color, color: 'white' }}
                        >
                            {isLoading ? (
                                <Loader2 size={10} className="animate-spin" />
                            ) : isPlaying ? (
                                <Pause size={10} className="fill-current" />
                            ) : (
                                <Play size={10} className="fill-current ml-0.5" />
                            )}
                        </div>
                    </motion.button>
                ) : (
                    <motion.button
                        key="idle"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        onClick={handlePlay}
                        disabled={isLoading}
                        className={cn(
                            "h-7 w-7 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors relative flex-shrink-0",
                            className
                        )}
                        style={{ color }}
                        title={audioCache.has(text) ? "Replay (Cached)" : "Play Audio"}
                    >
                        {isLoading ? (
                            <Loader2 size={13} className="animate-spin" />
                        ) : hasPlayedOnce ? (
                            <div className="relative">
                                <Check size={14} className="text-emerald-500" />
                                <Volume2 size={8} className="absolute -bottom-1 -right-1 opacity-50" />
                            </div>
                        ) : (
                            <>
                                <Volume2 size={14} />
                                {audioCache.has(text) && (
                                    <span
                                        className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full border border-white dark:border-slate-900 shadow-sm"
                                        style={{ backgroundColor: color }}
                                    />
                                )}
                            </>
                        )}
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};
