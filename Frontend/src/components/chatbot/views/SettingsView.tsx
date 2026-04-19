"use client";

import React from 'react';
import { useThemeStore } from '@/store/themeStore';
import { Palette, Maximize2, Type, Layout, Check, Sparkles } from 'lucide-react';

interface SettingsViewProps {
    onNavigate: (view: string) => void;
}

const COLORS = [
    { name: 'Emerald', value: '#10b981' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Orange', value: '#f59e0b' },
    { name: 'Zinc', value: '#71717a' },
];

const BG_TYPES = [
    { id: 'none', label: 'None' },
    { id: 'galaxy', label: 'Galaxy' },
    { id: 'ripple', label: 'Ripple' },
    { id: 'threads', label: 'Threads' },
    { id: 'liquid', label: 'Liquid' },
    { id: 'PixelBlast', label: 'Pixel Blast' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({ onNavigate }) => {
    const { 
        bubbleColor, setBubbleColor, 
        bgType, setBgType, 
        opacity, setOpacity,
        fontSize, setFontSize,
        modernBubbles, toggleModernBubbles
    } = useThemeStore();

    return (
        <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 space-y-8 no-scrollbar animate-fadeIn">
            <header className="mb-2">
                <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-blue-500" />
                    Customization
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Personalize your chat experience</p>
            </header>

            {/* Bubble Color */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    <Palette className="w-4 h-4" />
                    Theme Color
                </div>
                <div className="grid grid-cols-6 gap-3">
                    {COLORS.map((color) => (
                        <button
                            key={color.value}
                            onClick={() => setBubbleColor(color.value)}
                            className="relative w-full aspect-square rounded-full transition-transform hover:scale-110 active:scale-95 shadow-sm border-2 border-white dark:border-slate-800"
                            style={{ backgroundColor: color.value }}
                        >
                            {bubbleColor === color.value && (
                                <div className="absolute inset-0 flex items-center justify-center text-white bg-black/20 rounded-full">
                                    <Check className="w-4 h-4" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </section>

            {/* Background Type */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    <Layout className="w-4 h-4" />
                    Background Effect
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {BG_TYPES.map((bg) => (
                        <button
                            key={bg.id}
                            onClick={() => setBgType(bg.id as any)}
                            className={`p-3 text-xs font-semibold rounded-xl border transition-all ${
                                bgType === bg.id 
                                ? 'bg-blue-500 text-white border-blue-600 shadow-md' 
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-blue-300'
                            }`}
                        >
                            {bg.label}
                        </button>
                    ))}
                </div>
            </section>

            {/* Opacity Slider */}
            <section className="space-y-4">
                <div className="flex items-center justify-between text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                        <Maximize2 className="w-4 h-4" />
                        BG Visibility
                    </div>
                    <span className="text-blue-500">{Math.round(opacity * 100)}%</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={opacity}
                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
            </section>

            {/* Font Size */}
            <section className="space-y-4">
                <div className="flex items-center justify-between text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                        <Type className="w-4 h-4" />
                        Font Size
                    </div>
                    <span className="text-blue-500">{fontSize}px</span>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setFontSize(Math.max(12, fontSize - 1))}
                        className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-400"
                    >
                        Smaller
                    </button>
                    <button 
                        onClick={() => setFontSize(Math.min(20, fontSize + 1))}
                        className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-400"
                    >
                        Larger
                    </button>
                </div>
            </section>

            {/* Style Toggles */}
            <section className="space-y-4 pb-10">
                <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="space-y-1">
                        <div className="text-sm font-bold text-slate-800 dark:text-white">Modern Bubbles</div>
                        <div className="text-xs text-slate-500">Enable sleek, rounded chat bubbles</div>
                    </div>
                    <button 
                        onClick={toggleModernBubbles}
                        className={`w-12 h-6 rounded-full transition-colors relative ${modernBubbles ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${modernBubbles ? 'left-7' : 'left-1'}`} />
                    </button>
                </div>
            </section>
        </div>
    );
};
