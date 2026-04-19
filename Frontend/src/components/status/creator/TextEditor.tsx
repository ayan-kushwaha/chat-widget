import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Smile, Palette, Bold as BoldIcon, Italic as ItalicIcon, Link as LinkIcon, AlignLeft, AlignCenter, AlignRight, Highlighter, Move, Type, Plus, Wand2, Layers, Crop, Upload, X, Trash2, Sparkles, Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import EmojiPicker, { Theme, EmojiStyle } from 'emoji-picker-react';
import { TextLayerItem } from './TextLayerItem';
import type { TextLayer } from './StatusCreatorOverlay';

interface TextEditorProps {
    content: string;
    onChange: (content: string) => void;
    fontFamily: string;
    onFontChange: (font: string) => void;
    backgroundColor: string;
    onBackgroundChange: (color: string) => void;
    textColor: string;
    onTextColorChange: (color: string) => void;
    onLinkClick?: () => void;
    textAlign?: 'left' | 'center' | 'right';
    onTextAlignChange?: (align: 'left' | 'center' | 'right') => void;
    textBg?: boolean;
    onTextBgChange?: (bg: boolean) => void;
    textFullWidth?: boolean;
    onTextFullWidthChange?: (full: boolean) => void;
    mode?: 'standalone' | 'overlay';
    // Layering Props
    layers?: TextLayer[];
    setLayers?: React.Dispatch<React.SetStateAction<TextLayer[]>>;
    activeLayerId?: string | null;
    setActiveLayerId?: React.Dispatch<React.SetStateAction<string | null>>;
    aspect: number | undefined;
    onAspectChange: (val: number | undefined) => void;
}

const FONT_OPTIONS = [
    { value: 'Inter', label: 'Modern' },
    { value: "'Courier New', monospace", label: 'Typewriter' },
    { value: 'Georgia, serif', label: 'Serif' },
    { value: "'Comic Sans MS', cursive", label: 'Script' },
    { value: "'Arial Black', sans-serif", label: 'Bold' }
];

const PREMIUM_PALETTE = {
    minimal: [
        { color: '#000000', label: 'Ebony' },
        { color: '#ffffff', label: 'Glacier' },
        { color: '#334155', label: 'Slate' },
        { color: '#1e293b', label: 'Midnight' },
        { color: '#52525b', label: 'Zinc' },
    ],
    vibrant: [
        { color: '#6366f1', label: 'Indigo' },
        { color: '#10b981', label: 'Emerald' },
        { color: '#f43f5e', label: 'Rose' },
        { color: '#0ea5e9', label: 'Sky' },
        { color: '#f59e0b', label: 'Amber' },
        { color: '#8b5cf6', label: 'Violet' },
        { color: '#ec4899', label: 'Pink' },
        { color: '#06b6d4', label: 'Cyan' },
        { color: '#4d7c0f', label: 'Lime' },
        { color: '#b91c1c', label: 'Ruby' },
    ],
    gradients: [
        { color: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', label: 'Dark Night' },
        { color: 'linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)', label: 'Sunset' },
        { color: 'linear-gradient(135deg, #02aab0 0%, #00cdac 100%)', label: 'Minty' },
        { color: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', label: 'Aurora' },
        { color: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)', label: 'Lavender' },
        { color: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)', label: 'Deep Ocean' },
        { color: 'linear-gradient(145deg, #1a1a1a 0%, #3a3a3a 100%)', label: 'Carbon' },
        { color: 'linear-gradient(135deg, #ff0080 0%, #7928ca 100%)', label: 'Royal' },
        { color: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)', label: 'Ice' },
        { color: 'linear-gradient(135deg, #ed6ea0 0%, #ec8c69 100%)', label: 'Peach' },
        { color: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', label: 'Cosmos' },
        { color: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', label: 'Melon' },
    ]
};

export const TextEditor: React.FC<TextEditorProps> = ({
    content,
    onChange,
    fontFamily,
    onFontChange,
    backgroundColor,
    onBackgroundChange,
    textColor,
    onTextColorChange,
    onLinkClick,
    textAlign = 'center',
    onTextAlignChange,
    textBg = false,
    onTextBgChange,
    textFullWidth = false,
    onTextFullWidthChange,
    mode = 'standalone',
    layers,
    setLayers,
    activeLayerId,
    setActiveLayerId,
    aspect,
    onAspectChange
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [bubbleMenu, setBubbleMenu] = useState<{ x: number, y: number } | null>(null);
    const [activeFilterName, setActiveFilterName] = useState('none');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // --- Helper Functions for Layers (Copied/Adapted from PhotoEditor) ---
    const handleAddText = useCallback(() => {
        if (!setLayers) return;
        const newLayer: TextLayer = {
            id: Math.random().toString(36).substr(2, 9),
            content: 'Double tap to edit',
            x: 50,
            y: 350, // Center-ish
            color: '#ffffff',
            font: fontFamily || 'Inter',
            size: 1,
            align: 'center',
            bg: false,
            fullWidth: false,
            opacity: 1,
            blur: 0,
            radius: 8
        };
        setLayers(prev => [...prev, newLayer]);
        setActiveLayerId?.(newLayer.id);
    }, [setLayers, setActiveLayerId, fontFamily]);

    const activeLayer = layers?.find(l => l.id === activeLayerId);

    const updateActiveLayer = useCallback((updates: Partial<TextLayer>) => {
        if (!setLayers || !activeLayerId) return;
        setLayers(prev => prev.map(l => l.id === activeLayerId ? { ...l, ...updates } : l));
    }, [setLayers, activeLayerId]);

    const deleteActiveLayer = useCallback(() => {
        if (!setLayers || !activeLayerId) return;
        setLayers(prev => prev.filter(l => l.id !== activeLayerId));
        setActiveLayerId?.(null);
    }, [setLayers, activeLayerId, setActiveLayerId]);
    // -----------------------------------------------------------------------


    const handleFontCycle = () => {
        const currentIndex = FONT_OPTIONS.findIndex(f => f.value === fontFamily);
        const nextIndex = (currentIndex + 1) % FONT_OPTIONS.length;
        onFontChange(FONT_OPTIONS[nextIndex].value);
    };

    const getFontSize = () => {
        const length = content.replace(/<[^>]*>/g, '').length;
        if (length < 30) return 'text-3xl sm:text-6xl';
        if (length < 60) return 'text-2xl sm:text-5xl';
        if (length < 100) return 'text-xl sm:text-4xl';
        if (length < 200) return 'text-lg sm:text-3xl';
        if (length < 300) return 'text-base sm:text-2xl';
        if (length < 400) return 'text-sm sm:text-xl';
        if (length < 450) return 'text-xs sm:text-lg';
        return 'text-[10px] sm:text-base';
    };

    const handleSelection = () => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            setBubbleMenu({
                x: rect.left + rect.width / 2,
                y: rect.top - 10
            });
        } else {
            setBubbleMenu(null);
        }
    };

    const applyStyle = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const handleEmojiInsert = (emoji: string) => {
        editorRef.current?.focus();
        document.execCommand('insertText', false, emoji);
    };

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== content) {
            editorRef.current.innerHTML = content;
        }
    }, []);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        const element = e.currentTarget;
        let newContent = element.innerHTML;
        const textOnly = element.innerText;

        if (textOnly.length > 500) {
            const truncated = textOnly.slice(0, 500);
            element.innerText = truncated;
            newContent = element.innerHTML;
        }
        onChange(newContent);
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        const currentText = editorRef.current?.innerText || '';
        const availableSpace = 500 - currentText.length;

        if (availableSpace > 0) {
            const truncatedPaste = text.slice(0, availableSpace);
            document.execCommand('insertText', false, truncatedPaste);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        const currentText = editorRef.current?.innerText || '';
        const isPrintableKey = e.key.length === 1;
        const isModifierKey = e.ctrlKey || e.metaKey || e.altKey;
        const isDeleteKey = e.key === 'Backspace' || e.key === 'Delete';

        if (currentText.length >= 500 && isPrintableKey && !isModifierKey && !isDeleteKey) {
            const selection = window.getSelection();
            if (selection && selection.toString().length === 0) {
                e.preventDefault();
                return;
            }
        }

        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'b') { e.preventDefault(); applyStyle('bold'); }
            if (e.key === 'i') { e.preventDefault(); applyStyle('italic'); }
        }
    };

    const savedSelection = useRef<Range | null>(null);

    const saveSelection = () => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            savedSelection.current = sel.getRangeAt(0);
        }
    };

    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <div className="h-full relative flex flex-col group/editor" onMouseUp={handleSelection}>

            <div className="absolute inset-0 z-50 pointer-events-none">
                {layers?.map((layer) => (
                    <TextLayerItem
                        key={layer.id}
                        layer={layer}
                        isSelected={layer.id === activeLayerId}
                        onSelect={() => setActiveLayerId?.(layer.id)}
                        onChange={(updates) => {
                            if (!setLayers) return;
                            setLayers(prev => prev.map(l => l.id === layer.id ? { ...l, ...updates } : l));
                        }}
                        containerRef={containerRef as React.RefObject<HTMLDivElement>}
                    />
                ))}
            </div>

            <AnimatePresence>
                {bubbleMenu && (
                    <motion.div
                        className="fixed z-[999999] flex items-center gap-1 bg-[#0b141a]/95 backdrop-blur-2xl border border-white/20 p-2 rounded-2xl shadow-3xl overflow-hidden ring-1 ring-white/10"
                        style={{ top: bubbleMenu.y, left: bubbleMenu.x, transform: 'translate(-50%, -100%)' }}
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.8 }}
                    >
                        <button onMouseDown={(e) => { e.preventDefault(); applyStyle('bold'); }} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-xl transition-all text-white active:scale-90" title="Bold"><BoldIcon size={16} /></button>
                        <button onMouseDown={(e) => { e.preventDefault(); applyStyle('italic'); }} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-xl transition-all text-white active:scale-90" title="Italic"><ItalicIcon size={16} /></button>
                        <div className="w-px h-6 bg-white/10 mx-1" />
                        <div className="flex gap-1 pr-1">
                            {['#ffffff', '#10b981', '#f43f5e', '#0ea5e9', '#f59e0b'].map((color) => (
                                <button key={color} onMouseDown={(e) => { e.preventDefault(); applyStyle('foreColor', color); }} className="w-6 h-6 rounded-full border border-white/20 hover:scale-110 active:scale-90 transition-all" style={{ backgroundColor: color }} />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <TooltipProvider delayDuration={0}>
                {/* --- sidebar for Text Mode (Unified) --- */}
                {mode === 'standalone' && (
                    <motion.div
                        drag="x"
                        dragConstraints={{ left: -150, right: 150 }}
                        dragElastic={0.1}
                        dragMomentum={false}
                        className={cn(
                            "absolute sm:left-full sm:ml-6 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:right-auto sm:top-1/2 sm:-translate-y-1/2 z-[100] flex sm:flex-col items-center gap-2 sm:gap-3 animate-in fade-in duration-700 w-auto justify-center touch-none",
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
                            {activeLayerId ? (
                                /* Layer Edit Mode - Compact & Focused (Exact match to PhotoEditor) */
                                <div className="flex sm:flex-col flex-row items-center gap-1.5 p-1.5 bg-[#101418]/60 backdrop-blur-3xl rounded-full border border-white/5 shadow-3xl animate-in slide-in-from-top-4 sm:slide-in-from-right-4 duration-500">
                                    <button
                                        onClick={() => setActiveLayerId?.(null)}
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
                                        <PopoverContent side="left" collisionPadding={20} className="w-[280px] bg-[#0b141a]/95 backdrop-blur-3xl border border-white/10 rounded-[1.5rem] p-5 shadow-3xl z-[999999] mr-8">
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
                                        <PopoverContent side="left" collisionPadding={20} className="w-[200px] bg-[#0b141a]/95 backdrop-blur-3xl border border-white/10 rounded-[1.5rem] p-5 shadow-3xl z-[999999] mr-8">
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
                                        <PopoverContent side="left" collisionPadding={20} className="w-[180px] bg-[#0b141a]/95 backdrop-blur-3xl border border-white/10 rounded-[1rem] p-4 shadow-3xl z-[999999] mr-8">
                                            <div className="space-y-3">
                                                <div className="flex justify-between text-[9px] font-bold text-white/50 uppercase"><span>Size</span><span>{activeLayer ? Math.round(activeLayer.size * 100) : 100}%</span></div>
                                                <Slider value={[activeLayer?.size ?? 1]} min={0.5} max={2} step={0.1} onValueChange={(v) => updateActiveLayer({ size: v[0] })} className="py-2" />
                                            </div>
                                        </PopoverContent>
                                    </Popover>

                                    <div className="hidden sm:block w-6 h-px bg-white/5 mx-auto" />

                                    <button onClick={deleteActiveLayer} className="sm:w-10 sm:h-10 w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-all active:scale-95">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ) : (
                                /* Base Menu - Show only when no layer selected */
                                <div className="flex sm:flex-col flex-row items-center gap-2.5 p-2 bg-[#101418]/60 backdrop-blur-3xl rounded-full border border-white/5 shadow-3xl animate-in slide-in-from-top-2 sm:slide-in-from-right-2 duration-500">

                                    {/* Filter (Palette Control for Background in Text Mode) */}
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="sm:w-10 sm:h-10 w-9 h-9 bg-black/20 backdrop-blur-3xl border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all text-white/70">
                                                <Palette size={16} />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent side="left" collisionPadding={20} className="w-[320px] bg-[#0b141a]/95 backdrop-blur-3xl border border-white/10 rounded-2xl p-6 shadow-3xl z-[999999] mr-8">
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Studio Palettes</h3>
                                                    <div className="w-8 h-1 rounded-full bg-emerald-500/20" />
                                                </div>

                                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 no-scrollbar text-white">
                                                    <div className="space-y-3 font-bold text-xs">
                                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 ">Cinematic Gradients</p>
                                                        <div className="grid grid-cols-6 gap-1.5 pl-1">
                                                            {PREMIUM_PALETTE.gradients.map((p) => (
                                                                <button key={p.color} onClick={() => onBackgroundChange(p.color)} className={cn("aspect-square rounded-lg border transition-all active:scale-90", backgroundColor === p.color ? "border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "border-white/5 hover:border-white/20")} style={{ background: p.color }} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3 font-bold text-xs">
                                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Minimal Solids</p>
                                                        <div className="grid grid-cols-10 gap-1.5 pl-1">
                                                            {PREMIUM_PALETTE.minimal.map((p) => (
                                                                <button key={p.color} onClick={() => onBackgroundChange(p.color)} className={cn("aspect-square rounded-md border transition-all active:scale-90", backgroundColor === p.color ? "border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "border-white/5 hover:border-white/20")} style={{ backgroundColor: p.color }} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3 font-bold text-xs">
                                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Main Text Color</p>
                                                        <div className="grid grid-cols-10 gap-1.5 pl-1">
                                                            {[...PREMIUM_PALETTE.minimal, ...PREMIUM_PALETTE.vibrant].map((p) => (
                                                                <button key={p.color} onClick={() => onTextColorChange(p.color)} className={cn("aspect-square rounded-md border transition-all active:scale-90", textColor === p.color ? "border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "border-white/5 hover:border-white/20")} style={{ backgroundColor: p.color }} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>

                                    {/* Emoji Picker */}
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="sm:w-10 sm:h-10 w-9 h-9 bg-black/20 backdrop-blur-3xl border border-white/10 rounded-full flex flex-col items-center justify-center hover:bg-white/10 active:scale-95 transition-all group">
                                                <Smile size={16} className="text-white/70" />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent side="left" collisionPadding={20} className="w-auto p-0 border-none bg-transparent shadow-none z-[999999] mr-8">
                                            <div className="rounded-[2rem] overflow-hidden shadow-2xl border border-white/10">
                                                <EmojiPicker
                                                    theme={Theme.DARK}
                                                    emojiStyle={EmojiStyle.APPLE}
                                                    onEmojiClick={(e) => {
                                                        // Restore selection
                                                        if (savedSelection.current) {
                                                            const sel = window.getSelection();
                                                            sel?.removeAllRanges();
                                                            sel?.addRange(savedSelection.current);
                                                        } else {
                                                            editorRef.current?.focus();
                                                        }
                                                        document.execCommand('insertText', false, e.emoji);
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

                                    {/* Font Controls (Replacing Layers icon for Text Mode context) */}
                                    <button
                                        onClick={handleFontCycle}
                                        className="sm:w-10 sm:h-10 w-9 h-9 bg-black/20 backdrop-blur-3xl border border-white/10 rounded-full flex flex-col items-center justify-center hover:bg-white/10 active:scale-95 transition-all group"
                                        title="Change Font"
                                    >
                                        <span className="text-white/70 font-black text-sm" style={{ fontFamily }}>Aa</span>
                                    </button>

                                    {/* Main Text Alignment */}
                                    {onTextAlignChange && (
                                        <button
                                            onClick={() => {
                                                const next = textAlign === 'left' ? 'center' : textAlign === 'center' ? 'right' : 'left';
                                                onTextAlignChange(next);
                                            }}
                                            className="sm:w-10 sm:h-10 w-9 h-9 bg-black/20 backdrop-blur-3xl border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 text-white/70 transition-all active:scale-95"
                                        >
                                            {textAlign === 'left' ? <AlignLeft size={16} /> : textAlign === 'right' ? <AlignRight size={16} /> : <AlignCenter size={16} />}
                                        </button>
                                    )}

                                    <div className="hidden sm:block w-6 h-px bg-white/5 mx-auto" />

                                    <button onClick={handleAddText} className="sm:w-10 sm:h-10 w-9 h-9 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/20 flex items-center justify-center text-black active:scale-95 transition-all">
                                        <Plus size={16} />
                                    </button>

                                    <div className="hidden sm:block w-6 h-px bg-white/5 mx-auto" />

                                    {/* Aspect Ratio Toggle (Same as PhotoEditor) */}
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="w-10 h-10 bg-black/20 backdrop-blur-3xl border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 text-white/70 transition-all active:scale-95 sm:w-10 sm:h-10 w-9 h-9">
                                                <Crop size={16} />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent side="left" collisionPadding={20} className="w-[160px] bg-[#0b141a]/95 backdrop-blur-3xl border border-white/10 rounded-[1.5rem] p-4 shadow-3xl z-[999999] mr-8">
                                            <div className="flex flex-col gap-2 w-full">
                                                <span className="text-[9px] font-black uppercase text-center text-zinc-400 tracking-widest">Screen</span>
                                                <div className="grid grid-cols-1 gap-2">
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
                                        </PopoverContent>
                                    </Popover>

                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </TooltipProvider>

            <div
                ref={containerRef}
                className={cn(
                    "flex-1 transition-all duration-700 relative overflow-hidden flex flex-col items-center justify-center p-12 cursor-text",
                    mode === 'standalone' ? "rounded-2xl" : ""
                )}
                style={{ background: mode === 'standalone' ? backgroundColor : 'transparent' }}
                onClick={() => editorRef.current?.focus()}
            >
                {mode === 'standalone' && (
                    <>
                        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/40 to-transparent pointer-events-none z-10" />
                        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/40 to-transparent pointer-events-none z-10" />
                        <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/p6.png')] z-5" />
                    </>
                )}

                <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleInput}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    onBlur={saveSelection}
                    className={cn(
                        "w-full max-w-[90%] bg-transparent no-scrollbar border-none outline-none resize-none font-black placeholder:text-current z-20 selection:bg-emerald-500/30 transition-all duration-300",
                        getFontSize()
                    )}
                    style={{
                        color: textColor,
                        fontFamily,
                        textAlign: textAlign,
                        backgroundColor: textBg ? (textColor === '#ffffff' ? '#000000' : '#ffffff') : 'transparent',
                        padding: textBg ? '0.5em 1em' : '0',
                        borderRadius: '0.75em',
                        width: textFullWidth ? '100%' : 'auto',
                        display: textFullWidth ? 'block' : 'inline-block',
                        textShadow: (mode === 'standalone' && !textBg) ? '0 4px 20px rgba(0,0,0,0.2)' : 'none',
                        lineHeight: 1.5,
                        outline: 'none',
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                        boxDecorationBreak: 'clone',
                        WebkitBoxDecorationBreak: 'clone'
                    }}
                    spellCheck={false}
                />

                {!content.replace(/<[^>]*>/g, '').trim() && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 p-12">
                        <p className={cn("font-black opacity-30 select-none text-center", getFontSize())} style={{ color: textColor, fontFamily }}>Start typing...</p>
                    </div>
                )}
            </div>
        </div >
    );
};
