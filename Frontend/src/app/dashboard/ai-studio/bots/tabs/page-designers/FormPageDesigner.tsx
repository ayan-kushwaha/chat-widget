"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import {
    Save, Plus, Trash2, GripVertical, FileText,
    Settings, Shield, Star, Heart, Zap, Target, Search, Folder,
    MessageCircleQuestion, CheckCircle, X, Edit, MousePointer2,
    HelpCircle, Info, Book, Scissors, Link, Activity, BarChart,
    PieChart, Home, Menu, Smile, Frown, Meh, ThumbsDown,
    Volume2, Video, Image, Music, File, Tag, Bookmark, Flag,
    Bot, Smartphone, Tablet, Monitor, Cpu, Database, Wifi, Signal
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface FormPageDesignerProps {
    config: any;
    orgId: string;
}

interface FormItem {
    id: string;
    templateId: string; // ID of the underlying form structure (e.g., 'contact', 'support')
    title: string;
    description: string;
    icon: string;
    order: number;
    enabled: boolean;
}

interface FormPageConfig {
    pageTitle: string;
    description: string;
    items: FormItem[];
}

// Available Form Templates
const FORM_TEMPLATES = [
    { id: 'contact_form', name: 'Contact Us', type: 'General' },
    { id: 'support_ticket', name: 'Support Ticket', type: 'Support' },
    { id: 'feedback_survey', name: 'Feedback Survey', type: 'Feedback' },
    { id: 'quote_request', name: 'Quote Request', type: 'Sales' },
    { id: 'newsletter', name: 'Newsletter Signup', type: 'Marketing' }
];

// Icons List (Reused for consistency)
const FORM_ICONS = [
    { value: 'file', label: 'Form', Icon: FileText },
    { value: 'help', label: 'Help', Icon: HelpCircle },
    { value: 'info', label: 'Info', Icon: Info },
    { value: 'book', label: 'Guide', Icon: Book },
    { value: 'settings', label: 'Settings', Icon: Settings },
    { value: 'shield', label: 'Security', Icon: Shield },
    { value: 'star', label: 'Star', Icon: Star },
    { value: 'heart', label: 'Heart', Icon: Heart },
    { value: 'zap', label: 'Zap', Icon: Zap },
    { value: 'target', label: 'Target', Icon: Target },
    { value: 'search', label: 'Search', Icon: Search },
    { value: 'folder', label: 'Folder', Icon: Folder },
    { value: 'bot', label: 'Bot', Icon: Bot },
    { value: 'cut', label: 'Cut', Icon: Scissors },
    { value: 'link', label: 'Link', Icon: Link },
    { value: 'activity', label: 'Activity', Icon: Activity },
    { value: 'chart', label: 'Chart', Icon: BarChart },
    { value: 'pie', label: 'Pie', Icon: PieChart },
    { value: 'home', label: 'Home', Icon: Home },
    { value: 'menu', label: 'Menu', Icon: Menu },
    { value: 'smile', label: 'Smile', Icon: Smile },
    { value: 'tag', label: 'Tag', Icon: Tag },
    { value: 'bookmark', label: 'Bookmark', Icon: Bookmark },
    { value: 'flag', label: 'Flag', Icon: Flag },
    { value: 'wifi', label: 'Wifi', Icon: Wifi },
    { value: 'database', label: 'Data', Icon: Database },
    { value: 'cpu', label: 'Tech', Icon: Cpu }
];

import { botConfigService } from "@/services/bot-config.service";
import defaultData from "./default-data.json";

export function FormPageDesigner({ config, orgId }: FormPageDesignerProps) {
    const [pageConfig, setPageConfig] = useState<FormPageConfig>(defaultData.form as unknown as FormPageConfig);
    const [isSaving, setIsSaving] = useState(false);
    const [isGlobalEditing, setIsGlobalEditing] = useState(false);
    const [draggedItem, setDraggedItem] = useState<string | null>(null);

    const loadConfig = async () => {
        try {
            // Using 'default_bot' for now
            const apiConfig = await botConfigService.getBotConfig('default_bot');
            if (apiConfig && apiConfig.formConfig) {
                const parsed = { ...defaultData.form, ...apiConfig.formConfig } as FormPageConfig;
                // Migration/Fallback if structure changed
                if (!parsed.items || !Array.isArray(parsed.items)) {
                    // Convert old single-select structure to list if needed, or reset
                    parsed.items = defaultData.form.items;
                }
                setPageConfig(parsed);
            }
        } catch (e) {
            console.error('Failed to load form page config:', e);
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
                formConfig: pageConfig,
                orgId
            });
            toast({
                title: "✅ Configuration Saved!",
                description: "Your form settings have been updated."
            });
            setIsGlobalEditing(false);
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

    // Helper to get used template IDs
    const usedTemplateIds = pageConfig.items.map(i => i.templateId);

    // Item Management
    const addItem = () => {
        // Find first unused template
        const unusedTemplate = FORM_TEMPLATES.find(t => !usedTemplateIds.includes(t.id));

        // If all used, fallback to first (user will see it's a duplicate and can change, or we can block)
        // But better to pick a unique one if possible.
        const defaultTemplateId = unusedTemplate ? unusedTemplate.id : FORM_TEMPLATES[0].id; // Fallback to first if all used

        const newItem: FormItem = {
            id: `frm_${Date.now()}`,
            templateId: defaultTemplateId,
            title: unusedTemplate ? unusedTemplate.name : 'New Form',
            description: 'Description of this form',
            icon: 'file',
            order: pageConfig.items.length,
            enabled: true
        };
        setPageConfig(prev => ({
            ...prev,
            items: [...prev.items, newItem]
        }));
    };

    const updateItem = (id: string, updates: Partial<FormItem>) => {
        setPageConfig(prev => ({
            ...prev,
            items: prev.items.map(item => item.id === id ? { ...item, ...updates } : item)
        }));
    };

    const deleteItem = (id: string) => {
        setPageConfig(prev => ({
            ...prev,
            items: prev.items.filter(item => item.id !== id)
        }));
    };

    // Drag (same logic as FAQ)
    const handleDragStart = (id: string) => {
        if (!isGlobalEditing) return;
        setDraggedItem(id);
    };

    const handleDragOver = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!isGlobalEditing || !draggedItem || draggedItem === targetId) return;

        const items = [...pageConfig.items];
        const draggedIndex = items.findIndex(item => item.id === draggedItem);
        const targetIndex = items.findIndex(item => item.id === targetId);

        const [removed] = items.splice(draggedIndex, 1);
        items.splice(targetIndex, 0, removed);
        items.forEach((item, index) => item.order = index);

        setPageConfig(prev => ({ ...prev, items }));
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center w-full px-8 py-6 border-b border-white/5">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
                        Form Page
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Manage the forms available in your widget</p>
                </div>

                <div className="flex gap-2">
                    {!isGlobalEditing ? (
                        <Button
                            onClick={() => setIsGlobalEditing(true)}
                            className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-xl shadow-lg shadow-pink-500/20"
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
                                className="bg-pink-600 hover:bg-pink-700 px-6 py-2 rounded-xl font-semibold shadow-lg shadow-pink-500/20"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className={`flex-1 overflow-y-auto px-8 py-8 ${!isGlobalEditing ? 'opacity-90 pointer-events-none' : ''}`}>
                <div className="max-w-4xl mx-auto space-y-8">

                    {/* General Settings */}
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-slate-400" />
                            Page Settings
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-2">
                            <div>
                                <Label className="text-slate-300 mb-2">Page Title</Label>
                                <Input
                                    value={pageConfig.pageTitle}
                                    onChange={(e) => setPageConfig(prev => ({ ...prev, pageTitle: e.target.value }))}
                                    className="bg-black/40 border-white/20 text-white disabled:opacity-50"
                                    placeholder="Forms"
                                    disabled={!isGlobalEditing}
                                />
                            </div>
                            <div>
                                <Label className="text-slate-300 mb-2">Description</Label>
                                <Textarea
                                    value={pageConfig.description}
                                    onChange={(e) => setPageConfig(prev => ({ ...prev, description: e.target.value }))}
                                    className="bg-black/20 border-white/10 resize-none text-slate-300 min-h-[80px] p-4 focus-visible:ring-blue-500/20 rounded-lg disabled:opacity-80"
                                    placeholder="Select a form below..."
                                    disabled={!isGlobalEditing}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Form List */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-white">Available Forms</h3>
                            {isGlobalEditing && (
                                <Button
                                    onClick={addItem}
                                    disabled={usedTemplateIds.length >= FORM_TEMPLATES.length}
                                    variant="outline"
                                    className="border-white/20 hover:bg-white/10 text-slate-200 disabled:opacity-50"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    {usedTemplateIds.length >= FORM_TEMPLATES.length ? 'Limit Reached' : 'Add Form'}
                                </Button>
                            )}
                        </div>

                        {pageConfig.items.length === 0 ? (
                            <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10 border-dashed">
                                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-400">No forms added. {isGlobalEditing ? 'Click "Add Form" to start.' : ''}</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pageConfig.items.map((item, index) => (
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
                                                    <div className="w-5 h-5" />
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
                                                            className={`relative group w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center transition-all ${isGlobalEditing ? 'hover:border-blue-500/50 cursor-pointer' : 'cursor-default opacity-80'}`}
                                                        >
                                                            {(() => {
                                                                const IconComp = FORM_ICONS.find(i => i.value === item.icon)?.Icon || FileText;
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
                                                            {FORM_ICONS.map((iconOpt) => (
                                                                <DropdownMenuItem
                                                                    key={iconOpt.value}
                                                                    onClick={() => updateItem(item.id, { icon: iconOpt.value })}
                                                                    className={`flex flex-col items-center justify-center p-2 cursor-pointer rounded-lg transition-colors aspect-square ${item.icon === iconOpt.value ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/10 text-slate-400 hover:text-white'}`}
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
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs text-slate-500">Form Template</Label>
                                                        <Select
                                                            disabled={!isGlobalEditing}
                                                            value={item.templateId}
                                                            onValueChange={(val) => updateItem(item.id, { templateId: val })}
                                                        >
                                                            <SelectTrigger className="w-full bg-black/40 border-white/10 text-white h-10 disabled:opacity-80">
                                                                <SelectValue placeholder="Select Template" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-slate-900 border-white/10 text-white">
                                                                {FORM_TEMPLATES.map(tmpl => {
                                                                    // Check if this template is used by OTHER items
                                                                    const isUsed = pageConfig.items.some(i => i.templateId === tmpl.id && i.id !== item.id);

                                                                    return (
                                                                        <SelectItem
                                                                            key={tmpl.id}
                                                                            value={tmpl.id}
                                                                            disabled={isUsed}
                                                                            className={`cursor-pointer ${isUsed ? 'opacity-50' : ''}`}
                                                                        >
                                                                            <span className="font-medium text-white">
                                                                                {tmpl.name}
                                                                                {isUsed && " (Already Added)"}
                                                                            </span>
                                                                            <span className="text-xs text-slate-500 ml-2">({tmpl.type})</span>
                                                                        </SelectItem>
                                                                    );
                                                                })}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs text-slate-500">Label/Title</Label>
                                                        <Input
                                                            value={item.title}
                                                            onChange={(e) => updateItem(item.id, { title: e.target.value })}
                                                            placeholder="Display Name"
                                                            disabled={!isGlobalEditing}
                                                            className="bg-black/40 border-white/10 text-white h-10 disabled:opacity-80"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <Label className="text-xs text-slate-500">Description</Label>
                                                    <Textarea
                                                        value={item.description}
                                                        onChange={(e) => updateItem(item.id, { description: e.target.value })}
                                                        placeholder="Short description for the user..."
                                                        disabled={!isGlobalEditing}
                                                        className="bg-black/20 border-white/10 resize-none text-slate-300 min-h-[80px] p-4 focus-visible:ring-blue-500/20 rounded-lg disabled:opacity-80"
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
