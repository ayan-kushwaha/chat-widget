"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, CheckCircle, Trash2, FileText, FileJson, FileSpreadsheet, FileCode, X } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useOrg } from "@/context/OrgContext";
import { useTagManager } from "./hooks/useTagManager";

const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

interface FileUploadTabProps {
    loading: boolean;
    onSuccess: () => void;
    onOpenChange: (open: boolean) => void;
    mode?: 'add' | 'edit';
    initialData?: any;
}

export function FileUploadTab({ loading, onSuccess, onOpenChange, mode = 'add', initialData }: FileUploadTabProps) {
    const { activeOrgId } = useOrg();
    const { handleAddTag, handleRemoveTag } = useTagManager();

    const [file, setFile] = useState<File | null>(null);
    const [fileDescription, setFileDescription] = useState(initialData?.description || "");
    const [intentSummary, setIntentSummary] = useState(initialData?.intent_summary || "");
    const [fileTags, setFileTags] = useState<string[]>(initialData?.tags || []);
    const [fileTagInput, setFileTagInput] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Update state if initialData changes (for Edit mode)
    useState(() => {
        if (mode === 'edit' && initialData) {
            setFileDescription(initialData.description || "");
            setIntentSummary(initialData.intent_summary || "");
            setFileTags(initialData.tags || []);
        }
    });

    const handleFileSubmit = async () => {
        if (!file && mode === 'add') return toast.error("File is required");
        setSubmitting(true);
        try {
            if (mode === 'edit') {
                const safeId = initialData._id || initialData.id;
                await api.patch(`/knowledge/${activeOrgId}/source/file/${safeId}`, {
                    description: fileDescription,
                    intent_summary: intentSummary,
                    tags: fileTags
                });
                toast.success("File metadata updated successfully");
            } else {
                const formData = new FormData();
                if (file) formData.append("file", file);
                formData.append("description", fileDescription);
                formData.append("intent_summary", intentSummary);
                formData.append("tags", JSON.stringify(fileTags));

                await api.post(`/knowledge/${activeOrgId}/upload`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success("File uploaded successfully");
            }
            onSuccess();
            onOpenChange(false);
            setFile(null);
            setFileDescription("");
            setIntentSummary("");
            setFileTags([]);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to upload file");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {!file ? (
                    <div className="relative group cursor-pointer">
                        <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 z-50 cursor-pointer"
                            onChange={(e) => {
                                const selected = e.target.files?.[0];
                                if (selected) {
                                    if (selected.size > 5 * 1024 * 1024) {
                                        toast.error("File size exceeds 5MB limit");
                                        if (e.target) e.target.value = '';
                                        return;
                                    }
                                    setFile(selected);
                                }
                            }}
                            accept=".pdf,.txt,.docx,.md,.csv,.json"
                        />
                        <div className="border-2 border-dashed border-border rounded-xl p-10 text-center transition-all duration-200 group-hover:bg-muted/50 group-hover:border-primary/50 bg-muted/20">
                            <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-border group-hover:scale-110 transition-transform duration-300">
                                <Upload className="w-8 h-8 text-primary/80" />
                            </div>
                            <h3 className="text-lg font-semibold mb-1">Click to upload or drag & drop</h3>
                            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                Support for PDF, DOCX, TXT, CSV, JSON & Markdown.
                                <br />
                                Max file size: 5MB
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-card border rounded-xl p-4 flex items-center justify-between shadow-sm animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-4 overflow-hidden">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                {file.name.endsWith('.pdf') ? (
                                    <FileText className="w-6 h-6 text-red-500" />
                                ) : file.name.endsWith('.docx') ? (
                                    <FileText className="w-6 h-6 text-blue-500" />
                                ) : file.name.endsWith('.csv') ? (
                                    <FileSpreadsheet className="w-6 h-6 text-green-500" />
                                ) : file.name.endsWith('.json') ? (
                                    <FileJson className="w-6 h-6 text-orange-500" />
                                ) : file.name.endsWith('.md') ? (
                                    <FileCode className="w-6 h-6 text-purple-500" />
                                ) : (
                                    <FileText className="w-6 h-6 text-gray-500" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="font-medium truncate text-base">{file.name}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                    <span>{formatBytes(file.size)}</span>
                                    <span className="w-1 h-1 rounded-full bg-border" />
                                    <span className="flex items-center gap-1 text-green-600 font-medium">
                                        <CheckCircle className="w-3 h-3" /> Ready
                                    </span>
                                </div>
                            </div>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mr-2"
                            onClick={() => setFile(null)}
                        >
                            <Trash2 className="w-5 h-5" />
                        </Button>
                    </div>
                )}

                <div className="space-y-3">
                    <Label>Description <span className="text-muted-foreground font-normal ml-1">(Optional)</span></Label>
                    <Textarea
                        placeholder="Describe this document to help the AI understand its context..."
                        className="min-h-[80px] resize-none"
                        value={fileDescription}
                        onChange={(e) => setFileDescription(e.target.value)}
                        maxLength={3000}
                    />
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                        <span>💡 Short summary of the file content.</span>
                        <span>{fileDescription.length}/3000</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <Label>Intent Context <span className="text-muted-foreground font-normal ml-1">(Optional - Ai Auto-Generate)</span></Label>
                    <div className="space-y-2">
                        <Textarea
                            placeholder="e.g., This covers Refund Rules & Exceptions."
                            value={intentSummary}
                            onChange={(e) => setIntentSummary(e.target.value)}
                            className="italic text-sm min-h-[80px]"
                            maxLength={600}
                        />
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                            <span>💡 Helps the AI find this file even if keywords don&apos;t match perfectly.</span>
                            <span>{intentSummary.length}/600 (Max 120 words)</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <Label>Tags</Label>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Add tags (e.g., finance, v2.0)..."
                            value={fileTagInput}
                            onChange={(e) => setFileTagInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddTag(fileTagInput, fileTags, setFileTags, setFileTagInput);
                                }
                            }}
                            className="flex-1"
                        />
                        <Button type="button" variant="outline" onClick={() => handleAddTag(fileTagInput, fileTags, setFileTags, setFileTagInput)}>
                            Add
                        </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 min-h-[32px]">
                        {fileTags.length === 0 && (
                            <span className="text-xs text-muted-foreground py-1">No tags added yet.</span>
                        )}
                        {fileTags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="pl-2.5 pr-1 py-1 h-7 gap-1 hover:bg-muted">
                                #{tag}
                                <button
                                    onClick={() => handleRemoveTag(index, setFileTags)}
                                    className="hover:text-destructive hover:bg-destructive/10 rounded-full p-0.5 ml-1 transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-background mt-auto">
                <Button
                    className="w-full h-11 text-base shadow-lg shadow-primary/20"
                    onClick={handleFileSubmit}
                    disabled={submitting || !file}
                >
                    {submitting ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading & Saving...
                        </>
                    ) : (
                        <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload and Save
                        </>
                    )}
                </Button>
            </div>
        </>
    );
}
