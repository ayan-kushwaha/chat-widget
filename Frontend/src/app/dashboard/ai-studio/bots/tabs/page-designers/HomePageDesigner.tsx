"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Save, Plus, Trash2, GripVertical, Eye, EyeOff, Sparkles, Edit } from "lucide-react";
import { botConfigService } from "@/services/bot-config.service";

interface HomePageDesignerProps {
    config: any;
    orgId: string;
}

interface Placeholder {
    id: string;
    text: string;
    enabled: boolean;
    order: number;
}

interface Suggestion {
    id: string;
    icon: string;
    text: string;
    enabled: boolean;
    order: number;
}

interface HomeConfig {
    hero: {
        title: string;
        subtitle: string;
        backgroundType: 'gradient' | 'image' | 'solid';
        backgroundImage: string;
    };
    suggestions: Suggestion[];
    placeholders: Placeholder[];
    showStats: boolean;
    showLatestFAQ: boolean;
    showGreeting: boolean;
}

const DEFAULT_ICONS = ['💬', '❓', '📝', '📞', '📧', '🎯', '🚀', '💡', '⚡', '🎨', '📊', '🔧', '⚙️', '📱', '💻', '🌟', '🎉', '📅', '🔔', '👋'];

const defaultHomeConfig: HomeConfig = {
    hero: {
        title: 'Welcome to Cluaiz Support',
        subtitle: 'How can we help you today?',
        backgroundType: 'gradient',
        backgroundImage: ''
    },
    suggestions: [
        { id: 'sug_1', icon: '📦', text: 'Order Status', enabled: true, order: 0 },
        { id: 'sug_2', icon: '💳', text: 'Pricing', enabled: true, order: 1 },
        { id: 'sug_3', icon: '💁', text: 'Support', enabled: true, order: 2 }
    ],
    placeholders: [
        { id: 'ph_1', text: 'Ask anything...', enabled: true, order: 0 },
        { id: 'ph_2', text: 'Track my order...', enabled: true, order: 1 },
        { id: 'ph_3', text: 'Talk to support...', enabled: true, order: 2 }
    ],
    showStats: true,
    showLatestFAQ: false,
    showGreeting: true
};

export function HomePageDesigner({ config, orgId }: HomePageDesignerProps) {
    const [homeConfig, setHomeConfig] = useState<HomeConfig>(defaultHomeConfig);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [draggedPlaceholder, setDraggedPlaceholder] = useState<string | null>(null);
    const [draggedSuggestion, setDraggedSuggestion] = useState<string | null>(null);

    const loadConfig = async () => {
        try {
            // Using 'default_bot' for now
            const apiConfig = await botConfigService.getBotConfig('default_bot');
            if (apiConfig && apiConfig.homeConfig) {
                setHomeConfig(prev => ({
                    ...prev,
                    ...apiConfig.homeConfig
                }));
            }
        } catch (e) {
            console.error('Failed to load home config:', e);
            toast({
                title: "⚠️ Could not load config",
                description: "Using default configuration",
                variant: "destructive"
            });
        }
    };

    useEffect(() => {
        loadConfig();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await botConfigService.saveBotConfig('default_bot', {
                homeConfig,
                orgId
            });
            toast({
                title: "✅ Home Page Saved!",
                description: "Your home page design is updated"
            });
            setIsEditMode(false);
        } catch (error) {
            toast({
                title: "❌ Error",
                description: "Failed to save configuration",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const addPlaceholder = () => {
        const newPlaceholder: Placeholder = {
            id: `ph_${Date.now()}`,
            text: '', // Empty for UX
            enabled: true,
            order: homeConfig.placeholders.length
        };
        setHomeConfig(prev => ({
            ...prev,
            placeholders: [...prev.placeholders, newPlaceholder]
        }));
    };

    const updatePlaceholder = (id: string, updates: Partial<Placeholder>) => {
        setHomeConfig(prev => ({
            ...prev,
            placeholders: prev.placeholders.map(p => p.id === id ? { ...p, ...updates } : p)
        }));
    };

    const deletePlaceholder = (id: string) => {
        setHomeConfig(prev => ({
            ...prev,
            placeholders: prev.placeholders.filter(p => p.id !== id)
        }));
    };

    const handlePlaceholderDragStart = (id: string) => {
        setDraggedPlaceholder(id);
    };

    const handlePlaceholderDragOver = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedPlaceholder || draggedPlaceholder === targetId) return;

        const items = [...homeConfig.placeholders];
        const draggedIndex = items.findIndex(p => p.id === draggedPlaceholder);
        const targetIndex = items.findIndex(p => p.id === targetId);

        const [removed] = items.splice(draggedIndex, 1);
        items.splice(targetIndex, 0, removed);

        items.forEach((item, index) => {
            item.order = index;
        });

        setHomeConfig(prev => ({ ...prev, placeholders: items }));
    };

    const handleDragEnd = () => {
        setDraggedPlaceholder(null);
        setDraggedSuggestion(null);
    };

    // Suggestion Handlers
    const addSuggestion = () => {
        const newSuggestion: Suggestion = {
            id: `sug_${Date.now()}`,
            icon: '🔍',
            text: '', // Empty for UX
            enabled: true,
            order: homeConfig.suggestions.length
        };
        setHomeConfig(prev => ({
            ...prev,
            suggestions: [...prev.suggestions, newSuggestion]
        }));
    };

    const updateSuggestion = (id: string, updates: Partial<Suggestion>) => {
        setHomeConfig(prev => ({
            ...prev,
            suggestions: prev.suggestions.map(s => s.id === id ? { ...s, ...updates } : s)
        }));
    };

    const deleteSuggestion = (id: string) => {
        setHomeConfig(prev => ({
            ...prev,
            suggestions: prev.suggestions.filter(s => s.id !== id)
        }));
    };

    const handleSuggestionDragStart = (id: string) => {
        setDraggedSuggestion(id);
    };

    const handleSuggestionDragOver = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedSuggestion || draggedSuggestion === targetId) return;

        const items = [...homeConfig.suggestions];
        const draggedIndex = items.findIndex(s => s.id === draggedSuggestion);
        const targetIndex = items.findIndex(s => s.id === targetId);

        const [removed] = items.splice(draggedIndex, 1);
        items.splice(targetIndex, 0, removed);

        items.forEach((item, index) => {
            item.order = index;
        });

        setHomeConfig(prev => ({ ...prev, suggestions: items }));
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center px-8 py-6 border-b border-white/5">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-blue-400" />
                        Home Page Designer
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">Design your widget's landing screen</p>
                </div>
                <div className="flex gap-2">
                    {isEditMode ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsEditMode(false);
                                    loadConfig(); // Revert changes
                                }}
                                className="border-white/20 hover:bg-white/10"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </>
                    ) : (
                        <Button
                            onClick={() => setIsEditMode(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
                        >
                            <span className="mr-2">
                                <Edit className="w-4 h-4 mr-2" />

                            </span>
                            Edit Configuration
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-8">
                <div className="max-w-4xl mx-auto space-y-8">

                    {/* Hero Section */}
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <h4 className="text-lg font-semibold text-white mb-4">Hero Section</h4>

                        <div className="space-y-4">
                            <div>
                                <Label className="text-slate-300 mb-2">Welcome Title</Label>
                                <Input
                                    value={homeConfig.hero.title}
                                    onChange={(e) => setHomeConfig(prev => ({
                                        ...prev,
                                        hero: { ...prev.hero, title: e.target.value }
                                    }))}
                                    placeholder="Welcome to our support"
                                    maxLength={60}
                                    className="bg-black/40 border-white/20 text-white"
                                    disabled={!isEditMode}
                                />
                            </div>

                            <div>
                                <Label className="text-slate-300 mb-2">Subtitle</Label>
                                <Textarea
                                    value={homeConfig.hero.subtitle}
                                    onChange={(e) => setHomeConfig(prev => ({
                                        ...prev,
                                        hero: { ...prev.hero, subtitle: e.target.value }
                                    }))}
                                    placeholder="How can we help you today?"
                                    maxLength={150}
                                    rows={2}
                                    className="bg-black/40 border-white/20 text-white resize-none focus-visible:ring-blue-500/50 focus-visible:border-blue-500/50"
                                    disabled={!isEditMode}
                                />
                            </div>

                        </div>
                    </div>

                    {/* Suggestions Builder */}
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h4 className="text-lg font-semibold text-white">Search Suggestions</h4>
                                <p className="text-sm text-slate-400 mt-1">Tags shown under the search bar</p>
                            </div>
                            <Button
                                onClick={addSuggestion}
                                disabled={!isEditMode || homeConfig.suggestions.length >= 6}
                                variant="outline"
                                className="border-white/20 hover:bg-white/10"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Tag
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {homeConfig.suggestions
                                .sort((a, b) => a.order - b.order)
                                .map((suggestion) => (
                                    <div
                                        key={suggestion.id}
                                        draggable
                                        onDragStart={() => handleSuggestionDragStart(suggestion.id)}
                                        onDragOver={(e) => handleSuggestionDragOver(e, suggestion.id)}
                                        onDragEnd={handleDragEnd}
                                        className={`bg-white/5 border border-white/10 rounded-xl p-4 transition-all ${draggedSuggestion === suggestion.id ? 'opacity-50' : 'opacity-100'
                                            } ${suggestion.enabled ? '' : 'opacity-60'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <GripVertical className="w-5 h-5 text-slate-500 cursor-grab" />

                                            {/* Icon/Emoji Input - Using simple input for now as users often paste emojis */}
                                            <Input
                                                value={suggestion.icon}
                                                onChange={(e) => updateSuggestion(suggestion.id, { icon: e.target.value })}
                                                className="bg-black/40 border-white/20 text-white w-16 text-center text-xl"
                                                placeholder="🔍"
                                                maxLength={4}
                                                disabled={!isEditMode}
                                            />

                                            {/* Text */}
                                            <Input
                                                value={suggestion.text}
                                                onChange={(e) => updateSuggestion(suggestion.id, { text: e.target.value })}
                                                placeholder="e.g. Order Status"
                                                className="bg-black/40 border-white/20 text-white flex-1"
                                                disabled={!isEditMode}
                                            />

                                            {/* Toggle & Delete */}
                                            {isEditMode && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => updateSuggestion(suggestion.id, { enabled: !suggestion.enabled })}
                                                        className={`p-2 rounded-lg transition-colors ${suggestion.enabled
                                                            ? 'text-green-400 hover:bg-green-400/10'
                                                            : 'text-slate-500 hover:bg-slate-700'
                                                            }`}
                                                    >
                                                        {suggestion.enabled ? <Eye size={18} /> : <EyeOff size={18} />}
                                                    </button>

                                                    <button
                                                        onClick={() => deleteSuggestion(suggestion.id)}
                                                        className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteSuggestion(suggestion.id)}
                                                        className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                            {homeConfig.suggestions.length === 0 && (
                                <div className="text-center py-8 text-slate-500">
                                    <Plus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No suggestions added. Add tags to prompt users!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Search Placeholders Builder */}
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h4 className="text-lg font-semibold text-white">Search Input Text</h4>
                                <p className="text-sm text-slate-400 mt-1">Typing text animation in search bar</p>
                            </div>
                            <Button
                                onClick={addPlaceholder}
                                disabled={!isEditMode || homeConfig.placeholders.length >= 8}
                                variant="outline"
                                className="border-white/20 hover:bg-white/10"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Text
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {homeConfig.placeholders
                                .sort((a, b) => a.order - b.order)
                                .map((placeholder) => (
                                    <div
                                        key={placeholder.id}
                                        draggable
                                        onDragStart={() => handlePlaceholderDragStart(placeholder.id)}
                                        onDragOver={(e) => handlePlaceholderDragOver(e, placeholder.id)}
                                        onDragEnd={handleDragEnd}
                                        className={`bg-white/5 border border-white/10 rounded-xl p-4 transition-all ${draggedPlaceholder === placeholder.id ? 'opacity-50' : 'opacity-100'
                                            } ${placeholder.enabled ? '' : 'opacity-60'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <GripVertical className="w-5 h-5 text-slate-500 cursor-grab" />

                                            {/* Text */}
                                            <Input
                                                value={placeholder.text}
                                                onChange={(e) => updatePlaceholder(placeholder.id, { text: e.target.value })}
                                                placeholder="e.g. Ask about pricing..."
                                                className="bg-black/40 border-white/20 text-white flex-1"
                                                maxLength={40}
                                                disabled={!isEditMode}
                                            />

                                            {/* Toggle & Delete */}
                                            {isEditMode && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => updatePlaceholder(placeholder.id, { enabled: !placeholder.enabled })}
                                                        className={`p-2 rounded-lg transition-colors ${placeholder.enabled
                                                            ? 'text-green-400 hover:bg-green-400/10'
                                                            : 'text-slate-500 hover:bg-slate-700'
                                                            }`}
                                                    >
                                                        {placeholder.enabled ? <Eye size={18} /> : <EyeOff size={18} />}
                                                    </button>

                                                    <button
                                                        onClick={() => deletePlaceholder(placeholder.id)}
                                                        className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => deletePlaceholder(placeholder.id)}
                                                        className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                            {homeConfig.placeholders.length === 0 && (
                                <div className="text-center py-8 text-slate-500">
                                    <Plus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No text added. Add phrases to engage users!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Display Options */}
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <h4 className="text-lg font-semibold text-white mb-4">Display Options</h4>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                <div>
                                    <Label className="text-white">Show Stats Preview</Label>
                                    <p className="text-xs text-slate-400 mt-1">Display company stats on home</p>
                                </div>
                                <button
                                    onClick={() => setHomeConfig(prev => ({ ...prev, showStats: !prev.showStats }))}
                                    disabled={!isEditMode}
                                    className={`relative inline-flex h-10 w-20 items-center rounded-full transition-all ${homeConfig.showStats ? 'bg-green-600' : 'bg-slate-700'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-8 w-8 transform rounded-full bg-white transition-transform ${homeConfig.showStats ? 'translate-x-11' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                <div>
                                    <Label className="text-white">Show Greeting</Label>
                                    <p className="text-xs text-slate-400 mt-1">"Good morning/afternoon"</p>
                                </div>
                                <button
                                    onClick={() => setHomeConfig(prev => ({ ...prev, showGreeting: !prev.showGreeting }))}
                                    disabled={!isEditMode}
                                    className={`relative inline-flex h-10 w-20 items-center rounded-full transition-all ${homeConfig.showGreeting ? 'bg-green-600' : 'bg-slate-700'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-8 w-8 transform rounded-full bg-white transition-transform ${homeConfig.showGreeting ? 'translate-x-11' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                <div>
                                    <Label className="text-white">Show Latest FAQ</Label>
                                    <p className="text-xs text-slate-400 mt-1">Display popular help articles</p>
                                </div>
                                <button
                                    onClick={() => setHomeConfig(prev => ({ ...prev, showLatestFAQ: !prev.showLatestFAQ }))}
                                    disabled={!isEditMode}
                                    className={`relative inline-flex h-10 w-20 items-center rounded-full transition-all ${homeConfig.showLatestFAQ ? 'bg-green-600' : 'bg-slate-700'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-8 w-8 transform rounded-full bg-white transition-transform ${homeConfig.showLatestFAQ ? 'translate-x-11' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
