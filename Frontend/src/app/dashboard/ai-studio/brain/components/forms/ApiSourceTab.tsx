"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, Loader2, CheckCircle, X, FileJson } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useOrg } from "@/context/OrgContext";
import { useTagManager } from "./hooks/useTagManager";
import { ApiConfigWizard } from "./ApiConfigWizard";

const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

interface ApiSourceTabProps {
    loading: boolean;
    onSubmit: () => void;
    onSuccess: () => void;
    onOpenChange: (open: boolean) => void;
    mode?: 'add' | 'edit';
    initialData?: any;
}

export function ApiSourceTab({ loading, onSubmit, onSuccess, onOpenChange, mode = 'add', initialData }: ApiSourceTabProps) {
    const { activeOrgId } = useOrg();
    const { handleAddTag, handleRemoveTag } = useTagManager();

    const [apiUrl, setApiUrl] = useState("");
    const [apiDescription, setApiDescription] = useState("");
    const [intentSummary, setIntentSummary] = useState("");
    const [apiTags, setApiTags] = useState<string[]>([]);
    const [apiTagInput, setApiTagInput] = useState("");
    const [apiPreview, setApiPreview] = useState<any>(null);
    const [testingApi, setTestingApi] = useState(false);
    const [apiSyncMode, setApiSyncMode] = useState<'one-time' | 'real-time'>('one-time');
    const [submitting, setSubmitting] = useState(false);
    const [showConfigWizard, setShowConfigWizard] = useState(false);
    const [advancedConfig, setAdvancedConfig] = useState<any>(null);

    // Hydrate state on edit mode
    useState(() => {
        if (mode === 'edit' && initialData) {
            setApiUrl(initialData.endpoint || initialData.url || "");
            setApiDescription(initialData.name || initialData.description || "");
            setIntentSummary(initialData.intent_summary || "");
            setApiTags(initialData.tags || []);
            setApiSyncMode(initialData.syncMode || 'one-time');
            // If advanced config exists in initial data, set it
            if (initialData.method || initialData.authType) {
                setAdvancedConfig({
                    method: initialData.method,
                    authType: initialData.authType,
                    // Note: Auth credentials might be masked/encrypted, wizard handles empty placeholders
                    requestConfig: initialData.requestConfig,
                    fieldMapping: initialData.fieldMapping
                });
            }
            // Assume preview is valid if editing, or user can re-test
            setApiPreview({ valid: true }); // Mock validity to allow immediate submit/configure
        }
    });

    const handleTestApi = async () => {
        if (!apiUrl) return toast.error("API URL is required");
        setTestingApi(true);
        setApiPreview(null);
        try {
            const { data } = await api.post(`/knowledge/${activeOrgId}/api-source/preview`, { url: apiUrl });
            setApiPreview(data);
            toast.success("API Connection Successful");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Connection Failed");
            setApiPreview(null);
        } finally {
            setTestingApi(false);
        }
    };

    const handleApiSubmit = async () => {
        if (!apiUrl) return toast.error("API URL is required");

        // Real-time mode requires advanced configuration
        if (apiSyncMode === 'real-time' && !advancedConfig && mode === 'add') {
            // On edit, we might keep existing config if not changed, but advancedConfig might be null if not opened?
            // Actually hydration sets it.
            // If validation needed:
            if (!initialData?.syncMode) { // Only force for new or if upgrading
                toast.error("Please configure advanced settings for real-time mode");
                setShowConfigWizard(true);
                return;
            }
        }

        if (!apiPreview && mode === 'add') {
            await handleTestApi();
            if (!apiPreview) return;
        }

        setSubmitting(true);
        try {
            const payload = {
                url: apiUrl,
                description: apiDescription,
                intent_summary: intentSummary,
                tags: apiTags,
                syncMode: apiSyncMode,
                ...advancedConfig  // Include method, auth, requestConfig, fieldMapping
            };

            if (mode === 'edit' && initialData) {
                await api.patch(`/knowledge/${activeOrgId}/api-source/${initialData.id || initialData._id}`, payload);
                toast.success("API Source updated successfully");
            } else {
                await api.post(`/knowledge/${activeOrgId}/api-source`, payload);
                toast.success("API Source added successfully");
            }

            onSuccess();
            onOpenChange(false);

            // Reset form
            setApiUrl("");
            setApiDescription("");
            setIntentSummary("");
            setApiTags([]);
            setApiPreview(null);
            setApiSyncMode('one-time');
            setAdvancedConfig(null);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to save API Source");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                    <div className="flex gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-md h-fit">
                            <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h4 className="font-medium text-blue-900 dark:text-blue-100">Connect JSON API</h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                Cluaiz will fetch data from this endpoint, either once or keep it synced in real-time.
                                Great for product catalogs, employee lists, or status feeds.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Sync Mode section removed because APIs are strictly live tools */}

                    <div>
                        <Label>API Endpoint URL *</Label>
                        <div className="flex gap-2 mt-1.5">
                            <Input
                                placeholder="https://api.example.com/v1/products"
                                value={apiUrl}
                                onChange={(e) => {
                                    setApiUrl(e.target.value);
                                    setApiPreview(null);
                                }}
                                className="font-mono text-sm"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleTestApi}
                                disabled={testingApi || !apiUrl}
                                className="shrink-0 min-w-[100px]"
                            >
                                {testingApi ? <Loader2 className="w-4 h-4 animate-spin" /> : "Test URL"}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Must return a JSON response.</p>
                    </div>

                    {apiPreview && (
                        <div className="bg-muted/50 rounded-lg border p-3">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span className="text-xs font-medium text-green-600">Valid JSON Response</span>
                                </div>
                                <span className="text-xs text-muted-foreground">{formatBytes(apiPreview.totalSize)}</span>
                            </div>
                            <pre className="bg-background border rounded-md p-3 text-[10px] font-mono overflow-auto max-h-[150px] text-muted-foreground">
                                {JSON.stringify(apiPreview.preview, null, 2)}
                            </pre>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Description <span className="text-muted-foreground font-normal ml-1">(Optional)</span></Label>
                        <Textarea
                            placeholder="What data does this API provide?"
                            value={apiDescription}
                            onChange={(e) => setApiDescription(e.target.value)}
                            maxLength={3000}
                        />
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                            <span>💡 Describe this API for better context.</span>
                            <span>{apiDescription.length}/3000</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Intent Context <span className="text-muted-foreground font-normal ml-1">(Optional)</span></Label>
                        <Textarea
                            placeholder="e.g., Use this API for real-time stock and pricing queries."
                            className="italic text-sm min-h-[80px]"
                            value={intentSummary}
                            onChange={(e) => setIntentSummary(e.target.value)}
                            maxLength={600}
                        />
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                            <span>💡 Helps the AI find this API even if keywords don&apos;t match perfectly.</span>
                            <span>{intentSummary.length}/600 (Max 120 words)</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Tags</Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="e.g., dynamic, products"
                                value={apiTagInput}
                                onChange={(e) => setApiTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddTag(apiTagInput, apiTags, setApiTags, setApiTagInput);
                                    }
                                }}
                            />
                            <Button type="button" variant="outline" onClick={() => handleAddTag(apiTagInput, apiTags, setApiTags, setApiTagInput)}>
                                Add
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {apiTags.map((tag, i) => (
                                <Badge key={i} variant="secondary" className="gap-1">
                                    {tag}
                                    <X className="w-3 h-3 cursor-pointer" onClick={() => handleRemoveTag(i, setApiTags)} />
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>
            </div >

            {/* Footer */}
            < div className="p-6 border-t bg-background mt-auto" >
                {apiUrl && !apiPreview && !testingApi && (
                    <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-3">
                        <p className="text-xs text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                            <span className="text-lg">⚠️</span>
                            <span>Please click <strong>"Test URL"</strong> button above to verify API connection before continuing.</span>
                        </p>
                    </div>
                )
                }

                <Button
                    onClick={handleApiSubmit}
                    disabled={!apiUrl || submitting || !apiPreview}
                    className="w-full"
                    size="lg"
                >
                    {submitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {mode === 'edit' ? 'Updating...' : 'Saving API Source...'}
                        </>
                    ) : (
                        <>{mode === 'edit' ? 'Update Source' : 'Save API Source'}</>
                    )}
                </Button>
            </div >

            {/* Advanced Configuration Wizard */}
            < ApiConfigWizard
                open={showConfigWizard}
                onOpenChange={setShowConfigWizard}
                initialData={mode === 'edit' ? { ...advancedConfig, ...initialData } : advancedConfig}
                onComplete={(config) => {
                    setAdvancedConfig(config);
                    setShowConfigWizard(false);
                    toast.success("Advanced configuration saved!");
                }}
            />
        </>
    );
}

