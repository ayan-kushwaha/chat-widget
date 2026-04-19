"use client";

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { Search, Play, Pause, Music2, X, ChevronLeft, ChevronRight, Plus, Check, Loader2, Volume2, VolumeX, ArrowRight, Type, Image as ImageIcon, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { PhotoEditor } from './PhotoEditor';
import { TextEditor } from './TextEditor';
import { MusicSelector, MusicTrack } from './MusicSelector'; // Import MusicSelector & Type
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // Import Tooltip

interface StatusCreatorOverlayProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: StatusData) => void;
    editMode?: boolean;
    existingData?: Partial<StatusData>;
}

export interface TextLayer {
    id: string;
    content: string;
    x: number;
    y: number;
    color: string;
    font: string;
    size: number;
    align: 'left' | 'center' | 'right';
    bg: boolean;
    bgColor?: string;
    fullWidth: boolean;
    rotation?: number;
    width?: number;
    height?: number;
    opacity?: number;
    blur?: number;
    radius?: number;
}

export interface StatusData {
    type: 'text' | 'image';
    content: string;
    styling?: {
        fontFamily?: string;
        backgroundColor?: string;
        textColor?: string;
        filter?: string;
        layers?: TextLayer[];
        stickerStyle?: 'pill' | 'card' | 'minimal' | 'hidden';
        stickerPosition?: { x: number, y: number };
        backgroundBlur?: number;
        backgroundOpacity?: number;
        aspectRatio?: number;
    };
    startTime: Date;
    endTime: Date;
    privacy: 'all' | 'contacts' | 'new' | 'unknown';
    link?: string;
    music?: MusicTrack; // Updated to use MusicTrack
    musicVolume?: number;
}

export const StatusCreatorOverlay: React.FC<StatusCreatorOverlayProps> = ({
    open,
    onClose,
    onSubmit,
    editMode = false,
    existingData
}) => {
    const [step, setStep] = useState<'create' | 'settings'>('create');
    const [statusType, setStatusType] = useState<'text' | 'image'>(existingData?.type || 'text');
    const previewContainerRef = useRef<HTMLDivElement>(null);

    // Content state
    const [textContent, setTextContent] = useState(existingData?.content || '');
    const [imageContent, setImageContent] = useState(existingData?.content || '');

    // Music State
    const [showMusicSelector, setShowMusicSelector] = useState(false);
    const [music, setMusic] = useState<MusicTrack | null>(null);
    const [musicVolume, setMusicVolume] = useState(1);
    const [stickerStyle, setStickerStyle] = useState<'pill' | 'card' | 'minimal' | 'hidden'>((existingData?.styling?.stickerStyle as any) || 'pill');
    const [stickerPosition, setStickerPosition] = useState(existingData?.styling?.stickerPosition || { x: 50, y: 50 });
    const [isPaused, setIsPaused] = useState(false); // New state for click-to-pause
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioPromiseRef = useRef<Promise<void> | null>(null); // To track play() promise
    const dragX = useMotionValue(0);
    const dragY = useMotionValue(0);
    const parentRef = useRef<HTMLDivElement>(null); // For drag constraints

    // Separate Layer State for distinct modes
    const [imageLayers, setImageLayers] = useState<TextLayer[]>(existingData?.styling?.layers || []);
    const [textLayers, setTextLayers] = useState<TextLayer[]>([]);

    // Joint Active Layer State (Reset when switching tabs ideally, but okay to share)
    const [activeLayerId, setActiveLayerId] = useState<string | null>(null);

    // Styling state
    const [fontFamily, setFontFamily] = useState(existingData?.styling?.fontFamily || 'Inter');
    const [bgColor, setBgColor] = useState(existingData?.styling?.backgroundColor || '#6366f1');
    const [textColor, setTextColor] = useState(existingData?.styling?.textColor || '#ffffff');
    const [filter, setFilter] = useState(existingData?.styling?.filter || 'none');
    const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
    const [textBg, setTextBg] = useState(false);
    const [textSize, setTextSize] = useState(1);
    const [textFullWidth, setTextFullWidth] = useState(false);
    const [bgBlur, setBgBlur] = useState(existingData?.styling?.backgroundBlur ?? 20);
    const [bgOpacity, setBgOpacity] = useState(existingData?.styling?.backgroundOpacity ?? 50);

    // Settings state
    const [startTime, setStartTime] = useState<Date>(existingData?.startTime || new Date());
    const [endTime, setEndTime] = useState<Date>(existingData?.endTime || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    const [link, setLink] = useState(existingData?.link || '');
    const [privacy, setPrivacy] = useState<'all' | 'contacts' | 'new' | 'unknown'>(
        (existingData?.privacy as any) || 'all'
    );
    const [aspect, setAspect] = useState<number | undefined>(9 / 16);

    const handleNext = () => {
        if (step === 'create') {
            setStep('settings');
        }
    };

    const handleBack = () => {
        if (step === 'settings') {
            setStep('create');
        } else {
            onClose();
        }
    };

    // 🎵 Effect 1: Instantiate Audio Object when music changes
    React.useEffect(() => {
        if (!music || !music.previewUrl) {
            audioRef.current = null;
            return;
        }

        const audio = new Audio(music.previewUrl);
        audio.loop = false; // We handle looping manually for precise trim
        audioRef.current = audio;

        // Cleanup: Pause when music changes or component unmounts
        return () => {
            audio.pause();
            audioRef.current = null;
        };
    }, [music]);

    // 🎵 Effect 2: Manage Playback (Play/Pause/Loop) based on state
    React.useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !music) return;

        // If closed or paused, pause audio
        if (!open || isPaused) {
            audio.pause();
            return;
        }

        // Setup Loop Points
        const loopStart = music.trimStart || 0;
        const duration = music.trimDuration || 15; // default 15s
        const loopEnd = loopStart + duration;

        // Ensure we are at start if not already (first play)
        if (audio.currentTime < loopStart || audio.currentTime > loopEnd) {
            audio.currentTime = loopStart;
        }

        audio.volume = musicVolume;

        // Play Logic with Safety
        const playAudio = async () => {
            if (!audio || !audio.paused) return;
            try {
                // If there's an existing promise, wait for it or ignore
                if (audioPromiseRef.current) {
                    try { await audioPromiseRef.current; } catch (e) { }
                }

                const p = audio.play();
                if (p !== undefined) {
                    audioPromiseRef.current = p;
                    await p;
                    audioPromiseRef.current = null;
                }
            } catch (err: any) {
                audioPromiseRef.current = null;
                // Ignore AbortError - it's harmless
            }
        };

        playAudio();

        // Loop Monitor
        let rafId: number;
        const checkLoop = () => {
            if (!audioRef.current || isPaused || !open) return;

            if (audio.currentTime >= loopEnd || audio.ended) {
                audio.currentTime = loopStart;
                const p = audio.play();
                if (p) p.catch(() => { });
            }
            rafId = requestAnimationFrame(checkLoop);
        };

        rafId = requestAnimationFrame(checkLoop);

        return () => {
            cancelAnimationFrame(rafId);
        };
    }, [open, isPaused, music, musicVolume]);

    // --- Added: Layer Preview Component for WYSIWYG ---
    const PreviewLayer = ({ layer, containerW, containerH }: { layer: TextLayer, containerW: number, containerH: number }) => {
        const content = layer.content.replace(/<[^>]*>/g, ' ').trim();
        if (!content) return null;

        // Scale factor relative to a standard 400px wide reference (or whatever was used during edit)
        // Since we use Moveable with pixels, we need to know the editor width.
        // PhotoEditor flex-1 usually results in ~400-500px width on desktop.
        // A better way is to pass the editor width down, but for now we'll assume a standard 400px baseline
        // and scale it based on the CURRENT container width.

        // Actually, the layers were created relative to some container. 
        // Let's assume the preview container dimension is the reference if we recorded it, 
        // or just use 400 as a safe default.
        const scale = containerW / 400; // Baseline 400px

        return (
            <div
                className="absolute z-30 pointer-events-none"
                style={{
                    transform: `translate(${(layer.x / 400) * containerW}px, ${(layer.y / 711) * containerH}px) rotate(${layer.rotation || 0}deg)`,
                    width: layer.width ? `${(layer.width / 400) * containerW}px` : 'auto',
                    left: 0,
                    top: 0,
                    opacity: layer.opacity ?? 1
                }}
            >
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundColor: layer.bg ? (layer.bgColor || (layer.color === '#ffffff' ? '#000000' : '#ffffff')) : 'transparent',
                        filter: layer.blur ? `blur(${layer.blur * scale}px)` : 'none',
                        borderRadius: `${(layer.radius ?? 8) * scale}px`,
                        transform: 'scale(1.05)',
                        zIndex: -1
                    }}
                />
                <div
                    className={cn(
                        "font-black drop-shadow-2xl break-words outline-none min-w-[50px] whitespace-pre-wrap relative z-10",
                        layer.align === 'left' ? 'text-left' : layer.align === 'right' ? 'text-right' : 'text-center'
                    )}
                    style={{
                        fontFamily: layer.font,
                        color: layer.color,
                        fontSize: `${(layer.size * 32) * scale}px`,
                        lineHeight: 1.2,
                        padding: '0.5em 1em',
                        borderRadius: `${(layer.radius ?? 8) * scale}px`,
                        textShadow: '0 2px 10px rgba(0,0,0,0.3)'
                    }}
                >
                    {content}
                </div>
            </div>
        );
    };

    const bakeImageWithFilter = async (imageUrl: string, filterVal: string, layersArray: TextLayer[], blur: number, opacity: number, previewW: number, previewH: number, targetAspectRatio: number = 9 / 16): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');

                // 🔥 Dynamic Resolution based on Target Aspect Ratio
                // If Aspect Ratio is > 1 (Landscape), we treat width as primary constraint, else also width.
                // Standardizing on width = 1080 for detailed mobile/web view.
                const targetWidth = img.naturalWidth > 1080 ? img.naturalWidth : 1080;
                const targetHeight = targetWidth / targetAspectRatio;

                canvas.width = targetWidth;
                canvas.height = targetHeight;

                const ctx = canvas.getContext('2d');
                if (!ctx) return reject('No context');

                // 1. Draw Blurred Background (Only necessary if image doesn't fill canvas, but here we assume canvas matches aspect ratio if logical)
                // However, "targetAspectRatio" comes from state. If state matches image, it fits perfectly.
                // If state is 9:16 (default) but image is 16:9, we still need blur.

                ctx.save();
                const imgAspect = img.naturalWidth / img.naturalHeight;
                const canvasAspect = canvas.width / canvas.height;
                let bgW, bgH, bgX, bgY;

                if (imgAspect > canvasAspect) {
                    bgH = canvas.height;
                    bgW = canvas.height * imgAspect;
                } else {
                    bgW = canvas.width;
                    bgH = canvas.width / imgAspect;
                }
                bgX = (canvas.width - bgW) / 2;
                bgY = (canvas.height - bgH) / 2;

                if (blur > 0) {
                    ctx.filter = `blur(${blur}px) brightness(${opacity / 100})`;
                } else {
                    ctx.filter = `brightness(${opacity / 100})`;
                }

                if (filterVal && filterVal !== 'none') {
                    ctx.filter = (ctx.filter === 'none' ? '' : ctx.filter + ' ') + filterVal;
                }

                ctx.drawImage(img, bgX, bgY, bgW, bgH);
                ctx.restore();

                // 2. Draw Main Image (Centered - Contain)
                ctx.save();
                if (filterVal && filterVal !== 'none') {
                    ctx.filter = filterVal;
                }

                let drawW, drawH, drawX, drawY;
                if (imgAspect > canvasAspect) { // Image Wider than Canvas
                    drawW = canvas.width;
                    drawH = canvas.width / imgAspect;
                } else { // Image Taller than Canvas
                    drawH = canvas.height;
                    drawW = canvas.height * imgAspect;
                }

                // If the user INTENDED 16:9 (targetAspectRatio is ~1.77), the canvas is 16:9.
                // If the image IS 16:9, it will fill perfectly.

                drawX = (canvas.width - drawW) / 2;
                drawY = (canvas.height - drawH) / 2;

                ctx.drawImage(img, drawX, drawY, drawW, drawH);
                ctx.restore();

                // 3. Burn Each Layer
                layersArray.forEach(layer => {
                    const content = layer.content.replace(/<[^>]*>/g, ' ').trim();
                    if (!content) return;

                    ctx.save();
                    // Mapping coordinates from preview size to high-res canvas resolution
                    const x = (layer.x / previewW) * canvas.width;
                    const y = (layer.y / previewH) * canvas.height;

                    // Scale font relative to width ratio
                    const fontSize = (layer.size * 32) * (canvas.width / previewW);

                    let finalX = x;
                    if (layer.align === 'center') finalX += (layer.width ? (layer.width / previewW / 2 * canvas.width) : 0);
                    if (layer.align === 'right') finalX += (layer.width ? (layer.width / previewW * canvas.width) : 0);

                    ctx.translate(finalX, y);
                    if (layer.rotation) ctx.rotate(layer.rotation * Math.PI / 180);

                    ctx.globalAlpha = layer.opacity ?? 1;
                    if (layer.blur) {
                        ctx.filter = `blur(${layer.blur * (canvas.width / previewW)}px)`;
                    }

                    ctx.font = `900 ${fontSize}px ${layer.font} `;
                    ctx.fillStyle = layer.color;
                    ctx.textAlign = layer.align as CanvasTextAlign;
                    ctx.textBaseline = 'top';

                    const lines = content.split('\n');
                    const lineHeight = fontSize * 1.2;

                    lines.forEach((line, i) => {
                        const lineY = i * lineHeight;
                        if (layer.bg) {
                            ctx.save();
                            const metrics = ctx.measureText(line);
                            const textWidth = metrics.width;
                            const bgXPos = layer.align === 'center' ? -textWidth / 2 - 20 : layer.align === 'right' ? -textWidth - 20 : -20;
                            const radius = (layer.radius ?? 8) * (canvas.width / previewW);

                            if (layer.blur) ctx.filter = `blur(${layer.blur * (canvas.width / previewW)}px)`;

                            ctx.fillStyle = layer.bgColor || (layer.color === '#ffffff' ? '#000000' : '#ffffff');
                            ctx.beginPath();
                            const rectX = bgXPos;
                            const rectY = lineY - 10;
                            const rectW = textWidth + 40;
                            const rectH = fontSize + 20;

                            ctx.moveTo(rectX + radius, rectY);
                            ctx.lineTo(rectX + rectW - radius, rectY);
                            ctx.quadraticCurveTo(rectX + rectW, rectY, rectX + rectW, rectY + radius);
                            ctx.lineTo(rectX + rectW, rectY + rectH - radius);
                            ctx.quadraticCurveTo(rectX + rectW, rectY + rectH, rectX + rectW - radius, rectY + rectH);
                            ctx.lineTo(rectX + radius, rectY + rectH);
                            ctx.quadraticCurveTo(rectX, rectY + rectH, rectX, rectY + rectH - radius);
                            ctx.lineTo(rectX, rectY + radius);
                            ctx.closePath();
                            ctx.fill();
                            ctx.restore();
                        }
                        ctx.shadowColor = 'rgba(0,0,0,0.5)';
                        ctx.shadowBlur = 10;
                        ctx.fillText(line, 0, lineY);
                    });
                    ctx.restore();
                });

                resolve(canvas.toDataURL('image/jpeg', 0.95));
            };
            img.onerror = reject;
            img.src = imageUrl;
        });
    };

    const handlePublish = async () => {
        let finalContent = imageContent;
        const layers = statusType === 'text' ? textLayers : imageLayers;

        try {
            if (statusType === 'text') {
                if (previewContainerRef.current) {
                    const canvas = await html2canvas(previewContainerRef.current, {
                        backgroundColor: null,
                        scale: 3,
                        useCORS: true,
                        allowTaint: true,
                        logging: false,
                        onclone: (clonedDoc: Document) => {
                            const container = clonedDoc.querySelector('[data-status-preview="true"]');
                            if (container instanceof HTMLElement) {
                                container.style.borderRadius = '0px';
                                container.style.boxShadow = 'none';
                            }
                        }
                    } as any);
                    finalContent = canvas.toDataURL('image/jpeg', 0.95);
                } else {
                    finalContent = textContent;
                }
            } else {
                const previewW = previewContainerRef.current?.clientWidth || 400;
                const previewH = previewContainerRef.current?.clientHeight || 711;
                // 🟢 Pass current Aspect Ratio to Baker
                finalContent = await bakeImageWithFilter(imageContent, filter, layers, bgBlur, bgOpacity, previewW, previewH, aspect || 9 / 16);
            }
        } catch (error) {
            console.error("Status baking failed:", error);
            finalContent = statusType === 'text' ? textContent : imageContent;
        }

        const data: StatusData = {
            type: 'image',
            content: finalContent,
            styling: {
                fontFamily,
                backgroundColor: statusType === 'text' ? bgColor : undefined,
                textColor,
                filter: undefined,
                stickerStyle,
                stickerPosition,
                backgroundBlur: bgBlur,
                backgroundOpacity: bgOpacity,
                aspectRatio: aspect
            },
            startTime,
            endTime,
            privacy,
            link: link.trim() || undefined,
            music: music || undefined,
            musicVolume,
        };
        onSubmit(data);
        onClose();
    };

    const canProceed = statusType === 'text' ? textContent.trim().length > 0 : imageContent.length > 0;

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        className="fixed inset-0 z-[999999] flex items-center justify-center p-4 md:p-8 lg:px-32 xl:px-48"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                    >
                        <div
                            className="absolute inset-0 bg-black/80 backdrop-blur-2xl"
                            onClick={onClose}
                        />

                        {/* Music Selector Modal */}
                        {showMusicSelector && (
                            <MusicSelector
                                onSelect={(track) => setMusic(track)}
                                onClose={() => setShowMusicSelector(false)}
                            />
                        )}

                        <motion.div
                            className={cn(
                                "relative transition-all duration-700 ease-in-out flex flex-col group",
                                (aspect || 0) > 1 ? "aspect-[16/9] w-full sm:w-[95%] max-w-5xl" : "aspect-[9/16] w-[95%] sm:w-auto h-auto sm:h-full max-h-[850px]"
                            )}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1, type: 'spring', damping: 30 }}
                        >
                            {/* Card Background / Phone Frame */}
                            <div className="absolute inset-0 bg-[#0b141a] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 ring-1 ring-white/5 z-0" />

                            <div className="absolute top-0 left-0 right-0 z-50 p-4 sm:p-6 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent rounded-2xl overflow-hidden">
                                <button
                                    onClick={handleBack}
                                    className="p-2.5 bg-black/20 backdrop-blur-md border border-white/10 hover:bg-white/10 rounded-full transition-all active:scale-95"
                                >
                                    {step === 'create' ? (
                                        <X size={20} className="text-white" />
                                    ) : (
                                        <ChevronLeft size={20} className="text-white" />
                                    )}
                                </button>

                                <div className="flex flex-col items-center gap-1.5">
                                    <div className="flex flex-col items-center">
                                        <h2 className="text-[10px] font-black text-white/90 uppercase tracking-[0.3em] mb-1">
                                            {step === 'create' ? 'STUDIO' : 'FINALIZE'}
                                        </h2>
                                        <div className="flex gap-1">
                                            <div className={cn("w-6 h-1 rounded-full bg-emerald-500", step === 'settings' && "bg-white/20")} />
                                            <div className={cn("w-6 h-1 rounded-full bg-white/20", step === 'settings' && "bg-emerald-500")} />
                                        </div>
                                    </div>
                                    {step === 'create' && (
                                        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 scale-90">
                                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[7px] font-black text-white/60 uppercase tracking-[0.2em] tabular-nums">
                                                Live | {statusType === 'text' ? textContent.replace(/<[^>]*>/g, '').length : imageContent.length > 0 ? 'Media' : 'Empty'}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <Button
                                    onClick={step === 'create' ? handleNext : handlePublish}
                                    disabled={!canProceed}
                                    className={cn(
                                        "h-10 w-10 p-0 rounded-full transition-all",
                                        canProceed
                                            ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                                            : "bg-zinc-800 text-zinc-500"
                                    )}
                                >
                                    {step === 'create' ? (
                                        <ArrowRight size={20} />
                                    ) : (
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="text-black"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </motion.div>
                                    )}
                                </Button>
                            </div>

                            <div
                                ref={parentRef}
                                className="flex-1 relative z-10 bg-black/20 rounded-2xl min-h-0 overflow-visible"
                            >
                                {/* 🎼 Move Sticker Inside the Frame for correct relative percentages */}
                                {music && (
                                    <motion.div
                                        drag
                                        dragMomentum={false}
                                        dragElastic={0.1}
                                        style={{
                                            top: `${stickerPosition.y}%`,
                                            left: `${stickerPosition.x}%`,
                                            x: dragX,
                                            y: dragY,
                                        }}
                                        onDragEnd={() => {
                                            if (parentRef.current) {
                                                const rect = parentRef.current.getBoundingClientRect();

                                                // Calculate the actual pixel position (current top/left + drag offset)
                                                const currentX = (stickerPosition.x / 100) * rect.width + dragX.get();
                                                const currentY = (stickerPosition.y / 100) * rect.height + dragY.get();

                                                // Convert to new percentage
                                                const newX = (currentX / rect.width) * 100;
                                                const newY = (currentY / rect.height) * 100;

                                                // Reset MotionValues so they don't apply to the new top/left
                                                dragX.set(0);
                                                dragY.set(0);

                                                setStickerPosition({
                                                    x: Math.max(0, Math.min(100, newX)),
                                                    y: Math.max(0, Math.min(100, newY))
                                                });
                                            }
                                        }}
                                        className="absolute z-[60]"
                                    >
                                        <div
                                            className="relative -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing group/sticker"
                                            onContextMenu={(e) => e.preventDefault()}
                                        >
                                            {/* Sticker Context Menu */}
                                            <div className="absolute z-40 -top-4 -right-12 -translate-x-1/2 flex flex-col items-center opacity-0 group-hover/sticker:opacity-100 transition-opacity pointer-events-none group-hover/sticker:pointer-events-auto pb-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setMusic(null); }}
                                                        className="bg-black/80 text-red-400 text-[10px] px-2 py-1 rounded-md border border-white/10 hover:bg-red-500 hover:text-white font-bold shadow-lg backdrop-blur-md"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Sticker Display */}
                                            <div
                                                onDoubleClick={() => setStickerStyle(prev => prev === 'pill' ? 'card' : prev === 'card' ? 'minimal' : prev === 'minimal' ? 'hidden' : 'pill')}
                                                onClick={() => setIsPaused(prev => !prev)}
                                                className="cursor-pointer transition-transform active:scale-95 relative"
                                            >
                                                {stickerStyle === 'pill' && (
                                                    <div className="flex items-center gap-3 bg-black/60 backdrop-blur-xl border border-white/10 pr-4 rounded-full overflow-hidden shadow-2xl">
                                                        <div className="w-10 h-10 rounded-full animate-[spin_5s_linear_infinite] overflow-hidden border-2 border-zinc-900">
                                                            <img src={music.coverUrl} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="flex flex-col min-w-0 pr-2">
                                                            <span className="text-[10px] font-black text-white truncate max-w-[120px]">{music.title}</span>
                                                            <span className="text-[8px] font-bold text-zinc-400 truncate max-w-[100px]">{music.artist}</span>
                                                        </div>
                                                        <div className="flex gap-0.5 items-end h-4 ml-2">
                                                            <div className="w-0.5 bg-white h-full animate-[music-bar_0.5s_infinite]" />
                                                            <div className="w-0.5 bg-white h-2/3 animate-[music-bar_0.7s_infinite]" />
                                                            <div className="w-0.5 bg-white h-1/2 animate-[music-bar_0.6s_infinite]" />
                                                        </div>
                                                    </div>
                                                )}

                                                {stickerStyle === 'card' && (
                                                    <div className="flex flex-col items-center bg-white/10 backdrop-blur-2xl border border-white/20 p-4 rounded-2xl shadow-2xl w-48 overflow-hidden">
                                                        <img src={music.coverUrl} className="w-40 h-40 rounded-2xl shadow-lg mb-3 object-cover" />
                                                        <div className="text-center w-full px-4 min-w-0">
                                                            <h3 className="text-white text-sm font-black truncate">{music.title}</h3>
                                                            <p className="text-emerald-400 text-[10px] font-bold truncate forced-truncate">{music.artist}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {stickerStyle === 'minimal' && (
                                                    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5">
                                                        <Music2 size={12} className="text-emerald-400" />
                                                        <span className="text-[10px] font-bold text-white shadow-sm max-w-[150px] truncate">
                                                            {music.title} • {music.artist}
                                                        </span>
                                                    </div>
                                                )}

                                                {stickerStyle === 'hidden' && (
                                                    <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/5 opacity-50 hover:opacity-100 transition-opacity">
                                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                                        <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">Hidden</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                                {step === 'create' ? (
                                    <div className="h-full">
                                        <Tabs
                                            value={statusType}
                                            onValueChange={(v) => {
                                                setStatusType(v as 'text' | 'image');
                                                setActiveLayerId(null); // Reset active layer when switching tabs
                                            }}
                                            className="h-full flex flex-col"
                                        >
                                            <div className={cn(
                                                "absolute bottom-6 sm:bottom-3 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300",
                                                (statusType === 'image' && activeLayerId) ? "opacity-0 pointer-events-none translate-y-10" : "opacity-100"
                                            )}>
                                                <TabsList className="bg-black/60 backdrop-blur-3xl p-1 rounded-full border border-white/10 shadow-2xl scale-90 md:scale-100">
                                                    <TabsTrigger value="text" className="rounded-full px-5 py-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-black transition-all font-black text-[10px] uppercase tracking-wider">
                                                        <Type size={12} className="mr-2" />
                                                        Text
                                                    </TabsTrigger>
                                                    <TabsTrigger value="image" className="rounded-full px-5 py-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-black transition-all font-black text-[10px] uppercase tracking-wider">
                                                        <ImageIcon size={12} className="mr-2" />
                                                        Photo
                                                    </TabsTrigger>
                                                </TabsList>
                                            </div>

                                            <div className="absolute top-20 sm:top-24 right-4 z-[100] flex flex-col gap-3">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button
                                                                onClick={() => setShowMusicSelector(true)}
                                                                className="w-10 h-10 bg-black/40 backdrop-blur-3xl border border-white/20 rounded-full flex items-center justify-center hover:bg-white/10 text-emerald-400 shadow-lg active:scale-95 transition-all"
                                                            >
                                                                <Music2 size={18} />
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="left"><p className="text-[10px] font-bold">Add Music</p></TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>

                                            <TabsContent value="text" className="m-0 h-full focus-visible:outline-none">
                                                <TextEditor
                                                    content={textContent}
                                                    onChange={setTextContent}
                                                    fontFamily={fontFamily}
                                                    onFontChange={setFontFamily}
                                                    backgroundColor={bgColor}
                                                    onBackgroundChange={setBgColor}
                                                    textColor={textColor}
                                                    onTextColorChange={setTextColor}
                                                    onLinkClick={handleNext}
                                                    textAlign={textAlign}
                                                    onTextAlignChange={setTextAlign}
                                                    textBg={textBg}
                                                    onTextBgChange={setTextBg}
                                                    textFullWidth={textFullWidth}
                                                    onTextFullWidthChange={setTextFullWidth}
                                                    // Layer State (Text Specific)
                                                    layers={textLayers}
                                                    setLayers={setTextLayers}
                                                    activeLayerId={activeLayerId}
                                                    setActiveLayerId={setActiveLayerId}
                                                    // Dynamic Aspect Ratio
                                                    aspect={aspect}
                                                    onAspectChange={setAspect}
                                                />
                                            </TabsContent>
                                            <TabsContent value="image" className="m-0 h-full focus-visible:outline-none">
                                                <PhotoEditor
                                                    imageUrl={imageContent}
                                                    onChange={setImageContent}
                                                    onLinkClick={handleNext}
                                                    filter={filter}
                                                    onFilterChange={setFilter}
                                                    // Global Styles (Defaults for new layers)
                                                    fontFamily={fontFamily}
                                                    // Layer State (Image Specific)
                                                    layers={imageLayers}
                                                    setLayers={setImageLayers}
                                                    activeLayerId={activeLayerId}
                                                    setActiveLayerId={setActiveLayerId}
                                                    // Background Focus State
                                                    bgBlur={bgBlur}
                                                    onBgBlurChange={setBgBlur}
                                                    bgOpacity={bgOpacity}
                                                    onBgOpacityChange={setBgOpacity}
                                                    aspect={aspect}
                                                    onAspectChange={setAspect}
                                                />
                                            </TabsContent>
                                        </Tabs>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col p-4 rounded-2xl   pt-24 pb-12 space-y-8 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div
                                            ref={previewContainerRef}
                                            data-status-preview="true"
                                            className={cn(
                                                "relative mx-auto rounded-2xl overflow-hidden shadow-2xl ring-4 ring-emerald-500/10 group flex-shrink-0 transition-all duration-500",
                                                aspect === 16 / 9 ? "aspect-[16/9] w-full" : "aspect-[9/16] w-[85%]"
                                            )}
                                        >
                                            {statusType === 'image' ? (
                                                <div className="relative w-full h-full bg-black">
                                                    {/* Blur Background for Final Preview - With Filter */}
                                                    <div
                                                        className="absolute inset-0 opacity-100 scale-110"
                                                        style={{
                                                            backgroundImage: `url(${imageContent})`,
                                                            backgroundSize: 'cover',
                                                            backgroundPosition: 'center',
                                                            filter: `${filter && filter !== 'none' ? filter : ''} blur(${bgBlur}px) brightness(${bgOpacity / 100})`.trim()
                                                        }}
                                                    />
                                                    {/* Main Image - With Filter */}
                                                    <img
                                                        src={imageContent}
                                                        alt="Preview"
                                                        className="w-full h-full object-contain relative z-10"
                                                        style={{ filter: filter && filter !== 'none' ? filter : undefined }}
                                                    />
                                                    {/* Layer Overlay (WYSIWYG) */}
                                                    <div className="absolute inset-0 z-30 pointer-events-none">
                                                        {statusType === 'image' ? imageLayers.map(l => (
                                                            <PreviewLayer
                                                                key={l.id}
                                                                layer={l}
                                                                containerW={previewContainerRef.current?.clientWidth || 400}
                                                                containerH={previewContainerRef.current?.clientHeight || 711}
                                                            />
                                                        )) : textLayers.map(l => (
                                                            <PreviewLayer
                                                                key={l.id}
                                                                layer={l}
                                                                containerW={previewContainerRef.current?.clientWidth || 400}
                                                                containerH={previewContainerRef.current?.clientHeight || 711}
                                                            />
                                                        ))}
                                                    </div>

                                                    {textContent.replace(/<[^>]*>/g, '').trim() && (
                                                        <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
                                                            <div
                                                                className="text-white font-black text-xl text-center break-words drop-shadow-2xl"
                                                                style={{ color: textColor, fontFamily: fontFamily }}
                                                                dangerouslySetInnerHTML={{ __html: textContent }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div
                                                    className="w-full h-full flex items-center justify-center p-8 text-center relative"
                                                    style={{ background: bgColor, color: textColor, fontFamily }}
                                                >
                                                    <div
                                                        className={cn(
                                                            "font-bold break-words",
                                                            textContent.replace(/<[^>]*>/g, '').length < 50 ? 'text-4xl leading-tight' :
                                                                textContent.replace(/<[^>]*>/g, '').length < 100 ? 'text-3xl leading-snug' :
                                                                    textContent.replace(/<[^>]*>/g, '').length < 200 ? 'text-2xl leading-normal' :
                                                                        textContent.replace(/<[^>]*>/g, '').length < 400 ? 'text-lg leading-relaxed' : 'text-sm leading-relaxed'
                                                        )}
                                                        dangerouslySetInnerHTML={{ __html: textContent || 'Your status...' }}
                                                    />
                                                    {/* Layer Overlay for Text mode (Stickers/Emoji) */}
                                                    <div className="absolute inset-0 z-30 pointer-events-none">
                                                        {textLayers.map(l => (
                                                            <PreviewLayer
                                                                key={l.id}
                                                                layer={l}
                                                                containerW={previewContainerRef.current?.clientWidth || 400}
                                                                containerH={previewContainerRef.current?.clientHeight || 711}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Duration</Label>
                                                    <span className="text-emerald-400 font-bold text-sm tracking-tighter">7 Days (Pro)</span>
                                                </div>
                                                <div className="px-2">
                                                    <input
                                                        type="range"
                                                        min="1"
                                                        max="30"
                                                        defaultValue="7"
                                                        className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-emerald-500"
                                                    />
                                                    <div className="flex justify-between mt-2 text-[8px] font-black text-white/20 uppercase tracking-widest">
                                                        <span>24H</span>
                                                        <span>7D</span>
                                                        <span>30D</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Link Attachment</Label>
                                                <div className="relative group/link">
                                                    <Input
                                                        value={link}
                                                        onChange={(e) => setLink(e.target.value)}
                                                        placeholder="https://cluaiz.com/status"
                                                        className="bg-white/5 border-white/10 rounded-xl h-12 pl-10 text-xs font-bold text-emerald-400 placeholder:text-zinc-600 focus:border-emerald-500/50 transition-all"
                                                    />
                                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within/link:text-emerald-500 transition-colors">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>

                                            {music && (
                                                <div className="space-y-3 animate-in slide-in-from-left-4 duration-500 delay-100">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Music Volume</Label>
                                                        <span className="text-emerald-400 font-bold text-sm tracking-tighter">{Math.round(musicVolume * 100)}%</span>
                                                    </div>
                                                    <div className="px-2">
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="1"
                                                            step="0.05"
                                                            value={musicVolume}
                                                            onChange={(e) => {
                                                                const vol = parseFloat(e.target.value);
                                                                setMusicVolume(vol);
                                                                if (audioRef.current) audioRef.current.volume = vol;
                                                            }}
                                                            className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-emerald-500"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <Label className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Audience</Label>
                                                <div className="flex flex-wrap gap-2 justify-start">
                                                    {[
                                                        { value: 'all', label: 'All', icon: '🌍' },
                                                        { value: 'contacts', label: 'Contacts', icon: '👥' },
                                                        { value: 'new', label: 'New', icon: '✨' },
                                                        { value: 'unknown', label: 'Others', icon: '👤' }
                                                    ].map((option) => (
                                                        <button
                                                            key={option.value}
                                                            onClick={() => setPrivacy(option.value as any)}
                                                            className={cn(
                                                                "flex text-[9px] items-center gap-1.5 px-2 py-1 rounded-full border transition-all font-black uppercase tracking-wider",
                                                                privacy === option.value
                                                                    ? "bg-emerald-500 border-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                                                    : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white"
                                                            )}
                                                        >
                                                            <span className="text-sm">{option.icon}</span>
                                                            {option.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )
            }
        </AnimatePresence >
    );
};
