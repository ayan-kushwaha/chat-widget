"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function AgentAudioIntro() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const formatTime = (time: number) => {
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="w-full max-w-sm md:max-w-md lg:w-full lg:max-w-none mx-auto lg:mx-0 mt-6 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
            <audio
                ref={audioRef}
                src="/assets/aiemp/सॉफ्टवेयर_की_जगह_अब_20_AI_कर्मचारी.m4a"
            />

            <div className="flex items-center gap-6">
                {/* Play Button */}
                <button
                    onClick={togglePlay}
                    className="w-14 h-14 flex items-center justify-center bg-white text-black rounded-full hover:scale-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] flex-shrink-0"
                >
                    {isPlaying ? <Pause size={24} fill="black" /> : <Play size={24} className="ml-1" fill="black" />}
                </button>

                {/* Info & Controls */}
                <div className="flex-1">
                    <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                                <Music size={10} /> Introduction
                            </p>
                        </div>
                        <div className="bg-white/5 px-1 rounded-md border border-white/5">
                            <p className="text-[11px] font-mono text-zinc-400">
                                {formatTime(currentTime)} <span className="text-zinc-600">/</span> {formatTime(duration)}
                            </p>
                        </div>
                    </div>

                    {/* Waveform Visualization (Dynamic during play) */}
                    <div className="h-6 flex items-center gap-[2px] opacity-40">
                        {[...Array(40)].map((_, i) => (
                            <motion.div
                                key={i}
                                animate={{
                                    height: isPlaying ? [4, 12, 6, 20, 8, 4][i % 6] : 4,
                                    opacity: isPlaying ? [0.3, 1, 0.5][i % 3] : 0.3
                                }}
                                transition={{
                                    duration: 0.6,
                                    repeat: Infinity,
                                    delay: i * 0.02
                                }}
                                className="w-[1.5px] bg-emerald-500 rounded-full"
                            />
                        ))}
                    </div>

                    {/* Interactive Scrubber */}
                    <div className="relative group">
                        <input
                            type="range"
                            min="0"
                            max={duration || 100}
                            value={currentTime}
                            onChange={handleSeek}
                            className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-white hover:accent-emerald-400 transition-all outline-none"
                            style={{
                                background: `linear-gradient(to right, #10b981 ${(currentTime / (duration || 100)) * 100}%, rgba(255,255,255,0.1) 0%)`
                            }}
                        />
                    </div>
                </div>
            </div>

            <style jsx>{`
                input[type='range']::-webkit-slider-thumb {
                    appearance: none;
                    width: 0;
                    height: 0;
                    border-radius: 50%;
                    background: white;
                    box-shadow: 0 0 10px rgba(255,255,255,0.5);
                    transition: all 0.2s;
                }
                .group:hover input[type='range']::-webkit-slider-thumb {
                    width: 12px;
                    height: 12px;
                }
            `}</style>
        </div>
    );
}
