"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Save, Edit, X, Sun, Moon, Sparkles, Palette } from "lucide-react";
import { botConfigService } from "@/services/bot-config.service";

interface WindowDesignerProps {
    config: any;
    orgId: string;
    isEditing: boolean;
}

interface WindowConfig {
    theme: 'auto' | 'light' | 'dark';
    colorMode: 'auto' | 'custom';
    customColor: string;
}

const defaultWindowConfig: WindowConfig = {
    theme: 'auto',
    colorMode: 'auto',
    customColor: '#3B82F6'
};

const THEME_OPTIONS = [
    { value: 'auto', label: 'Auto', icon: Sparkles, desc: 'Follows system' },
    { value: 'light', label: 'Light', icon: Sun, desc: 'Always light' },
    { value: 'dark', label: 'Dark', icon: Moon, desc: 'Always dark' }
];

const COLOR_PRESETS = [
    { value: '#3B82F6', label: 'Blue', color: 'bg-blue-500' },
    { value: '#8B5CF6', label: 'Purple', color: 'bg-purple-500' },
    { value: '#10B981', label: 'Green', color: 'bg-green-500' },
    { value: '#F59E0B', label: 'Orange', color: 'bg-orange-500' },
    { value: '#EC4899', label: 'Pink', color: 'bg-pink-500' },
    { value: '#06B6D4', label: 'Cyan', color: 'bg-cyan-500' },
    { value: '#EF4444', label: 'Red', color: 'bg-red-500' },
    { value: '#84CC16', label: 'Lime', color: 'bg-lime-500' }
];

export function WindowDesigner({ config, orgId, isEditing }: WindowDesignerProps) {
    const [windowConfig, setWindowConfig] = useState<WindowConfig>(defaultWindowConfig);

    const loadConfig = async () => {
        console.log('🔄 WindowDesigner: Loading config...');
        try {
            const apiConfig = await botConfigService.getBotConfig('default_bot');
            console.log('📦 WindowDesigner: Received config:', apiConfig);

            if (apiConfig?.widgetConfig?.window) {
                console.log('✅ WindowDesigner: Found window config:', apiConfig.widgetConfig.window);
                setWindowConfig({ ...defaultWindowConfig, ...apiConfig.widgetConfig.window });
            } else {
                console.log('⚠️ WindowDesigner: No window config found, using defaults');
            }
        } catch (e) {
            console.error('❌ WindowDesigner: Failed to load config:', e);
        }
    };

    useEffect(() => {
        loadConfig();
    }, []);

    // Expose save function via window for parent to call
    useEffect(() => {
        const saveWindowConfig = async () => {
            console.log('💾 WindowDesigner: Saving config...', windowConfig);
            try {
                const existing = await botConfigService.getBotConfig('default_bot');
                const existingWidget = existing?.widgetConfig || {};

                const newConfig = {
                    widgetConfig: {
                        ...existingWidget,
                        window: windowConfig
                    },
                    orgId
                };

                console.log('📤 WindowDesigner: Sending to backend:', newConfig);
                await botConfigService.saveBotConfig('default_bot', newConfig);
                console.log('✅ WindowDesigner: Saved successfully!');
            } catch (error) {
                console.error('❌ WindowDesigner: Failed to save:', error);
            }
        };

        // Attach to window for parent to call
        (window as any).saveWindowDesigner = saveWindowConfig;

        return () => {
            delete (window as any).saveWindowDesigner;
        };
    }, [windowConfig, orgId]);

    const handleConfigChange = (updates: Partial<WindowConfig>) => {
        const newConfig = { ...windowConfig, ...updates };
        console.log('🔧 WindowDesigner: Config changed:', newConfig);
        setWindowConfig(newConfig);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className={`${!isEditing ? 'opacity-90 pointer-events-none' : ''}`}>
                <div className="max-w-4xl mx-auto space-y-8">

                    {/* Theme Mode */}
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-white mb-2">Theme Mode</h3>
                            <p className="text-sm text-slate-400">Choose how the chat window adapts to light and dark modes</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {THEME_OPTIONS.map((option) => {
                                const Icon = option.icon;
                                const isSelected = windowConfig.theme === option.value;
                                return (
                                    <button
                                        key={option.value}
                                        onClick={() => isEditing && handleConfigChange({ theme: option.value as any })}
                                        disabled={!isEditing}
                                        className={`p-6 rounded-xl border-2 transition-all ${isSelected
                                            ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                                            : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                                            } ${!isEditing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                    >
                                        <div className="flex flex-col items-center gap-3">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isSelected ? 'bg-blue-500/20' : 'bg-white/5'
                                                }`}>
                                                <Icon className={`w-6 h-6 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
                                            </div>
                                            <div className="text-center">
                                                <div className={`font-semibold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                                                    {option.label}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1">{option.desc}</div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Primary Color */}
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-white mb-2">Primary Color</h3>
                            <p className="text-sm text-slate-400">Set the accent color for buttons, headers, and highlights</p>
                        </div>

                        {/* Color Mode Toggle */}
                        <div className="mb-6">
                            <Label className="text-slate-300 mb-3 block">Color Mode</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => isEditing && handleConfigChange({ colorMode: 'auto' })}
                                    disabled={!isEditing}
                                    className={`p-4 rounded-xl border-2 transition-all ${windowConfig.colorMode === 'auto'
                                        ? 'border-purple-500 bg-purple-500/10'
                                        : 'border-white/10 hover:border-white/20'
                                        } ${!isEditing ? 'cursor-not-allowed opacity-50' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Sparkles className={`w-5 h-5 ${windowConfig.colorMode === 'auto' ? 'text-purple-400' : 'text-slate-400'}`} />
                                        <div className="text-left">
                                            <div className="font-semibold text-white text-sm">Auto</div>
                                            <div className="text-xs text-slate-500">Matches launcher icon</div>
                                        </div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => isEditing && handleConfigChange({ colorMode: 'custom' })}
                                    disabled={!isEditing}
                                    className={`p-4 rounded-xl border-2 transition-all ${windowConfig.colorMode === 'custom'
                                        ? 'border-blue-500 bg-blue-500/10'
                                        : 'border-white/10 hover:border-white/20'
                                        } ${!isEditing ? 'cursor-not-allowed opacity-50' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Palette className={`w-5 h-5 ${windowConfig.colorMode === 'custom' ? 'text-blue-400' : 'text-slate-400'}`} />
                                        <div className="text-left">
                                            <div className="font-semibold text-white text-sm">Custom</div>
                                            <div className="text-xs text-slate-500">Choose your own color</div>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Color Picker (Only shown when Custom is selected) */}
                        {windowConfig.colorMode === 'custom' && (
                            <div className="mt-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                <Label className="text-slate-300 mb-3 block">Choose Color</Label>
                                <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                                    {COLOR_PRESETS.map((preset) => (
                                        <button
                                            key={preset.value}
                                            onClick={() => isEditing && handleConfigChange({ customColor: preset.value })}
                                            disabled={!isEditing}
                                            className={`w-full h-14 rounded-xl ${preset.color} transition-all ${windowConfig.customColor === preset.value
                                                ? 'ring-4 ring-white ring-offset-2 ring-offset-slate-900 scale-110'
                                                : 'hover:scale-105'
                                                } ${!isEditing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                            title={preset.label}
                                        />
                                    ))}
                                </div>

                                {/* Custom Hex Input */}
                                <div className="mt-4">
                                    <Label className="text-slate-400 text-sm mb-2 block">Or enter hex code:</Label>
                                    <input
                                        type="text"
                                        value={windowConfig.customColor}
                                        onChange={(e) => handleConfigChange({ customColor: e.target.value })}
                                        disabled={!isEditing}
                                        placeholder="#3B82F6"
                                        className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Preview Note */}
                    <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-blue-500/20 rounded-2xl p-6">
                        <div className="flex items-start gap-4">
                            <div className="text-3xl">💡</div>
                            <div>
                                <h4 className="text-white font-semibold mb-2">Preview Changes</h4>
                                <p className="text-slate-300 text-sm">
                                    Open the chat window to see your theme and color changes in real-time.
                                    The preview will update automatically based on your selections.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
