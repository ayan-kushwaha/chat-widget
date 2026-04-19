"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Save, GripVertical, Plus, Trash2, Eye, EyeOff } from "lucide-react";

interface MenuNavigationTabProps {
    config: any;
    orgId: string;
}

interface MenuItem {
    id: string;
    type: 'faq' | 'form' | 'profile' | 'chat' | 'home';
    label: string;
    icon: string;
    enabled: boolean;
    order: number;
    formId?: string;
}

interface MenuConfig {
    startScreen: 'profile' | 'home' | 'chat';
    menuEnabled: boolean;
    items: MenuItem[];
}

const defaultConfig: MenuConfig = {
    startScreen: 'profile',
    menuEnabled: true,
    items: [
        { id: 'home', type: 'home', label: 'Home', icon: '🏠', enabled: true, order: 0 },
        { id: 'profile', type: 'profile', label: 'About Us', icon: 'ℹ️', enabled: true, order: 1 },
        { id: 'chat', type: 'chat', label: 'Chat', icon: '💬', enabled: true, order: 2 },
        { id: 'faq', type: 'faq', label: 'Help Center', icon: '❓', enabled: true, order: 3 },
        { id: 'contact', type: 'form', label: 'Contact Us', icon: '📝', enabled: true, order: 4, formId: 'contact_form' }
    ]
};

const AVAILABLE_ICONS = [
    '🏠', '💬', '❓', '📝', '📞', '📧', '🎯', '🚀', '💡', '⚡',
    '🎨', '📊', '🔧', '⚙️', '📱', '💻', '🌟', '🎉', '📅', '🔔', 'ℹ️'
];

const MENU_TYPE_OPTIONS = [
    { value: 'home', label: 'Home Dashboard', icon: '🏠' },
    { value: 'profile', label: 'About Us / Profile', icon: 'ℹ️' },
    { value: 'chat', label: 'Chat Interface', icon: '💬' },
    { value: 'faq', label: 'FAQ / Help', icon: '❓' },
    { value: 'form', label: 'Custom Form', icon: '📝' }
];

export function MenuNavigationTab({ config, orgId }: MenuNavigationTabProps) {
    const [menuConfig, setMenuConfig] = useState<MenuConfig>(defaultConfig);
    const [isSaving, setIsSaving] = useState(false);
    const [draggedItem, setDraggedItem] = useState<string | null>(null);
    const [showIconPicker, setShowIconPicker] = useState<string | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('cluaiz-menu-navigation-config');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);

                // --- SELF-REPAIR LOGIC ---
                // If the saved config is missing 'home' or 'chat', we inject them to update the user's config
                // to the new standard without deleting their existing modifications.
                const existingIds = new Set((parsed.items || []).map((i: any) => i.id));
                const newItems = [...(parsed.items || [])];

                // Add Home if missing
                if (!existingIds.has('home')) {
                    newItems.unshift({ id: 'home', type: 'home', label: 'Home', icon: '🏠', enabled: true, order: 0 });
                }

                // Add Chat if missing
                if (!existingIds.has('chat')) {
                    // Try to insert after Home
                    const insertIdx = newItems.findIndex(i => i.id === 'home') + 1 || 0;
                    newItems.splice(insertIdx, 0, { id: 'chat', type: 'chat', label: 'Chat', icon: '💬', enabled: true, order: 1 });
                }

                // Add Profile if missing (rare but possible if user deleted it)
                if (!existingIds.has('profile')) {
                    newItems.splice(1, 0, { id: 'profile', type: 'profile', label: 'About Us', icon: 'ℹ️', enabled: true, order: 2 });
                }

                parsed.items = newItems;
                setMenuConfig(parsed);
            } catch (e) {
                console.error('Failed to load menu config:', e);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('cluaiz-menu-navigation-config', JSON.stringify(menuConfig));
    }, [menuConfig]);

    const updateStartScreen = (screen: 'profile') => {
        setMenuConfig(prev => ({ ...prev, startScreen: screen }));
    };

    const toggleMenuEnabled = () => {
        setMenuConfig(prev => ({ ...prev, menuEnabled: !prev.menuEnabled }));
    };

    const updateMenuItem = (id: string, updates: Partial<MenuItem>) => {
        setMenuConfig(prev => ({
            ...prev,
            items: prev.items.map(item =>
                item.id === id ? { ...item, ...updates } : item
            )
        }));
    };

    const toggleItemEnabled = (id: string) => {
        setMenuConfig(prev => ({
            ...prev,
            items: prev.items.map(item =>
                item.id === id ? { ...item, enabled: !item.enabled } : item
            )
        }));
    };

    const deleteMenuItem = (id: string) => {
        setMenuConfig(prev => ({
            ...prev,
            items: prev.items.filter(item => item.id !== id)
        }));
    };

    const addMenuItem = () => {
        const newItem: MenuItem = {
            id: `item_${Date.now()}`,
            type: 'profile',
            label: 'New Item',
            icon: '⭐',
            enabled: true,
            order: menuConfig.items.length
        };
        setMenuConfig(prev => ({
            ...prev,
            items: [...prev.items, newItem]
        }));
    };

    const handleDragStart = (id: string) => {
        setDraggedItem(id);
    };

    const handleDragOver = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedItem || draggedItem === targetId) return;

        const items = [...menuConfig.items];
        const draggedIndex = items.findIndex(item => item.id === draggedItem);
        const targetIndex = items.findIndex(item => item.id === targetId);

        const [removed] = items.splice(draggedIndex, 1);
        items.splice(targetIndex, 0, removed);

        // Update order
        items.forEach((item, index) => {
            item.order = index;
        });

        setMenuConfig(prev => ({ ...prev, items }));
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            toast({
                title: "✅ Menu Configuration Saved!",
                description: "Your widget navigation is updated"
            });
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

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center w-full px-8 py-6 border-b border-white/5">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Menu & Navigation
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Configure your widget's navigation system</p>
                </div>

                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-6 rounded-xl text-base font-semibold shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300"
                >
                    <Save className="w-5 h-5 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Configuration'}
                </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-8 py-8">
                <div className="max-w-5xl mx-auto space-y-8">

                    {/* Start Screen Selection - REMOVED as Home/Chat are gone */}
                    {/* <div className="bg-white/5 p-6 rounded-2xl border border-white/10"> ... </div> */}

                    {/* Menu Toggle */}
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-1">Enable Navigation Menu</h3>
                                <p className="text-slate-400 text-sm">Show hamburger menu for view switching</p>
                            </div>
                            <button
                                onClick={toggleMenuEnabled}
                                className={`relative inline-flex h-14 w-28 items-center rounded-full transition-all duration-300 ${menuConfig.menuEnabled
                                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg shadow-green-500/50'
                                    : 'bg-slate-700'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-10 w-10 transform rounded-full bg-white transition-transform duration-300 ${menuConfig.menuEnabled ? 'translate-x-16' : 'translate-x-2'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Menu Items */}
                    {menuConfig.menuEnabled && (
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-1">Menu Items</h3>
                                    <p className="text-slate-400 text-sm">Drag to reorder, click to edit</p>
                                </div>
                                <Button
                                    onClick={addMenuItem}
                                    variant="outline"
                                    className="border-white/20 hover:bg-white/10"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Item
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {menuConfig.items
                                    .sort((a, b) => a.order - b.order)
                                    .map((item) => (
                                        <div
                                            key={item.id}
                                            draggable
                                            onDragStart={() => handleDragStart(item.id)}
                                            onDragOver={(e) => handleDragOver(e, item.id)}
                                            onDragEnd={handleDragEnd}
                                            className={`bg-white/5 border border-white/10 rounded-xl p-4 transition-all ${draggedItem === item.id ? 'opacity-50' : 'opacity-100'
                                                } ${item.enabled ? '' : 'opacity-60'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <GripVertical className="w-5 h-5 text-slate-500 cursor-grab" />

                                                <div className="relative">
                                                    <button
                                                        onClick={() => setShowIconPicker(showIconPicker === item.id ? null : item.id)}
                                                        className="text-3xl hover:scale-110 transition-transform"
                                                    >
                                                        {item.icon}
                                                    </button>

                                                    {showIconPicker === item.id && (
                                                        <div className="absolute top-full left-0 mt-2 p-3 bg-slate-800 border border-white/20 rounded-xl shadow-2xl z-50 grid grid-cols-5 gap-2">
                                                            {AVAILABLE_ICONS.map((icon) => (
                                                                <button
                                                                    key={icon}
                                                                    onClick={() => {
                                                                        updateMenuItem(item.id, { icon });
                                                                        setShowIconPicker(null);
                                                                    }}
                                                                    className="text-2xl hover:scale-125 transition-transform p-1"
                                                                >
                                                                    {icon}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 grid grid-cols-2 gap-3">
                                                    <Input
                                                        value={item.label}
                                                        onChange={(e) => updateMenuItem(item.id, { label: e.target.value })}
                                                        placeholder="Label"
                                                        className="bg-black/40 border-white/20 text-white"
                                                    />

                                                    <select
                                                        value={item.type}
                                                        onChange={(e) => updateMenuItem(item.id, { type: e.target.value as any })}
                                                        className="bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white"
                                                    >
                                                        {MENU_TYPE_OPTIONS.map(option => (
                                                            <option key={option.value} value={option.value}>
                                                                {option.icon} {option.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => toggleItemEnabled(item.id)}
                                                        className={`p-2 rounded-lg transition-colors ${item.enabled
                                                            ? 'text-green-400 hover:bg-green-400/10'
                                                            : 'text-slate-500 hover:bg-slate-700'
                                                            }`}
                                                    >
                                                        {item.enabled ? <Eye size={18} /> : <EyeOff size={18} />}
                                                    </button>

                                                    <button
                                                        onClick={() => deleteMenuItem(item.id)}
                                                        className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>

                                            {item.type === 'form' && (
                                                <div className="mt-3 pl-12">
                                                    <Label className="text-xs text-slate-400 mb-2 block">Form ID</Label>
                                                    <Input
                                                        value={item.formId || ''}
                                                        onChange={(e) => updateMenuItem(item.id, { formId: e.target.value })}
                                                        placeholder="contact_form"
                                                        className="bg-black/40 border-white/20 text-white text-sm"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
