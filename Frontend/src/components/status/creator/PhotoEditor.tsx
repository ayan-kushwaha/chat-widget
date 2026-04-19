import React, { useState, useCallback, useRef, useEffect } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Upload, ImageIcon, Crop, RotateCw, ZoomIn, ZoomOut, Check, X, Wand2, Link as LinkIcon, Smile, Layers, AlignLeft, AlignCenter, AlignRight, Highlighter, Move, Type, Trash2, Palette, Sparkles, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import EmojiPicker, { Theme, EmojiStyle } from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TextLayerItem } from './TextLayerItem';

import type { TextLayer } from './StatusCreatorOverlay';

interface PhotoEditorProps {
    imageUrl: string;
    onChange: (url: string) => void;
    onLinkClick?: () => void;
    filter: string;
    onFilterChange: (filter: string) => void;
    fontFamily: string;
    layers: TextLayer[];
    setLayers: React.Dispatch<React.SetStateAction<TextLayer[]>>;
    activeLayerId: string | null;
    setActiveLayerId: React.Dispatch<React.SetStateAction<string | null>>;
    bgBlur: number;
    onBgBlurChange: (val: number) => void;
    bgOpacity: number;
    onBgOpacityChange: (val: number) => void;
    aspect: number | undefined;
    onAspectChange: (val: number | undefined) => void;
}

const PHOTO_FILTERS = [
    { name: 'none', label: 'Original', filter: 'none' },
    { name: 'bnw', label: 'Noir', filter: 'grayscale(100%) contrast(1.2)' },
    { name: 'warm', label: 'Golden', filter: 'sepia(30%) saturate(140%) hue-rotate(-10deg) contrast(1.1)' },
    { name: 'cold', label: 'Frost', filter: 'saturate(80%) hue-rotate(180deg) brightness(1.1) contrast(1.1)' },
    { name: 'sepia', label: 'Vintage', filter: 'sepia(80%) contrast(1.2) brightness(0.9)' },
    { name: 'cinematic', label: 'Cinema', filter: 'contrast(1.3) brightness(1.1) saturate(1.2)' },
    { name: 'dreamy', label: 'Dreamy', filter: 'blur(0.5px) brightness(1.2) saturate(0.8)' },
    { name: 'polaroid', label: 'Polaroid', filter: 'contrast(1.1) brightness(1.1) sepia(0.3) saturate(1.5)' },
    { name: 'kodak', label: 'Kodak', filter: 'contrast(1.4) saturate(1.4) sepia(0.2)' },
    { name: 'cyberpunk', label: 'Cyber', filter: 'hue-rotate(30deg) contrast(1.4) saturate(1.8)' },
    { name: 'fade', label: 'Fade', filter: 'opacity(0.8) brightness(1.2) contrast(0.8)' },
    { name: 'drama', label: 'Drama', filter: 'contrast(1.5) saturate(0.5)' }
];

export const PhotoEditor: React.FC<PhotoEditorProps> = ({
    imageUrl, onChange, onLinkClick, filter, onFilterChange,
    fontFamily, layers, setLayers, activeLayerId, setActiveLayerId,
    bgBlur, onBgBlurChange, bgOpacity, onBgOpacityChange,
    aspect, onAspectChange
}) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);

    const activeFilter = PHOTO_FILTERS.find((f: any) => f.filter === filter) || PHOTO_FILTERS[0];
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [showCropper, setShowCropper] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Container ref for Moveable bounds (optional)
    const containerRef = useRef<HTMLDivElement>(null);

    const activeLayer = layers.find((l: TextLayer) => l.id === activeLayerId);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAddText = () => {
        const newLayer: TextLayer = {
            id: Date.now().toString(),
            content: 'Type...',
            x: 50,
            y: 300,
            color: '#ffffff',
            font: fontFamily,
            size: 1,
            width: 200,
            align: 'center',
            bg: false,
            bgColor: '#000000',
            fullWidth: false,
            rotation: 0,
            opacity: 1,
            blur: 0,
            radius: 0
        };
        setLayers(prev => [...prev, newLayer]);
        setActiveLayerId(newLayer.id);
    };

    const updateLayer = (id: string, updates: Partial<TextLayer>) => {
        setLayers((prev: any) => (prev as TextLayer[]).map((l: TextLayer) => l.id === id ? { ...l, ...updates } : l));
    };

    const updateActiveLayer = (updates: Partial<TextLayer>) => {
        if (activeLayerId) {
            updateLayer(activeLayerId, updates);
        }
    };

    const deleteActiveLayer = () => {
        if (activeLayerId) {
            setLayers((prev: any) => (prev as TextLayer[]).filter((l: TextLayer) => l.id !== activeLayerId));
            setActiveLayerId(null);
        }
    };

    const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                onChange(result);
                setShowCropper(true);

                // 🟢 Auto-Detect Aspect Ratio
                const img = new Image();
                img.onload = () => {
                    const ratio = img.naturalWidth / img.naturalHeight;
                    if (ratio > 1) {
                        onAspectChange(16 / 9); // Landscape -> PC Mode
                    } else {
                        onAspectChange(9 / 16); // Portrait -> Mobile Mode
                    }
                };
                img.src = result;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleApplyCrop = async () => {
        if (!croppedAreaPixels || !imageUrl) return;
        try {
            const croppedImage = await getCroppedImg(imageUrl, croppedAreaPixels, rotation);
            onChange(croppedImage);
            setShowCropper(false);
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            setRotation(0);
        } catch (e) {
            console.error(e);
        }
    };

    // Auto-Clamp existing oversized layers (Fixes the 290% bug from screenshot)
    useEffect(() => {
        const needsClamp = layers.some((l: TextLayer) => l.size > 2);
        if (needsClamp) {
            setLayers((prev: any) => (prev as TextLayer[]).map((l: TextLayer) => l.size > 2 ? { ...l, size: 2 } : l));
        }
    }, [layers, setLayers]);

    return (
        <div className="h-full relative flex flex-col group/photo">
            <style>{`
                .moveable-cluaiz-theme .moveable-control {
                    background: #10b981 !important;
                    border: 2px solid #000 !important;
                    box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
                    width: 12px !important;
                    height: 12px !important;
                    margin-top: -6px !important;
                    margin-left: -6px !important;
                    border-radius: 50% !important;
                }
                .moveable-cluaiz-theme .moveable-line {
                    background: #10b981 !important;
                    width: 2px !important;
                    height: 2px !important;
                }
                .moveable-cluaiz-theme .moveable-guideline {
                    background: #f43f5e !important; 
                }
                .color-grid button:hover {
                    transform: scale(1.2);
                    z-index: 10;
                }
            `}</style>
            {!imageUrl ? (
                /* Cinematic Upload Stage */
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-black/20 relative">
                    <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/p6.png')]" />
                    <div className="relative group cursor-pointer mb-8" onClick={() => fileInputRef.current?.click()}>
                        <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] rounded-full group-hover:bg-emerald-500/30 transition-all duration-700" />
                        <div className="w-32 h-32 relative bg-black/40 backdrop-blur-3xl rounded-2xl flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.3)] border border-white/10 group-hover:scale-105 group-hover:rotate-3 transition-all duration-500">
                            <ImageIcon size={40} className="text-emerald-400" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-black shadow-lg border-4 border-[#0b141a]">
                            <Upload size={16} />
                        </div>
                    </div>
                    <div className="space-y-3 z-10">
                        <h3 className="text-xl font-black text-white/90 uppercase tracking-widest">Aesthetics</h3>
                        <p className="text-[10px] text-zinc-500 max-w-[200px] leading-relaxed font-bold uppercase tracking-widest mx-auto opacity-60">UPLOAD A HIGH-RESOLUTION MOMENT</p>
                    </div>
                </div>
            ) : showCropper ? (
                <div className="flex-1 relative bg-black flex flex-col">
                    <div className="relative flex-1 w-full bg-[#0b141a]">
                        <Cropper
                            image={imageUrl}
                            crop={crop}
                            zoom={zoom}
                            rotation={rotation}
                            aspect={aspect} // Dynamic Aspect prop
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onRotationChange={setRotation}
                            onCropComplete={onCropComplete}
                            objectFit="contain" // User Request: "orgine size"
                            style={{
                                containerStyle: { filter: activeFilter.filter, background: 'transparent' },
                                mediaStyle: { filter: activeFilter.filter }
                            }}
                        />
                    </div>
                </div>
            ) : (
                /* Cinematic Preview Stage */
                <div
                    className="flex-1 relative group bg-black flex items-center justify-center overflow-hidden rounded-2xl"
                    ref={containerRef}
                >
                    {/* Cinematic Vignettes */}
                    <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10" />
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-10" />

                    <div
                        className="absolute inset-0 z-0 scale-110 pointer-events-none transition-all duration-300"
                        style={{
                            backgroundImage: `url('${imageUrl}')`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            filter: `${activeFilter.filter !== 'none' ? activeFilter.filter : ''} blur(${bgBlur}px) brightness(${bgOpacity / 100})`.trim(),
                            opacity: 1
                        }}
                    />

                    <img
                        src={imageUrl}
                        alt="Status preview"
                        className="w-full h-full object-contain relative z-10 transition-transform duration-700"
                        style={{ filter: activeFilter.filter }}
                    />

                    {/* Draggable Text Layers with TextLayerItem */}
                    {layers.map((layer) => (
                        <TextLayerItem
                            key={layer.id}
                            layer={layer}
                            isSelected={activeLayerId === layer.id}
                            onSelect={() => setActiveLayerId(layer.id)}
                            onChange={(updates) => updateLayer(layer.id, updates)}
                            containerRef={containerRef as React.RefObject<HTMLDivElement>}
                        />
                    ))}
                </div>
            )}

            {/* Floating Sidebar - Positioned outside but visible */}
            {imageUrl && (
                <TooltipProvider delayDuration={0}>
                    <motion.div
                        drag="x"
                        dragConstraints={{ left: -150, right: 150 }}
                        dragElastic={0.1}
                        dragMomentum={false}
                        className={cn(
                            "absolute sm:left-full sm:ml-6 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:right-auto sm:top-1/2 sm:-translate-y-1/2 z-[100] flex sm:flex-col items-center gap-2 sm:gap-3 fade-in duration-700 w-auto justify-center touch-none",
                            (aspect || 0) > 1
                                ? "-top-16 sm:top-1/2"
                                : "top-24 sm:top-1/2"
                        )}
                    >
                        {/* Mobile Toggle Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className={cn(
                                "sm:hidden w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-lg backdrop-blur-3xl border animate-in zoom-in-50 duration-300",
                                isMobileMenuOpen
                                    ? "bg-emerald-500 text-black border-emerald-500 rotate-90"
                                    : "bg-black/60 text-white/70 border-white/10"
                            )}
                        >
                            {isMobileMenuOpen ? <X size={15} /> : <Wand2 size={15} />}
                        </button>

                        <div className={cn(
                            "flex sm:flex-col flex-row items-center gap-2 transition-all duration-300",
                            !isMobileMenuOpen && "hidden sm:flex"
                        )}>
                            {showCropper ? (
                                /* Crop Tools - Widened & Cleaned */
                                <div className="flex sm:flex-col flex-row gap-3 p-3 bg-black/40 backdrop-blur-3xl rounded-[1.5rem] border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-300 items-center sm:w-28 w-auto">
                                    {/* Aspect Ratio Toggle */}
                                    <div className="flex flex-col gap-2 w-full pb-2 border-b border-white/10">
                                        <span className="text-[9px] font-black uppercase text-center text-zinc-400 tracking-widest">Aspect</span>
                                        <div className="grid grid-cols-2 sm:grid-cols-1 gap-2">
                                            {[
                                                { label: 'Mobile (9:16)', val: 9 / 16 },
                                                { label: 'PC (16:9)', val: 16 / 9 },
                                            ].map((r) => (
                                                <button
                                                    key={r.label}
                                                    onClick={() => onAspectChange(r.val)}
                                                    className={cn(
                                                        "text-[9px] font-black h-10 rounded-xl transition-all uppercase flex items-center justify-center border",
                                                        aspect === r.val
                                                            ? "bg-emerald-500 text-black border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-105"
                                                            : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10 hover:border-white/20"
                                                    )}
                                                >
                                                    {r.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 w-full justify-center">
                                        <button onClick={() => setZoom(Math.min(zoom + 0.2, 3))} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white transition-colors bg-white/5 border border-white/5"><ZoomIn size={14} /></button>
                                        <button onClick={() => setZoom(Math.max(zoom - 0.2, 1))} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white transition-colors bg-white/5 border border-white/5"><ZoomOut size={14} /></button>
                                    </div>
                                    <button onClick={() => setRotation((rotation + 90) % 360)} className="w-full py-2 rounded-xl flex items-center justify-center hover:bg-white/10 text-white transition-colors bg-white/5 border border-white/5 text-[9px] font-bold uppercase tracking-wider gap-2">
                                        <RotateCw size={12} /> Rotate
                                    </button>
                                    <div className="h-px w-6 bg-white/10 mx-auto" />
                                    <button onClick={handleApplyCrop} className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-black"><Check size={18} /></button>
                                    <button onClick={() => setShowCropper(false)} className="w-10 h-10 border border-white/20 rounded-full flex items-center justify-center text-white/50"><X size={18} /></button>
                                </div>
                            ) : activeLayerId ? (
                                /* Layer Edit Mode - Compact & Focused */
                                <div className="flex sm:flex-col flex-row items-center gap-1.5 p-1.5 bg-[#101418]/60 backdrop-blur-3xl rounded-full border border-white/5 shadow-3xl animate-in slide-in-from-top-4 sm:slide-in-from-right-4 duration-500">
                                    {/* Tiny Deselect */}
                                    <button
                                        onClick={() => setActiveLayerId(null)}
                                        className="w-5 h-5 self-center rounded-full flex items-center justify-center hover:bg-white/10 text-white/40 transition-all active:scale-95"
                                    >
                                        <X size={10} />
                                    </button>

                                    <button
                                        onClick={() => {
                                            const next = activeLayer?.align === 'left' ? 'center' : activeLayer?.align === 'center' ? 'right' : 'left';
                                            updateActiveLayer({ align: next });
                                        }}
                                        className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/5 text-white/80 transition-all active:scale-95"
                                    >
                                        {activeLayer?.align === 'left' ? <AlignLeft size={16} /> : activeLayer?.align === 'right' ? <AlignRight size={16} /> : <AlignCenter size={16} />}
                                    </button>

                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/5 text-white/80 transition-all active:scale-95 relative">
                                                <Palette size={16} />
                                                {activeLayer && (
                                                    <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full border border-[#101418]" style={{ backgroundColor: activeLayer.color }} />
                                                )}
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent side="left" className="w-[280px] bg-[#0b141a]/95 backdrop-blur-3xl border border-white/10 rounded-[1.5rem] p-5 shadow-3xl z-[999999] mr-8">
                                            <Tabs defaultValue="text">
                                                <TabsList className="w-full bg-white/5 p-1 rounded-xl mb-4 border border-white/5">
                                                    <TabsTrigger value="text" className="flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-emerald-500 data-[state=active]:text-black">Text</TabsTrigger>
                                                    <TabsTrigger value="bg" className="flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-emerald-500 data-[state=active]:text-black">Highlight</TabsTrigger>
                                                </TabsList>
                                                <TabsContent value="text" className="mt-0 outline-none">
                                                    <div className="grid grid-cols-5 gap-2 color-grid">
                                                        {['#ffffff', '#000000', '#10b981', '#f43f5e', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6', '#ef4444', '#14b8a6', '#06b6d4', '#f97316', '#6366f1', '#a855f7'].map(color => (
                                                            <button key={color} onClick={() => updateActiveLayer({ color: color })} className={cn("w-8 h-8 rounded-full border-2 transition-all active:scale-90", activeLayer?.color === color ? "border-emerald-500 scale-110 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "border-white/10")} style={{ backgroundColor: color }} />
                                                        ))}
                                                    </div>
                                                </TabsContent>
                                                <TabsContent value="bg" className="mt-0 outline-none">
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-[9px] font-black text-white/40 uppercase">Enable Shadow/BG</span>
                                                            <button onClick={() => updateActiveLayer({ bg: !activeLayer?.bg })} className={cn("px-3 py-1 rounded-full text-[8px] font-black transition-all", activeLayer?.bg ? "bg-emerald-500 text-black shadow-lg" : "bg-white/5 text-zinc-500")}>
                                                                {activeLayer?.bg ? 'ACTIVE' : 'OFF'}
                                                            </button>
                                                        </div>
                                                        {activeLayer?.bg && (
                                                            <div className="grid grid-cols-5 gap-2 color-grid animate-in zoom-in-50 duration-300">
                                                                {['#000000', '#ffffff', '#10b981', '#f43f5e', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6', '#ef4444', '#000000cc', '#ffffffcc', '#10b981cc', '#f43f5ecc', '#0ea5e9cc'].map((color, i) => (
                                                                    <button key={i} onClick={() => updateActiveLayer({ bgColor: color })} className={cn("w-8 h-8 rounded-full border-2 transition-all active:scale-90", (activeLayer?.bgColor || '#000000') === color ? "border-emerald-500 scale-110 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "border-white/10")} style={{ backgroundColor: color }} />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TabsContent>
                                            </Tabs>
                                        </PopoverContent>
                                    </Popover>

                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/5 text-emerald-400 transition-all active:scale-95">
                                                <Sparkles size={16} />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent side="left" className="w-[200px] bg-[#0b141a]/95 backdrop-blur-3xl border border-white/10 rounded-[1.5rem] p-5 shadow-3xl z-[999999] mr-8">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Layer FX</span>
                                                    <button onClick={() => updateActiveLayer({ opacity: 1, blur: 0 })} className="text-[8px] font-black text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-widest">Reset</button>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-[9px] font-black text-white/40 uppercase"><span>Opacity</span><span>{Math.round((activeLayer?.opacity ?? 1) * 100)}%</span></div>
                                                    <Slider value={[activeLayer?.opacity ?? 1]} min={0} max={1} step={0.01} onValueChange={(v) => updateActiveLayer({ opacity: v[0] })} className="py-2" />
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-[9px] font-black text-white/40 uppercase"><span>Blur</span><span>{activeLayer?.blur ?? 0}px</span></div>
                                                    <Slider value={[activeLayer?.blur ?? 0]} min={0} max={20} step={1} onValueChange={(v) => updateActiveLayer({ blur: v[0] })} className="py-2" />
                                                </div>
                                                <div className="space-y-3 pt-2 border-t border-white/5">
                                                    <div className="flex justify-between items-center text-[9px] font-black text-white/40 uppercase"><span>Rounding</span><span className="text-emerald-400">{activeLayer?.radius ?? 8}px</span></div>
                                                    <Slider value={[activeLayer?.radius ?? 8]} min={0} max={100} step={1} onValueChange={(v) => updateActiveLayer({ radius: v[0] })} className="py-2" />
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>

                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/5 text-white/80 transition-all active:scale-95">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[10px] font-black">T</span>
                                                    <span className="text-[5px] font-bold text-zinc-500 uppercase">Size</span>
                                                </div>
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent side="left" className="w-[180px] bg-[#0b141a]/95 backdrop-blur-3xl border border-white/10 rounded-[1rem] p-4 shadow-3xl z-[999999] mr-8">
                                            <div className="space-y-3">
                                                <div className="flex justify-between text-[9px] font-bold text-white/50 uppercase"><span>Size</span><span>{activeLayer ? Math.round(activeLayer.size * 100) : 100}%</span></div>
                                                <Slider value={[activeLayer?.size ?? 1]} min={0.5} max={2} step={0.1} onValueChange={(v) => updateActiveLayer({ size: v[0] })} className="py-2" />
                                            </div>
                                        </PopoverContent>
                                    </Popover>

                                    <div className="hidden sm:block w-6 h-px bg-white/5 mx-auto" />

                                    <button onClick={deleteActiveLayer} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-all active:scale-95">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ) : (
                                /* Base Menu - Show only when no layer selected */
                                <div className="flex sm:flex-col flex-row items-center gap-2.5 p-2 bg-[#101418]/60 backdrop-blur-3xl rounded-full border border-white/5 shadow-3xl animate-in slide-in-from-top-2 sm:slide-in-from-right-2 duration-500">
                                    <button onClick={handleAddText} className="sm:w-10 sm:h-10 w-9 h-9 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/20 flex items-center justify-center text-black active:scale-95 transition-all">
                                        <Plus size={16} />
                                    </button>

                                    <div className="hidden sm:block h-px w-6 bg-white/10 mx-auto my-1" />

                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className={cn("sm:w-10 sm:h-10 w-9 h-9 backdrop-blur-3xl border rounded-full flex items-center justify-center active:scale-95 transition-all", activeFilter.name !== 'none' ? "bg-emerald-500 border-emerald-500 text-black" : "bg-black/20 border-white/10 text-white/70")}>
                                                <Wand2 size={16} />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent side="left" className="w-[280px] bg-[#0b141a]/95 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-5 shadow-3xl z-[999999] mr-8">
                                            <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto no-scrollbar pr-1">
                                                {PHOTO_FILTERS.map((f) => (
                                                    <button key={f.name} onClick={() => onFilterChange?.(f.filter)} className={cn("group flex flex-col items-center gap-2 p-2 rounded-2xl border transition-all active:scale-95", activeFilter.name === f.name ? "bg-white/10 border-emerald-500" : "bg-white/5 border-white/5 hover:bg-white/10")}>
                                                        <div className="w-full aspect-square rounded-xl overflow-hidden relative"><div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style={{ backgroundImage: `url('${imageUrl}')`, filter: f.filter }} /></div>
                                                        <span className={cn("text-[9px] font-black uppercase tracking-wider", activeFilter.name === f.name ? "text-emerald-400" : "text-white/60")}>{f.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </PopoverContent>
                                    </Popover>

                                    {/* <Popover>
                                    <PopoverTrigger asChild>
                                        <button className="w-10 h-10 bg-black/20 backdrop-blur-3xl border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all text-white/70"><Layers size={18} /></button>
                                    </PopoverTrigger>
                                    <PopoverContent side="left" className="w-[240px] bg-[#0b141a]/95 backdrop-blur-3xl border border-white/10 rounded-[1.5rem] p-5 shadow-3xl z-[999999] mr-8">
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Background Focus</p>
                                            <div className="space-y-3"><div className="flex justify-between text-[9px] font-bold text-white/50 uppercase"><span>Blur</span><span>{bgBlur}%</span></div><Slider defaultValue={[bgBlur]} max={50} step={1} onValueChange={(v) => onBgBlurChange(v[0])} className="py-2" /></div>
                                            <div className="space-y-3"><div className="flex justify-between text-[9px] font-bold text-white/50 uppercase"><span>Opacity</span><span>{bgOpacity}%</span></div><Slider defaultValue={[bgOpacity]} max={100} step={1} onValueChange={(v) => onBgOpacityChange(v[0])} className="py-2" /></div>
                                        </div>
                                    </PopoverContent>
                                </Popover> */}

                                    <button onClick={() => setShowCropper(true)} className="sm:w-10 sm:h-10 w-9 h-9 bg-black/20 border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 text-white/50"><Crop size={16} /></button>
                                    <button onClick={() => fileInputRef.current?.click()} className="sm:w-10 sm:h-10 w-9 h-9 bg-black/20 border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 text-white/50"><Upload size={16} /></button>

                                    {/* Sticker / Emoji Picker */}
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="sm:w-10 sm:h-10 w-9 h-9 bg-black/20 border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 text-emerald-400">
                                                <Smile size={16} />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent side="left" collisionPadding={20} className="w-auto p-0 border-none bg-transparent shadow-none z-[999999] mr-8">
                                            <div className="rounded-[2rem] overflow-hidden shadow-2xl border border-white/10">
                                                <EmojiPicker
                                                    theme={Theme.DARK}
                                                    emojiStyle={EmojiStyle.APPLE}
                                                    onEmojiClick={(e: any) => {
                                                        const newLayer: TextLayer = {
                                                            id: Date.now().toString(),
                                                            content: e.emoji,
                                                            x: 100,
                                                            y: 300,
                                                            color: '#ffffff',
                                                            font: fontFamily,
                                                            size: 2, // Large for stickers
                                                            align: 'center',
                                                            bg: false,
                                                            fullWidth: false,
                                                            opacity: 1,
                                                            blur: 0,
                                                            radius: 0
                                                        };
                                                        setLayers((prev: any) => [...(prev as TextLayer[]), newLayer]);
                                                        setActiveLayerId(newLayer.id);
                                                    }}
                                                    width={320}
                                                    height={400}
                                                    searchDisabled={false}
                                                    skinTonesDisabled
                                                    previewConfig={{ showPreview: false }}
                                                />
                                            </div>
                                        </PopoverContent>
                                    </Popover>

                                </div>
                            )}
                        </div>
                    </motion.div>
                </TooltipProvider>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        </div >
    );
};

const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

async function getCroppedImg(
    imageSrc: string,
    pixelCrop: Area,
    rotation = 0
): Promise<string> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('No 2d context');
    }

    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    canvas.width = safeArea;
    canvas.height = safeArea;

    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-safeArea / 2, -safeArea / 2);

    ctx.drawImage(
        image,
        safeArea / 2 - image.width * 0.5,
        safeArea / 2 - image.height * 0.5
    );

    const data = ctx.getImageData(0, 0, safeArea, safeArea);

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.putImageData(
        data,
        0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x,
        0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y
    );

    return canvas.toDataURL('image/jpeg', 0.95);
}
