"use client";

import React from 'react';
import { useThemeStore } from '@/store/themeStore';
import { Palette, Bot, Type } from 'lucide-react';
import { SettingSection, SettingItem, BackgroundCard, CursorCard } from './SharedComponents';
import { cn } from '@/lib/utils';

export const ChatsSettings: React.FC = () => {
    const {
        bgType,
        opacity, setOpacity,
        cursorType,
        fontFamily, setFontFamily,
        fontSize, setFontSize,
        bubbleColor, setBubbleColor,
        aiBubbleColor, setAiBubbleColor,
        compactMode, toggleCompactMode,
        modernBubbles, toggleModernBubbles
    } = useThemeStore();

    return (
        <div className="space-y-8">
            <SettingSection title="Cinematic Atmosphere">
                <div className="grid grid-cols-2 gap-4 p-4">
                    {['none', 'galaxy', 'liquid', 'ripple', 'threads', 'PixelBlast'].map((mode) => (
                        <BackgroundCard
                            key={mode}
                            mode={mode}
                            isActive={bgType === mode}
                        />
                    ))}
                </div>
            </SettingSection>

            <SettingSection title="Background Intensity">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-bold text-white">Opacity</span>
                        <span className="text-xs font-mono text-emerald-500">{Math.round(opacity * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={opacity}
                        onChange={(e) => setOpacity(parseFloat(e.target.value))}
                        className="w-full accent-emerald-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            </SettingSection>

            <SettingSection title="Chat Density">
                <SettingItem
                    label="Compact Mode"
                    description="Show more messages on screen."
                    toggle
                    active={compactMode}
                    onToggle={toggleCompactMode}
                />
                <SettingItem
                    label="Modern Bubbles"
                    description="Use the new rounded bubble design."
                    toggle
                    active={modernBubbles}
                    onToggle={toggleModernBubbles}
                />
            </SettingSection>

            <SettingSection title="Cursor Effects">
                <div className="flex gap-4 p-4">
                    {['none', 'splash', 'crosshair', 'target'].map((type) => (
                        <CursorCard
                            key={type}
                            type={type}
                            isActive={cursorType === type}
                        />
                    ))}
                </div>
            </SettingSection>

            <SettingSection title="Chat Styling">
                <div className="p-4 space-y-6">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Palette size={14} className="text-zinc-500" />
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">My Messages</span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {[
                                '#09090b', // Zinc 950 (Void Black)
                                '#022c22', // Emerald 950 (Deepest Green - Cluaiz Signature)
                                '#064e3b', // Emerald 900 (Jungle Green)
                                '#14532d', // Green 900 (Forest)
                                '#0f172a', // Slate 900 (Midnight Navy)
                                '#172554', // Blue 950 (Abyssal Blue)
                                '#312e81', // Indigo 900 (Royal Dark)
                                '#4c0519', // Rose 950 (Dark Wine)
                                '#451a03', // Amber 950 (Dark Wood)
                                '#1c1917', // Stone 950 (Warm Black)
                                '#27272a', // Zinc 800 (Gunmetal)
                                '#000000', // Pure Black (OLED)
                            ].map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setBubbleColor(color)}
                                    className={cn(
                                        "w-8 h-8 rounded-full transition-all hover:scale-110 relative border border-white/10 shadow-lg",
                                        bubbleColor === color ? "ring-2 ring-emerald-500 ring-offset-2 ring-offset-black" : "opacity-60 hover:opacity-100"
                                    )}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="h-[1px] bg-white/5" />

                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Bot size={14} className="text-zinc-500" />
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">AI Messages</span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {[
                                '#09090b', // Zinc 950 (Void Black)
                                '#022c22', // Emerald 950 (Deepest Green - Cluaiz Signature)
                                '#064e3b', // Emerald 900 (Jungle Green)
                                '#14532d', // Green 900 (Forest)
                                '#0f172a', // Slate 900 (Midnight Navy)
                                '#172554', // Blue 950 (Abyssal Blue)
                                '#312e81', // Indigo 900 (Royal Dark)
                                '#4c0519', // Rose 950 (Dark Wine)
                                '#451a03', // Amber 950 (Dark Wood)
                                '#1c1917', // Stone 950 (Warm Black)
                                '#27272a', // Zinc 800 (Gunmetal)
                                '#000000', // Pure Black (OLED)
                            ].map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setAiBubbleColor(color)}
                                    className={cn(
                                        "w-8 h-8 rounded-full transition-all hover:scale-110 relative border border-white/10 shadow-lg",
                                        aiBubbleColor === color ? "ring-2 ring-emerald-500 ring-offset-2 ring-offset-black" : "opacity-60 hover:opacity-100"
                                    )}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="h-[1px] bg-white/5" />

                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Type size={14} className="text-zinc-500" />
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Font Size</span>
                            </div>
                            <span className="text-xs font-mono text-emerald-500">{fontSize}px</span>
                        </div>
                        <input
                            type="range"
                            min="14"
                            max="16"
                            step="0.5"
                            value={fontSize}
                            onChange={(e) => setFontSize(Number(e.target.value))}
                            className="w-full accent-emerald-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <div className="h-[1px] bg-white/5" />

                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Type size={14} className="text-zinc-500" />
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Typography</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                'Inter', 'Roboto', 'Lato', 'Montserrat',
                                'Oswald', 'Playfair Display', 'Merriweather',
                                'Nunito', 'Raleway', 'Poppins', 'Open Sans', 'Inconsolata'
                            ].map((font) => (
                                <button
                                    key={font}
                                    onClick={() => setFontFamily(font)}
                                    className={cn(
                                        "px-3 py-2 rounded-lg text-xs transition-all border text-left truncate",
                                        fontFamily === font
                                            ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-500"
                                            : "bg-black/20 border-white/5 text-zinc-400 hover:bg-white/5 hover:text-white"
                                    )}
                                    style={{ fontFamily: font }}
                                >
                                    {font}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </SettingSection>
        </div>
    );
};
