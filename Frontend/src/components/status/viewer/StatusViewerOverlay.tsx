"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pause, Play, Volume2, VolumeX, MoreVertical, Share2, Download, Trash2, Copy, Music2, Eye } from 'lucide-react';
import { X as AnimatedX } from '@/components/animate-ui/icons/x';
import html2canvas from 'html2canvas';
// react-player removed for Zero Cost Native Audio

import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface StatusItem {
    id: string;
    userName: string;
    userAvatar?: string;
    type: 'text' | 'image';
    content: string;
    styling?: {
        fontFamily?: string;
        backgroundColor?: string;
        textColor?: string;
        filter?: string;
        stickerStyle?: 'pill' | 'card' | 'minimal' | 'hidden';
        stickerPosition?: { x: number, y: number };
        backgroundBlur?: number;
        backgroundOpacity?: number;
        aspectRatio?: number;
    };
    timestamp: string;
    createdAt: Date;
    music?: {    // Updated Music Metadata (iTunes)
        title: string;
        artist: string;
        coverUrl: string;
        previewUrl: string;
        trimStart?: number;
        trimDuration?: number;
    };
    musicVolume?: number;
    views?: number;
}

interface StatusViewerOverlayProps {
    open: boolean;
    onClose: () => void;
    statuses: StatusItem[];
    initialIndex?: number;
    onEdit?: (status: StatusItem) => void;
    onDelete?: (status: StatusItem) => void;
    isWidgetMode?: boolean; // 🟢 New Prop
    onViewStatus?: (id: string) => void; // 🟢 View Tracking
}

export const StatusViewerOverlay: React.FC<StatusViewerOverlayProps> = ({
    open,
    onClose,
    statuses,
    initialIndex = 0,
    onEdit,
    onDelete,
    isWidgetMode = false,
    onViewStatus
}) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    // Sync initialIndex when overlay opens
    useEffect(() => {
        if (open) {
            setCurrentIndex(initialIndex);
            setProgress(0); // Reset progress when opening
        }
    }, [open, initialIndex]);

    // 🔄 Critical: Reset progress when status changes AND Track View
    useEffect(() => {
        setProgress(0);
        // 🟢 Track View
        if (open && statuses[currentIndex]) {
            onViewStatus?.(statuses[currentIndex].id);
        }
    }, [currentIndex, open, statuses, onViewStatus]);
    const [isPaused, setIsPaused] = useState(false);
    const [isMuted, setIsMuted] = useState(false); // Default unmuted, but browser might force mute
    const [progress, setProgress] = useState(0);
    const [showMenu, setShowMenu] = useState(false);

    // 🎵 The Audio Ref for Native Playback
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

    const currentStatus = statuses[currentIndex];

    // Dynamic Duration: If music, use logic based on trim (default 15s), else 12s
    const musicDuration = (currentStatus?.music?.trimDuration || 15) * 1000;
    const DURATION = currentStatus?.music ? musicDuration : 12000;

    // Calculate remaining seconds
    const remainingSeconds = Math.ceil((DURATION * (1 - progress / 100)) / 1000);
    const formatTime = (seconds: number) => `00:${seconds.toString().padStart(2, '0')}`;

    const handleShare = async () => {
        if (!currentStatus) return;
        const link = `https://cluaiz.com/${(currentStatus.userName || 'user').replace(/\s+/g, '').toLowerCase()}/status/${currentStatus.id}`;
        try {
            await navigator.clipboard.writeText(link);
            alert('Link copied to clipboard! 🔗');
        } catch (err) {
            console.error('Failed to copy link:', err);
        }
        setShowMenu(false);
    };



    // ... inside component ...
    const statusContentRef = React.useRef<HTMLDivElement>(null);

    const handleSave = async () => {
        if (!currentStatus) return;

        if (currentStatus.type === 'image') {
            try {
                // Direct Download for baked images
                const response = await fetch(currentStatus.content);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `cluaiz-status-${currentStatus.id}.jpg`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            } catch (err) {
                console.error('Download failed:', err);
                window.open(currentStatus.content, '_blank');
            }
        } else {
            // Convert Text Status to Image using html2canvas (WYSIWYG)
            if (!statusContentRef.current) return;

            try {
                // Temporarily remove transform/scale to capture cleanly or capture as seen
                const canvas = await html2canvas(statusContentRef.current, {
                    useCORS: true,
                    backgroundColor: currentStatus.styling?.backgroundColor || '#000000',
                    scale: 2, // High resolution
                } as any);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
                const a = document.createElement('a');
                a.href = dataUrl;
                a.download = `cluaiz-text-status-${currentStatus.id}.jpg`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } catch (err) {
                console.error('Text to Image failed:', err);
                // Fallback to copy
                await navigator.clipboard.writeText(currentStatus.content.replace(/<[^>]*>/g, ''));
                alert('Could not generate image. Text copied to clipboard instead! 📋');
            }
        }
        setShowMenu(false);
    };

    // Auto-advance timer
    useEffect(() => {
        if (!open || isPaused || !currentStatus) return;

        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    return 100;
                }
                return prev + (100 / (DURATION / 100));
            });
        }, 100);

        return () => clearInterval(interval);
    }, [open, isPaused, currentIndex, statuses.length, currentStatus]);

    // Handle progress completion side effect
    useEffect(() => {
        if (progress >= 100) {
            if (currentIndex < statuses.length - 1) {
                setCurrentIndex(currentIndex + 1);
                setProgress(0);
            } else {
                onClose();
            }
        }
    }, [progress, currentIndex, statuses.length, onClose]);

    // Reset progress when index changes
    useEffect(() => {
        setProgress(0);
    }, [currentIndex]);

    // Keyboard navigation
    useEffect(() => {
        if (!open) return;

        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') handlePrevious();
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'Escape') onClose();
            if (e.key === ' ') setIsPaused(p => !p);
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [open, currentIndex]);

    // 🎵 Audio Playback Logic (Ad-Free & Native) with TRIM support
    useEffect(() => {
        // 1. If status has music and is open/active
        if (open && currentStatus?.music?.previewUrl && !isPaused) {

            // Stop previous audio
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }

            // 2. Create new Audio Object
            const audio = new Audio(currentStatus.music.previewUrl);
            audioRef.current = audio;

            const vol = currentStatus.musicVolume ?? 1.0;
            audio.volume = isMuted ? 0 : vol;
            // Loop is manual for trim support
            audio.loop = false;

            const startTime = currentStatus.music.trimStart || 0;
            const duration = currentStatus.music.trimDuration || 15;
            const endTime = startTime + duration;

            audio.currentTime = startTime;

            // 3. Play with Promise handling and Autoplay Fallback
            const playPromise = audio.play();

            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log("Auto-play blocked, retrying muted", error);
                    // If blocked, try playing muted (which browsers allow)
                    if (!isMuted) {
                        setIsMuted(true);
                        audio.muted = true;
                        audio.play().catch(e => console.error("Even muted play failed", e));
                    }
                });
            }

            // 4. Manual Loop Logic
            const checkLoop = () => {
                if (!audioRef.current) return;
                if (audioRef.current.currentTime >= endTime || audioRef.current.ended) {
                    audioRef.current.currentTime = startTime;
                    audioRef.current.play().catch(() => { });
                }
                requestAnimationFrame(checkLoop);
            };
            const rafId = requestAnimationFrame(checkLoop);

            return () => cancelAnimationFrame(rafId);

        } else {
            // Pause if overlay closed or paused
            if (audioRef.current) {
                audioRef.current.pause();
            }
        }

        // 🧹 Cleanup
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [open, currentStatus, isPaused, isMuted]);

    // Handle Mute Toggle Effect
    useEffect(() => {
        if (audioRef.current) {
            const vol = currentStatus?.musicVolume ?? 1.0;
            audioRef.current.volume = isMuted ? 0 : vol;
        }
    }, [isMuted, currentStatus]);

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < statuses.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            onClose();
        }
    };

    if (!open || !currentStatus) return null;

    return (
        <motion.div
            className="fixed inset-0 z-[9999] bg-black flex flex-col cursor-default select-none" // 🔒 Select None
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation(); // 🛡️ Stop Bubbling to ChatWindow
                e.nativeEvent.stopImmediatePropagation(); // 🛑 Kill everything effectively
            }} // 🚫 Disable Right Click
        >
            {/* Progress Bars (Top Layer) */}
            <div className="relative z-[100] flex gap-1 p-4">
                {statuses.map((_, idx) => (
                    <div
                        key={idx}
                        className="flex-1 h-0.5 bg-white/20 rounded-full overflow-hidden"
                    >
                        <motion.div
                            className="h-full bg-white"
                            initial={{ width: '0%' }}
                            animate={{
                                width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%'
                            }}
                            transition={{ duration: 0.1 }}
                        />
                    </div>
                ))}
            </div>

            {/* Header (Top Layer) */}
            <div className="relative z-[100] flex items-center justify-end px-4 py-2">

                <div className="flex items-center gap-2">
                    {/* View Count (Hidden in Widget Mode) */}
                    {!isWidgetMode && (
                        <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 mr-2">
                            <Eye size={14} className="text-emerald-400" />
                            <span className="text-white font-black text-[10px] tracking-widest uppercase">{(currentStatus as any).views || 0}</span>
                        </div>
                    )}

                    {/* Countdown Timer */}
                    <span className="text-white/80 font-mono text-xs font-bold bg-white/10 px-2 py-1 rounded-md min-w-[45px] text-center">
                        {formatTime(remainingSeconds)}
                    </span>

                    <button
                        onClick={() => setIsPaused(!isPaused)}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    >
                        {isPaused ? <Play size={18} className="text-white" /> : <Pause size={18} className="text-white" />}
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    >
                        {isMuted ? <VolumeX size={18} className="text-white" /> : <Volume2 size={18} className="text-white" />}
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md"
                        >
                            <MoreVertical size={18} className="text-white" />
                        </button>

                        <AnimatePresence>
                            {showMenu && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                    className="absolute right-0 top-12 min-w-[180px] bg-[#0b141a]/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 py-1"
                                >
                                    <button
                                        onClick={handleShare}
                                        className="w-full px-4 py-3 text-left text-xs font-bold text-white hover:bg-white/10 transition-colors flex items-center gap-3 uppercase tracking-wider"
                                    >
                                        <Share2 size={14} className="text-emerald-400" />
                                        Share
                                    </button>

                                    <button
                                        onClick={handleSave}
                                        className="w-full px-4 py-3 text-left text-xs font-bold text-white hover:bg-white/10 transition-colors flex items-center gap-3 uppercase tracking-wider"
                                    >
                                        {currentStatus.type === 'image' ? (
                                            <>
                                                <Download size={14} className="text-sky-400" />
                                                Save Image
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={14} className="text-sky-400" />
                                                Copy Text
                                            </>
                                        )}
                                    </button>

                                    {onDelete && (
                                        <>
                                            <div className="h-px bg-white/10 mx-2 my-1" />
                                            <button
                                                onClick={() => {
                                                    onDelete(currentStatus);
                                                    setShowMenu(false);
                                                }}
                                                className="w-full px-4 py-3 text-left text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-3 uppercase tracking-wider"
                                            >
                                                <Trash2 size={14} />
                                                Delete
                                            </button>
                                        </>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <AnimatedX size={18} className="text-white" animateOnHover />
                    </button>
                </div>
            </div>

            {/* Content Area with Tap Navigation */}
            <div className="flex-1 flex items-center justify-center relative px-0 sm:px-8">

                {/* Tap Targets */}
                <div
                    className="absolute inset-y-0 left-0 w-[30%] z-20 cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
                />
                <div
                    className="absolute inset-y-0 right-0 w-[70%] z-20 cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                />

                {/* Left Navigation Zone (Visual only on desktop hover, or minimal) */}
                <button
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    className={cn(
                        "hidden sm:block absolute left-8 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-30",
                        currentIndex === 0 && "opacity-0 pointer-events-none"
                    )}
                >
                    <ChevronLeft size={32} className="text-white" />
                </button>

                {/* Status Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStatus.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                        className={cn(
                            "relative -mt-14 bg-black rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 mx-auto transition-all duration-700 ease-in-out",
                            (currentStatus.styling?.aspectRatio || (currentStatus as any).aspectRatio || 0) > 1 ? "aspect-[16/9] w-full sm:w-[95%] max-w-5xl" : "h-[90vh] w-auto aspect-[9/16]"
                        )}
                        style={{
                            aspectRatio: currentStatus.styling?.aspectRatio ? `${currentStatus.styling.aspectRatio}` : '9/16'
                        }}
                    >
                        {/* Blur Background for Fit Mode (Both Image and Text) */}
                        <div
                            className="absolute inset-0 opacity-50 blur-xl scale-110 z-0"
                            style={{
                                backgroundImage: currentStatus.type === 'image' ? `url(${currentStatus.content})` : undefined,
                                backgroundColor: currentStatus.type === 'text' ? currentStatus.styling?.backgroundColor : undefined,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                filter: currentStatus.type === 'image' ? currentStatus.styling?.filter : undefined
                            }}
                        />

                        {currentStatus.type === 'image' ? (
                            <img
                                src={currentStatus.content}
                                alt="Status"
                                className="w-full h-full object-contain relative z-10"
                                style={{
                                    // filter: currentStatus.styling?.filter
                                }}
                            />
                        ) : (
                            <div
                                ref={statusContentRef}
                                className="w-full h-full p-8 flex items-center justify-center relative z-10 text-center break-words"
                                style={{
                                    backgroundColor: currentStatus.styling?.backgroundColor || '#000000',
                                    color: currentStatus.styling?.textColor || '#ffffff',
                                    fontFamily: currentStatus.styling?.fontFamily || 'Inter'
                                }}
                            >
                                <div
                                    className={cn(
                                        "font-bold leading-normal whitespace-pre-wrap break-words drop-shadow-lg",
                                        currentStatus.content.replace(/<[^>]*>/g, '').length < 50 ? "text-3xl" : "text-xl"
                                    )}
                                    dangerouslySetInnerHTML={{ __html: currentStatus.content }}
                                />
                            </div>
                        )}
                        {/* 🎵 Dynamic Music Sticker (Moved inside frame for correct local positioning) */}
                        {currentStatus?.music && currentStatus.styling?.stickerStyle !== 'hidden' && (
                            <div
                                className={cn(
                                    "absolute z-50 animate-in zoom-in-50 duration-500 origin-center",
                                    // If we don't have a position, fallback to center
                                    !currentStatus.styling?.stickerPosition && "top-24 left-1/2 -translate-x-1/2"
                                )}
                                style={currentStatus.styling?.stickerPosition ? {
                                    top: `${currentStatus.styling.stickerPosition.y}%`,
                                    left: `${currentStatus.styling.stickerPosition.x}%`,
                                    transform: 'translate(-50%, -50%)',
                                } : undefined}
                            >
                                {/* PILL STYLE */}
                                {(!currentStatus.styling?.stickerStyle || currentStatus.styling.stickerStyle === 'pill') && (
                                    <div className="flex items-center gap-3 bg-black/60 backdrop-blur-xl border border-white/10 pr-4 rounded-full overflow-hidden shadow-2xl">
                                        <div className="w-10 h-10 rounded-full animate-[spin_5s_linear_infinite] overflow-hidden border-2 border-zinc-900">
                                            <img src={currentStatus.music.coverUrl} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[10px] font-black text-white truncate max-w-[120px]">{currentStatus.music.title}</span>
                                            <span className="text-[8px] font-bold text-zinc-400 truncate max-w-[100px]">{currentStatus.music.artist}</span>
                                        </div>
                                        <div className="flex gap-0.5 items-end h-4 ml-2">
                                            <div className="w-0.5 bg-white h-full animate-music-bar-1" />
                                            <div className="w-0.5 bg-white h-2/3 animate-music-bar-2" />
                                            <div className="w-0.5 bg-white h-1/2 animate-music-bar-3" />
                                        </div>
                                    </div>
                                )}

                                {/* CARD STYLE */}
                                {currentStatus.styling?.stickerStyle === 'card' && (
                                    <div className="flex flex-col items-center bg-white/10 backdrop-blur-2xl border border-white/20 p-4 rounded-3xl shadow-2xl w-48 overflow-hidden">
                                        <img src={currentStatus.music.coverUrl} className="w-40 h-40 rounded-2xl shadow-lg mb-3 object-cover" />
                                        <div className="text-center w-full px-4 min-w-0">
                                            <h3 className="text-white text-sm font-black truncate">{currentStatus.music.title}</h3>
                                            <p className="text-emerald-400 text-[10px] font-bold truncate leading-tight">{currentStatus.music.artist}</p>
                                        </div>
                                    </div>
                                )}

                                {currentStatus.styling?.stickerStyle === 'minimal' && (
                                    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5">
                                        <Music2 size={12} className="text-emerald-400" />
                                        <span className="text-[10px] font-bold text-white shadow-sm max-w-[150px] truncate">
                                            {currentStatus.music.title} • {currentStatus.music.artist}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Right Navigation Zone */}
                <button
                    onClick={handleNext}
                    disabled={currentIndex === statuses.length - 1}
                    className={cn(
                        "hidden sm:block absolute right-8 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-30",
                        currentIndex === statuses.length - 1 && "opacity-50"
                    )}
                >
                    <ChevronRight size={32} className="text-white" />
                </button>
            </div>

            {/* Remaining space cleaned up (sticker moved) */}
        </motion.div>
    );
};
