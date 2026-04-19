"use client";

import React, { useState, useRef } from 'react';
import { Search, Play, Pause, Music2, X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface MusicTrack {
    id: number;
    title: string;
    artist: string;
    coverUrl: string; // Thumbnail
    previewUrl: string; // 30 sec audio
    trimStart?: number;
    trimDuration?: number;
}

interface MusicSelectorProps {
    onSelect: (track: MusicTrack | null) => void;
    onClose: () => void;
}

export const MusicSelector: React.FC<MusicSelectorProps> = ({ onSelect, onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<MusicTrack[]>([]);
    const [loading, setLoading] = useState(false);
    const [playingTrack, setPlayingTrack] = useState<number | null>(null);
    const [selectedTrack, setSelectedTrack] = useState<MusicTrack | null>(null);
    const [step, setStep] = useState<'search' | 'trim'>('search');
    const [trimStart, setTrimStart] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // 🔍 Search Logic
    const handleSearch = async (term: string) => {
        setQuery(term);
        if (term.length < 2) return;
        setLoading(true);
        try {
            const response = await fetch(`https://itunes.apple.com/search?term=${term}&media=music&entity=song&limit=15`);
            const data = await response.json();
            const tracks = data.results.map((item: any) => ({
                id: item.trackId,
                title: item.trackName,
                artist: item.artistName,
                coverUrl: item.artworkUrl100.replace('100x100', '300x300'),
                previewUrl: item.previewUrl
            }));
            setResults(tracks);
        } catch (error) { console.error("Search failed", error); }
        finally { setLoading(false); }
    };

    // 🎵 Preview Logic in Search
    const handlePreview = (track: MusicTrack) => {
        if (playingTrack === track.id) {
            audioRef.current?.pause();
            setPlayingTrack(null);
        } else {
            if (audioRef.current) audioRef.current.pause();
            audioRef.current = new Audio(track.previewUrl);
            audioRef.current.volume = 0.5;
            audioRef.current.play();
            setPlayingTrack(track.id);
            audioRef.current.onended = () => setPlayingTrack(null);
        }
    };

    const [playHead, setPlayHead] = useState(0);

    // ✂️ Switch to Trim Mode
    const initTrim = (track: MusicTrack) => {
        if (audioRef.current) audioRef.current.pause();
        setPlayingTrack(null);
        setSelectedTrack(track);
        setStep('trim');
        setTrimStart(0);
        // Start looping trim preview immediately
        playTrimPreview(track, 0);
    };

    const rafRef = useRef<number | null>(null);

    const playTrimPreview = (track: MusicTrack, startTime: number) => {
        // Cancel existing loop
        if (rafRef.current) cancelAnimationFrame(rafRef.current);

        if (!audioRef.current) {
            audioRef.current = new Audio(track.previewUrl);
            audioRef.current.volume = 0.8;
        } else if (audioRef.current.src !== track.previewUrl) {
            audioRef.current.pause();
            audioRef.current = new Audio(track.previewUrl);
            audioRef.current.volume = 0.8;
        }

        // Only update current time if it's a significant change to avoid stutter
        if (Math.abs(audioRef.current.currentTime - startTime) > 0.5 || audioRef.current.paused) {
            audioRef.current.currentTime = startTime;
        }

        if (audioRef.current.paused) {
            audioRef.current.play().catch(e => console.error("Audio Play Error", e));
        }

        // Loop 15s segment
        const checkTime = () => {
            if (!audioRef.current) return;

            // Update Playhead for visual
            setPlayHead(((audioRef.current.currentTime - startTime) / 15) * 100);

            if (audioRef.current.currentTime >= startTime + 15 || audioRef.current.ended) {
                audioRef.current.currentTime = startTime;
                audioRef.current.play().catch(() => { });
            }
            rafRef.current = requestAnimationFrame(checkTime);
        };
        rafRef.current = requestAnimationFrame(checkTime);
    };

    const handleRemoveMusic = () => {
        if (audioRef.current) audioRef.current.pause();
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        onSelect(null);
        onClose();
    };

    const confirmSelection = () => {
        if (!selectedTrack) return;
        if (audioRef.current) audioRef.current.pause();
        // Pass trim metadata
        onSelect({
            ...selectedTrack,
            trimStart: trimStart,
            trimDuration: 15
        });
        onClose();
    };

    return (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[450px] bg-[#0b141a]/95 backdrop-blur-3xl border border-white/10 rounded-t-[1.8rem] shadow-2xl z-50 flex flex-col h-[70vh] animate-in slide-in-from-bottom-10 duration-400 overflow-hidden">

            {step === 'search' ? (
                <>
                    {/* Header */}
                    <div className="p-4 pb-2 sm:p-6 sm:pb-2">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-black text-base sm:text-lg flex items-center gap-2">
                                <span className="bg-emerald-500/20 p-1.5 rounded-full text-emerald-500"><Music2 size={16} /></span>
                                Music Library
                            </h3>
                            <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
                                <X size={16} className="text-white/70" />
                            </button>
                        </div>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 z-10 transition-colors group-focus-within:text-emerald-500" size={15} />
                            <Input
                                placeholder="Search songs..."
                                value={query}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="bg-zinc-900/80 border-white/5 rounded-2xl pl-11 py-5 text-xs text-white focus:border-emerald-500/50 relative z-0"
                                autoFocus
                            />
                        </div>
                    </div>

                    <ScrollArea className="flex-1 px-4 pb-6">
                        {loading && (
                            <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-50">
                                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                <span className="text-zinc-500 text-[10px] uppercase tracking-widest font-black">Searching...</span>
                            </div>
                        )}

                        <div className="space-y-1">
                            {results.map((track) => (
                                <div
                                    key={track.id}
                                    className="flex items-center gap-4 p-2.5 rounded-xl hover:bg-white/5 group transition-all cursor-pointer"
                                    onClick={() => initTrim(track)}
                                >
                                    <div className="relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-800 shadow-lg">
                                        <img src={track.coverUrl} className="w-full h-full object-cover" />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handlePreview(track); }}
                                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            {playingTrack === track.id ? <Pause size={14} className="fill-white text-white" /> : <Play size={14} className="fill-white text-white" />}
                                        </button>
                                    </div>

                                    <div className="flex-1 min-w-0 px-2 max-w-[220px]">
                                        <h4 className="text-white text-[13px] font-bold truncate leading-tight group-hover:text-emerald-400 transition-all uppercase tracking-tight">
                                            {track.title}
                                        </h4>
                                        <p className="text-zinc-500 text-[10px] truncate mt-0.5 tracking-tight group-hover:text-zinc-400 transition-colors">
                                            {track.artist}
                                        </p>
                                    </div>

                                    <div className="flex-shrink-0 ml-auto p-1.5">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); initTrim(track); }}
                                            className="px-3 py-1.5 rounded-xl bg-emerald-500 text-black flex items-center gap-2 hover:bg-emerald-400 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 border border-white/10"
                                        >
                                            <Plus size={12} className="stroke-[3]" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </>
            ) : (
                /* ✂️ TRIMMER UI */
                <div className="flex flex-col h-full p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setStep('search')} className="p-2 bg-white/5 rounded-full"><ChevronLeft size={18} className="text-white" /></button>
                            <h3 className="text-white font-bold text-sm">Trim Audio (15s)</h3>
                        </div>
                        <button onClick={handleRemoveMusic} className="text-xs font-bold text-red-500 hover:text-red-400 bg-red-500/10 px-3 py-1.5 rounded-full transition-colors">
                            Remove
                        </button>
                    </div>

                    <div className="flex items-center gap-4 mb-8">
                        <img src={selectedTrack?.coverUrl} className="w-20 h-20 rounded-xl shadow-lg border border-white/10" />
                        <div>
                            <h2 className="text-white font-black text-xl leading-tight line-clamp-2">{selectedTrack?.title}</h2>
                            <p className="text-emerald-400 text-xs font-bold">{selectedTrack?.artist}</p>
                        </div>
                    </div>

                    {/* WAVEFORM & SELECTION VISUALIZER */}
                    <div className="relative w-full h-24 bg-zinc-900/50 rounded-2xl mb-6 overflow-hidden border border-white/5 mx-2">
                        {/* Fake Waveform Lines */}
                        <div className="absolute inset-0 flex items-center justify-between px-2 opacity-30">
                            {[...Array(50)].map((_, i) => (
                                <div key={i} className="w-1 bg-white rounded-full" style={{ height: `${20 + Math.random() * 60}%` }} />
                            ))}
                        </div>

                        {/* Selected Window Highlight */}
                        <div
                            className="absolute top-0 bottom-0 bg-emerald-500/20 border-x-2 border-emerald-500 transition-all duration-100 ease-out"
                            style={{
                                left: `${(trimStart / 30) * 100}%`, // 30s is total duration
                                width: '50%' // 15s is 50% of 30s
                            }}
                        >
                            {/* Playhead inside selection */}
                            <div
                                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_white] transition-none"
                                style={{ left: `${Math.min(playHead, 100)}%` }}
                            />
                        </div>
                    </div>

                    {/* TRIM SLIDER CONTROLS */}
                    <div className="space-y-4 mb-auto px-2">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-zinc-500">
                            <button onClick={() => { setTrimStart(0); playTrimPreview(selectedTrack!, 0); }} className="hover:text-white transition-colors">Start (0s)</button>
                            <button onClick={() => { setTrimStart(15); playTrimPreview(selectedTrack!, 15); }} className="hover:text-white transition-colors">End (15s)</button>
                        </div>

                        <input
                            type="range"
                            min="0"
                            max="15"
                            step="0.1"
                            value={trimStart}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setTrimStart(val);
                                if (selectedTrack) playTrimPreview(selectedTrack, val);
                            }}
                            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />

                        <div className="text-center text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 py-2 rounded-lg border border-emerald-500/20">
                            Selected: {Math.floor(trimStart)}s - {Math.floor(trimStart + 15)}s
                        </div>
                    </div>

                    <Button onClick={confirmSelection} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-6 text-sm rounded-xl">
                        Done
                    </Button>
                </div>
            )}
        </div>
    );
};

// Add ChevronLeft Icon needed for back button
import { ChevronLeft } from 'lucide-react';
