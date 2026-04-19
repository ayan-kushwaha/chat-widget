"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import {
    Save, Plus, Trash2, GripVertical, HelpCircle,
    Info, Book, FileText, Settings, Shield, Star,
    Heart, Zap, Target, Search, Folder, MessageCircleQuestion,
    ChevronDown, ChevronUp, Edit, MousePointer2,
    Scissors, Link, Activity, BarChart, PieChart, Home, Menu, Smile, Frown, Meh, ThumbsDown,
    Volume2, Video, Image, Music, File, Tag, Bookmark, Flag, Bot, Smartphone, Tablet, Monitor, Cpu, Database, Wifi, Signal, CheckCircle, X
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FAQPageDesignerProps {
    config: any;
    orgId: string;
}

interface FAQItem {
    id: string;
    question: string;
    answer: string;
    icon: string;
    order: number;
    enabled: boolean;
}

interface FAQConfig {
    pageTitle: string;
    description: string;
    items: FAQItem[];
}

import { DEFAULT_FAQ_CONFIG } from "@/data/defaultWidgetConfig";

// Available icons for FAQ items - expanded list
const FAQ_ICONS = [
    { value: 'help', label: 'Help', Icon: HelpCircle },
    { value: 'info', label: 'Info', Icon: Info },
    { value: 'book', label: 'Guide', Icon: Book },
    { value: 'file', label: 'Doc', Icon: FileText },
    { value: 'settings', label: 'Settings', Icon: Settings },
    { value: 'shield', label: 'Security', Icon: Shield },
    { value: 'star', label: 'Star', Icon: Star },
    { value: 'heart', label: 'Heart', Icon: Heart },
    { value: 'zap', label: 'Zap', Icon: Zap },
    { value: 'target', label: 'Target', Icon: Target },
    { value: 'search', label: 'Search', Icon: Search },
    { value: 'folder', label: 'Folder', Icon: Folder },
    { value: 'bot', label: 'Bot / AI', Icon: Bot },
    { value: 'cut', label: 'Cut / Scissors', Icon: Scissors },
    { value: 'link', label: 'Link', Icon: Link },
    { value: 'activity', label: 'Activity', Icon: Activity },
    { value: 'chart', label: 'Chart', Icon: BarChart },
    { value: 'pie', label: 'Pie Chart', Icon: PieChart },
    { value: 'home', label: 'Home', Icon: Home },
    { value: 'menu', label: 'Menu', Icon: Menu },
    { value: 'smile', label: 'Smile', Icon: Smile },
    { value: 'tag', label: 'Tag', Icon: Tag },
    { value: 'bookmark', label: 'Bookmark', Icon: Bookmark },
    { value: 'flag', label: 'Flag', Icon: Flag },
    { value: 'wifi', label: 'Wifi', Icon: Wifi },
    { value: 'database', label: 'Database', Icon: Database },
    { value: 'cpu', label: 'Technology', Icon: Cpu }
];

import { botConfigService } from "@/services/bot-config.service";
import defaultData from "./default-data.json";

export function FAQPageDesigner({ config, orgId }: FAQPageDesignerProps) {
    const [faqConfig, setFaqConfig] = useState<FAQConfig>(defaultData.faq as FAQConfig);
    const [isSaving, setIsSaving] = useState(false);
    const [isGlobalEditing, setIsGlobalEditing] = useState(false);
    const [draggedItem, setDraggedItem] = useState<string | null>(null);

    const loadConfig = async () => {
        try {
            // Using 'default_bot' for now
            const apiConfig = await botConfigService.getBotConfig('default_bot');
            if (apiConfig && apiConfig.faqConfig) {
                const parsed = { ...defaultData.faq, ...apiConfig.faqConfig } as FAQConfig;
                // Ensure backward compatibility
                if (!parsed.items) parsed.items = [];
                setFaqConfig(parsed);
            }
        } catch (e) {
            console.error('Failed to load FAQ config:', e);
            toast({
                title: "⚠️ Could not load config",
                description: "Using default configuration",
                variant: "destructive"
            });
        }
    };

    // Load from API on mount
    useEffect(() => {
        loadConfig();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await botConfigService.saveBotConfig('default_bot', {
                faqConfig,
                orgId
            });
            toast({
                title: "✅ FAQ Page Saved!",
                description: "Your Help Center content has been updated."
            });
            setIsGlobalEditing(false); // Return to View Mode
        } catch (error) {
            console.error(error);
            toast({
                title: "❌ Error",
                description: "Failed to save configuration",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setIsGlobalEditing(false);
        loadConfig();
        toast({ title: "Changes Discarded" });
    }

    // Item Management
    const addItem = () => {
        const newItem: FAQItem = {
            id: `faq_${Date.now()}`,
            question: '', // Empty for UX
            answer: '',   // Empty for UX
            icon: 'help',
            order: faqConfig.items.length,
            enabled: true
        };
        setFaqConfig(prev => ({
            ...prev,
            items: [...prev.items, newItem]
        }));
    };

    const updateItem = (id: string, updates: Partial<FAQItem>) => {
        setFaqConfig(prev => ({
            ...prev,
            items: prev.items.map(item => item.id === id ? { ...item, ...updates } : item)
        }));
    };

    const deleteItem = (id: string) => {
        setFaqConfig(prev => ({
            ...prev,
            items: prev.items.filter(item => item.id !== id)
        }));
    };

    // Drag and Drop
    const handleDragStart = (id: string) => {
        if (!isGlobalEditing) return;
        setDraggedItem(id);
    };

    const handleDragOver = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!isGlobalEditing || !draggedItem || draggedItem === targetId) return;

        const items = [...faqConfig.items];
        const draggedIndex = items.findIndex(item => item.id === draggedItem);
        const targetIndex = items.findIndex(item => item.id === targetId);

        const [removed] = items.splice(draggedIndex, 1);
        items.splice(targetIndex, 0, removed);

        // Update order
        items.forEach((item, index) => item.order = index);

        setFaqConfig(prev => ({ ...prev, items }));
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center w-full px-8 py-6 border-b border-white/5">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                        FAQ & Help Page
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Design your help center content</p>
                </div>

                <div className="flex gap-2">
                    {!isGlobalEditing ? (
                        <Button
                            onClick={() => setIsGlobalEditing(true)}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl shadow-lg shadow-orange-500/20"
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Configuration
                        </Button>
                    ) : (
                        <>
                            <Button
                                onClick={handleCancel}
                                variant="outline"
                                className="border-white/20 hover:bg-white/10 text-slate-300"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Content Content Scroller */}
            <div className={`flex-1 overflow-y-auto px-8 py-8 ${!isGlobalEditing ? 'opacity-90 pointer-events-none' : ''}`}>
                <div className="max-w-4xl mx-auto space-y-8">

                    {/* Page Settings */}
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-slate-400" />
                            General Settings
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-2">
                            <div>
                                <Label className="text-slate-300 mb-2">Page Title</Label>
                                <Input
                                    value={faqConfig.pageTitle}
                                    onChange={(e) => setFaqConfig(prev => ({ ...prev, pageTitle: e.target.value }))}
                                    className="bg-black/40 border-white/20 text-white disabled:opacity-50"
                                    placeholder="Help Center"
                                    disabled={!isGlobalEditing}
                                />
                            </div>
                            <div>
                                <Label className="text-slate-300 mb-2">Description</Label>
                                <Textarea
                                    value={faqConfig.description}
                                    onChange={(e) => setFaqConfig(prev => ({ ...prev, description: e.target.value }))}
                                    className="bg-black/20 border-white/10 resize-none text-slate-300 min-h-[80px] p-4 focus-visible:ring-orange-500/20 rounded-lg disabled:opacity-80"
                                    placeholder="Brief description..."
                                    disabled={!isGlobalEditing}
                                />
                            </div>
                        </div>
                    </div>

                    {/* FAQ Builder */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-white">Questions & Answers</h3>
                            {isGlobalEditing && (
                                <Button onClick={addItem} variant="outline" className="border-white/20 hover:bg-white/10 text-slate-200">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Question
                                </Button>
                            )}
                        </div>

                        {faqConfig.items.length === 0 ? (
                            <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10 border-dashed">
                                <MessageCircleQuestion className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-400">No FAQs added yet. {isGlobalEditing ? 'Click "Add Question" to start.' : ''}</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {faqConfig.items.map((item, index) => (
                                    <div
                                        key={item.id}
                                        draggable={isGlobalEditing}
                                        onDragStart={() => handleDragStart(item.id)}
                                        onDragOver={(e) => handleDragOver(e, item.id)}
                                        onDragEnd={handleDragEnd}
                                        className={`bg-white/5 border border-white/10 rounded-xl p-4 transition-all hover:bg-white/[0.07] ${draggedItem === item.id ? 'opacity-50' : 'opacity-100'} ${!isGlobalEditing ? 'cursor-default' : ''}`}
                                    >
                                        <div className="flex gap-4">
                                            {/* Drag Handle & Index */}
                                            <div className="flex flex-col items-center justify-start py-2 gap-2">
                                                {isGlobalEditing ? (
                                                    <GripVertical className="w-5 h-5 text-slate-600 cursor-grab hover:text-slate-400" />
                                                ) : (
                                                    <div className="w-5 h-5" /> // Spacer
                                                )}
                                                <span className="text-xs font-mono text-slate-500">#{index + 1}</span>
                                            </div>

                                            {/* Icon Selector */}
                                            <div className="flex flex-col gap-2">
                                                <Label className="text-slate-400 text-xs text-center">Icon</Label>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild disabled={!isGlobalEditing}>
                                                        <button
                                                            disabled={!isGlobalEditing}
                                                            className={`relative group w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center transition-all ${isGlobalEditing ? 'hover:border-orange-500/50 cursor-pointer' : 'cursor-default opacity-80'}`}
                                                        >
                                                            {(() => {
                                                                const IconComp = FAQ_ICONS.find(i => i.value === item.icon)?.Icon || HelpCircle;
                                                                return <IconComp className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />;
                                                            })()}

                                                            {/* Hover Overlay */}
                                                            {isGlobalEditing && (
                                                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl backdrop-blur-[1px]">
                                                                    <MousePointer2 className="w-4 h-4 text-white" />
                                                                </div>
                                                            )}
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start" className="w-64 bg-slate-900 border-white/10 text-white max-h-80 overflow-y-auto p-2">
                                                        <div className="grid grid-cols-4 gap-1">
                                                            {FAQ_ICONS.map((iconOpt) => (
                                                                <DropdownMenuItem
                                                                    key={iconOpt.value}
                                                                    onClick={() => updateItem(item.id, { icon: iconOpt.value })}
                                                                    className={`flex flex-col items-center justify-center p-2 cursor-pointer rounded-lg transition-colors aspect-square ${item.icon === iconOpt.value ? 'bg-orange-500/20 text-orange-400' : 'hover:bg-white/10 text-slate-400 hover:text-white'}`}
                                                                >
                                                                    <iconOpt.Icon className="w-5 h-5 mb-1" />
                                                                </DropdownMenuItem>
                                                            ))}
                                                        </div>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            {/* Content Fields */}
                                            <div className="flex-1 space-y-3">
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-slate-500">Question</Label>
                                                    <Input
                                                        value={item.question}
                                                        onChange={(e) => updateItem(item.id, { question: e.target.value })}
                                                        placeholder="e.g. How do I reset my password?"
                                                        disabled={!isGlobalEditing}
                                                        className="font-medium text-lg bg-black/20 border-white/10 p-4 h-auto focus-visible:ring-orange-500/20 text-white placeholder:text-slate-600 rounded-lg disabled:opacity-80"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-slate-500">Answer</Label>
                                                    <Textarea
                                                        value={item.answer}
                                                        onChange={(e) => updateItem(item.id, { answer: e.target.value })}
                                                        placeholder="Provide a helpful answer..."
                                                        disabled={!isGlobalEditing}
                                                        className="bg-black/20 border-white/10 resize-none text-slate-300 min-h-[80px] p-4 focus-visible:ring-orange-500/20 rounded-lg disabled:opacity-80"
                                                    />
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            {isGlobalEditing && (
                                                <div className="flex flex-col gap-2 pt-6">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => deleteItem(item.id)}
                                                        className="w-8 h-8 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
