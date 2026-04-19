import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { Target, Calendar } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import { CollapsibleSection } from "../shared/CollapsibleSection";
import { TileSelector } from "../TileSelector";
import { AutoResizeTextarea } from "../AutoResizeTextarea";
import {
    PROFILE_FORM_SCHEMA,
    INDUSTRIES
} from "../profileForm.schema";

interface ProfileClassificationEditProps {
    org: any;
    isOpen: boolean;
    onToggle: (id: string) => void;
    onOrgChange: (field: string, value: any) => void;
    showField: (section: "classification" | "strategy", fieldId: string) => boolean;
    customInputs: Record<string, string>;
    setCustomInputs: React.Dispatch<React.SetStateAction<any>>;
    subCategoryOptions: { value: string; label: string }[];
    businessModelOptions: { value: string; label: string }[];
    targetAudienceOptions: { value: string; label: string }[];
}

export function ProfileClassificationEdit({
    org,
    isOpen,
    onToggle,
    onOrgChange,
    showField,
    customInputs,
    setCustomInputs,
    subCategoryOptions,
    businessModelOptions,
    targetAudienceOptions
}: ProfileClassificationEditProps) {
    return (
        <CollapsibleSection
            id="classification"
            title="Classification & Strategy"
            icon={Target}
            isOpen={isOpen}
            onToggle={onToggle}
        >
            <div className="grid gap-6 pb-4">
                {PROFILE_FORM_SCHEMA.classification.map((field: any) => {
                    if (!showField("classification", field.id)) return null;

                    return (
                        <div key={field.id} className="space-y-2 mx-1">
                            <Label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                                {field.label}
                            </Label>

                            {field.type === "tile" && (
                                <>
                                    <TileSelector
                                        options={
                                            field.id === "subCategory" ? subCategoryOptions :
                                                field.id === "businessModel" ? businessModelOptions :
                                                    field.id === "targetAudience" ? targetAudienceOptions :
                                                        field.options
                                        }
                                        value={org[field.id] || ""}
                                        onChange={v => {
                                            if (v === 'other') {
                                                setCustomInputs((prev: Record<string, string>) => ({ ...prev, [field.id]: '' }));
                                                onOrgChange(field.id, 'other');
                                            } else {
                                                onOrgChange(field.id, v);
                                            }
                                            if (field.id === "industry") onOrgChange("subCategory", "");
                                        }}
                                    />

                                    {/* Custom 'Other' Input */}
                                    {((field.id === "industry" && !INDUSTRIES.some(i => i.value === org.industry) && org.industry) ||
                                        (field.id === "subCategory" && !subCategoryOptions.some(i => i.value === org.subCategory) && org.subCategory) ||
                                        (field.id === "businessModel" && !businessModelOptions.some(i => i.value === org.businessModel) && org.businessModel) ||
                                        (field.id === "targetAudience" && !targetAudienceOptions.some(i => i.value === org.targetAudience) && org.targetAudience) ||
                                        org[field.id] === "other") && (
                                            <div className="animate-in fade-in slide-in-from-top-2 duration-300 transition-all opacity-100 mt-2 space-y-1">
                                                <div className="flex justify-end pr-1">
                                                    <span className="text-[10px] text-zinc-400">
                                                        {(customInputs[field.id] ||
                                                            (org[field.id] !== 'other' ? org[field.id] as string : "") || "").length}/60
                                                    </span>
                                                </div>
                                                <Input
                                                    maxLength={60}
                                                    placeholder={`Please specify your ${field.label.toLowerCase()}...`}
                                                    value={customInputs[field.id] ||
                                                        (org[field.id] !== 'other' ? org[field.id] : "")}
                                                    onChange={e => {
                                                        setCustomInputs((prev: Record<string, string>) => ({ ...prev, [field.id]: e.target.value }));
                                                        onOrgChange(field.id, e.target.value || 'other');
                                                    }}
                                                    className="h-10 text-sm bg-neutral-50 dark:bg-zinc-900 border-neutral-200 dark:border-zinc-800 transition-all focus:ring-2 focus:ring-blue-500/20"
                                                />
                                            </div>
                                        )}
                                </>
                            )}

                            {field.type === "slider" && (
                                <div className="space-y-4 pt-2">
                                    <div className="flex justify-between items-center">
                                        <Badge variant="secondary" className="bg-neutral-100 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 ml-auto">
                                            {parseInt(org[field.id] || "1", 10) === 1000 ? '1000+' : (org[field.id] || "1")}
                                        </Badge>
                                    </div>
                                    <Slider
                                        min={field.min}
                                        max={field.max}
                                        step={1}
                                        value={[parseInt(org[field.id] || "1", 10)]}
                                        onValueChange={(vals) => onOrgChange(field.id, vals[0].toString())}
                                        className="py-2"
                                    />
                                </div>
                            )}

                            {field.type === "date" && (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal border-neutral-200 bg-gray-50 dark:border-white/5 dark:bg-[#0e0e0e]",
                                                !org[field.id] && "text-neutral-400"
                                            )}
                                        >
                                            <Calendar className="mr-2 h-4 w-4" />
                                            {org[field.id] ? format(new Date(org[field.id]), "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <CalendarUI
                                            mode="single"
                                            selected={org[field.id] ? new Date(org[field.id]) : undefined}
                                            onSelect={(date) => onOrgChange(field.id, date ? date.toISOString() : "")}
                                            initialFocus
                                            disabled={(date) => date > new Date() || date < new Date("1800-01-01")}
                                            captionLayout="dropdown"
                                            startMonth={new Date("1800-01-01")}
                                            endMonth={new Date()}
                                            defaultMonth={org[field.id] ? new Date(org[field.id]) : new Date()}
                                        />
                                    </PopoverContent>
                                </Popover>
                            )}

                            {field.type === "textarea" && (
                                <div className="space-y-1">
                                    <div className="flex justify-end pr-1">
                                        <span className="text-[10px] text-zinc-400">
                                            {(org[field.id] || "").length}/{field.maxLength || 800}
                                        </span>
                                    </div>
                                    <AutoResizeTextarea
                                        maxLength={field.maxLength || 800}
                                        value={org[field.id] || ""}
                                        onChange={val => onOrgChange(field.id, val)}
                                        placeholder={field.placeholder}
                                        rows={3}
                                        className="min-h-[80px] "
                                    />
                                </div>
                            )}

                            {field.type === "text" && (
                                <Input
                                    value={org[field.id] || ""}
                                    onChange={e => onOrgChange(field.id, e.target.value)}
                                    placeholder={field.placeholder}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </CollapsibleSection>
    );
}
