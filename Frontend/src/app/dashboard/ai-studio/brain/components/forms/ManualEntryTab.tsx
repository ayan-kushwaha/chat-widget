"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, X, Brain } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useOrg } from "@/context/OrgContext";
import { useTagManager } from "./hooks/useTagManager";

interface ManualEntryTabProps {
    loading: boolean;
    onSuccess: () => void;
    onOpenChange: (open: boolean) => void;
    mode?: 'add' | 'edit';
    initialData?: any;
}

export function ManualEntryTab({ loading, onSuccess, onOpenChange, mode = 'add', initialData }: ManualEntryTabProps) {
    const { activeOrgId } = useOrg();
    const { handleAddTag, handleRemoveTag } = useTagManager();

    const [manualTitle, setManualTitle] = useState(initialData?.title || "");
    const [manualContent, setManualContent] = useState(initialData?.content || "");
    const [intentSummary, setIntentSummary] = useState(
        (initialData?.intent_summary === "No intent summary available." || !initialData?.intent_summary) ? "" : initialData.intent_summary
    );
    const [manualTags, setManualTags] = useState<string[]>(initialData?.tags || []);
    const [manualTagInput, setManualTagInput] = useState("");
    const [manualPriority, setManualPriority] = useState<string>(initialData?.priority || "high");
    const [submitting, setSubmitting] = useState(false);

    const handleManualSubmit = async () => {
        if (!manualContent) return toast.error("Content is required");
        setSubmitting(true);
        try {
            if (mode === 'edit') {
                const safeId = initialData._id || initialData.id || initialData.sourceId;
                await api.put(`/knowledge/${activeOrgId}/manual-text/${safeId}`, {
                    content: manualContent,
                    title: manualTitle || "Manual Entry",
                    intent_summary: intentSummary,
                    tags: manualTags,
                    priority: manualPriority
                });
                toast.success("Knowledge updated successfully");
            } else {
                await api.post(`/knowledge/${activeOrgId}/manual-text`, {
                    content: manualContent,
                    title: manualTitle || "Manual Entry",
                    intent_summary: intentSummary,
                    tags: manualTags,
                    priority: manualPriority
                });
                toast.success("Knowledge added successfully");
            }
            onSuccess();
            onOpenChange(false);
            setManualTitle("");
            setManualContent("");
            setIntentSummary("");
            setManualTags([]);
            setManualPriority("high");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to save manual entry");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input
                        placeholder="e.g., Refund Rules & Exceptions"
                        value={manualTitle}
                        onChange={(e) => setManualTitle(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Content / Knowledge *</Label>
                    <Textarea
                        placeholder="Write the knowledge or instructions for the AI..."
                        className="min-h-[150px]"
                        value={manualContent}
                        onChange={(e) => setManualContent(e.target.value)}
                        maxLength={5000}
                    />
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                        <span>💡 This is what the AI will learn and remember.</span>
                        <span>{manualContent.length}/5000</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Intent Context <span className="text-muted-foreground font-normal ml-1">(Optional - Ai Auto-Generate)</span></Label>
                    <Textarea
                        placeholder="e.g., This covers Refund Rules & Exceptions."
                        value={intentSummary}
                        onChange={(e) => setIntentSummary(e.target.value)}
                        className="italic text-sm min-h-[80px]"
                        maxLength={600}
                    />
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                        <span>💡 Helps the AI find this entry even if keywords don&apos;t match perfectly.</span>
                        <span>{intentSummary.length}/600 (Max 120 words)</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Context Tags *</Label>
                    <div className="flex gap-2">
                        <Input
                            placeholder="e.g., refund, policy, urgent"
                            value={manualTagInput}
                            onChange={(e) => setManualTagInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddTag(manualTagInput, manualTags, setManualTags, setManualTagInput);
                                }
                            }}
                        />
                        <Button type="button" variant="outline" onClick={() => handleAddTag(manualTagInput, manualTags, setManualTags, setManualTagInput)}>
                            Add
                        </Button>
                    </div>
                    {manualTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {manualTags.map((tag, index) => (
                                <div key={index} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                    #{tag}
                                    <button onClick={() => handleRemoveTag(index, setManualTags)} className="hover:text-destructive">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                        Tags help the AI find this knowledge quickly during conversations.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={manualPriority} onValueChange={setManualPriority}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="high">High (Always wins over website data)</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-background mt-auto">
                <Button className="w-full" onClick={handleManualSubmit} disabled={submitting}>
                    {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {mode === 'edit' ? 'Update Knowledge' : 'Save Knowledge'}
                </Button>
            </div>
        </>
    );
}
