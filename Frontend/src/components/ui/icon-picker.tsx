"use client";

import React, { useState, useMemo, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { Search, X, Palette } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// ----------------------------------------------------------------------
// Curated Icon Categories
// ----------------------------------------------------------------------
const ICON_CATEGORIES: any = {
    "AI & Models": [
        "Bot", "Brain", "Sparkles", "Cpu", "Microchip", "CircuitBoard", "Wand2", "Zap",
        "Fingerprint", "ScanFace", "Eye", "ToyBrick", "Component", "Workflow", "Network"
    ],
    "Social & Media": [
        "Twitter", "Facebook", "Instagram", "Linkedin", "Youtube", "Github", "Twitch",
        "MessageCircle", "MessageSquare", "Mail", "Send", "Share2", "Globe", "Cast",
        "Image", "Video", "Mic", "Music", "Play", "Camera", "Film"
    ],
    "Automation": [
        "Workflow", "GitBranch", "GitCommit", "GitMerge", "GitPullRequest", "Webhook",
        "Layers", "Link", "Unlink", "RefreshCw", "Repeat", "Timer", "Clock", "PlayCircle",
        "StopCircle", "Power", "Activity", "Radio"
    ],
    "Tools & Tech": [
        "Settings", "Database", "Server", "HardDrive", "Cloud", "Code", "Terminal",
        "Command", "Hash", "Search", "Filter", "Sliders", "Wrench", "Hammer", "Construction",
        "Box", "Package", "Container", "Archive", "Trash2", "Save"
    ],
    "Business": [
        "Briefcase", "Building", "CreditCard", "DollarSign", "Euro", "PoundSterling",
        "Wallet", "ShoppingBag", "ShoppingCart", "Tag", "Percent", "TrendingUp",
        "BarChart", "PieChart", "LineChart", "Target", "Award", "Medal"
    ],
    "UI & Layout": [
        "Layout", "LayoutGrid", "LayoutList", "LayoutTemplate", "Sidebar", "Menu",
        "Home", "User", "Users", "UserPlus", "LogOut", "LogIn", "Lock", "Unlock",
        "Key", "Shield", "Check", "X", "Plus", "Minus", "Edit", "FileEdit"
    ]
};

// ----------------------------------------------------------------------
// Color Palette (Tailwind Classes to Hex/Class mapping if needed, or just Hex)
// ----------------------------------------------------------------------
const COLORS = [
    { name: "Slate", value: "text-slate-500", bg: "bg-slate-500/10", border: "border-slate-500/20" },
    // { name: "Gray", value: "text-gray-500", bg: "bg-gray-500/10", border: "border-gray-500/20" },
    // { name: "Zinc", value: "text-zinc-500", bg: "bg-zinc-500/10", border: "border-zinc-500/20" },
    { name: "Red", value: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
    { name: "Orange", value: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
    { name: "Amber", value: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    { name: "Yellow", value: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
    { name: "Lime", value: "text-lime-500", bg: "bg-lime-500/10", border: "border-lime-500/20" },
    { name: "Green", value: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
    { name: "Emerald", value: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { name: "Teal", value: "text-teal-500", bg: "bg-teal-500/10", border: "border-teal-500/20" },
    { name: "Cyan", value: "text-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
    { name: "Sky", value: "text-sky-500", bg: "bg-sky-500/10", border: "border-sky-500/20" },
    { name: "Blue", value: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { name: "Indigo", value: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
    { name: "Violet", value: "text-violet-500", bg: "bg-violet-500/10", border: "border-violet-500/20" },
    { name: "Purple", value: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
    { name: "Fuchsia", value: "text-fuchsia-500", bg: "bg-fuchsia-500/10", border: "border-fuchsia-500/20" },
    { name: "Pink", value: "text-pink-500", bg: "bg-pink-500/10", border: "border-pink-500/20" },
    { name: "Rose", value: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" },
];

interface IconPickerProps {
    value: string;
    color?: string; // Expecting Tailwind class like "text-blue-500"
    onChange: (iconName: string, color?: string) => void;
    trigger?: React.ReactNode;
}

export function IconPicker({ value, color, onChange, trigger }: IconPickerProps) {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState("AI & Models");
    const [selectedColor, setSelectedColor] = useState(color || "text-blue-500");

    // Sync selectedColor with color prop changes
    useEffect(() => {
        if (color) {
            setSelectedColor(color);
        }
    }, [color]);

    // Memoize full icon list for search fallback
    const allIconNames = useMemo(() => {
        return Object.keys(LucideIcons)
            .filter(key => key !== 'icons' && key !== 'createLucideIcon' && key !== 'default')
            .sort();
    }, []);

    // Active List Logic
    const displayIcons = useMemo(() => {
        if (searchTerm) {
            return allIconNames.filter(name =>
                name.toLowerCase().includes(searchTerm.toLowerCase())
            ).slice(0, 100);
        }
        return ICON_CATEGORIES[activeTab] || [];
    }, [searchTerm, activeTab, allIconNames]);

    const SelectedIcon = (LucideIcons as any)[value] || LucideIcons.Box;
    const activeColorObj = COLORS.find(c => c.value === selectedColor) || COLORS[0];

    return (
        <>
            <div onClick={() => setOpen(true)} className="cursor-pointer group">
                {trigger || (
                    <div className={`flex items-center gap-3 p-3 border rounded-xl transition-all hover:bg-accent/50 ${activeColorObj.border} ${activeColorObj.bg}`}>
                        <div className={`p-2 rounded-lg bg-white/50 dark:bg-black/20 ${activeColorObj.value}`}>
                            <SelectedIcon className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="text-sm font-medium">{value}</span>
                            <span className="text-xs text-muted-foreground opacity-70 group-hover:opacity-100">Click to change</span>
                        </div>
                    </div>
                )}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[900px] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white shadow-2xl">

                    {/* Header with Search & Color */}
                    <DialogHeader className="p-6 border-b border-zinc-200 dark:border-zinc-800 shrink-0 bg-zinc-50/80 dark:bg-zinc-900/50 backdrop-blur-xl">
                        <div className="flex items-center justify-between mb-4">
                            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                                <Palette className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                                Icon Library
                            </DialogTitle>
                            <div className="grid grid-cols-9 gap-1 mr-6">
                                {COLORS.map((c) => (
                                    <button
                                        key={c.name}
                                        onClick={() => {
                                            setSelectedColor(c.value);
                                            onChange(value, c.value); // Update color immediately
                                        }}
                                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${c.value.replace('text-', 'bg-')} ${selectedColor === c.value ? 'border-zinc-800 dark:border-white ring-2 ring-zinc-500/20 dark:ring-white/20' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                        title={c.name}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-zinc-500 w-4 h-4" />
                            <Input
                                placeholder="Search all icons..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus-visible:ring-blue-500 h-10 rounded-lg shadow-inner"
                            />
                        </div>
                    </DialogHeader>

                    <div className="flex flex-1 overflow-hidden">
                        {/* Sidebar Categories */}
                        {!searchTerm && (
                            <div className="w-48 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 overflow-y-auto py-4">
                                <div className="space-y-1 px-2">
                                    {Object.keys(ICON_CATEGORIES).map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setActiveTab(cat)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === cat ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Icon Grid */}
                        <ScrollArea className="flex-1 p-6 bg-white dark:bg-black/20">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {displayIcons.map((iconName: string) => {
                                    const IconComp = (LucideIcons as any)[iconName];
                                    if (!IconComp) return null;
                                    const isSelected = value === iconName;

                                    return (
                                        <button
                                            key={iconName}
                                            onClick={() => {
                                                onChange(iconName, selectedColor);
                                                setOpen(false);
                                            }}
                                            className={`group relative flex flex-col items-center justify-center p-2 m-1 rounded-xl border transition-all duration-200
                                                ${isSelected
                                                    ? `bg-blue-50/50 dark:bg-white/5 ${activeColorObj.border.replace('/20', '/50')} ring-1 ${activeColorObj.border}`
                                                    : 'bg-white dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:scale-105 hover:shadow-xl hover:shadow-black/5'}
                                            `}
                                        >
                                            <IconComp
                                                className={`w-8 h-8 mb-2 transition-colors duration-200 ${isSelected ? selectedColor : 'text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white'}`}
                                                style={isSelected ? { filter: 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))' } : {}}
                                            />
                                            <span className="text-[10px] w-full text-center truncate text-zinc-500 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">
                                                {iconName}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            {displayIcons.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                                    <Search className="w-10 h-10 mb-4 opacity-20" />
                                    <p>No icons found.</p>
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
