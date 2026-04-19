"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCw } from '@/components/animate-ui/icons/rotate-cw';
import { Play } from '@/components/animate-ui/icons/play';
import { Pause } from '@/components/animate-ui/icons/pause';
import { RotateCcw } from '@/components/animate-ui/icons/rotate-ccw';
import { BrowserTTS, TTSConfig } from './BrowserTTS';
import { Loader2 } from 'lucide-react';
import { CloudTTS } from './CloudTTS';

interface NeuralVoicePlayerProps {
    text: string;
    gender?: 'male' | 'female';
    accentColor?: string;
    lang?: string;
    preferOnline?: boolean;
    onWordChange?: (wordIndex: number) => void;
    onEnd?: () => void;
}

export const NeuralVoicePlayer: React.FC<NeuralVoicePlayerProps> = ({
    text,
    gender = 'female',
    accentColor = 'emerald',
    lang,
    preferOnline = false,
    onWordChange,
    onEnd
}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isCloudMode, setIsCloudMode] = useState(false);
    const [engineType, setEngineType] = useState<'native' | 'browser-cloud' | 'cloud'>('native');
    const [isCloudLoading, setIsCloudLoading] = useState(false);
    const [buffering, setBuffering] = useState(false);
    const [currentCharIndex, setCurrentCharIndex] = useState(0);
    const skipIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const simIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const charToWordMap = useRef<{ [key: number]: number }>({});
    const lastWordIdx = useRef(-1);

    const onWordChangeRef = useRef(onWordChange);
    useEffect(() => { onWordChangeRef.current = onWordChange; }, [onWordChange]);

    const stopSimHighlighter = () => {
        if (simIntervalRef.current) {
            clearInterval(simIntervalRef.current);
            simIntervalRef.current = null;
        }
    };

    useEffect(() => {
        BrowserTTS.stop();
        stopSimHighlighter();
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
        }
        setIsCloudMode(false);
        setIsCloudLoading(false);
        setBuffering(false);

        const words = text.split(/(\s+)/);
        const map: { [key: number]: number } = {};
        let charCursor = 0;
        let wordCounter = 0;

        for (const w of words) {
            const isWhitespace = /\s+/.test(w);
            const currentWordIdx = isWhitespace ? -1 : wordCounter++;

            for (let i = 0; i < w.length; i++) {
                map[charCursor + i] = currentWordIdx;
            }
            charCursor += w.length;
        }
        charToWordMap.current = map;

        setCurrentCharIndex(0);
        onWordChangeRef.current?.(-1);
        lastWordIdx.current = -1;
    }, [text]);

    const handleBoundary = (charIndex: number) => {
        requestAnimationFrame(() => {
            setCurrentCharIndex(charIndex);
            if (onWordChangeRef.current) {
                const wordIdx = charToWordMap.current[charIndex] ?? -1;
                if (wordIdx !== lastWordIdx.current) {
                    lastWordIdx.current = wordIdx;
                    onWordChangeRef.current(wordIdx);
                }
            }
        });
    };

    const playCloudAudio = async (voiceName: string, startOffset: number = 0) => {
        setIsCloudMode(true);
        setEngineType('cloud');
        setIsCloudLoading(true);

        try {
            const partialText = startOffset > 0 ? text.substring(startOffset) : text;
            const blob = await CloudTTS.synthesize(partialText, voiceName);

            if (audioRef.current) {
                if (audioRef.current.src.startsWith('blob:')) {
                    URL.revokeObjectURL(audioRef.current.src);
                }
                const url = URL.createObjectURL(blob);
                audioRef.current.src = url;
                audioRef.current.play();
                setIsPlaying(true);
                setIsCloudLoading(false);
            }
        } catch (err) {
            console.error("Cloud TTS Direct Synthesis Failed:", err);
            setIsCloudLoading(false);
            setIsPlaying(false);
        }
    };

    const toggleVoice = (offset: number = -1) => {
        if (isPlaying && offset === -1) {
            stopSimHighlighter();
            if (isCloudMode && audioRef.current) {
                audioRef.current.pause();
            } else {
                BrowserTTS.stop();
            }
            setIsPlaying(false);
        } else {
            // 🛑 Stop all other players first
            window.dispatchEvent(new CustomEvent('stop-all-tts'));

            let startOffset = offset === -1 ? currentCharIndex : offset;
            if (startOffset >= text.length - 2) startOffset = 0; // 🛑 Safety reset if at end
            setCurrentCharIndex(startOffset);
            stopSimHighlighter();

            setBuffering(true);
            BrowserTTS.speak(
                text,
                { gender, rate: 1.1, lang, preferOnline },
                () => {
                    setBuffering(false);
                    setIsPlaying(true);
                    setIsCloudMode(false);
                    setEngineType(BrowserTTS.lastUsedEngine);

                    // 🚀 Fallback Highlighter for Cloud Voices (Boundary events are missing often)
                    if (BrowserTTS.lastUsedEngine === 'browser-cloud') {
                        let simIdx = startOffset;
                        simIntervalRef.current = setInterval(() => {
                            simIdx += 12; // Adjusted for 1.1x rate
                            if (simIdx < text.length) handleBoundary(simIdx);
                            else stopSimHighlighter();
                        }, 400);
                    }
                },
                () => {
                    stopSimHighlighter();
                    setBuffering(false);
                    setIsPlaying(false);
                    setCurrentCharIndex(0);
                    lastWordIdx.current = -1;
                    onWordChangeRef.current?.(-1);
                    onEnd?.();
                },
                handleBoundary,
                startOffset,
                (cloudVoice) => playCloudAudio(cloudVoice, startOffset)
            );
        }
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateProgress = () => {
            if (isCloudMode && audio.duration) {
                const pct = audio.currentTime / audio.duration;
                const charIdx = Math.floor(pct * text.length);
                setCurrentCharIndex(charIdx);

                // 🚀 Hilte (Sync Highlight for Cloud)
                const wordIdx = charToWordMap.current[charIdx] ?? -1;
                if (wordIdx !== lastWordIdx.current) {
                    lastWordIdx.current = wordIdx;
                    onWordChangeRef.current?.(wordIdx);
                }
            }
        };

        const handleEnded = () => {
            stopSimHighlighter();
            setBuffering(false);
            setIsPlaying(false);
            setCurrentCharIndex(0);
            lastWordIdx.current = -1;
            onWordChangeRef.current?.(-1);
            onEnd?.();
        };

        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('ended', handleEnded);
        return () => {
            audio.removeEventListener('timeupdate', updateProgress);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [isCloudMode, text.length, onEnd]);

    const handleSkip = (seconds: number, restart: boolean = true) => {
        if (isCloudMode && audioRef.current) {
            audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.duration, audioRef.current.currentTime + seconds));
            return;
        }

        setCurrentCharIndex((prev) => {
            const charDelta = seconds * 18; // 🚀 Improved estimate: ~18 chars per second
            let nextOffset = Math.max(0, Math.min(text.length - 1, prev + charDelta));
            
            // 🧠 Intelligent Word Snapping
            if (seconds > 0) {
                // Skipping Forward: find start of NEXT word
                const nextSpace = text.indexOf(' ', nextOffset);
                if (nextSpace !== -1 && nextSpace - nextOffset < 30) {
                    nextOffset = nextSpace + 1;
                }
            } else {
                // Skipping Backward: find start of CURRENT/PREVIOUS word
                const prevSpace = text.lastIndexOf(' ', nextOffset);
                if (prevSpace !== -1) {
                    nextOffset = prevSpace + 1;
                }
            }

            if (restart) {
                toggleVoice(nextOffset);
            }
            return nextOffset;
        });
    };

    const wasPlayingBeforeSkip = React.useRef(false);

    const startContinuousSkip = (baseSeconds: number) => {
        if (skipIntervalRef.current) return;
        
        // ⏸️ Stop/Pause immediately to prevent jitter
        wasPlayingBeforeSkip.current = isPlaying;
        if (isPlaying) {
            if (isCloudMode) audioRef.current?.pause();
            else BrowserTTS.stop();
            setIsPlaying(false);
        }

        // Initial jump
        handleSkip(baseSeconds, false);

        // Continuous movement (Silent)
        skipIntervalRef.current = setInterval(() => {
            handleSkip(baseSeconds, false);
        }, 150);
    };

    const stopContinuousSkip = () => {
        if (skipIntervalRef.current) {
            clearInterval(skipIntervalRef.current);
            skipIntervalRef.current = null;
            
            // 🔊 Resume only on release
            if (wasPlayingBeforeSkip.current) {
                setCurrentCharIndex(prev => {
                    toggleVoice(prev);
                    return prev;
                });
            }
        }
    };

    const handlersRef = useRef({ toggleVoice, handleSkip });
    handlersRef.current = { toggleVoice, handleSkip };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
            if (e.code === 'Space') { e.preventDefault(); handlersRef.current.toggleVoice(); }
            else if (e.code === 'ArrowRight') { handlersRef.current.handleSkip(5); }
            else if (e.code === 'ArrowLeft') { handlersRef.current.handleSkip(-5); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Logic to handle global stop event (when ANOTHER card starts playing)
    useEffect(() => {
        const handleStopAll = () => {
            if (isPlaying) {
                stopSimHighlighter();
                if (isCloudMode && audioRef.current) {
                    audioRef.current.pause();
                } else {
                    BrowserTTS.stop();
                }
                setIsPlaying(false);
            }
        };
        window.addEventListener('stop-all-tts', handleStopAll);
        return () => window.removeEventListener('stop-all-tts', handleStopAll);
    }, [isPlaying, isCloudMode]);

    // Absolute unmount cleanup only
    useEffect(() => {
        return () => {
            BrowserTTS.stop();
            stopSimHighlighter();
            stopContinuousSkip();
        };
    }, []);

    const progress = (currentCharIndex / Math.max(1, text.length)) * 100;

    return (
        <div className="flex items-center gap-2 rounded-full bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 shadow-sm w-[250px] h-12 group transition-all hover:shadow-md dark:hover:shadow-none">
            <audio ref={audioRef} className="hidden" />

            <div className="flex items-center pl-1">
                <button
                    onMouseDown={() => startContinuousSkip(-5)}
                    onMouseUp={stopContinuousSkip}
                    onMouseLeave={stopContinuousSkip}
                    className="p-2 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" animateOnHover="rotate" animateOnTap="rotate" />
                </button>

                <button
                    onClick={() => toggleVoice()}
                    className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${isPlaying ? 'bg-black dark:bg-white text-white dark:text-black scale-105 shadow-md' : 'bg-neutral-200 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 hover:scale-105'}`}
                >
                    {(isCloudLoading || buffering) ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isPlaying ? (
                        <Pause className="w-3.5 h-3.5" animateOnHover />
                    ) : (
                        <Play className="w-3.5 h-3.5 ml-0.5" animateOnHover="path" animateOnTap="path" />
                    )}
                </button>

                <button
                    onMouseDown={() => startContinuousSkip(5)}
                    onMouseUp={stopContinuousSkip}
                    onMouseLeave={stopContinuousSkip}
                    className="p-2 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                    <RotateCw className="w-3.5 h-3.5" animateOnHover="rotate" animateOnTap="rotate" />
                </button>
            </div>

            <div className="flex-1 pr-1 flex items-center gap-2 group/progress relative">
                <div
                    className="flex-1 overflow-hidden h-1 text-xs flex rounded-full bg-neutral-200 dark:bg-white/10 cursor-pointer relative"
                    onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const pct = (e.clientX - rect.left) / rect.width;
                        const offset = Math.floor(pct * text.length);
                        toggleVoice(offset);
                    }}
                >
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ type: "spring", bounce: 0, duration: 0.2 }}
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-black dark:bg-white relative `}
                    />
                </div>
                <span className={`text-[10px] font-mono font-bold min-w-[28px] ${isCloudMode ? 'text-emerald-500' : 'text-neutral-400'}`}>
                    {Math.round(progress)}%
                </span>
            </div>
        </div>
    );
};
