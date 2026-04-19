"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { featuresAPI } from "@/api/features.api";
import { Loader2 } from "lucide-react";
import IncludesList from "./IncludesList";
import { IconPicker } from "@/components/ui/icon-picker";

// Constants
import { FEATURE_CATEGORIES } from "../data/categories";

const CATEGORY_OPTIONS = Object.entries(FEATURE_CATEGORIES)
    .filter(([key]) => key !== "default")
    .map(([key, value]) => ({
        value: key,
        label: value.label
    }));



const STATUS_OPTIONS = [
    { value: "active", label: "Active (Live)" },
    { value: "coming_soon", label: "Coming Soon" },
    { value: "inactive", label: "Inactive" }
];

interface FeatureDialogProps {
    open: boolean;
    onClose: () => void;
    feature?: any;
    onSaved: () => void;
}

export default function FeatureDialog({ open, onClose, feature, onSaved }: FeatureDialogProps) {
    const isEditing = !!feature;
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        id: "",
        name: "",
        category: "ai_core", // Default
        baseMultiplier: 0,
        sellMultiplier: 0,
        unit: "TOKENS", // Enforce TOKENS
        costType: "per_unit",
        description: "",
        icon: "Box",
        color: "blue", // Default Semantic Color
        status: "active",
        location: "",
        includes: [] as any[] // Array of sub-features
    });

    useEffect(() => {
        if (feature) {
            setFormData({
                id: feature.value || feature.id || "",
                name: feature.label || feature.name || "",
                category: feature.categoryId || feature.category || "ai_core",
                baseMultiplier: 0, // Enforce Component Pricing
                sellMultiplier: 0, // Enforce Component Pricing
                unit: "TOKENS", // Enforce TOKENS
                costType: feature.defaults?.costType || feature.costType || "per_unit",
                description: feature.desc || feature.description || "",
                icon: feature.icon || feature.defaults?.icon || "Box",
                color: feature.color || "blue",
                status: feature.status || "active",
                location: feature.defaults?.location || feature.location || "",
                includes: feature.defaults?.includes || feature.includes || []
            });
        } else {
            // Reset for Create
            setFormData({
                id: "",
                name: "",
                category: "ai_core",
                baseMultiplier: 0,
                sellMultiplier: 0,
                unit: "TOKENS", // Enforce TOKENS
                costType: "per_unit",
                description: "",
                icon: "Box",
                color: "blue",
                status: "active",
                location: "",
                includes: []
            });
        }
    }, [feature, open]);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleIncludesChange = (newIncludes: any[]) => {
        setFormData(prev => ({ ...prev, includes: newIncludes }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Prepare Payload
            const payload = {
                ...formData,
                baseMultiplier: Number(formData.baseMultiplier),
                sellMultiplier: Number(formData.sellMultiplier),
                includes: formData.includes.map(inc => ({
                    ...inc,
                    baseMultiplier: Number(inc.baseMultiplier),
                    sellMultiplier: Number(inc.sellMultiplier)
                }))
            };

            if (isEditing) {
                // Update - use formData.id which contains the correct feature ID
                await featuresAPI.update(formData.id, payload);
                toast.success("Feature updated successfully");
            } else {
                // Create
                await featuresAPI.create(payload);
                toast.success("Feature created successfully");
            }

            onSaved();
            onClose();
        } catch (error: any) {
            console.error("Save Error:", error);
            toast.error(error.response?.data?.message || "Failed to save feature");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[85vh] p-0 flex flex-col gap-0 overflow-hidden">
                <DialogHeader className="p-6 border-b shrink-0">
                    <DialogTitle>{isEditing ? "Edit Feature" : "Create New Feature"}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6">
                    <form id="feature-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="space-y-2 shrink-0 md:w-[200px]">
                                <Label>Icon</Label>
                                <IconPicker
                                    value={formData.icon}
                                    color={formData.color}
                                    onChange={(val, col) => {
                                        handleChange("icon", val);
                                        if (col) handleChange("color", col);
                                    }}
                                />
                            </div>
                            <div className="space-y-2 flex-1">
                                <Label>Feature Name</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => handleChange("name", e.target.value)}
                                    placeholder="e.g. Smart Forms"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select value={formData.category} onValueChange={(v) => handleChange("category", v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {CATEGORY_OPTIONS.map((cat) => (
                                            <SelectItem key={cat.value} value={cat.value}>
                                                {cat.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={formData.status} onValueChange={(v) => handleChange("status", v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {STATUS_OPTIONS.map((status) => (
                                            <SelectItem key={status.value} value={status.value}>
                                                {status.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => handleChange("description", e.target.value)}
                                placeholder="Brief description of the feature..."
                                className="min-h-[80px]"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Dashboard Location</Label>
                            <Input
                                value={formData.location}
                                onChange={(e) => handleChange("location", e.target.value)}
                                placeholder="/dashboard/..."
                                className="font-mono text-xs"
                            />
                        </div>

                        {/* Separator */}
                        <div className="border-t pt-4">
                            <IncludesList
                                includes={formData.includes}
                                onChange={handleIncludesChange}
                            />
                        </div>
                    </form>
                </div>

                <DialogFooter className="p-6 border-t bg-zinc-50 dark:bg-zinc-900/50 shrink-0">
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form="feature-form" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? "Save Changes" : "Create Feature"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
