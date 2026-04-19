"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Archive } from "lucide-react";
import { toast } from "sonner";
import * as LucideIcons from "lucide-react";
import { Search, Plus, Edit, Trash2, Zap, Box, X, AlertTriangle } from "lucide-react";
import FeatureDialog from "./FeatureDialog";
import FeatureDetailSheet from "./FeatureDetailSheet";
import { featuresAPI } from "@/api/features.api";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Icon Map
// No Static Icon Map - Dynamic Consumption

// Mappings for UI Consistency
import { FEATURE_CATEGORIES, CategoryKey } from "../data/categories";

const CATEGORY_STYLES: Record<string, { color: string; bg: string; label: string }> = FEATURE_CATEGORIES;

export default function FeatureList() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    // CRUD State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [featureToEdit, setFeatureToEdit] = useState<any>(null);

    // Detail View State
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [featureToView, setFeatureToView] = useState<any>(null);

    // Delete Confirmation State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
    const [featureToDelete, setFeatureToDelete] = useState<{ id: string, name: string } | null>(null);
    const [usageInfo, setUsageInfo] = useState<{ inUse: boolean, planCount: number, estimatedUsers: number } | null>(null);

    // Dynamic State
    const [features, setFeatures] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchFeatures = async () => {
        try {
            setIsLoading(true);
            const res = await featuresAPI.getAll();
            const data = await res.data;

            // ADAPTER: Backend -> Frontend State Adapter
            const mappedFeatures = data.map((be: any) => {
                const style = CATEGORY_STYLES[be.category] || CATEGORY_STYLES.default;

                // Derive Custom Colors if present
                let itemColor = style.color;
                let itemBg = style.bg;

                if (be.color) {
                    let colorKey = be.color;

                    // Handle Legacy Class Format (e.g., text-blue-500)
                    const match = be.color.match(/text-(\w+)-([0-9]+)/);
                    if (match) {
                        colorKey = match[1];
                    }

                    // Match User's IconPicker Styling (Safelisted)
                    itemColor = `text-${colorKey}-500`;
                    itemBg = `bg-${colorKey}-500/10 dark:bg-${colorKey}-500/20`;
                }

                return {
                    value: be.id,
                    label: be.name,
                    title: be.name,
                    desc: be.description,
                    icon: be.icon, // Keeps Emoji or String
                    color: itemColor, // Store derived or default
                    bg: itemBg, // Store derived or default
                    categoryId: be.category,
                    // Nest defaults to match old UI structure
                    defaults: {
                        name: be.name,
                        unit: be.unit,
                        baseCost: 0, // Calculated dynamically from includes usually
                        sellPrice: 0,
                        costType: be.costType,
                        location: be.location,
                        includes: be.includes || []
                    },
                    raw: be // Pass full backend object for editing
                };
            });

            setFeatures(mappedFeatures);
        } catch (error) {
            console.error("Failed to fetch features:", error);
            toast.error("Failed to load features from server.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFeatures();
    }, []);

    // Filter Logic
    const filteredFeatures = features.filter(f => {
        const matchesSearch = f.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.desc.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "all" || f.categoryId === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Extract Unique Categories for Tabs
    const categories = Array.from(new Set(features.map(f => f.categoryId))).map(id => ({
        id,
        label: CATEGORY_STYLES[id]?.label || id.toUpperCase()
    }));

    const toggleSelection = (value: string) => {
        if (!isSelectionMode) return;
        if (selectedItems.includes(value)) {
            setSelectedItems(selectedItems.filter(item => item !== value));
        } else {

            setSelectedItems([...selectedItems, value]);
        }
    };

    const cancelSelection = () => {
        setIsSelectionMode(false);
        setSelectedItems([]);
    };

    const handleAdd = () => {
        setFeatureToEdit(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (feature: any, e: React.MouseEvent) => {
        e.stopPropagation();
        // Use the raw backend object if available, otherwise fallback to feature
        setFeatureToEdit(feature.raw || feature);
        setIsDialogOpen(true);
    };

    const handleView = (feature: any) => {
        setFeatureToView(feature); // Pass the MAPPED object for display (contains defaults & styles)
        setIsDetailOpen(true);
    };

    const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setFeatureToDelete({ id, name });

        try {
            // Check usage before showing dialog
            const response = await featuresAPI.checkUsage(id);
            const usage = response.data;
            setUsageInfo(usage);

            if (usage.inUse) {
                // Show archive dialog
                setArchiveDialogOpen(true);
            } else {
                // Show delete dialog
                setDeleteDialogOpen(true);
            }
        } catch (error) {
            console.error("Usage check failed", error);
            toast.error("Failed to check feature usage");
        }
    };

    const confirmDelete = async () => {
        if (!featureToDelete) return;

        try {
            await featuresAPI.delete(featureToDelete.id);
            toast.success("Feature deleted successfully");
            fetchFeatures();
        } catch (error) {
            console.error("Delete failed", error);
            toast.error("Failed to delete feature");
        } finally {
            setDeleteDialogOpen(false);
            setFeatureToDelete(null);
            setUsageInfo(null);
        }
    };

    const confirmArchive = async () => {
        if (!featureToDelete) return;

        try {
            await featuresAPI.archive(featureToDelete.id);
            toast.success("Feature archived successfully - existing users can still use it");
            fetchFeatures();
        } catch (error) {
            console.error("Archive failed", error);
            toast.error("Failed to archive feature");
        } finally {
            setArchiveDialogOpen(false);
            setFeatureToDelete(null);
            setUsageInfo(null);
        }
    };

    const selectAll = () => {
        if (selectedItems.length === filteredFeatures.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(filteredFeatures.map(f => f.value));
        }
    };

    if (isLoading) {
        return <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <Card className="border-none shadow-none relative">
            <CardHeader className="space-y-4 px-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">Feature Library (Live)</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            System features linked to Backend Registry.
                        </p>
                    </div>
                    <Button onClick={handleAdd} size="sm" className="gap-2">
                        <Plus className="h-4 w-4" /> Add Feature
                    </Button>

                    {/* Bulk Actions Bar */}
                    {selectedItems.length > 0 && (
                        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-200 border border-zinc-700 dark:border-zinc-300">
                            <span className="font-bold text-sm bg-zinc-800 dark:bg-zinc-200 px-2 py-0.5 rounded-md min-w-[2rem] text-center">
                                {selectedItems.length}
                            </span>
                            <span className="text-sm font-medium">Selected</span>
                            <div className="h-4 w-px bg-white/20 dark:bg-black/20" />
                            <Button size="sm" variant="ghost" className="hover:bg-red-500/20 text-red-400 hover:text-red-300 h-8" onClick={cancelSelection}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>

                {/* Search & Filter */}
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute z-10 left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search in library..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Category Pills */}
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant={selectedCategory === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory("all")}
                        className="rounded-full"
                    >
                        All
                    </Button>
                    {categories.map((cat) => (
                        <Button
                            key={cat.id}
                            variant={selectedCategory === cat.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedCategory(cat.id)}
                            className="rounded-full"
                        >
                            {cat.label}
                        </Button>
                    ))}
                </div>
            </CardHeader>

            <CardContent className="px-0 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFeatures.map((feature) => {
                        // Icon Handling: Check if string is a Lucide name or an Emoji
                        const IconComponent = (LucideIcons as any)[feature.icon];
                        const isEmoji = !IconComponent;

                        const isSelected = selectedItems.includes(feature.value);

                        // Logic: Direct Multiplier Summation
                        let baseCost = 0;
                        let sellPrice = 0;

                        if (feature.defaults && feature.defaults.includes) {
                            feature.defaults.includes.forEach((item: any) => {
                                baseCost += (item.baseMultiplier || 0);
                                sellPrice += (item.sellMultiplier || 0);
                            });
                        }

                        // Fallback
                        if (baseCost === 0 && feature.defaults.baseCost) baseCost = feature.defaults.baseCost;
                        if (sellPrice === 0 && feature.defaults.sellPrice) sellPrice = feature.defaults.sellPrice;

                        return (
                            <Card
                                key={feature.value}
                                className={`overflow-hidden border-2 transition-all hover:shadow-xl group bg-white dark:bg-zinc-950 relative select-none hover:border-primary/50 cursor-pointer`}
                                onClick={() => handleView(feature)}
                            >
                                {/* 🎨 1. Header Section (Identity) */}
                                <div className="p-4 flex items-start justify-between border-b bg-zinc-50/50 dark:bg-zinc-900/50">
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-1 p-2.5 rounded-xl ${feature.bg} ${feature.color} ring-1 ring-inset ring-black/5`}>
                                            {isEmoji ? (
                                                <span className="text-2xl">{feature.icon}</span>
                                            ) : (
                                                <IconComponent className="h-6 w-6" strokeWidth={2} />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-lg leading-tight text-zinc-900 dark:text-zinc-100">
                                                    {feature.label}
                                                </h3>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700">
                                                    {feature.categoryId.toUpperCase()}
                                                </Badge>
                                                {feature.defaults.costType === 'free' && (
                                                    <span className="text-[10px] font-medium text-emerald-600 flex items-center gap-0.5">
                                                        <Zap className="h-3 w-3 fill-current" /> Free
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-400 hover:text-foreground" onClick={(e) => handleEdit(feature, e)}>
                                            <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-400 hover:text-red-500" onClick={(e) => handleDelete(feature.value, feature.label, e)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>

                                {/*  2. Template Defaults (Premium Display) */}
                                <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900/30 border-t border-b border-dashed border-zinc-200 dark:border-zinc-800">
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* My Cost */}
                                        <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 shadow-sm">
                                            <span className="text-[9px] font-extrabold text-red-400 uppercase tracking-wider flex items-center gap-1">
                                                <div className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                                                My Base
                                            </span>
                                            <div className="text-xl font-black text-zinc-700 dark:text-zinc-300 tracking-tight">
                                                {baseCost > 0 ? (
                                                    <span className="flex items-baseline gap-0.5">
                                                        {parseFloat(baseCost.toFixed(2))}
                                                        <span className="text-xs font-bold text-zinc-400">x</span>
                                                    </span>
                                                ) : <span className="text-sm font-bold text-emerald-500">FREE</span>}
                                            </div>
                                        </div>

                                        {/* Sell Price */}
                                        <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-green-50/50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/40 shadow-sm">
                                            <span className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                Sell Price
                                            </span>
                                            <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight">
                                                {sellPrice > 0 ? (
                                                    <span className="flex items-baseline gap-0.5">
                                                        {parseFloat(sellPrice.toFixed(2))}
                                                        <span className="text-xs font-bold text-emerald-600/70">x</span>
                                                    </span>
                                                ) : <span className="text-sm font-bold text-emerald-500">FREE</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 🏷️ 3. Source Info & Location */}
                                <div className="px-4 py-3 flex flex-col text-xs text-muted-foreground bg-white dark:bg-zinc-950">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">Path:</span>
                                            {feature.defaults.location || "System"}
                                        </div>
                                        {feature.defaults.includes && feature.defaults.includes.length > 0 && (
                                            <Badge variant="secondary" className="h-5 text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-mono px-1.5">
                                                {feature.defaults.includes.length} Feat.
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2.5em] leading-relaxed">
                                        {feature.desc}
                                    </p>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                {filteredFeatures.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">No templates found matching your search.</p>
                    </div>
                )}
            </CardContent>

            <FeatureDialog
                open={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                feature={featureToEdit}
                onSaved={fetchFeatures}
            />

            {/* Delete Dialog - When feature is NOT in use */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-zinc-500" />
                            Delete Feature?
                        </AlertDialogTitle>
                        <div className="space-y-3 pt-2 text-sm text-muted-foreground">
                            <div className="font-semibold text-foreground">
                                Delete "{featureToDelete?.name}"?
                            </div>
                            <div className="text-sm bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-3">
                                ✅ <span className="font-semibold text-green-700 dark:text-green-400">Safe to delete:</span> No active plans are using this feature.
                            </div>
                            <div className="text-xs text-muted-foreground">
                                This action cannot be undone. Historical data will be removed.
                            </div>
                        </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            Delete Permanently
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Archive Dialog - When feature IS in use */}
            <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Cannot Delete: Feature In Use
                        </AlertDialogTitle>
                        <div className="space-y-4 pt-2 text-sm text-muted-foreground">
                            <div className="font-semibold text-foreground">
                                "{featureToDelete?.name}" is currently active in <span className="text-red-600">{usageInfo?.planCount || 0} plan(s)</span> used by approximately <span className="text-red-600">{usageInfo?.estimatedUsers || 0} users</span>.
                            </div>

                            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-3 space-y-2">
                                <div className="font-semibold text-red-600">⚠️ Deleting will cause:</div>
                                <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
                                    <li>Immediate billing failures for active subscriptions</li>
                                    <li>Service disruption for paying customers</li>
                                    <li>Loss of historical usage data</li>
                                </ul>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-3 space-y-2">
                                <div className="font-semibold text-blue-600">💡 Recommended: Archive Instead</div>
                                <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
                                    <li>Existing users can continue using this feature</li>
                                    <li>No billing disruption</li>
                                    <li>New plans cannot select this feature</li>
                                    <li>Can be reactivated later if needed</li>
                                </ul>
                            </div>
                        </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmArchive}
                            className="bg-amber-600 hover:bg-amber-700 focus:ring-amber-600"
                        >
                            <Archive className="h-4 w-4 mr-2" />
                            Archive Feature
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>


            <FeatureDetailSheet
                open={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                feature={featureToView}
                onEdit={() => {
                    if (featureToView) {
                        setIsDetailOpen(false);
                        handleEdit(featureToView, { stopPropagation: () => { } } as React.MouseEvent);
                    }
                }}
            />
        </Card >
    );
}
